// ======= Configurações e Variáveis Globais =======

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const groundHeight = 50;
const blocoSize = 50;

const blocos = [];
const projeteis = [];
const explosoes = [];

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

const inimigos = [];

const mouse = { x: 0, y: 0 };
const velocidadeProjetil = 8;
const intervaloDisparo = 500; // ms

// ======= Setup Inicial =======

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  blocos.length = 0;

  // Bloco de chão
  blocos.push({
    x: 0,
    y: canvas.height - groundHeight,
    width: canvas.width,
    height: groundHeight,
  });

  // Escadas
  criarEscada(canvas.width - blocoSize * 5, canvas.height - groundHeight, 5, true);
  criarEscada(blocoSize * 3, canvas.height - groundHeight, 4, false);
}

function criarEscada(xStart, yStart, degraus, paraDireita = true) {
  for (let i = 0; i < degraus; i++) {
    const x = paraDireita ? xStart + i * blocoSize : xStart - i * blocoSize;
    for (let j = 0; j <= i; j++) {
      const y = yStart - j * blocoSize;
      blocos.push({ x, y, width: blocoSize, height: blocoSize });
    }
  }
}

// ======= Eventos =======

canvas.addEventListener('mousemove', (e) => {
  mouse.x = e.clientX;
  mouse.y = e.clientY;
});

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

// ======= Atualizações =======

function criarInimigo(x) {
  const alturaMin = canvas.height / 4;
  const alturaMax = canvas.height / 2;
  const y = Math.random() * (alturaMax - alturaMin) + alturaMin;

  inimigos.push({
    x,
    y: 0,            // começa no topo
    alturaMaxima: y,  // altura randomizada onde vai parar de descer
    width: 40,
    height: 40,
    velocidade: 2,
  });
}

// Criar 2 inimigos
for (let i = 0; i < 2; i++) {
  criarInimigo((canvas.width / 3) * (i + 1));
}

function atualizarInimigos() {
  inimigos.forEach((inimigo, index) => {
    // Calcula o alvo no eixo X (segue personagem)
    let alvoX = inimigo.x;
    if (inimigo.x < personagem.x) alvoX += inimigo.velocidade;
    else if (inimigo.x > personagem.x) alvoX -= inimigo.velocidade;

    // Verifica colisão com outros inimigos para evitar sobreposição
    let podeMover = true;
    const margem = 5; // distância extra para folga

    inimigos.forEach((outro, i) => {
      if (i !== index) {
        const dx = alvoX - outro.x;
        const distanciaMinima = inimigo.width + margem;

        if (Math.abs(dx) < distanciaMinima) {
          podeMover = false;
        }
      }
    });

    // Atualiza posição se não colidir
    if (podeMover) {
      inimigo.x = alvoX;
    }

    // Desce até altura máxima
    if (inimigo.y < inimigo.alturaMaxima) {
      inimigo.y += 1;
      if (inimigo.y > inimigo.alturaMaxima) inimigo.y = inimigo.alturaMaxima;
    }
  });
}

function desenharInimigos() {
  ctx.fillStyle = 'red';
  inimigos.forEach(inimigo => {
    ctx.fillRect(inimigo.x, inimigo.y, inimigo.width, inimigo.height);
  });
}

function atualizarPersonagem() {
  personagem.velocidadeY += personagem.gravidade;
  personagem.y += personagem.velocidadeY;
  personagem.x += personagem.velocidadeX;

  personagem.noChao = false;

  blocos.forEach((bloco) => {
    resolverColisao(personagem, bloco);
  });

  if (personagem.x < 0) personagem.x = 0;
  if (personagem.x + personagem.size > canvas.width) personagem.x = canvas.width - personagem.size;
}

function resolverColisao(personagem, bloco) {
  const px = personagem.x, py = personagem.y, pw = personagem.size, ph = personagem.size;
  const bx = bloco.x, by = bloco.y, bw = bloco.width, bh = bloco.height;

  const overlapX = Math.min(px + pw, bx + bw) - Math.max(px, bx);
  const overlapY = Math.min(py + ph, by + bh) - Math.max(py, by);

  if (overlapX > 0 && overlapY > 0) {
    if (overlapX < overlapY) {
      personagem.x = px < bx ? bx - pw : bx + bw;
      personagem.velocidadeX = 0;
    } else {
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

// ======= Projéteis =======

function criarProjetil() {
  const origemX = personagem.x + personagem.size / 2;
  const origemY = personagem.y + personagem.size / 2;
  const dx = mouse.x - origemX;
  const dy = mouse.y - origemY;
  const distancia = Math.sqrt(dx * dx + dy * dy);

  projeteis.push({
    x: origemX,
    y: origemY,
    dx: dx / distancia,
    dy: dy / distancia,
    size: 6,
  });
}

function atualizarProjeteis() {
  for (let i = projeteis.length - 1; i >= 0; i--) {
    const p = projeteis[i];
    p.x += p.dx * velocidadeProjetil;
    p.y += p.dy * velocidadeProjetil;

    if (p.x < 0 || p.x > canvas.width || p.y < 0 || p.y > canvas.height) {
      projeteis.splice(i, 1);
      continue;
    }

    for (const bloco of blocos) {
      if (
        p.x < bloco.x + bloco.width &&
        p.x + p.size > bloco.x &&
        p.y < bloco.y + bloco.height &&
        p.y + p.size > bloco.y
      ) {
        criarExplosao(p.x, p.y);
        projeteis.splice(i, 1);
        break;
      }
    }
  }
}

// ======= Explosões =======

function criarExplosao(x, y) {
  const particulas = [];
  const quantidade = 20;

  for (let i = 0; i < quantidade; i++) {
    const angulo = Math.random() * 2 * Math.PI;
    const velocidade = Math.random() * 4 + 2;

    particulas.push({
      x, y,
      dx: Math.cos(angulo) * velocidade,
      dy: Math.sin(angulo) * velocidade,
      tamanho: Math.random() * 3 + 2,
      vida: 1,
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
      p.dy += 0.05; 
      p.vida -= 0.02; 
    }
    if (particulas.every(p => p.vida <= 0)) explosoes.splice(i, 1);
  }
}

// ======= Desenho =======

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = 'black';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = 'green';
  blocos.forEach((bloco) => ctx.fillRect(bloco.x, bloco.y, bloco.width, bloco.height));

  ctx.fillStyle = 'white';
  ctx.fillRect(personagem.x, personagem.y, personagem.size, personagem.size);

  ctx.fillStyle = 'yellow';
  projeteis.forEach((p) => ctx.fillRect(p.x, p.y, p.size, p.size));

  explosoes.forEach(particulas => {
    particulas.forEach(p => {
      ctx.fillStyle = `rgba(255, 200, 0, ${p.vida})`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.tamanho, 0, Math.PI * 2);
      ctx.fill();
    });
  });
}

// ======= Loop Principal =======

function loop() {
  atualizarPersonagem();
   atualizarInimigos();
  atualizarProjeteis();
  atualizarExplosoes();
  draw();
  desenharInimigos();
  requestAnimationFrame(loop);
}

// ======= Inicialização =======

resizeCanvas();
setInterval(criarProjetil, intervaloDisparo);
loop();
