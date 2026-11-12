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


// "KBH" graffiti: every 10 seconds somebody wipes it off with a rag,
// and then it gets sprayed again from the start
const graffiti = document.getElementById('graffiti');
const sprayMask = document.getElementById('spray-mask');
const REPEAT = 10000;   // 10 seconds
const WIPE = 2000;      // how long the wiping takes (same as in index.css)

function wipeAndSprayAgain() {
  sprayMask.classList.add('wiping');     // the rag goes over the graffiti
  graffiti.classList.add('smudge');      // the paint smears

  setTimeout(function () {
    sprayMask.classList.remove('wiping');
    graffiti.classList.remove('smudge');
    // start every spray stroke from the beginning again
    sprayMask.getAnimations({ subtree: true }).forEach(function (animation) {
      animation.cancel();
      animation.play();
    });
  }, WIPE);
}

if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
  setInterval(wipeAndSprayAgain, REPEAT);
}


// Coming back with the browser's back button: the browser can show the
// page from memory, so start the graffiti spray again from the beginning
window.addEventListener('pageshow', function (event) {
  if (event.persisted) {
    sprayMask.classList.remove('wiping');
    graffiti.classList.remove('smudge');
    sprayMask.getAnimations({ subtree: true }).forEach(function (animation) {
      animation.cancel();
      animation.play();
    });
  }
});
