function goToPage() {
    const gender = document.getElementById("gender").value;
    const position = document.getElementById("position").value;
    window.location.href = "leaderboard-" + gender + "-" + position + ".html";
}

function setDropdowns() {
    // e.g. "leaderboard-women-fastest.html"
    const file = window.location.pathname.split("/").pop();
    const parts = file.replace(".html", "").split("-");

    // parts = ["leaderboard", "women", "fastest"]
    if (parts.length === 3) {
        document.getElementById("gender").value = parts[1];
        document.getElementById("position").value = parts[2];
    }
}

setDropdowns();
