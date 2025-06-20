// ======= Configurações e Variáveis Globais =======
const canvas = document.getElementById('gameCanvas');
if (!canvas) throw new Error("Canvas element not found!");
const ctx = canvas.getContext('2d');
// Adicione junto com as outras variáveis globais
let gameOverAtivo = false;
let tempoGameOver = 0;
const delayReinicio = 3000; // 3 segundos antes de reiniciar

// Configurações do jogo
const groundHeight = 50;
const blocoSize = 50;
const velocidadeProjetil = 8;
const intervaloDisparo = 500; // ms

// Sistema de Fases
const fases = [
  { inimigos: 2, velocidadeInimigos: 2, intervaloDisparoInimigos: 1500, corFundo: 'black' },
  { inimigos: 3, velocidadeInimigos: 2.5, intervaloDisparoInimigos: 1200, corFundo: '#111122' },
  { inimigos: 4, velocidadeInimigos: 3, intervaloDisparoInimigos: 1000, corFundo: '#221111' },
  { inimigos: 5, velocidadeInimigos: 3.5, intervaloDisparoInimigos: 800, corFundo: '#112211' },
  { inimigos: 6, velocidadeInimigos: 4, intervaloDisparoInimigos: 600, corFundo: '#222211' }
];

// Estado do jogo
const blocos = [];
const projeteis = [];
const explosoes = [];
const inimigos = [];
const projeteisInimigos = [];
let faseAtual = 0;
let intervalos = [];
let gameOver = false;
let faseCompleta = false;
let vidasIniciais = 3;
let invulneravel = false;
let tempoUltimoDano = 0;
const tempoInvulneravel = 1000; // 1 segundo
let personagemPosicaoAnterior = { x: 100, y: 0 };
let gameLoop;

// Personagem principal
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
  vidaMaxima: 100,
  vidaAtual: 100,
  visivel: true
};

// Controle do mouse
const mouse = { x: 0, y: 0 };

// ======= Funções de Inicialização =======
function init() {
  resizeCanvas();
  setupEventListeners();
  iniciarFase(faseAtual);
  loop();
}

function iniciarFase(indiceFase) {
  personagemPosicaoAnterior = { x: personagem.x, y: personagem.y };
  inimigos.length = 0;
  projeteisInimigos.length = 0;
  explosoes.length = 0;
  faseCompleta = false;
  invulneravel = false;

  intervalos.forEach(clearInterval);
  intervalos = [];

  const fase = fases[indiceFase];

  if (indiceFase !== faseAtual) {
    personagem.vidas = vidasIniciais;
  }

  personagem.x = personagemPosicaoAnterior.x;
  personagem.y = personagemPosicaoAnterior.y;
  personagem.velocidadeX = 0;
  personagem.velocidadeY = 0;

  criarInimigos(fase.inimigos, fase.velocidadeInimigos);

  intervalos.push(setInterval(criarProjetil, intervaloDisparo));
  intervalos.push(setInterval(() => {
    if (!gameOver && !faseCompleta) {
      inimigos.forEach(inimigo => criarProjetilInimigo(inimigo));
    }
  }, fase.intervaloDisparoInimigos));
}

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  blocos.length = 0;

  blocos.push({
    x: 0,
    y: canvas.height - groundHeight,
    width: canvas.width,
    height: groundHeight,
  });

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

function criarInimigos(quantidade, velocidade = 2) {
  for (let i = 0; i < quantidade; i++) {
    const x = (canvas.width / (quantidade + 1)) * (i + 1);
    const alturaMin = canvas.height / 4;
    const alturaMax = canvas.height / 2;
    const y = Math.random() * (alturaMax - alturaMin) + alturaMin;

    inimigos.push({
      x,
      y: 0,
      alturaMaxima: y,
      width: 40,
      height: 40,
      velocidade: velocidade,
      vidaMaxima: 50 + faseAtual * 20, // Inimigos ficam mais resistentes a cada fase
      vidaAtual: 50 + faseAtual * 20,
      danoPorProjetil: 10 // Dano que o personagem causa
    });
  }
}

// ======= Event Handlers =======
function setupEventListeners() {
  canvas.addEventListener('mousemove', (e) => {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
  });

  window.addEventListener('resize', () => {
    resizeCanvas();
    draw();
  });

  window.addEventListener('keydown', (e) => {
    const key = e.key.toLowerCase();
    if (key === 'a') personagem.velocidadeX = -personagem.velocidadeMovimento;
    if (key === 'd') personagem.velocidadeX = personagem.velocidadeMovimento;
    if (key === 'w' && personagem.noChao) personagem.velocidadeY = -personagem.forcaPulo;
    if (gameOver && key === 'r') reiniciarJogo();
  });

  window.addEventListener('keyup', (e) => {
    const key = e.key.toLowerCase();
    if (key === 'a' || key === 'd') personagem.velocidadeX = 0;
  });
}

