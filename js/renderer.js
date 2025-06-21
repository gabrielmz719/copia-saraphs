/**
 * ======= SISTEMA DE RENDERIZAÇÃO =======
 * Lida com toda a renderização do jogo e efeitos visuais
 */

/**
 * Função principal de renderização
 */
function render() {
    const ctx = GameState.ctx;
    const canvas = GameState.canvas;
    
    // Limpar canvas com fundo da onda
    const wave = getCurrentWave();
    ctx.fillStyle = wave.backgroundColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Aplicar tremor de tela se ativo
    applyScreenShake(ctx);
    
    // Renderizar elementos do jogo em ordem
    renderBackground();
    renderBlocks();
    renderXPGems();
    renderEnemies();
    renderPlayer();
    renderProjectiles();
    renderExplosions();
    renderUpgradeSelection();
    renderGameOverScreen();
    
    // Resetar transformações
    ctx.setTransform(1, 0, 0, 1, 0, 0);
}

/**
 * Aplicar efeito de tremor de tela
 */
function applyScreenShake(ctx) {
    if (GameState.screenShake) {
        const shake = GameState.screenShake;
        const elapsed = Date.now() - shake.startTime;
        
        if (elapsed < shake.duration) {
            const intensity = shake.intensity * (1 - elapsed / shake.duration);
            const offsetX = (Math.random() - 0.5) * intensity;
            const offsetY = (Math.random() - 0.5) * intensity;
            
            ctx.translate(offsetX, offsetY);
        } else {
            GameState.screenShake = null;
        }
    }
}

/**
 * Renderizar elementos de fundo
 */
function renderBackground() {
    const ctx = GameState.ctx;
    const canvas = GameState.canvas;
    
    // Renderizar estrelas ou partículas no fundo
    ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
    for (let i = 0; i < 50; i++) {
        const x = (i * 137.5) % canvas.width;
        const y = (i * 73.3) % canvas.height;
        const size = Math.sin(Date.now() * 0.001 + i) * 0.5 + 1;
        
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fill();
    }
}

/**
 * Renderizar blocos/plataformas
 */
function renderBlocks() {
    const ctx = GameState.ctx;
    
    GameState.blocks.forEach(block => {
        // Cores diferentes para diferentes tipos de bloco
        switch (block.type) {
            case 'ground':
                ctx.fillStyle = '#2a4a2a';
                break;
            case 'platform':
                ctx.fillStyle = '#4a4a2a';
                break;
            case 'stair':
                ctx.fillStyle = '#3a3a4a';
                break;
            default:
                ctx.fillStyle = '#2a2a2a';
        }
        
        ctx.fillRect(block.x, block.y, block.width, block.height);
        
        // Adicionar borda para melhor visibilidade
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.lineWidth = 1;
        ctx.strokeRect(block.x, block.y, block.width, block.height);
    });
}

/**
 * Renderizar gemas de XP
 */
function renderXPGems() {
    const ctx = GameState.ctx;
    
    GameState.xpGems.forEach(gem => {
        if (gem.collected) return;
        
        const alpha = gem.life;
        const sparkle = Math.sin(gem.sparkleTime * 10) * 0.3 + 0.7;
        
        // Brilho da gema
        const gradient = ctx.createRadialGradient(gem.x, gem.y, 0, gem.x, gem.y, gem.size * 2);
        gradient.addColorStop(0, `rgba(0, 255, 136, ${alpha * sparkle})`);
        gradient.addColorStop(1, `rgba(0, 255, 136, 0)`);
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(gem.x, gem.y, gem.size * 2, 0, Math.PI * 2);
        ctx.fill();
        
        // Núcleo da gema
        ctx.fillStyle = `rgba(0, 255, 136, ${alpha})`;
        ctx.beginPath();
        ctx.arc(gem.x, gem.y, gem.size, 0, Math.PI * 2);
        ctx.fill();
        
        // Destaque da gema
        ctx.fillStyle = `rgba(255, 255, 255, ${alpha * 0.8})`;
        ctx.beginPath();
        ctx.arc(gem.x - gem.size * 0.3, gem.y - gem.size * 0.3, gem.size * 0.3, 0, Math.PI * 2);
        ctx.fill();
    });
}

/**
 * Renderizar inimigos
 */
function renderEnemies() {
    const ctx = GameState.ctx;
    
    GameState.enemies.forEach(enemy => {
        // Corpo do inimigo
        ctx.fillStyle = enemy.color;
        ctx.fillRect(enemy.x, enemy.y, enemy.width, enemy.height);
        
        // Borda do inimigo
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1;
        ctx.strokeRect(enemy.x, enemy.y, enemy.width, enemy.height);
        
        // Barra de vida
        const healthBarWidth = enemy.width;
        const healthBarHeight = 4;
        const healthPercent = enemy.health / enemy.maxHealth;
        
        // Fundo da barra de vida
        ctx.fillStyle = 'rgba(255, 0, 0, 0.3)';
        ctx.fillRect(enemy.x, enemy.y - 8, healthBarWidth, healthBarHeight);
        
        // Preenchimento da barra de vida
        ctx.fillStyle = healthPercent > 0.5 ? '#00ff00' : healthPercent > 0.25 ? '#ffff00' : '#ff0000';
        ctx.fillRect(enemy.x, enemy.y - 8, healthBarWidth * healthPercent, healthBarHeight);
        
        // Olhos do inimigo
        ctx.fillStyle = '#ff0000';
        ctx.fillRect(enemy.x + 8, enemy.y + 8, 4, 4);
        ctx.fillRect(enemy.x + enemy.width - 12, enemy.y + 8, 4, 4);
    });
}

