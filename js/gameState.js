/**
 * ======= GERENCIAMENTO DE ESTADO DO JOGO =======
 * Gerenciamento centralizado de estado para o jogo arena de sobrevivência
 */

// Constantes de configuração do jogo
const CONFIG = {
    CANVAS_ID: 'gameCanvas',
    GROUND_HEIGHT: 50,
    BLOCK_SIZE: 50,
    PROJECTILE_SPEED: 8,
    SHOOT_INTERVAL: 300, // Reduzido para melhor sensação de jogabilidade
    INVULNERABILITY_TIME: 1000,
    GAME_OVER_DELAY: 3000,
    XP_PER_KILL: 25,
    XP_TO_LEVEL: 100
};

// Configuração de ondas - dificuldade progressiva
const WAVES = [
    { enemies: 3, enemySpeed: 1.5, enemyShootInterval: 2000, backgroundColor: '#0a0a0a', name: 'Iniciação' },
    { enemies: 5, enemySpeed: 2, enemyShootInterval: 1800, backgroundColor: '#0a0a1a', name: 'Ameaça Crescente' },
    { enemies: 7, enemySpeed: 2.5, enemyShootInterval: 1500, backgroundColor: '#1a0a0a', name: 'Escalada' },
    { enemies: 9, enemySpeed: 3, enemyShootInterval: 1200, backgroundColor: '#0a1a0a', name: 'Avassalador' },
    { enemies: 12, enemySpeed: 3.5, enemyShootInterval: 1000, backgroundColor: '#1a1a0a', name: 'Resistência Final' }
];

// Estado global do jogo
const GameState = {
    // Canvas e contexto
    canvas: null,
    ctx: null,
    
    // Entidades do jogo
    player: null,
    enemies: [],
    playerProjectiles: [],
    enemyProjectiles: [],
    explosions: [],
    blocks: [],
    xpGems: [],
    
    // Controle de fluxo do jogo
    currentWave: 0,
    gameOver: false,
    gamePaused: false,
    waveComplete: false,
    showingUpgrades: false,
    gameStartTime: 0,
    
    // Estatísticas do jogador
    kills: 0,
    xp: 0,
    level: 1,
    
    // Tempo e intervalos
    intervals: [],
    lastShootTime: 0,
    gameOverTime: 0,
    
    // Estado de entrada
    keys: {},
    mouse: { x: 0, y: 0 },
    
    // Sistema de melhorias
    availableUpgrades: [],
    activeUpgrades: new Set(),
    
    // Rastreamento de desempenho
    lastFrameTime: 0,
    fps: 0
};

/**
 * Inicializar o estado do jogo
 */
function initializeGameState() {
    GameState.canvas = document.getElementById(CONFIG.CANVAS_ID);
    if (!GameState.canvas) {
        throw new Error(`Elemento canvas com ID '${CONFIG.CANVAS_ID}' não encontrado!`);
    }
    
    GameState.ctx = GameState.canvas.getContext('2d');
    GameState.gameStartTime = Date.now();
    
    // Inicializar jogador
    GameState.player = createPlayer();
    
    // Configurar canvas e blocos
    resizeCanvas();
    
    console.log('Estado do jogo inicializado com sucesso');
}

/**
 * Resetar estado do jogo para novo jogo
 */
function resetGameState() {
    // Limpar todos os intervalos
    GameState.intervals.forEach(clearInterval);
    GameState.intervals = [];
    
    // Resetar fluxo do jogo
    GameState.currentWave = 0;
    GameState.gameOver = false;
    GameState.gamePaused = false;
    GameState.waveComplete = false;
    GameState.showingUpgrades = false;
    GameState.gameStartTime = Date.now();
    
    // Resetar estatísticas
    GameState.kills = 0;
    GameState.xp = 0;
    GameState.level = 1;
    
    // Limpar entidades
    GameState.enemies = [];
    GameState.playerProjectiles = [];
    GameState.enemyProjectiles = [];
    GameState.explosions = [];
    GameState.xpGems = [];
    
    // Resetar jogador
    GameState.player = createPlayer();
    
    // Limpar melhorias ativas
    GameState.activeUpgrades.clear();
    
    // Resetar tempo
    GameState.lastShootTime = 0;
    GameState.gameOverTime = 0;
    
    console.log('Estado do jogo resetado');
}

/**
 * Lidar com redimensionamento do canvas
 */
function resizeCanvas() {
    GameState.canvas.width = window.innerWidth;
    GameState.canvas.height = window.innerHeight;
    
    // Reconstruir blocos
    GameState.blocks = [];
    
    // Chão
    GameState.blocks.push({
        x: 0,
        y: GameState.canvas.height - CONFIG.GROUND_HEIGHT,
        width: GameState.canvas.width,
        height: CONFIG.GROUND_HEIGHT,
        type: 'ground'
    });
    
    // Criar estruturas de plataforma
    createPlatforms();
}

/**
 * Criar estruturas de plataforma para jogabilidade mais interessante
 */
function createPlatforms() {
    const canvas = GameState.canvas;
    const blockSize = CONFIG.BLOCK_SIZE;
    
    // Escada esquerda
    createStaircase(blockSize * 2, canvas.height - CONFIG.GROUND_HEIGHT, 4, false);
    
    // Escada direita
    createStaircase(canvas.width - blockSize * 6, canvas.height - CONFIG.GROUND_HEIGHT, 5, true);
    
    // Plataformas centrais
    const centerX = canvas.width / 2;
    GameState.blocks.push({
        x: centerX - blockSize * 2,
        y: canvas.height - CONFIG.GROUND_HEIGHT - blockSize * 2,
        width: blockSize * 4,
        height: blockSize,
        type: 'platform'
    });
    
    GameState.blocks.push({
        x: centerX - blockSize,
        y: canvas.height - CONFIG.GROUND_HEIGHT - blockSize * 4,
        width: blockSize * 2,
        height: blockSize,
        type: 'platform'
    });
}

/**
 * Criar uma estrutura de escada
 */
function createStaircase(startX, startY, steps, rightDirection = true) {
    const blockSize = CONFIG.BLOCK_SIZE;
    
    for (let i = 0; i < steps; i++) {
        const x = rightDirection ? startX + i * blockSize : startX - i * blockSize;
        
        for (let j = 0; j <= i; j++) {
            const y = startY - j * blockSize;
            GameState.blocks.push({
                x,
                y,
                width: blockSize,
                height: blockSize,
                type: 'stair'
            });
        }
    }
}

/**
 * Obter configuração da onda atual
 */
function getCurrentWave() {
    return WAVES[GameState.currentWave] || WAVES[WAVES.length - 1];
}

/**
 * Verificar se o jogo está em estado jogável
 */
function isGamePlayable() {
    return !GameState.gameOver && !GameState.gamePaused && !GameState.showingUpgrades;
}

/**
 * Adicionar XP e lidar com subida de nível
 */
function addXP(amount) {
    GameState.xp += amount;
    
    while (GameState.xp >= CONFIG.XP_TO_LEVEL) {
        GameState.xp -= CONFIG.XP_TO_LEVEL;
        GameState.level++;
        
        // Mostrar seleção de melhoria
        showUpgradeSelection();
    }
}

/**
 * Formatar tempo para exibição
 */
function formatTime(milliseconds) {
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
}

// Exportar para acesso global
window.GameState = GameState;
window.CONFIG = CONFIG;
window.WAVES = WAVES;