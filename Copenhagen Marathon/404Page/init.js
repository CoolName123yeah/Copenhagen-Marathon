var game = document.getElementById('game');

// Sprites are drawn bigger on large windows and at original size on small ones.
function getScale() {
  return (window.innerWidth < 700 || window.innerHeight < 600) ? 1 : 2;
}

function fit() {
  var scale = getScale();
  game.style.width = Math.floor(window.innerWidth / scale) + 'px';
  game.style.transform = 'translateX(-50%) scale(' + scale + ')';
}
fit();
window.addEventListener('resize', fit);   // must be registered before the Runner's own listener

// Clicking the back button must not make the character jump.
var backButton = document.getElementById('back-button');
if (backButton) {
  ['mousedown', 'touchstart'].forEach(function(type) {
    backButton.addEventListener(type, function(e) { e.stopPropagation(); });
  });
}

new Runner('#game');
