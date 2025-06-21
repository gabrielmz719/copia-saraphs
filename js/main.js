/**
 * ======= PONTO DE ENTRADA PRINCIPAL =======
 * Inicializar e começar o jogo
 */

/**
 * Inicializar o jogo
 */
function initGame() {
    try {
        console.log('Inicializando Arena de Sobrevivência...');
        
        // Inicializar estado do jogo
        initializeGameState();
        
        // Inicializar UI
        initializeUI();
        
        // Configurar ouvintes de eventos
        setupEventListeners();
        
        // Iniciar a primeira onda
        spawnEnemies();
        
        // Iniciar loop do jogo
        startGameLoop();
        
        console.log('Jogo inicializado com sucesso!');
        createNotification('Bem-vindo à Arena de Sobrevivência!', 'success', 3000);
        
    } catch (error) {
        console.error('Falha ao inicializar jogo:', error);
        alert('Falha ao inicializar jogo. Por favor, atualize a página.');
    }
}

/**
 * Configurar todos os ouvintes de eventos
 */
function setupEventListeners() {
    // Eventos de teclado
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    
    // Eventos de mouse
    GameState.canvas.addEventListener('mousemove', handleMouseMove);
    GameState.canvas.addEventListener('click', handleMouseClick);
    
    // Eventos de janela
    window.addEventListener('resize', handleWindowResize);
    window.addEventListener('beforeunload', handleBeforeUnload);
    
    // Prevenir menu de contexto no canvas
    GameState.canvas.addEventListener('contextmenu', (e) => e.preventDefault());
    
    console.log('Ouvintes de eventos configurados');
}

/**
 * Lidar com eventos de tecla pressionada
 */
function handleKeyDown(event) {
    const key = event.code;
    
    // Prevenir padrão para teclas do jogo
    if (['KeyW', 'KeyA', 'KeyS', 'KeyD', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(key)) {
        event.preventDefault();
    }
    
    // Armazenar estado da tecla
    GameState.keys[key] = true;
    
    // Lidar com teclas especiais
    switch (key) {
        case 'KeyP':
            if (!GameState.gameOver && !GameState.showingUpgrades) {
                togglePause();
            }
            break;
            
        case 'KeyR':
            if (GameState.gameOver) {
                restartGame();
            }
            break;
            
        case 'Escape':
            if (GameState.showingUpgrades) {
                // Cancelar seleção de melhoria (se quisermos permitir isso)
                // GameState.showingUpgrades = false;
            } else if (!GameState.gameOver) {
                togglePause();
            }
            break;
    }
}

/**
 * Lidar com eventos de tecla solta
 */
function handleKeyUp(event) {
    GameState.keys[event.code] = false;
}

/**
 * Lidar com movimento do mouse
 */
function handleMouseMove(event) {
    const rect = GameState.canvas.getBoundingClientRect();
    GameState.mouse.x = event.clientX - rect.left;
    GameState.mouse.y = event.clientY - rect.top;
}

/**
 * Lidar com cliques do mouse
 */
function handleMouseClick(event) {
    const rect = GameState.canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    // Lidar com seleção de melhoria
    if (GameState.showingUpgrades) {
        handleUpgradeClick(x, y);
        return;
    }
    
    // Tiro manual (se quisermos permitir isso)
    if (isGamePlayable()) {
        createPlayerProjectile();
    }
}

/**
 * Lidar com redimensionamento da janela
 */
function handleWindowResize() {
    resizeCanvas();
    console.log(`Canvas redimensionado para ${GameState.canvas.width}x${GameState.canvas.height}`);
}

/**
 * Lidar com antes de descarregar (fechar página)
 */
function handleBeforeUnload(event) {
    // Salvar estado do jogo ou mostrar aviso se necessário
    if (!GameState.gameOver && GameState.kills > 0) {
        event.preventDefault();
        event.returnValue = 'Tem certeza que quer sair? Seu progresso será perdido.';
        return event.returnValue;
    }
}

/**
 * Lidar com mudança de visibilidade (troca de aba)
 */
function handleVisibilityChange() {
    if (document.hidden && isGamePlayable()) {
        // Auto-pausar quando a aba não está visível
        GameState.gamePaused = true;
    }
}

// Configurar ouvinte de mudança de visibilidade
document.addEventListener('visibilitychange', handleVisibilityChange);

// Inicializar jogo quando DOM estiver carregado
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initGame);
} else {
    initGame();
}

// Manipulador de erro global
window.addEventListener('error', (event) => {
    console.error('Erro do jogo:', event.error);
    createNotification('Ocorreu um erro. Verifique o console para detalhes.', 'error', 5000);
});

// Exportar para depuração
window.GameDebug = {
    GameState,
    CONFIG,
    WAVES,
    restartGame,
    togglePause,
    addXP: (amount) => addXP(amount),
    setWave: (wave) => {
        GameState.currentWave = Math.max(0, Math.min(wave, WAVES.length - 1));
        GameState.enemies = [];
        spawnEnemies();
    },
    giveUpgrade: (upgradeId) => applyUpgrade(upgradeId),
    godMode: () => {
        GameState.player.maxHealth = 9999;
        GameState.player.health = 9999;
        GameState.player.lives = 99;
        createNotification('Modo Deus Ativado', 'success');
    }
};

console.log('Arena de Sobrevivência carregada. Use window.GameDebug para depuração.');