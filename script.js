const batchSize = 20;

const generations = {
    1: [1, 151],
    2: [152, 251],
    3: [252, 386],
    4: [387, 493],
    5: [494, 649],
    6: [650, 721],
    7: [722, 809],
    8: [810, 905],
    9: [906, 1025]
};
const generationNames = {
    1: "Gen 1 - Kanto",
    2: "Gen 2 - Johto",
    3: "Gen 3 - Hoenn",
    4: "Gen 4 - Sinnoh",
    5: "Gen 5 - Unova",
    6: "Gen 6 - Kalos",
    7: "Gen 7 - Alola",
    8: "Gen 8 - Galar",
    9: "Gen 9 - Paldea"
};
const statNames = {
    "hp": "HP",
    "attack": "Attack",
    "defense": "Defense",
    "special-attack": "Sp. Atk",
    "special-defense": "Sp. Def",
    "speed": "Speed"
};
const spriteUrl = "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/";

// 
let pokedex = {};
let currentGen = 1;
let currentId = null;
let showShiny = false;
let favorites = loadFavorites();
let evolutionCache = {};
let cryAudio = null;
let loadToken = 0;

window.onload = function () {
    applyTheme(loadTheme());

    let genSelect = document.getElementById("gen-select");
    for (let gen in generations) {
        let option = document.createElement("option");
        option.value = gen;
        option.innerText = generationNames[gen];
        genSelect.append(option);
    }

    genSelect.addEventListener("change", function () {
        loadGeneration(Number(genSelect.value));
    });
    document.getElementById("search").addEventListener("input", applyFilter);
    document.getElementById("type-filter").addEventListener("change", applyFilter);
    document.getElementById("fav-only").addEventListener("change", applyFilter);
    document.getElementById("shiny-btn").addEventListener("click", toggleShiny);
    document.getElementById("fav-btn").addEventListener("click", toggleFavorite);
    document.getElementById("cry-btn").addEventListener("click", playCry);
    document.getElementById("theme-btn").addEventListener("click", toggleTheme);
    document.getElementById("retry-btn").addEventListener("click", function () {
        loadGeneration(currentGen);
    });
    document.addEventListener("keydown", handleKeys);

    loadGeneration(1);
};


async function loadGeneration(gen, selectId) {
    currentGen = gen;
    document.getElementById("gen-select").value = gen;
    loadToken++;
    let token = loadToken;

    let start = generations[gen][0];
    let end = generations[gen][1];
    let total = end - start + 1;

    document.getElementById("pokemon-list").innerHTML = "";
    showLoading("Memuat Pokémon...");

    let cached = loadCache(gen);
    if (cached) Object.assign(pokedex, cached);

    try {
        let missing = [];
        for (let i = start; i <= end; i++) {
            if (!pokedex[i]) missing.push(i);
        }

        for (let s = 0; s < missing.length; s += batchSize) {
            let batch = missing.slice(s, s + batchSize);
            await Promise.all(batch.map(num => getPokemon(num)));
            if (token !== loadToken) return;

            let loaded = total - missing.length + Math.min(s + batchSize, missing.length);
            updateProgress(loaded, total);
        }

        if (token !== loadToken) return;
        if (missing.length > 0) saveCache(gen);
        finishLoading(gen, selectId);
    } catch (error) {
        console.error(error);
        if (token !== loadToken) return;
        showLoadingError("Gagal memuat data. Periksa koneksi internet, lalu coba lagi.");
    }
}

async function getPokemon(num) {
    let res = await fetch("https://pokeapi.co/api/v2/pokemon/" + num);
    if (!res.ok) throw new Error("Gagal mengambil Pokémon " + num);
    let pokemon = await res.json();

    res = await fetch(pokemon["species"]["url"]);
    if (!res.ok) throw new Error("Gagal mengambil species " + num);
    let species = await res.json();

    let artwork = pokemon["sprites"]["other"]["official-artwork"];
    let englishEntry = species["flavor_text_entries"].find(
        entry => entry.language.name === "en"
    );

    let desc = "Tidak ada deskripsi.";
    if (englishEntry) {
        desc = englishEntry["flavor_text"]
            .replace(/[\r\n\x0c]/g, " ")
            .replace(/POKéMON/g, "Pokémon");
    }

    pokedex[num] = {
        "name": pokemon["name"],
        "img": artwork["front_default"] || pokemon["sprites"]["front_default"],
        "shiny": artwork["front_shiny"] || pokemon["sprites"]["front_shiny"],
        "cry": pokemon["cries"] ? pokemon["cries"]["latest"] : null,
        "types": pokemon["types"].map(t => t.type.name),
        "desc": desc,
        "height": pokemon["height"] / 10,
        "weight": pokemon["weight"] / 10,
        "stats": pokemon["stats"].map(s => ({
            "name": s.stat.name,
            "value": s.base_stat
        })),
        "evoUrl": species["evolution_chain"]["url"]
    };
}