// ======= Lógica do Jogo =======
function atualizarPersonagem() {
  personagem.velocidadeY += personagem.gravidade;
  personagem.y += personagem.velocidadeY;
  personagem.x += personagem.velocidadeX;

  personagem.noChao = false;

  blocos.forEach((bloco) => {
    resolverColisao(personagem, bloco);
  });

  personagem.x = Math.max(0, Math.min(canvas.width - personagem.size, personagem.x));
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

function atualizarInimigos() {
  inimigos.forEach((inimigo, index) => {
    let alvoX = inimigo.x;
    if (inimigo.x < personagem.x) alvoX += inimigo.velocidade;
    else if (inimigo.x > personagem.x) alvoX -= inimigo.velocidade;

    let podeMover = true;
    const margem = 5;

    inimigos.forEach((outro, i) => {
      if (i !== index && Math.abs(alvoX - outro.x) < inimigo.width + margem) {
        podeMover = false;
      }
    });

    if (podeMover) inimigo.x = alvoX;

    if (inimigo.y < inimigo.alturaMaxima) {
      inimigo.y = Math.min(inimigo.y + 1, inimigo.alturaMaxima);
    }
  });
}

// ======= Sistema de Projéteis =======
function criarProjetil() {
  if (gameOver || faseCompleta) return;

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

function criarProjetilInimigo(inimigo) {
  const origemX = inimigo.x + inimigo.width / 2;
  const origemY = inimigo.y + inimigo.height / 2;
  const dx = personagem.x + personagem.size / 2 - origemX;
  const dy = personagem.y + personagem.size / 2 - origemY;
  const distancia = Math.sqrt(dx * dx + dy * dy);

  projeteisInimigos.push({
    x: origemX,
    y: origemY,
    dx: dx / distancia,
    dy: dy / distancia,
    size: 6,
  });
}

function atualizarProjeteis() {
  atualizarListaProjeteis(projeteis, (p, i) => {
    for (let j = inimigos.length - 1; j >= 0; j--) {
      const inimigo = inimigos[j];
      if (colisaoProjetilObjeto(p, inimigo)) {
        criarExplosao(p.x, p.y);

        // Aplica dano ao inimigo
        inimigo.vidaAtual -= inimigo.danoPorProjetil;

        // Verifica se o inimigo morreu
        if (inimigo.vidaAtual <= 0) {
          inimigos.splice(j, 1);

          if (inimigos.length === 0 && !faseCompleta) {
            faseCompleta = true;
            avancarFase();
          }
        }
        return true;
      }
    }
    return false;
  });

  atualizarListaProjeteis(projeteisInimigos, (p, i) => {
    if (colisaoProjetilObjeto(p, personagem)) {
      criarExplosao(p.x, p.y);

      const agora = Date.now();
      if (!invulneravel || agora - tempoUltimoDano > tempoInvulneravel) {
        // Reduz vida gradualmente em vez de perder vida inteira
        personagem.vidaAtual -= 20; // Dano do inimigo

        tempoUltimoDano = agora;
        invulneravel = true;

        setTimeout(() => {
          invulneravel = false;
        }, tempoInvulneravel);

        if (personagem.vidaAtual <= 0) {
          personagem.vidas--;
          personagem.vidaAtual = personagem.vidaMaxima; // Reseta a vida para próxima "chance"

          if (personagem.vidas <= 0 && !gameOverAtivo) {
            gameOverAtivo = true;
            tempoGameOver = Date.now();
            gameOver = true;
          } else {
            piscarPersonagem();
          }
        } else {
          piscarPersonagem();
        }
      }
      return true;
    }
    return false;
  });

  verificarColisoesEntreProjeteis();
}

function piscarPersonagem() {
  let contador = 0;
  const maxPiscadas = 10; // Aumentei para dar mais feedback
  const intervaloPiscada = 100; // ms entre cada piscada

  const intervalo = setInterval(() => {
    personagem.visivel = !personagem.visivel;
    contador++;

    if (contador >= maxPiscadas) {
      clearInterval(intervalo);
      personagem.visivel = true;
    }
  }, intervaloPiscada);
}

function colisaoProjetilObjeto(projetil, objeto) {
  // Verifica se o objeto é o personagem (que tem propriedade 'size' em vez de 'width/height')
  if (objeto === personagem) {
    return (
      projetil.x < personagem.x + personagem.size &&
      projetil.x + projetil.size > personagem.x &&
      projetil.y < personagem.y + personagem.size &&
      projetil.y + projetil.size > personagem.y
    );
  }

  // Para outros objetos (inimigos, blocos) que usam width/height
  return (
    projetil.x < objeto.x + objeto.width &&
    projetil.x + projetil.size > objeto.x &&
    projetil.y < objeto.y + objeto.height &&
    projetil.y + projetil.size > objeto.y
  );
}

function atualizarListaProjeteis(lista, callbackColisao) {
  for (let i = lista.length - 1; i >= 0; i--) {
    const p = lista[i];
    p.x += p.dx * velocidadeProjetil;
    p.y += p.dy * velocidadeProjetil;

    if (p.x < 0 || p.x > canvas.width || p.y < 0 || p.y > canvas.height) {
      lista.splice(i, 1);
      continue;
    }

    for (const bloco of blocos) {
      if (colisaoProjetilObjeto(p, bloco)) {
        criarExplosao(p.x, p.y);
        lista.splice(i, 1);
        break;
      }
    }

    if (callbackColisao(p, i)) {
      lista.splice(i, 1);
    }
  }

  // Projéteis inimigos
  for (let i = projeteisInimigos.length - 1; i >= 0; i--) {
    const p = projeteisInimigos[i];
    p.x += p.dx * velocidadeProjetil;
    p.y += p.dy * velocidadeProjetil;

    // Verifica se saiu da tela
    if (p.x < 0 || p.x > canvas.width || p.y < 0 || p.y > canvas.height) {
      projeteisInimigos.splice(i, 1);
      continue;
    }

    // Verifica colisão com blocos
    let colidiuComBloco = false;
    for (const bloco of blocos) {
      if (colisaoProjetilObjeto(p, bloco)) {
        criarExplosao(p.x, p.y);
        projeteisInimigos.splice(i, 1);
        colidiuComBloco = true;
        break;
      }
    }
    if (colidiuComBloco) continue;

    // Verifica colisão com personagem
    if (colisaoProjetilObjeto(p, personagem)) {
      criarExplosao(p.x, p.y);

      const agora = Date.now();
      if (!invulneravel || agora - tempoUltimoDano > tempoInvulneravel) {
        personagem.vidaAtual -= 20; // Valor do dano
        tempoUltimoDano = agora;
        invulneravel = true;

        setTimeout(() => {
          invulneravel = false;
        }, tempoInvulneravel);

        if (personagem.vidaAtual <= 0) {
          personagem.vidas--;
          personagem.vidaAtual = personagem.vidaMaxima;

          if (personagem.vidas <= 0 && !gameOverAtivo) {
            gameOverAtivo = true;
            tempoGameOver = Date.now();
            gameOver = true;
          }
        }
        piscarPersonagem();
      }
      projeteisInimigos.splice(i, 1);
      continue;
    }
  }

  verificarColisoesEntreProjeteis();
}

function verificarColisoesEntreProjeteis() {
  for (let i = projeteis.length - 1; i >= 0; i--) {
    for (let j = projeteisInimigos.length - 1; j >= 0; j--) {
      const p = projeteis[i];
      const pi = projeteisInimigos[j];

      if (Math.hypot(p.x - pi.x, p.y - pi.y) < (p.size + pi.size) / 2) {
        criarExplosao((p.x + pi.x) / 2, (p.y + pi.y) / 2);
        projeteis.splice(i, 1);
        projeteisInimigos.splice(j, 1);
        break;
      }
    }
  }
}

function avancarFase() {
  faseAtual++;
  if (faseAtual < fases.length) {
    setTimeout(() => iniciarFase(faseAtual), 2000);
  } else {
    gameOver = true;
  }
}

function reiniciarJogo() {
  faseAtual = 0;
  gameOver = false;
  personagem.x = 100;
  personagem.y = 0;
  personagem.velocidadeX = 0;
  personagem.velocidadeY = 0;
  personagem.vidas = vidasIniciais;
  personagem.vidaAtual = personagem.vidaMaxima; // Resetar vida atual
  invulneravel = false;
  iniciarFase(faseAtual);
  if (!gameLoop) {
    loop();
  }
}

// ======= Sistema de Explosões =======
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

// ======= Sistema de Colisão com Inimigos =======
function verificarColisaoPersonagemInimigos() {
  const agora = Date.now();

  inimigos.forEach(inimigo => {
    if (colisaoPersonagemInimigo(personagem, inimigo)) {
      if (!invulneravel || agora - tempoUltimoDano > tempoInvulneravel) {
        // Dano progressivo por contato
        personagem.vidaAtual -= 5; // Dano menor que por projétil

        tempoUltimoDano = agora;
        invulneravel = true;

        piscarPersonagem();

        setTimeout(() => {
          invulneravel = false;
        }, tempoInvulneravel);

        if (personagem.vidaAtual <= 0) {
          personagem.vidas--;
          personagem.vidaAtual = personagem.vidaMaxima;

          if (personagem.vidas <= 0) {
            gameOver = true;
          }
        }
      }
    }
  });
}

function colisaoPersonagemInimigo(personagem, inimigo) {
  return (
    personagem.x < inimigo.x + inimigo.width &&
    personagem.x + personagem.size > inimigo.x &&
    personagem.y < inimigo.y + inimigo.height &&
    personagem.y + personagem.size > inimigo.y
  );
}

// ======= Renderização =======
function draw() {
  ctx.fillStyle = fases[faseAtual].corFundo || 'black';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = 'white';
  ctx.font = '20px Arial';
  ctx.fillText(`Fase: ${faseAtual + 1}/${fases.length}`, 20, 30);
  ctx.fillText(`Vidas: ${personagem.vidas}`, 20, 60);

  ctx.fillStyle = 'green';
  blocos.forEach((bloco) => ctx.fillRect(bloco.x, bloco.y, bloco.width, bloco.height));

  ctx.fillStyle = 'red';
  inimigos.forEach(inimigo => {
    ctx.fillRect(inimigo.x, inimigo.y, inimigo.width, inimigo.height);
  });

  ctx.fillStyle = 'yellow';
  projeteis.forEach((p) => ctx.fillRect(p.x, p.y, p.size, p.size));

  ctx.fillStyle = 'orange';
  projeteisInimigos.forEach((p) => ctx.fillRect(p.x, p.y, p.size, p.size));

  // Renderização do personagem com invulnerabilidade
  if (!invulneravel || (Date.now() - tempoUltimoDano) % 200 < 100) {
    ctx.fillStyle = 'white';
    ctx.fillRect(personagem.x, personagem.y, personagem.size, personagem.size);
  }
  // Renderização do personagem
  if (personagem.visivel) {
    ctx.fillStyle = 'white';
    ctx.fillRect(personagem.x, personagem.y, personagem.size, personagem.size);

    // Barra de vida
    const vidaWidth = (personagem.vidaAtual / personagem.vidaMaxima) * personagem.size;
    ctx.fillStyle = 'red';
    ctx.fillRect(personagem.x, personagem.y - 15, personagem.size, 5);
    ctx.fillStyle = 'lime';
    ctx.fillRect(personagem.x, personagem.y - 15, vidaWidth, 5);
  }

  explosoes.forEach(particulas => {
    particulas.forEach(p => {
      ctx.fillStyle = `rgba(255, 200, 0, ${p.vida})`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.tamanho, 0, Math.PI * 2);
      ctx.fill();
    });
  });

  // Desenha inimigos com barra de vida
  inimigos.forEach(inimigo => {
    ctx.fillStyle = 'red';
    ctx.fillRect(inimigo.x, inimigo.y, inimigo.width, inimigo.height);

    // Barra de vida do inimigo
    const vidaWidth = (inimigo.vidaAtual / inimigo.vidaMaxima) * inimigo.width;
    ctx.fillStyle = 'lime';
    ctx.fillRect(inimigo.x, inimigo.y - 10, vidaWidth, 5);
  });



  // Atualiza o texto de vidas para mostrar vida atual
  ctx.fillStyle = 'white';
  ctx.font = '20px Arial';
  ctx.fillText(`Fase: ${faseAtual + 1}/${fases.length}`, 20, 30);
  ctx.fillText(`Vidas: ${personagem.vidas}`, 20, 60);
  ctx.fillText(`Vida: ${Math.max(0, personagem.vidaAtual)}/${personagem.vidaMaxima}`, 20, 90);


  if (gameOver) {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = 'white';
    ctx.font = '40px Arial';
    ctx.textAlign = 'center';
    const mensagem = faseAtual >= fases.length ? 'Você Venceu!' : 'Game Over';
    ctx.fillText(mensagem, canvas.width / 2, canvas.height / 2 - 40);
    ctx.font = '20px Arial';
    ctx.fillText('Pressione R para reiniciar', canvas.width / 2, canvas.height / 2 + 20);
    ctx.textAlign = 'left';
  }
}

// ======= Loop Principal =======
function loop() {
  if (!gameOver) {
    atualizarPersonagem();
    atualizarInimigos();
    atualizarProjeteis();
    atualizarExplosoes();
    verificarColisaoPersonagemInimigos();
    draw();
    gameLoop = requestAnimationFrame(loop);
  } else {
    draw();
    
    // Verifica se é hora de reiniciar
    if (gameOverAtivo && Date.now() - tempoGameOver > delayReinicio) {
      reiniciarJogo();
    } else {
      gameLoop = requestAnimationFrame(loop);
    }
  }
}

// ======= Inicialização =======
setupEventListeners();
init();