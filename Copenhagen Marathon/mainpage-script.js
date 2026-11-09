// Race clock: starts at 10:25:40 and counts up every second
const clock = document.getElementById('clock');
let seconds = 10 * 3600 + 25 * 60 + 40;

setInterval(function () {
  seconds++;
  const h = Math.floor(seconds / 3600);
  const m = Math.floor(seconds / 60) % 60;
  const s = seconds % 60;
  clock.textContent = [h, m, s].map(n => String(n).padStart(2, '0')).join(':');
}, 1000);
