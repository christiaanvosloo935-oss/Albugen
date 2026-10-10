// Builds albums.json: a shuffled list of albums for the app to draw from this week.
// Runs in GitHub Actions (see .github/workflows/album-pool.yml), so phones never
// need to reach Apple's search API themselves.
import { createRequire } from "node:module";
import { readFileSync, writeFileSync, existsSync } from "node:fs";

const require = createRequire(import.meta.url);
const { GENRES, candidates, pickDeep, toAlbum } = require("../catalog.js");

const STOREFRONT = process.env.STOREFRONT || "za";
const SIZE = Number(process.env.POOL_SIZE || 16);
const OUT = new URL("../albums.json", import.meta.url);
const sleep = ms => new Promise(r => setTimeout(r, ms));
const pick = a => a[Math.floor(Math.random() * a.length)];

// The iTunes API allows roughly 20 calls a minute, so space calls out and back off on 403/429.
async function getJSON(url) {
  for (let i = 0; i < 5; i++) {
    await sleep(3200);
    const r = await fetch(url);
    if (r.ok) return r.json();
    if (r.status !== 403 && r.status !== 429 && r.status < 500) throw new Error(`HTTP ${r.status} for ${url}`);
    console.log(`HTTP ${r.status}, waiting before retry`);
    await sleep(20000 * (i + 1));
  }
  throw new Error(`Gave up on ${url}`);
}

// Don't offer albums from last week's list again.
const exclude = new Set(existsSync(OUT) ? (JSON.parse(readFileSync(OUT, "utf8")).albums || []).map(a => a.id) : []);
const albums = [];

for (let tries = 0; albums.length < SIZE && tries < SIZE * 4; tries++) {
  const g = pick(GENRES);              // every genre equally likely
  const term = pick(g.seeds);
  try {
    const res = await getJSON(`https://itunes.apple.com/search?media=music&entity=album&limit=200&country=${STOREFRONT}&term=${encodeURIComponent(term)}`);
    const ok = candidates(res.results, g, exclude);
    if (!ok.length) { console.log(`- ${g.name} / "${term}": no albums`); continue; }
    const r = pickDeep(ok);
    const look = await getJSON(`https://itunes.apple.com/lookup?id=${r.collectionId}&entity=song&country=${STOREFRONT}`);
    const album = toAlbum(r, look.results);
    if (album.tracks.length < 5) continue;
    exclude.add(album.id);
    albums.push(album);
    console.log(`+ ${g.name} / "${term}": ${album.artist} – ${album.title} (${album.year})`);
  } catch (e) {
    console.log(`! ${g.name} / "${term}": ${e.message}`);
  }
}

if (albums.length < 4) throw new Error(`Only found ${albums.length} albums; keeping the previous list.`);
writeFileSync(OUT, JSON.stringify({ generated: new Date().toISOString(), storefront: STOREFRONT, albums }, null, 1) + "\n");
console.log(`Wrote ${albums.length} albums.`);