function showLoading(text) {
    document.getElementById("loading").style.display = "block";
    document.getElementById("loading-text").innerText = text;
    document.getElementById("retry-btn").hidden = true;
    document.getElementById("progress").style.display = "block";
    document.getElementById("progress-bar").style.width = "0%";
}

function updateProgress(loaded, total) {
    document.getElementById("progress-bar").style.width = (loaded / total) * 100 + "%";
    document.getElementById("loading-text").innerText =
        "Memuat Pokémon... " + loaded + "/" + total;
}

function showLoadingError(message) {
    document.getElementById("loading-text").innerText = message;
    document.getElementById("progress").style.display = "none";
    document.getElementById("retry-btn").hidden = false;
}

function finishLoading(gen, selectId) {
    document.getElementById("loading").style.display = "none";

    document.getElementById("search").value = "";
    buildTypeFilter();
    buildList();
    applyFilter();
    setCurrentPokemon(selectId || generations[gen][0]);
}


function loadCache(gen) {
    try {
        let saved = JSON.parse(localStorage.getItem("pokedex-cache-v2-gen-" + gen));
        let total = generations[gen][1] - generations[gen][0] + 1;
        if (saved && Object.keys(saved).length === total) return saved;
    } catch (e) {}
    return null;
}

function saveCache(gen) {
    try {
        let data = {};
        for (let i = generations[gen][0]; i <= generations[gen][1]; i++) {
            data[i] = pokedex[i];
        }
        localStorage.setItem("pokedex-cache-v2-gen-" + gen, JSON.stringify(data));
    } catch (e) {}
}

function loadFavorites() {
    try {
        return JSON.parse(localStorage.getItem("pokedex-favorites")) || [];
    } catch (e) {
        return [];
    }
}

function saveFavorites() {
    try {
        localStorage.setItem("pokedex-favorites", JSON.stringify(favorites));
    } catch (e) {}
}


function loadTheme() {
    try {
        let saved = localStorage.getItem("pokedex-theme");
        if (saved) return saved;
    } catch (e) {}
    let prefersDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
    return prefersDark ? "dark" : "light";
}

function applyTheme(theme) {
    document.body.classList.toggle("dark", theme === "dark");
    let btn = document.getElementById("theme-btn");
    btn.innerText = theme === "dark" ? "🤍 " : "🖤";
    btn.setAttribute("aria-label", theme === "dark" ? "Pakai tema terang" : "Pakai tema gelap");
}

function toggleTheme() {
    let next = document.body.classList.contains("dark") ? "light" : "dark";
    applyTheme(next);
    try {
        localStorage.setItem("pokedex-theme", next);
    } catch (e) {}
}


function formatNumber(id) {
    return "#" + id.toString().padStart(3, "0");
}

function genOfId(id) {
    for (let gen in generations) {
        if (id >= generations[gen][0] && id <= generations[gen][1]) return Number(gen);
    }
    return 1;
}

function buildList() {
    let list = document.getElementById("pokemon-list");
    list.innerHTML = "";

    for (let i = generations[currentGen][0]; i <= generations[currentGen][1]; i++) {
        let item = document.createElement("div");
        item.dataset.id = i;
        item.classList.add("pokemon-name-item");
        item.tabIndex = 0;
        item.setAttribute("role", "button");

        let label = document.createElement("span");
        label.innerText = formatNumber(i) + " " + pokedex[i]["name"];

        let heart = document.createElement("span");
        heart.classList.add("heart");
        heart.innerText = favorites.includes(i) ? "♥" : "";

        item.append(label, heart);
        item.addEventListener("click", function () {
            setCurrentPokemon(i);
        });
        item.addEventListener("keydown", function (e) {
            if (e.key === "Enter") setCurrentPokemon(i);
        });
        list.append(item);
    }

    let empty = document.createElement("div");
    empty.id = "no-result";
    empty.classList.add("no-result");
    empty.innerText = "Tidak ada Pokémon yang cocok. Ubah kata kunci atau filter.";
    empty.style.display = "none";
    list.append(empty);
}

