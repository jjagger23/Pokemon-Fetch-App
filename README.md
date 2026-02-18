# Pokémon Team Builder (PokeAPI + Fetch)

A simple “Pokémon Team Builder” web app that uses `fetch()` with the **PokeAPI** to load Pokémon data dynamically. Users can search by **name or ID**, view the Pokémon’s **sprite**, play its **cry**, choose **four moves**, and add that Pokémon (with chosen moves) to a persistent **team list**.

## Live Demo
(https://jjagger23.github.io/Pokemon-Fetch-App/)

## Features
- Search Pokémon by **name or ID** (ex: `pikachu` or `25`)
- **Quick Select (Gen 1)** dropdown (#001–#151)
- Displays:
  - Pixel sprite image
  - Playable cry audio (when available)
  - Type badges (Fire/Water/etc.)
  - Height / Weight
  - Base stats with simple stat bars
- Loads Pokémon moves into **4 dropdown menus**
- Requires **4 unique moves** before adding to the team
- **Add to Team** (up to 6 Pokémon)
- **Clear Team** button
- **Caching** to minimize API calls:
  - Memory cache (during the session)
  - `localStorage` cache (persists across refreshes)
- Team is stored in `localStorage` so it remains after refresh
- Small Pokédex-style “beep” plays on successful load (browser permitting)

## Files
- `index.html` – page structure and UI elements  
- `styles.css` – styling for a clean Pokédex-inspired layout  
- `script.js` – logic (fetching, caching, rendering, team storage)

## How to Run Locally
1. Download/clone this repo.
2. Open `index.html` in a browser.

> Tip: Some browsers may block audio autoplay. The beep is triggered by user actions (clicking **Find** or selecting from the dropdown), which usually allows it.

## PokeAPI
This project uses the PokeAPI:
- Base endpoint: `https://pokeapi.co/api/v2/pokemon/{name-or-id}`

## Notes / Requirements Checklist
- ✅ Enter Pokémon by name or ID  
- ✅ Uses `fetch()` to request JSON from the API  
- ✅ Parses JSON and updates the page dynamically  
- ✅ Displays Pokémon image  
- ✅ Loads and plays Pokémon cry (when available)  
- ✅ Loads moves into 4 dropdown menus  
- ✅ Allows selecting 4 moves  
- ✅ Saves selection and displays in “Your Team”  

## Author
Joshua Jaggernauth
