// Race clock: starts at 1:08:23 and counts up every second
const clock = document.getElementById('clock');
let seconds = 1 * 3600 + 8 * 60 + 23;

setInterval(function () {
  seconds++;
  const h = Math.floor(seconds / 3600);
  const m = Math.floor(seconds / 60) % 60;
  const s = seconds % 60;
  clock.textContent = h + ':' + String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0');
}, 1000);
