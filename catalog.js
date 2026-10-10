// Shared by the app (index.html) and the weekly pool job (scripts/draw-pool.mjs).
// Which genres Alburad draws from, and how a search result becomes an album.
const GENRES = [
  { id: "rock", name: "Rock & Alternative", c: "var(--rust)",
    seeds: ["indie rock","shoegaze","post-punk","slowcore","garage rock","psychedelic rock","krautrock","math rock","post-rock","noise rock","jangle pop","college rock","grunge","prog rock","southern rock","blues rock","art rock","new wave","goth rock","britpop","emo","surf rock","space rock"],
    accept: ["Rock","Alternative","Indie Rock","Hard Rock","Prog-Rock/Art Rock","Psychedelic","Rock & Roll","American Trad Rock","Arena Rock","Blues-Rock","Jam Bands","Southern Rock","Surf","Britpop","College Rock","Goth Rock","Grunge","New Wave","Indie Pop","Punk"] },
  { id: "poppunk", name: "Pop Punk", c: "var(--orange)", seeds: ["pop punk","skate punk","melodic punk"], accept: ["Punk","Alternative","Rock"] },
  { id: "metal", name: "Heavy Metal", c: "var(--brown)", seeds: ["heavy metal","NWOBHM","traditional heavy metal"], accept: ["Metal","Heavy Metal","Hard Rock"] },
  { id: "pop", name: "Pop & Adult Contemporary", c: "var(--mustard)",
    seeds: ["chamber pop","sophisti-pop","soft rock","art pop","baroque pop","sunshine pop","yacht rock","adult contemporary"],
    accept: ["Pop","Adult Contemporary","Soft Rock","Pop/Rock","Indie Pop"] },
  { id: "jazz", name: "Jazz", c: "var(--avocado)",
    seeds: ["bebop","spiritual jazz","hard bop","cool jazz","modal jazz","jazz fusion","vocal jazz","piano trio","avant-garde jazz","latin jazz","ethio jazz","free jazz"],
    accept: ["Jazz","Bebop","Hard Bop","Cool Jazz","Fusion","Vocal Jazz","Avant-Garde Jazz","Contemporary Jazz","Big Band","Latin Jazz","Mainstream Jazz","Crossover Jazz","Trad Jazz","Smooth Jazz"] },
  { id: "blues", name: "Blues", c: "var(--rust)",
    seeds: ["delta blues","chicago blues","piedmont blues","electric blues","soul blues","country blues","texas blues"],
    accept: ["Blues","Acoustic Blues","Chicago Blues","Classic Blues","Contemporary Blues","Country Blues","Delta Blues","Electric Blues"] },
  { id: "folk", name: "Folk & Singer/Songwriter", c: "var(--avocado)",
    seeds: ["chamber folk","british folk","psych folk","freak folk","singer songwriter","appalachian folk","folk revival"],
    accept: ["Folk","Singer/Songwriter","Contemporary Folk","Traditional Folk","Alternative Folk","Contemporary Singer/Songwriter"] },
  { id: "classical", name: "Classical", c: "var(--brown)",
    seeds: ["baroque","string quartet","minimalism","piano sonatas","chamber music","choral","cello suites","harpsichord"],
    accept: ["Classical","Baroque Era","Chamber Music","Minimalism","Modern Era","Romantic Era","Classical Era","Choral","Opera","Orchestral","Solo Instrumental","Contemporary Era","Impressionist","Medieval Era","Renaissance"] },
  { id: "score", name: "Film Score", c: "var(--orange)", seeds: ["original score","film score","motion picture score"], accept: ["Soundtrack","Original Score"] },
  { id: "experimental", name: "Experimental & Avant-Garde", c: "var(--rust)",
    seeds: ["experimental","avant-garde","drone","musique concrete","tape music","sound collage"],
    accept: ["Experimental","Avant-Garde","Electronic","Alternative","Ambient","Electronica"] },
  { id: "easy", name: "Easy Listening", c: "var(--mustard)", seeds: ["easy listening","exotica","lounge","space age pop"], accept: ["Easy Listening","Lounge","Vocal","Pop"] },
  { id: "lofi", name: "Lo-Fi", c: "var(--avocado)", seeds: ["lo-fi","bedroom pop","lofi beats","home recording"], accept: ["Alternative","Electronic","Hip-Hop/Rap","Indie Pop","Lo-Fi"] },
  { id: "christian", name: "Christian", c: "var(--brown)",
    seeds: ["christian rock","christian folk","worship","christian indie","jesus music"],
    accept: ["Christian","Christian & Gospel","Christian Rock","CCM","Gospel","Praise & Worship","Christian Pop"] },
];
const BLOCK_GENRES = ["Children's Music","Holiday","Christmas","Spoken Word","Comedy","Fitness & Workout","Karaoke"];
const BLOCK_TITLES = /christmas|holiday|children|kids|lullab|karaoke|greatest hits|best of|essential|spoken word|workout|- single|- ep\b/i;

// Search results that are full albums in the genre, minus blocked genres/titles and albums in `exclude`.
function candidates(results, g, exclude) {
  return (results || []).filter(r =>
    r.collectionType === "Album" && r.trackCount >= 5 &&
    g.accept.includes(r.primaryGenreName) && !BLOCK_GENRES.includes(r.primaryGenreName) &&
    !BLOCK_TITLES.test(r.collectionName) && !exclude.has(r.collectionId));
}

// Search results are ranked by popularity; lean toward the back of the list for deeper cuts.
function pickDeep(ok) {
  return Math.random() < 0.65
    ? ok[Math.floor(ok.length / 3 + Math.random() * (ok.length * 2 / 3))]
    : ok[Math.floor(Math.random() * ok.length)];
}

function toAlbum(r, lookupResults) {
  const tracks = (lookupResults || []).filter(t => t.wrapperType === "track")
    .sort((a, b) => (a.discNumber - b.discNumber) || (a.trackNumber - b.trackNumber))
    .map(t => ({ name: t.trackName, ms: t.trackTimeMillis }));
  return {
    id: r.collectionId, title: r.collectionName, artist: r.artistName,
    year: (r.releaseDate || "").slice(0, 4), genre: r.primaryGenreName,
    art: (r.artworkUrl100 || "").replace("100x100bb", "1200x1200bb"),
    url: r.collectionViewUrl, tracks
  };
}

if (typeof module !== "undefined") module.exports = { GENRES, BLOCK_GENRES, BLOCK_TITLES, candidates, pickDeep, toAlbum };
