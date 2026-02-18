const API_BASE = "https://pokeapi.co/api/v2/pokemon/";
const memoryCache = new Map();
const team = [];

const searchBtn = document.getElementById("searchBtn");
const input = document.getElementById("pokemonInput");
const status = document.getElementById("status");

const pokemonName = document.getElementById("pokemonName");
const pokemonImage = document.getElementById("pokemonImage");
const pokemonCry = document.getElementById("pokemonCry");

const moveDropdowns = [
    document.getElementById("move1"),
    document.getElementById("move2"),
    document.getElementById("move3"),
    document.getElementById("move4")
];

const addToTeamBtn = document.getElementById("addToTeamBtn");
const teamContainer = document.getElementById("teamContainer");

let currentPokemon = null;

/* =========================
   FETCH WITH CACHING
========================= */
async function fetchPokemon(query) {
    const key = query.toLowerCase().trim();

    if (memoryCache.has(key)) {
        return memoryCache.get(key);
    }

    const response = await fetch(API_BASE + key);
    if (!response.ok) {
        throw new Error("Pokemon not found.");
    }

    const data = await response.json();
    memoryCache.set(key, data);
    return data;
}

/* =========================
   DISPLAY POKEMON
========================= */
function displayPokemon(data) {
    currentPokemon = data;

    pokemonName.textContent = data.name.toUpperCase();
    pokemonImage.src = data.sprites.front_default;
    pokemonImage.alt = data.name;

    // Cry
    const cryUrl = data.cries?.latest || "";
    pokemonCry.src = cryUrl;

    // Moves
    const moves = data.moves.map(m => m.move.name);

    moveDropdowns.forEach(select => {
        select.innerHTML = "";
        moves.forEach(move => {
            const option = document.createElement("option");
            option.value = move;
            option.textContent = move;
            select.appendChild(option);
        });
    });
}

/* =========================
   ADD TO TEAM
========================= */
function addToTeam() {
    if (!currentPokemon) return;

    if (team.length >= 6) {
        alert("Team is full (max 6).");
        return;
    }

    const selectedMoves = moveDropdowns.map(s => s.value);

    const member = {
        name: currentPokemon.name,
        sprite: currentPokemon.sprites.front_default,
        moves: selectedMoves
    };

    team.push(member);
    renderTeam();
}

function renderTeam() {
    teamContainer.innerHTML = "";

    team.forEach(p => {
        const div = document.createElement("div");
        div.className = "team-member";

        div.innerHTML = `
            <h4>${p.name.toUpperCase()}</h4>
            <img src="${p.sprite}" width="100">
            <ul>
                ${p.moves.map(m => `<li>${m}</li>`).join("")}
            </ul>
        `;

        teamContainer.appendChild(div);
    });
}

/* =========================
   EVENTS
========================= */
searchBtn.addEventListener("click", async () => {
    try {
        status.textContent = "Loading...";
        const data = await fetchPokemon(input.value);
        displayPokemon(data);
        status.textContent = "Loaded successfully.";
    } catch (error) {
        status.textContent = error.message;
    }
});

addToTeamBtn.addEventListener("click", addToTeam);