function buildTypeFilter() {
    let select = document.getElementById("type-filter");
    select.innerHTML = '<option value="all">Semua tipe</option>';

    let types = [];
    for (let i = generations[currentGen][0]; i <= generations[currentGen][1]; i++) {
        pokedex[i]["types"].forEach(t => {
            if (!types.includes(t)) types.push(t);
        });
    }
    types.sort();

    types.forEach(t => {
        let option = document.createElement("option");
        option.value = t;
        option.innerText = t;
        select.append(option);
    });
}


function applyFilter() {
    let keyword = document.getElementById("search").value.trim().toLowerCase();
    let type = document.getElementById("type-filter").value;
    let favOnly = document.getElementById("fav-only").checked;
    let visibleCount = 0;

    document.querySelectorAll(".pokemon-name-item").forEach(item => {
        let id = Number(item.dataset.id);
        let data = pokedex[id];

        let matchKeyword =
            data["name"].includes(keyword) ||
            id.toString() === keyword ||
            formatNumber(id).includes(keyword);
        let matchType = type === "all" || data["types"].includes(type);
        let matchFav = !favOnly || favorites.includes(id);

        let show = matchKeyword && matchType && matchFav;
        item.style.display = show ? "flex" : "none";
        if (show) visibleCount++;
    });

    let noResult = document.getElementById("no-result");
    if (noResult) noResult.style.display = visibleCount === 0 ? "block" : "none";
}


function setCurrentPokemon(id) {
    id = Number(id);
    let data = pokedex[id];
    if (!data) return;

    if (currentId !== id) showShiny = false;
    currentId = id;

    document.getElementById("pokemon-name").innerText = formatNumber(id) + " " + data["name"];
    document.getElementById("pokemon-description").innerText = data["desc"];

    updateImage();
    updateButtons();

    let typesDiv = document.getElementById("pokemon-types");
    typesDiv.innerHTML = "";
    data["types"].forEach(type => {
        let span = document.createElement("span");
        span.classList.add("type-box", type);
        span.innerText = type;
        typesDiv.append(span);
    });

    document.getElementById("pokemon-body").innerHTML =
        "<span><b>Tinggi:</b> " + data["height"] + " m</span>" +
        "<span><b>Berat:</b> " + data["weight"] + " kg</span>";

    let statsDiv = document.getElementById("pokemon-stats");
    statsDiv.innerHTML = "";
    data["stats"].forEach(stat => {
        let row = document.createElement("div");
        row.classList.add("stat-row");

        let label = document.createElement("span");
        label.classList.add("stat-label");
        label.innerText = statNames[stat.name] || stat.name;

        let track = document.createElement("div");
        track.classList.add("stat-track");
        let fill = document.createElement("div");
        fill.classList.add("stat-fill");
        fill.style.width = Math.min(stat.value / 255 * 100, 100) + "%";
        track.append(fill);

        let value = document.createElement("span");
        value.innerText = stat.value;

        row.append(label, track, value);
        statsDiv.append(row);
    });

    document.querySelectorAll(".pokemon-name-item").forEach(item => {
        item.classList.remove("selected");
    });
    let active = document.querySelector('.pokemon-name-item[data-id="' + id + '"]');
    if (active) {
        active.classList.add("selected");
        active.scrollIntoView({ block: "nearest" });
    }

    loadEvolution(id);
}

function updateImage() {
    let data = pokedex[currentId];
    let img = document.getElementById("pokemon-img");
    let newSrc = showShiny && data["shiny"] ? data["shiny"] : data["img"];

    img.classList.add("fade"); 
    img.onload = function () {
        img.classList.remove("fade");
    };
    img.src = newSrc;
    img.alt = data["name"] + (showShiny ? " (shiny)" : "");
}

function updateButtons() {
    let data = pokedex[currentId];

    document.getElementById("shiny-btn").classList.toggle("active", showShiny);
    document.getElementById("cry-btn").disabled = !data["cry"];

    let isFav = favorites.includes(currentId);
    let favBtn = document.getElementById("fav-btn");
    favBtn.classList.toggle("active", isFav);
    favBtn.innerText = isFav ? "♥ Favorit" : "♡ Favorit";
}

