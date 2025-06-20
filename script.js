const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const groundHeight = 50;
const blocoSize = 50;

const blocos = []; // Aqui vão todos os blocos com colisão

const personagem = {
  x: 100,
  y: 0,
  size: 40,
  velocidadeX: 0,
  velocidadeY: 0,
  gravidade: 0.7,
  noChao: false,
  velocidadeMovimento: 5,
  forcaPulo: 15,
};

// Função para gerar uma escada (lado direito ou esquerdo)
function criarEscada(xStart, yStart, degraus, paraDireita = true) {
  for (let i = 0; i < degraus; i++) {
    const x = paraDireita
      ? xStart + i * blocoSize
      : xStart - i * blocoSize;

    for (let j = 0; j <= i; j++) {
      const y = yStart - j * blocoSize;
      blocos.push({
        x: x,
        y: y,
        width: blocoSize,
        height: blocoSize,
      });
    }
  }
}

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  blocos.length = 0; // limpa todos os blocos para recalcular

  // chão (um bloco grande)
  blocos.push({
    x: 0,
    y: canvas.height - groundHeight,
    width: canvas.width,
    height: groundHeight,
  });

  // escada direita
  criarEscada(canvas.width - blocoSize * 5, canvas.height - groundHeight, 5, true);

  // escada esquerda
  criarEscada(blocoSize * 3, canvas.height - groundHeight, 4, false);
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = 'black';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // desenhar todos os blocos verdes
  ctx.fillStyle = 'green';
  blocos.forEach((bloco) => {
    ctx.fillRect(bloco.x, bloco.y, bloco.width, bloco.height);
  });

  // desenhar personagem branco
  ctx.fillStyle = 'white';
  ctx.fillRect(personagem.x, personagem.y, personagem.size, personagem.size);
}

function verificarColisao(personagem, bloco) {
  return (
    personagem.x < bloco.x + bloco.width &&
    personagem.x + personagem.size > bloco.x &&
    personagem.y < bloco.y + bloco.height &&
    personagem.y + personagem.size > bloco.y
  );
}

function resolverColisao(personagem, bloco) {
  const px = personagem.x;
  const py = personagem.y;
  const pw = personagem.size;
  const ph = personagem.size;

  const bx = bloco.x;
  const by = bloco.y;
  const bw = bloco.width;
  const bh = bloco.height;

  const overlapX = Math.min(px + pw, bx + bw) - Math.max(px, bx);
  const overlapY = Math.min(py + ph, by + bh) - Math.max(py, by);

  if (overlapX > 0 && overlapY > 0) {
    if (overlapX < overlapY) {
      // Colisão lateral → empurra para o lado
      if (px < bx) {
        personagem.x = bx - pw; // encostou pela esquerda
      } else {
        personagem.x = bx + bw; // encostou pela direita
      }
      personagem.velocidadeX = 0;
    } else {
      // Colisão vertical → trata como já estava
      if (py < by) {
        personagem.y = by - ph;
        personagem.velocidadeY = 0;
        personagem.noChao = true;
      } else {
        personagem.y = by + bh;
        personagem.velocidadeY = 0;
      }
    }
  }
}

function atualizarPersonagem() {
  personagem.velocidadeY += personagem.gravidade;
  personagem.y += personagem.velocidadeY;
  personagem.x += personagem.velocidadeX;

  personagem.noChao = false;

  // Colisão com todos os blocos
 personagem.noChao = false;
blocos.forEach((bloco) => {
  resolverColisao(personagem, bloco);
});

  // Limita dentro da tela
  if (personagem.x < 0) personagem.x = 0;
  if (personagem.x + personagem.size > canvas.width) personagem.x = canvas.width - personagem.size;
}

function loop() {
  atualizarPersonagem();
  draw();
  requestAnimationFrame(loop);
}

window.addEventListener('resize', () => {
  resizeCanvas();
  draw();
});

window.addEventListener('keydown', (e) => {
  if (e.key.toLowerCase() === 'a') personagem.velocidadeX = -personagem.velocidadeMovimento;
  if (e.key.toLowerCase() === 'd') personagem.velocidadeX = personagem.velocidadeMovimento;
  if (e.key.toLowerCase() === 'w' && personagem.noChao) personagem.velocidadeY = -personagem.forcaPulo;
});

window.addEventListener('keyup', (e) => {
  if (e.key.toLowerCase() === 'a' || e.key.toLowerCase() === 'd') personagem.velocidadeX = 0;
});

resizeCanvas();
loop();
