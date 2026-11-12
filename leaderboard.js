// [name, country, time, photo] — listed fastest first
const DATA = {
    all: [
        ["Marcus Hale", "Ireland", "2:34:12", "tom.jpg"],
        ["Lena Okafor", "Nigeria", "2:38:47", "zendaya.jpeg"],
        ["Tomás Vidal", "Spain", "2:41:25", "tom.jpg"],
        ["Sofia Lindqvist", "Sweden", "2:45:09", "zendaya.jpeg"],
        ["Amara Dlamini", "South Africa", "2:48:36", "zendaya.jpeg"],
        ["Min-jun Seo", "South Korea", "2:52:14", "tom.jpg"],
        ["Declan Brophy", "Ireland", "2:55:58", "tom.jpg"],
        ["Chiara Bellandi", "Italy", "2:59:41", "zendaya.jpeg"],
        ["Luca Ferrari", "Italy", "3:01:08", "tom.jpg"],
        ["Yuki Tanaka", "Japan", "3:03:17", "zendaya.jpeg"],
        ["Ravi Menon", "India", "3:04:23", "tom.jpg"],
        ["Priya Nair", "India", "3:05:44", "zendaya.jpeg"],
        ["Oskar Lindgren", "Sweden", "3:07:51", "tom.jpg"],
        ["Elena Petrova", "Bulgaria", "3:08:02", "zendaya.jpeg"],
        ["Mateo Silva", "Brazil", "3:10:40", "tom.jpg"]
    ],
    women: [
        ["Sofia Lindqvist", "Ireland", "2:34:12", "zendaya.jpeg"],
        ["Lena Okafor", "Nigeria", "2:38:47", "zendaya.jpeg"],
        ["Amara Dlamini", "Spain", "2:41:25", "zendaya.jpeg"],
        ["Chiara Bellandi", "Sweden", "2:45:09", "zendaya.jpeg"],
        ["Roselyne Moore", "South Africa", "2:48:36", "zendaya.jpeg"],
        ["Anne Hale", "South Korea", "2:52:14", "zendaya.jpeg"],
        ["Caroline Duncan", "Ireland", "2:55:58", "zendaya.jpeg"],
        ["Rose Chandler", "Italy", "2:59:41", "zendaya.jpeg"],
        ["Yuki Tanaka", "Japan", "3:03:17", "zendaya.jpeg"],
        ["Priya Nair", "India", "3:05:44", "zendaya.jpeg"],
        ["Elena Petrova", "Bulgaria", "3:08:02", "zendaya.jpeg"],
        ["Camila Reyes", "Chile", "3:11:29", "zendaya.jpeg"],
        ["Hannah Müller", "Germany", "3:14:55", "zendaya.jpeg"],
        ["Ngozi Eze", "Nigeria", "3:18:36", "zendaya.jpeg"],
        ["Freya Nilsen", "Norway", "3:22:10", "zendaya.jpeg"]
    ],
    men: [
        ["Tomás Vidal", "Spain", "2:34:12", "tom.jpg"],
        ["Marcus Hale", "Ireland", "2:41:25", "tom.jpg"],
        ["Min-jun Seo", "South Korea", "2:52:14", "tom.jpg"],
        ["Declan Brophy", "Ireland", "2:55:58", "tom.jpg"],
        ["Evan Huffman", "South Africa", "2:57:36", "tom.jpg"],
        ["Kian Tomlinson", "South Korea", "2:57:54", "tom.jpg"],
        ["Joseph Mercer", "Ireland", "2:58:58", "tom.jpg"],
        ["Hasan Eaton", "Italy", "2:59:41", "tom.jpg"],
        ["Luca Ferrari", "Italy", "3:01:08", "tom.jpg"],
        ["Ravi Menon", "India", "3:04:23", "tom.jpg"],
        ["Oskar Lindgren", "Sweden", "3:07:51", "tom.jpg"],
        ["Mateo Silva", "Brazil", "3:10:40", "tom.jpg"],
        ["Jonas Weber", "Germany", "3:15:12", "tom.jpg"],
        ["Kwame Mensah", "Ghana", "3:19:03", "tom.jpg"],
        ["Henrik Dahl", "Norway", "3:23:47", "tom.jpg"]
    ]
};

const genderEl = document.getElementById("gender");
const yearEl = document.getElementById("year");
const positionEl = document.getElementById("position");
const podiumEl = document.getElementById("podium");
const listEl = document.getElementById("list");

function el(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
}

function avatar(className, [name, , , photo]) {
    const img = el("img", className);
    img.src = "photos/" + photo;
    img.alt = name;
    return img;
}

function podiumPlace(rank, runner) {
    const place = el("div", "place place-" + rank);
    const block = el("div", "block");
    block.append(
        avatar("avatar-lg", runner),
        el("p", "name", runner[0]),
        el("p", "country", runner[1]),
        el("p", "time", runner[2])
    );
    place.append(el("span", "podium-rank", rank), block);
    return place;
}

function listRow(rank, runner) {
    const row = el("li", "row");
    const info = el("div", "info");
    info.append(el("p", "name", runner[0]), el("p", "country", runner[1]));
    row.append(el("span", "rank", rank), avatar("avatar", runner), info, el("span", "time", runner[2]));
    return row;
}

function render() {
    const fastest = positionEl.value === "fastest";
    const runners = DATA[genderEl.value];
    podiumEl.replaceChildren();
    listEl.replaceChildren();

    if (fastest) {
        // visual order: 2nd, 1st, 3rd
        [1, 0, 2].forEach(i => podiumEl.append(podiumPlace(i + 1, runners[i])));
        runners.slice(3).forEach((r, i) => listEl.append(listRow(i + 4, r)));
    } else {
        // slowest first, keeping each runner's real rank
        runners.map((r, i) => [i + 1, r]).reverse()
            .forEach(([rank, r]) => listEl.append(listRow(rank, r)));
    }
    podiumEl.hidden = !fastest;
    history.replaceState(null, "", "#" + genderEl.value + "-" + positionEl.value);
}

// restore state from URL, e.g. #women-slowest
const [g, p] = location.hash.slice(1).split("-");
if (DATA[g]) genderEl.value = g;
if (p === "fastest" || p === "slowest") positionEl.value = p;

[genderEl, yearEl, positionEl].forEach(s => s.addEventListener("change", render));
render();
