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

let mouse = { x: 0, y: 0 };
const projeteis = [];
const velocidadeProjetil = 8;
const intervaloDisparo = 500; // a cada 200ms (0.2s)

const explosoes = []


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

canvas.addEventListener('mousemove', (e) => {
  mouse.x = e.clientX;
  mouse.y = e.clientY;
});

function criarProjetil() {
  const origemX = personagem.x + personagem.size / 2;
  const origemY = personagem.y + personagem.size / 2;

  const dx = mouse.x - origemX;
  const dy = mouse.y - origemY;
  const distancia = Math.sqrt(dx * dx + dy * dy);

  const direcaoX = dx / distancia;
  const direcaoY = dy / distancia;

  projeteis.push({
    x: origemX,
    y: origemY,
    dx: direcaoX,
    dy: direcaoY,
    size: 6,
  });
}

setInterval(criarProjetil, intervaloDisparo);

function atualizarProjeteis() {
  for (let i = projeteis.length - 1; i >= 0; i--) {
    const p = projeteis[i];
    p.x += p.dx * velocidadeProjetil;
    p.y += p.dy * velocidadeProjetil;

    // Se sair da tela, remove
    if (p.x < 0 || p.x > canvas.width || p.y < 0 || p.y > canvas.height) {
      projeteis.splice(i, 1);
      continue;
    }

    // Colisão com blocos
    for (const bloco of blocos) {
      if (
        p.x < bloco.x + bloco.width &&
        p.x + p.size > bloco.x &&
        p.y < bloco.y + bloco.height &&
        p.y + p.size > bloco.y
      ) {
        projeteis.splice(i, 1);
        break;
      }
    }
  }
}

function drawProjeteis() {
  ctx.fillStyle = 'yellow';
  projeteis.forEach((p) => {
    ctx.fillRect(p.x, p.y, p.size, p.size);
  });
}

function criarExplosao(x, y) {
  const particulas = [];
  const quantidade = 20;

  for (let i = 0; i < quantidade; i++) {
    const angulo = Math.random() * 2 * Math.PI;
    const velocidade = Math.random() * 4 + 2;

    particulas.push({
      x: x,
      y: y,
      dx: Math.cos(angulo) * velocidade,
      dy: Math.sin(angulo) * velocidade,
      tamanho: Math.random() * 3 + 2,
      vida: 1, // começa com opacidade 1
    });
  }

  explosoes.push(particulas);
}

function atualizarExplosoes() {
  for (let i = explosoes.length - 1; i >= 0; i--) {
    const particulas = explosoes[i];

    for (const p of particulas) {
      p.x += p.dx;
      p.y += p.dy;
      p.dy += 0.05; // gravidade
      p.vida -= 0.02; // vai desaparecendo
    }

    // Remove explosão se todas as partículas sumirem
    if (particulas.every(p => p.vida <= 0)) {
      explosoes.splice(i, 1);
    }
  }
}

function drawExplosoes() {
  explosoes.forEach(particulas => {
    particulas.forEach(p => {
      ctx.fillStyle = `rgba(255, 200, 0, ${p.vida})`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.tamanho, 0, Math.PI * 2);
      ctx.fill();
    });
  });
}
function atualizarProjeteis() {
  for (let i = projeteis.length - 1; i >= 0; i--) {
    const p = projeteis[i];
    p.x += p.dx * velocidadeProjetil;
    p.y += p.dy * velocidadeProjetil;

    // Remove o projétil se sair da tela
    if (p.x < 0 || p.x > canvas.width || p.y < 0 || p.y > canvas.height) {
      projeteis.splice(i, 1);
      continue;
    }

    // Verifica colisão com cada bloco
    for (const bloco of blocos) {
      if (
        p.x < bloco.x + bloco.width &&
        p.x + p.size > bloco.x &&
        p.y < bloco.y + bloco.height &&
        p.y + p.size > bloco.y
      ) {
        criarExplosao(p.x, p.y);     // 💥 Cria a explosão no ponto de colisão
        projeteis.splice(i, 1);      // Remove o projétil
        break;                      // Sai do loop dos blocos pra não tentar colidir mais vezes
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
  atualizarProjeteis();
  atualizarExplosoes();

  draw();
  drawProjeteis();
  drawExplosoes();

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
