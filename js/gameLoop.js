/**
 * ======= LOOP DO JOGO =======
 * Loop principal do jogo e lógica de atualização
 */

let gameLoopId = null;

/**
 * Iniciar o loop do jogo
 */
function startGameLoop() {
    if (gameLoopId) {
        cancelAnimationFrame(gameLoopId);
    }
    
    gameLoop();
}

/**
 * Parar o loop do jogo
 */
function stopGameLoop() {
    if (gameLoopId) {
        cancelAnimationFrame(gameLoopId);
        gameLoopId = null;
    }
}

/**
 * Loop principal do jogo
 */
function gameLoop() {
    const currentTime = Date.now();
    const deltaTime = currentTime - GameState.lastFrameTime;
    GameState.lastFrameTime = currentTime;
    
    // Calcular FPS
    GameState.fps = 1000 / deltaTime;
    
    // Atualizar estado do jogo
    if (isGamePlayable()) {
        updateGame();
    }
    
    // Sempre renderizar
    render();
    
    // Lidar com reinício automático do fim de jogo
    if (GameState.gameOver && !GameState.gameWon) {
        if (currentTime - GameState.gameOverTime > CONFIG.GAME_OVER_DELAY) {
            restartGame();
        }
    }
    
    // Continuar loop
    gameLoopId = requestAnimationFrame(gameLoop);
}

/**
 * Atualizar todos os sistemas do jogo
 */
function updateGame() {
    // Atualizar entidades
    updatePlayer();
    updateEnemies();
    updateProjectiles();
    updateExplosions();
    updateXPGems();
    
    // Verificar colisões
    checkPlayerEnemyCollisions();
    
    // Lidar com entrada
    handleContinuousInput();
    
    // Tiro automático
    if (Date.now() - GameState.lastShootTime > CONFIG.SHOOT_INTERVAL) {
        createPlayerProjectile();
    }
}

/**
 * Lidar com entrada contínua (movimento)
 */
function handleContinuousInput() {
    const player = GameState.player;
    
    // Resetar velocidade horizontal
    player.velocityX = 0;
    
    // Movimento
    if (GameState.keys['KeyA'] || GameState.keys['ArrowLeft']) {
        player.velocityX = -player.moveSpeed;
    }
    if (GameState.keys['KeyD'] || GameState.keys['ArrowRight']) {
        player.velocityX = player.moveSpeed;
    }
    
    // Pulo
    if ((GameState.keys['KeyW'] || GameState.keys['ArrowUp'] || GameState.keys['Space']) && player.onGround) {
        player.velocityY = -player.jumpForce;
        player.onGround = false;
    }
}

/**
 * Iniciar nova onda
 */
function startNewWave() {
    GameState.waveComplete = false;
    spawnEnemies();
    
    const wave = getCurrentWave();
    createNotification(`Onda ${GameState.currentWave + 1}: ${wave.name}`, 'info', 2000);
}

/**
 * Reiniciar o jogo
 */
function restartGame() {
    console.log('Reiniciando jogo...');
    
    // Resetar estado do jogo
    resetGameState();
    
    // Iniciar primeira onda
    startNewWave();
    
    // Mostrar notificação de reinício
    createNotification('Jogo Reiniciado', 'success', 1500);
}

/**
 * Pausar/despausar o jogo
 */
function togglePause() {
    GameState.gamePaused = !GameState.gamePaused;
    
    if (GameState.gamePaused) {
        createNotification('Jogo Pausado', 'info', 1000);
    } else {
        createNotification('Jogo Retomado', 'success', 1000);
    }
}