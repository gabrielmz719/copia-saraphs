const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  draw();
}
window.addEventListener('resize', resizeCanvas);

const groundHeight = 50; 
const blockSize = 50;

// Variáveis para a escada direita
const rightStairsSteps = 5;
const rightStairsStartX = () => canvas.width - rightStairsSteps * blockSize;
const rightStairsStartY = () => canvas.height - groundHeight;

// Variáveis para a escada esquerda
const leftStairsSteps = 3;
const leftStairsStartX = 0;
const leftStairsStartY = () => canvas.height - groundHeight;

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Fundo preto
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Chão
  ctx.fillStyle = 'green';
  ctx.fillRect(0, canvas.height - groundHeight, canvas.width, groundHeight);

  // Desenha escada direita
  drawFilledStairs(rightStairsStartX(), rightStairsStartY(), rightStairsSteps, blockSize, true);

  // Desenha escada esquerda
  drawFilledStairs(leftStairsStartX, leftStairsStartY(), leftStairsSteps, blockSize, false);
}

function drawFilledStairs(xStart, yStart, steps, blockSize, toRight) {
  ctx.fillStyle = 'green';

  for (let i = 0; i < steps; i++) {
    const x = toRight
      ? xStart + i * blockSize
      : xStart + (steps - 1 - i) * blockSize;

    for (let j = 0; j <= i; j++) {
      const y = yStart - j * blockSize;
      ctx.fillRect(x, y, blockSize, blockSize);
    }
  }
}

resizeCanvas();