/**
 * Renderizar jogador
 */
function renderPlayer() {
    const ctx = GameState.ctx;
    const player = GameState.player;
    
    if (!player.visible) return;
    
    // Renderizar efeito de rastro
    player.trailPositions.forEach((trail, index) => {
        if (trail.alpha <= 0) return;
        
        ctx.fillStyle = `rgba(255, 255, 255, ${trail.alpha * 0.3})`;
        const size = player.size * (0.5 + trail.alpha * 0.5);
        ctx.fillRect(
            trail.x + (player.size - size) / 2,
            trail.y + (player.size - size) / 2,
            size,
            size
        );
    });
    
    // Flash de invulnerabilidade do jogador
    if (player.invulnerable && (Date.now() - player.lastDamageTime) % 200 < 100) {
        return; // Pular renderização para efeito de flash
    }
    
    // Corpo do jogador
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(player.x, player.y, player.size, player.size);
    
    // Borda do jogador
    ctx.strokeStyle = '#00ff88';
    ctx.lineWidth = 2;
    ctx.strokeRect(player.x, player.y, player.size, player.size);
    
    // Barra de vida do jogador
    const healthBarWidth = player.size;
    const healthBarHeight = 6;
    const healthPercent = player.health / player.maxHealth;
    
    // Fundo da barra de vida
    ctx.fillStyle = 'rgba(255, 0, 0, 0.5)';
    ctx.fillRect(player.x, player.y - 12, healthBarWidth, healthBarHeight);
    
    // Preenchimento da barra de vida
    ctx.fillStyle = healthPercent > 0.5 ? '#00ff00' : healthPercent > 0.25 ? '#ffff00' : '#ff0000';
    ctx.fillRect(player.x, player.y - 12, healthBarWidth * healthPercent, healthBarHeight);
    
    // Efeito de escudo se ativo
    if (GameState.activeUpgrades.has('shield')) {
        const shieldAlpha = 0.3 + Math.sin(Date.now() * 0.01) * 0.2;
        const gradient = ctx.createRadialGradient(
            player.x + player.size / 2, player.y + player.size / 2, 0,
            player.x + player.size / 2, player.y + player.size / 2, player.size
        );
        gradient.addColorStop(0, `rgba(0, 170, 255, 0)`);
        gradient.addColorStop(0.8, `rgba(0, 170, 255, ${shieldAlpha})`);
        gradient.addColorStop(1, `rgba(0, 170, 255, 0)`);
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(player.x + player.size / 2, player.y + player.size / 2, player.size, 0, Math.PI * 2);
        ctx.fill();
    }
}

/**
 * Renderizar projéteis
 */
function renderProjectiles() {
    const ctx = GameState.ctx;
    
    // Projéteis do jogador
    GameState.playerProjectiles.forEach(projectile => {
        // Renderizar rastro
        projectile.trail.forEach(trail => {
            if (trail.alpha <= 0) return;
            
            ctx.fillStyle = `rgba(255, 255, 0, ${trail.alpha})`;
            const size = projectile.size * trail.alpha;
            ctx.fillRect(
                trail.x - size / 2,
                trail.y - size / 2,
                size,
                size
            );
        });
        
        // Brilho do projétil
        const gradient = ctx.createRadialGradient(
            projectile.x, projectile.y, 0,
            projectile.x, projectile.y, projectile.size * 2
        );
        gradient.addColorStop(0, 'rgba(255, 255, 0, 0.8)');
        gradient.addColorStop(1, 'rgba(255, 255, 0, 0)');
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(projectile.x, projectile.y, projectile.size * 2, 0, Math.PI * 2);
        ctx.fill();
        
        // Núcleo do projétil
        ctx.fillStyle = '#ffff00';
        ctx.fillRect(
            projectile.x - projectile.size / 2,
            projectile.y - projectile.size / 2,
            projectile.size,
            projectile.size
        );
    });
    
    // Projéteis inimigos
    GameState.enemyProjectiles.forEach(projectile => {
        // Brilho do projétil
        const gradient = ctx.createRadialGradient(
            projectile.x, projectile.y, 0,
            projectile.x, projectile.y, projectile.size * 2
        );
        gradient.addColorStop(0, 'rgba(255, 100, 0, 0.8)');
        gradient.addColorStop(1, 'rgba(255, 100, 0, 0)');
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(projectile.x, projectile.y, projectile.size * 2, 0, Math.PI * 2);
        ctx.fill();
        
        // Núcleo do projétil
        ctx.fillStyle = '#ff6600';
        ctx.fillRect(
            projectile.x - projectile.size / 2,
            projectile.y - projectile.size / 2,
            projectile.size,
            projectile.size
        );
    });
}

