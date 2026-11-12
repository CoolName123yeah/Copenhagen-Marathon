var game = document.getElementById('game');

// Sprites are drawn bigger on large windows and at original size on small ones.
function getTargetScale() {
  return (window.innerWidth < 700 || window.innerHeight < 600) ? 1 : 2;
}

// Size and position the game so every sprite pixel covers a whole number of
// device pixels. Fractional sizes or positions (odd window widths, browser zoom,
// devices with a pixel ratio like 1.25 or 2.625) make some pixels wider than
// others, which looks like uneven compression.
function fit() {
  var dpr = window.devicePixelRatio || 1;
  var devicePixelsPerSprite = Math.max(1, Math.floor(getTargetScale() * dpr + 0.01));
  var scale = devicePixelsPerSprite / dpr;
  var width = Math.floor(window.innerWidth / scale);
  var left = (window.innerWidth - width * scale) / 2;
  var bottom = window.innerHeight * 0.15;

  game.style.width = width + 'px';
  game.style.left = Math.round(left * dpr) / dpr + 'px';       // snap to a device pixel
  game.style.bottom = Math.round(bottom * dpr) / dpr + 'px';
  game.style.transformOrigin = 'bottom left';
  game.style.transform = 'scale(' + scale + ')';
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
