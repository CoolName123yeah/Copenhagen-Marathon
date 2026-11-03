var SCALE = 2;   // how big the sprites look; 1 = original size
var game = document.getElementById('game');

function fit() {
  game.style.width = Math.floor(window.innerWidth / SCALE) + 'px';
  game.style.transform = 'translate(-50%, -50%) scale(' + SCALE + ')';
}
fit();
window.addEventListener('resize', fit);   // must be registered before the Runner's own listener

new Runner('#game');
this.horizonLine = new HorizonLine(this.canvas, this.horizonImg, this.dimensions);