/**
 * Renderizar explosões
 */
function renderExplosions() {
    const ctx = GameState.ctx;
    
    GameState.explosions.forEach(particles => {
        particles.forEach(particle => {
            if (particle.life <= 0) return;
            
            const alpha = particle.life;
            ctx.fillStyle = particle.color.replace(')', `, ${alpha})`).replace('rgb', 'rgba');
            
            ctx.beginPath();
            ctx.arc(particle.x, particle.y, particle.size * alpha, 0, Math.PI * 2);
            ctx.fill();
        });
    });
}

/**
 * Renderizar tela de seleção de melhoria
 */
function renderUpgradeSelection() {
    if (!GameState.showingUpgrades) return;
    
    const ctx = GameState.ctx;
    const canvas = GameState.canvas;
    
    // Sobreposição
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Título
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 36px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Escolha Sua Melhoria', canvas.width / 2, 120);
    
    // Cartas de melhoria
    const cardWidth = 200;
    const cardHeight = 280;
    const spacing = 40;
    const totalWidth = cardWidth * 3 + spacing * 2;
    const startX = (canvas.width - totalWidth) / 2;
    const startY = canvas.height / 2 - cardHeight / 2;
    
    GameState.availableUpgrades.forEach((upgrade, index) => {
        const cardX = startX + index * (cardWidth + spacing);
        const cardY = startY;
        
        // Fundo da carta
        const rarityColors = {
            common: '#666666',
            uncommon: '#00aa00',
            rare: '#0066ff',
            epic: '#aa00aa'
        };
        
        ctx.fillStyle = rarityColors[upgrade.rarity] || '#666666';
        ctx.fillRect(cardX, cardY, cardWidth, cardHeight);
        
        // Borda da carta
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.strokeRect(cardX, cardY, cardWidth, cardHeight);
        
        // Ícone
        ctx.font = '48px Arial';
        ctx.textAlign = 'center';
        ctx.fillStyle = '#ffffff';
        ctx.fillText(upgrade.icon, cardX + cardWidth / 2, cardY + 80);
        
        // Nome
        ctx.font = 'bold 18px Arial';
        ctx.fillText(upgrade.name, cardX + cardWidth / 2, cardY + 130);
        
        // Descrição
        ctx.font = '14px Arial';
        ctx.fillStyle = '#cccccc';
        
        // Quebra de linha da descrição
        const words = upgrade.description.split(' ');
        let line = '';
        let y = cardY + 160;
        
        words.forEach(word => {
            const testLine = line + word + ' ';
            const metrics = ctx.measureText(testLine);
            
            if (metrics.width > cardWidth - 20 && line !== '') {
                ctx.fillText(line, cardX + cardWidth / 2, y);
                line = word + ' ';
                y += 20;
            } else {
                line = testLine;
            }
        });
        
        ctx.fillText(line, cardX + cardWidth / 2, y);
        
        // Indicador de raridade
        ctx.font = 'bold 12px Arial';
        ctx.fillStyle = rarityColors[upgrade.rarity] || '#666666';
        ctx.fillText(upgrade.rarity.toUpperCase(), cardX + cardWidth / 2, cardY + cardHeight - 20);
    });
    
    // Instruções
    ctx.font = '16px Arial';
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.fillText('Clique em uma melhoria para selecioná-la', canvas.width / 2, startY + cardHeight + 60);
    
    ctx.textAlign = 'left';
}

/**
 * Renderizar tela de fim de jogo
 */
function renderGameOverScreen() {
    if (!GameState.gameOver) return;
    
    const ctx = GameState.ctx;
    const canvas = GameState.canvas;
    
    // Sobreposição
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Título
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 48px Arial';
    ctx.textAlign = 'center';
    
    const title = GameState.gameWon ? 'Vitória!' : 'Fim de Jogo';
    const titleColor = GameState.gameWon ? '#00ff88' : '#ff4444';
    
    ctx.fillStyle = titleColor;
    ctx.fillText(title, canvas.width / 2, canvas.height / 2 - 100);
    
    // Estatísticas
    ctx.fillStyle = '#ffffff';
    ctx.font = '24px Arial';
    
    const stats = [
        `Onda Alcançada: ${GameState.currentWave + 1}`,
        `Inimigos Derrotados: ${GameState.kills}`,
        `Tempo Sobrevivido: ${formatTime(Date.now() - GameState.gameStartTime)}`,
        `Nível Alcançado: ${GameState.level}`
    ];
    
    stats.forEach((stat, index) => {
        ctx.fillText(stat, canvas.width / 2, canvas.height / 2 - 20 + index * 40);
    });
    
    // Instruções
    ctx.font = '18px Arial';
    ctx.fillStyle = '#cccccc';
    ctx.fillText('Pressione R para reiniciar', canvas.width / 2, canvas.height / 2 + 180);
    
    ctx.textAlign = 'left';
}