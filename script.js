const API_BASE = "https://pokeapi.co/api/v2/pokemon/";
const LIST_URL = "https://pokeapi.co/api/v2/pokemon?limit=151";

const CACHE_KEY_PREFIX = "poke_cache_v1_";
const TEAM_KEY = "poke_team_v1";
const LIST_KEY = "poke_list_151_v1";

const memoryCache = new Map();

const searchBtn = document.getElementById("searchBtn");
const input = document.getElementById("pokemonInput");
const statusEl = document.getElementById("status");
const cacheTag = document.getElementById("cacheTag");

const pokemonSelect = document.getElementById("pokemonSelect");

const pokemonName = document.getElementById("pokemonName");
const pokemonImage = document.getElementById("pokemonImage");
const pokemonCry = document.getElementById("pokemonCry");
const cryHint = document.getElementById("cryHint");

const typeBadges = document.getElementById("typeBadges");

const heightValue = document.getElementById("heightValue");
const weightValue = document.getElementById("weightValue");
const statsGrid = document.getElementById("statsGrid");

const moveDropdowns = [
  document.getElementById("move1"),
  document.getElementById("move2"),
  document.getElementById("move3"),
  document.getElementById("move4")
];

const addToTeamBtn = document.getElementById("addToTeamBtn");
const movesHint = document.getElementById("movesHint");

const teamContainer = document.getElementById("teamContainer");
const clearTeamBtn = document.getElementById("clearTeamBtn");

let currentPokemon = null;
let team = loadTeam();

renderTeam();
initMoveSelects();
clearPokemonDetailsUI();
loadPokemonList151();

/* =========================
   Pokédex "beep" sound
   (Web Audio API; no external files needed)
========================= */
let audioCtx = null;

function playPokedexBeep() {
  try {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }

    // some browsers start suspended until user gesture - attempt resume
    if (audioCtx.state === "suspended") {
      audioCtx.resume();
    }

    const now = audioCtx.currentTime;

    // Oscillator for the beep
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    // "Pokédex-ish" short double beep
    osc.type = "square";
    osc.frequency.setValueAtTime(880, now);         // A5
    osc.frequency.setValueAtTime(990, now + 0.06);  // B5-ish

    // Envelope
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.18, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.12);

    osc.connect(gain);
    gain.connect(audioCtx.destination);

    osc.start(now);
    osc.stop(now + 0.13);
  } catch {
    // If blocked or unsupported, just do nothing (no errors)
  }
}

// --------------------------
// helpers
// --------------------------
function setStatus(msg) { statusEl.textContent = msg; }
function setCache(source) { cacheTag.textContent = `Cache: ${source}`; }
function normalizeQuery(q) { return String(q || "").trim().toLowerCase(); }
function cap(str) { return str ? str.charAt(0).toUpperCase() + str.slice(1) : str; }

function idFromListUrl(url) {
  const parts = url.split("/").filter(Boolean);
  return Number(parts[parts.length - 1]);
}

function chooseSprite(p) {
  return (
    p?.sprites?.other?.["official-artwork"]?.front_default ||
    p?.sprites?.front_default ||
    p?.sprites?.front_shiny ||
    ""
  );
}

function chooseCry(p) {
  return p?.cries?.latest || p?.cries?.legacy || "";
}

function unique(arr) {
  return [...new Set(arr)];
}

// Convert decimeters -> meters, hectograms -> kg (PokeAPI units)
function formatHeight(dm) {
  if (typeof dm !== "number") return "—";
  const m = dm / 10;
  return `${m.toFixed(1)} m`;
}
function formatWeight(hg) {
  if (typeof hg !== "number") return "—";
  const kg = hg / 10;
  return `${kg.toFixed(1)} kg`;
}

// --------------------------
// localStorage cache helpers
// --------------------------
function getLocalCache(key) {
  try {
    const raw = localStorage.getItem(CACHE_KEY_PREFIX + key);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed?.data || null;
  } catch {
    return null;
  }
}

function setLocalCache(key, data) {
  try {
    localStorage.setItem(
      CACHE_KEY_PREFIX + key,
      JSON.stringify({ savedAt: Date.now(), data })
    );
  } catch {}
}

// --------------------------
// fetch with caching
// --------------------------
async function fetchPokemon(query) {
  const key = normalizeQuery(query);
  if (!key) throw new Error("Please enter a Pokémon name or ID.");

  if (memoryCache.has(key)) {
    setCache("memory");
    return memoryCache.get(key);
  }

  const cached = getLocalCache(key);
  if (cached) {
    memoryCache.set(key, cached);
    setCache("localStorage");
    return cached;
  }

  setCache("network");
  const res = await fetch(API_BASE + encodeURIComponent(key), { cache: "no-store" });
  if (!res.ok) throw new Error("Pokémon not found. Try a name like 'snorlax' or an ID like '143'.");

  const data = await res.json();
  memoryCache.set(key, data);
  setLocalCache(key, data);
  return data;
}