function toggleShiny() {
    if (!currentId) return;
    showShiny = !showShiny;
    updateImage();
    updateButtons();
}

function toggleFavorite() {
    if (!currentId) return;

    if (favorites.includes(currentId)) {
        favorites = favorites.filter(f => f !== currentId);
    } else {
        favorites.push(currentId);
    }
    saveFavorites();
    updateButtons();

    let item = document.querySelector('.pokemon-name-item[data-id="' + currentId + '"]');
    if (item) {
        item.querySelector(".heart").innerText = favorites.includes(currentId) ? "♥" : "";
    }
    applyFilter(); 
}


function playCry() {
    if (!currentId) return;
    let data = pokedex[currentId];
    if (!data["cry"]) return;

    if (cryAudio) cryAudio.pause();
    cryAudio = new Audio(data["cry"]);
    cryAudio.volume = 0.5;
    cryAudio.play().catch(function () {});
}

  // 
function collectStages(node, depth, stages) {
    if (!stages[depth]) stages[depth] = [];

    let parts = node["species"]["url"].split("/").filter(Boolean);
    let id = Number(parts[parts.length - 1]);
    stages[depth].push({ "id": id, "name": node["species"]["name"] });

    node["evolves_to"].forEach(next => collectStages(next, depth + 1, stages));
}

async function loadEvolution(id) {
    let box = document.getElementById("pokemon-evolution");
    let url = pokedex[id]["evoUrl"];
    box.innerHTML = "<h3>Evolusi</h3><p class='evo-note'>Memuat...</p>";

    try {
        if (!evolutionCache[url]) {
            let res = await fetch(url);
            if (!res.ok) throw new Error("Gagal mengambil evolusi");
            let chain = await res.json();

            let stages = [];
            collectStages(chain["chain"], 0, stages);
            evolutionCache[url] = stages;
        }
        if (currentId !== id) return;
        renderEvolution(evolutionCache[url]);
    } catch (error) {
        console.error(error);
        if (currentId !== id) return;
        box.innerHTML = "<h3>Evolusi</h3><p class='evo-note'>Gagal memuat evolusi.</p>";
    }
}

function renderEvolution(stages) {
    let box = document.getElementById("pokemon-evolution");
    box.innerHTML = "<h3>Evolusi</h3>";

    if (stages.length === 1) {
        let note = document.createElement("p");
        note.classList.add("evo-note");
        note.innerText = "Pokémon ini tidak berevolusi.";
        box.append(note);
        return;
    }

    let chain = document.createElement("div");
    chain.classList.add("evo-chain");

    stages.forEach((stage, index) => {
        if (index > 0) {
            let arrow = document.createElement("span");
            arrow.classList.add("evo-arrow");
            arrow.innerText = "→";
            chain.append(arrow);
        }

        let stageDiv = document.createElement("div");
        stageDiv.classList.add("evo-stage");

        stage.forEach(p => {
            let btn = document.createElement("button");
            btn.type = "button";
            btn.classList.add("evo-item");
            if (p.id === currentId) btn.classList.add("current");

            let img = document.createElement("img");
            img.src = spriteUrl + p.id + ".png";
            img.alt = p.name;

            let name = document.createElement("span");
            name.innerText = p.name;

            btn.append(img, name);
            btn.addEventListener("click", function () {
                goToPokemon(p.id);
            });
            stageDiv.append(btn);
        });

        chain.append(stageDiv);
    });

    box.append(chain);
}

function goToPokemon(id) {
    let gen = genOfId(id);
    if (gen === currentGen) {
        setCurrentPokemon(id);
    } else {
        loadGeneration(gen, id);
    }
}


function handleKeys(e) {
    if (e.key !== "ArrowDown" && e.key !== "ArrowUp") return;
    if (e.target.tagName === "SELECT") return;

    let items = Array.from(document.querySelectorAll(".pokemon-name-item"))
        .filter(item => item.style.display !== "none");
    if (items.length === 0) return;

    e.preventDefault();

    let index = items.findIndex(item => Number(item.dataset.id) === currentId);
    if (e.key === "ArrowDown") index = Math.min(index + 1, items.length - 1);
    if (e.key === "ArrowUp") index = Math.max(index - 1, 0);

    setCurrentPokemon(items[index].dataset.id);
}