// --------------------------
// list dropdown (Gen 1)
// --------------------------
async function loadPokemonList151() {
  const cached = getListCache();
  if (cached && Array.isArray(cached) && cached.length === 151) {
    fillPokemonSelect(cached);
    return;
  }

  try {
    pokemonSelect.innerHTML = `<option value="">Loading Pokémon list…</option>`;
    const res = await fetch(LIST_URL, { cache: "no-store" });
    if (!res.ok) throw new Error("Could not load Pokémon list.");
    const data = await res.json();

    const list = (data.results || [])
      .map(item => ({ id: idFromListUrl(item.url), name: item.name }))
      .sort((a,b) => a.id - b.id);

    setListCache(list);
    fillPokemonSelect(list);
  } catch {
    pokemonSelect.innerHTML = `<option value="">(Could not load list)</option>`;
  }
}

function getListCache() {
  try {
    const raw = localStorage.getItem(LIST_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}
function setListCache(list) {
  try { localStorage.setItem(LIST_KEY, JSON.stringify(list)); } catch {}
}

function fillPokemonSelect(list) {
  pokemonSelect.innerHTML = `<option value="">— Select a Pokémon (#ID - name) —</option>`;
  for (const p of list) {
    const opt = document.createElement("option");
    opt.value = String(p.id);
    opt.textContent = `#${String(p.id).padStart(3, "0")} - ${cap(p.name)}`;
    pokemonSelect.appendChild(opt);
  }
}

pokemonSelect.addEventListener("change", async () => {
  if (!pokemonSelect.value) return;
  input.value = pokemonSelect.value;
  await handleSearch(true); // user-triggered via dropdown
});

// --------------------------
// moves
// --------------------------
function initMoveSelects() {
  moveDropdowns.forEach(sel => {
    sel.innerHTML = `<option value="">— Select a move —</option>`;
    sel.disabled = true;
  });
  addToTeamBtn.disabled = true;
  movesHint.textContent = "Moves loaded: —";
}

function populateMoves(moveNames) {
  moveDropdowns.forEach(sel => {
    sel.innerHTML = "";
    const opt0 = document.createElement("option");
    opt0.value = "";
    opt0.textContent = "— Select a move —";
    sel.appendChild(opt0);

    for (const move of moveNames) {
      const opt = document.createElement("option");
      opt.value = move;
      opt.textContent = move;
      sel.appendChild(opt);
    }

    sel.disabled = false;
  });

  addToTeamBtn.disabled = false;
  movesHint.textContent = `Moves loaded: ${moveNames.length}`;
}

function getMoveNames(p) {
  return (p.moves || [])
    .map(m => m?.move?.name)
    .filter(Boolean)
    .sort((a, b) => a.localeCompare(b));
}

function getSelectedMoves() {
  return moveDropdowns.map(s => s.value).filter(Boolean);
}

// --------------------------
// Type badges + stats UI
// --------------------------
const TYPE_COLORS = {
  normal:  "#C8C8A7",
  fire:    "#F5AC78",
  water:   "#9DB7F5",
  electric:"#FAE078",
  grass:   "#A7DB8D",
  ice:     "#BCE6E6",
  fighting:"#D67873",
  poison:  "#C183C1",
  ground:  "#EBD69D",
  flying:  "#C6B7F5",
  psychic: "#FA92B2",
  bug:     "#C6D16E",
  rock:    "#D1C17D",
  ghost:   "#A292BC",
  dragon:  "#A27DFA",
  dark:    "#A29288",
  steel:   "#D1D1E0",
  fairy:   "#F4BDC9"
};

function setTypeBadges(typesArr) {
  typeBadges.innerHTML = "";

  const types = (typesArr || [])
    .map(t => t?.type?.name)
    .filter(Boolean);

  if (!types.length) return;

  for (const t of types) {
    const span = document.createElement("span");
    span.className = "type-badge";
    span.textContent = t;

    const color = TYPE_COLORS[t];
    if (color) span.style.background = color;
    else span.classList.add("default");

    typeBadges.appendChild(span);
  }
}

function setHeightWeight(p) {
  heightValue.textContent = formatHeight(p?.height);
  weightValue.textContent = formatWeight(p?.weight);
}

function clearStats() {
  statsGrid.innerHTML = "";
}

function setStats(p) {
  clearStats();

  const stats = (p?.stats || []).map(s => ({
    name: s?.stat?.name || "",
    value: s?.base_stat ?? 0
  }));

  const labelMap = {
    hp: "HP",
    attack: "ATK",
    defense: "DEF",
    "special-attack": "Sp.Atk",
    "special-defense": "Sp.Def",
    speed: "SPD"
  };

  const order = ["hp","attack","defense","special-attack","special-defense","speed"];
  const ordered = order.map(key => stats.find(s => s.name === key) || { name:key, value:0 });

  const MAX_FOR_BAR = 200;

  for (const s of ordered) {
    const row = document.createElement("div");
    row.className = "stat-row";

    const name = document.createElement("div");
    name.className = "stat-name";
    name.textContent = labelMap[s.name] || s.name.toUpperCase();

    const num = document.createElement("div");
    num.className = "stat-num";
    num.textContent = String(s.value);

    const bar = document.createElement("div");
    bar.className = "stat-bar";

    const fill = document.createElement("div");
    fill.className = "stat-fill";
    const pct = Math.max(0, Math.min(100, (s.value / MAX_FOR_BAR) * 100));
    fill.style.width = pct.toFixed(0) + "%";

    bar.appendChild(fill);
    row.appendChild(name);
    row.appendChild(num);
    row.appendChild(bar);

    statsGrid.appendChild(row);
  }
}

function clearPokemonDetailsUI() {
  pokemonName.textContent = "—";
  typeBadges.innerHTML = "";
  heightValue.textContent = "—";
  weightValue.textContent = "—";
  clearStats();

  pokemonImage.src = "";
  pokemonImage.alt = "";
  pokemonImage.style.display = "none";

  pokemonCry.removeAttribute("src");
  pokemonCry.load();
  cryHint.textContent = "";

  setCache("—");
}

// --------------------------
// display pokemon
// --------------------------
function displayPokemon(p) {
  currentPokemon = p;

  pokemonName.textContent = p?.name ? p.name.toUpperCase() : "—";

  setTypeBadges(p?.types);
  setHeightWeight(p);
  setStats(p);

  const sprite = chooseSprite(p);
  if (sprite) {
    pokemonImage.src = sprite;
    pokemonImage.alt = p.name;
    pokemonImage.style.display = "block";
  } else {
    pokemonImage.src = "";
    pokemonImage.alt = "";
    pokemonImage.style.display = "none";
  }

  const cryUrl = chooseCry(p);
  if (cryUrl) {
    pokemonCry.src = cryUrl;
    cryHint.textContent = "";
  } else {
    pokemonCry.removeAttribute("src");
    pokemonCry.load();
    cryHint.textContent = "(No cry available for this Pokémon)";
  }

  const moves = getMoveNames(p);
  populateMoves(moves);
}

// --------------------------
// search handler
// --------------------------
// userInitiated = true when called from click/dropdown,
// so the beep is allowed to play more reliably.
async function handleSearch(userInitiated = false) {
  initMoveSelects();
  setStatus("Loading…");

  try {
    const q = normalizeQuery(input.value);
    const data = await fetchPokemon(q);
    displayPokemon(data);
    setStatus("Loaded successfully.");

    // Play beep on successful load
    // (only on user actions to avoid autoplay blocking)
    if (userInitiated) {
      playPokedexBeep();
    } else {
      // still attempt; if blocked, it fails silently
      playPokedexBeep();
    }
  } catch (e) {
    currentPokemon = null;
    clearPokemonDetailsUI();
    initMoveSelects();
    setStatus(e.message || "Something went wrong.");
  }
}

searchBtn.addEventListener("click", () => handleSearch(true));

input.addEventListener("keydown", (e) => {
  if (e.key === "Enter") handleSearch(true);
});

// --------------------------
// team storage
// --------------------------
function loadTeam() {
  try {
    const raw = localStorage.getItem(TEAM_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveTeam() {
  localStorage.setItem(TEAM_KEY, JSON.stringify(team));
}

function renderTeam() {
  teamContainer.innerHTML = "";

  if (!team.length) {
    teamContainer.innerHTML =
      `<div class="team-card">
         <div></div>
         <div>
           <strong>No Pokémon yet.</strong>
           <div class="hint">Add up to 6 to build your team.</div>
         </div>
       </div>`;
    return;
  }

  team.forEach((p, idx) => {
    const card = document.createElement("div");
    card.className = "team-card";

    const img = document.createElement("img");
    img.src = p.sprite || "";
    img.alt = p.name ? `${p.name} sprite` : "Pokemon sprite";

    const info = document.createElement("div");

    const title = document.createElement("div");
    title.innerHTML = `<strong>${cap(p.name)}</strong> <span class="hint">• Slot ${idx + 1} • #${p.id}</span>`;

    const ul = document.createElement("ul");
    (p.moves || []).forEach(m => {
      const li = document.createElement("li");
      li.textContent = m;
      ul.appendChild(li);
    });

    info.appendChild(title);
    info.appendChild(ul);

    card.appendChild(img);
    card.appendChild(info);
    teamContainer.appendChild(card);
  });
}

// --------------------------
// Add to Team
// --------------------------
addToTeamBtn.addEventListener("click", () => {
  if (!currentPokemon) return;

  if (team.length >= 6) {
    setStatus("Team is full (max 6). Clear to add more.");
    return;
  }

  const selected = getSelectedMoves();
  if (selected.length !== 4) {
    setStatus("Pick 4 moves before adding to your team.");
    return;
  }

  const uniq = unique(selected);
  if (uniq.length !== 4) {
    setStatus("Please choose 4 different moves (no duplicates).");
    return;
  }

  team.push({
    id: currentPokemon.id,
    name: currentPokemon.name,
    sprite: chooseSprite(currentPokemon),
    moves: uniq
  });

  saveTeam();
  renderTeam();
  setStatus(`${cap(currentPokemon.name)} added to your team.`);
});

clearTeamBtn.addEventListener("click", () => {
  team = [];
  saveTeam();
  renderTeam();
  setStatus("Team cleared.");
});
