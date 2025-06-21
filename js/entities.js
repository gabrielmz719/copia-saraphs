/**
 * ======= ENTITY MANAGEMENT =======
 * Player, enemies, and entity-related functionality
 */

/**
 * Create the player entity
 */
function createPlayer() {
    return {
        x: 100,
        y: 0,
        size: 35,
        velocityX: 0,
        velocityY: 0,
        gravity: 0.7,
        onGround: false,
        moveSpeed: 6,
        jumpForce: 16,
        maxHealth: 100,
        health: 100,
        lives: 3,
        visible: true,
        invulnerable: false,
        lastDamageTime: 0,
        
        // Visual effects
        flashTime: 0,
        trailPositions: []
    };
}

/**
 * Create an enemy entity
 */
function createEnemy(x, targetY, wave) {
    return {
        x: x,
        y: 0,
        targetY: targetY,
        width: 35,
        height: 35,
        speed: wave.enemySpeed,
        maxHealth: 40 + GameState.currentWave * 15,
        health: 40 + GameState.currentWave * 15,
        lastShootTime: 0,
        shootInterval: wave.enemyShootInterval + Math.random() * 500,
        type: Math.random() < 0.3 ? 'fast' : 'normal', // 30% chance for fast enemy
        color: Math.random() < 0.3 ? '#ff4444' : '#cc2222'
    };
}

/**
 * Create XP gem at position
 */
function createXPGem(x, y) {
    return {
        x: x,
        y: y,
        size: 8,
        velocityX: (Math.random() - 0.5) * 4,
        velocityY: -Math.random() * 3 - 2,
        gravity: 0.3,
        life: 1.0,
        magnetRange: 80,
        collected: false,
        sparkleTime: 0
    };
}

/**
 * Update player physics and movement
 */
function updatePlayer() {
    const player = GameState.player;
    
    // Apply gravity
    player.velocityY += player.gravity;
    
    // Update position
    player.y += player.velocityY;
    player.x += player.velocityX;
    
    // Reset ground state
    player.onGround = false;
    
    // Check collisions with blocks
    GameState.blocks.forEach(block => {
        resolveCollision(player, block);
    });
    
    // Keep player in bounds
    player.x = Math.max(0, Math.min(GameState.canvas.width - player.size, player.x));
    
    // Update trail positions for visual effect
    updatePlayerTrail();
    
    // Update invulnerability
    if (player.invulnerable && Date.now() - player.lastDamageTime > CONFIG.INVULNERABILITY_TIME) {
        player.invulnerable = false;
    }
}

/**
 * Update player trail effect
 */
function updatePlayerTrail() {
    const player = GameState.player;
    
    // Add current position to trail
    player.trailPositions.unshift({ x: player.x, y: player.y, alpha: 1.0 });
    
    // Update trail positions and remove old ones
    for (let i = player.trailPositions.length - 1; i >= 0; i--) {
        const trail = player.trailPositions[i];
        trail.alpha -= 0.1;
        
        if (trail.alpha <= 0 || i > 8) {
            player.trailPositions.splice(i, 1);
        }
    }
}

/**
 * Resolve collision between player and block
 */
function resolveCollision(player, block) {
    const px = player.x, py = player.y, pw = player.size, ph = player.size;
    const bx = block.x, by = block.y, bw = block.width, bh = block.height;
    
    const overlapX = Math.min(px + pw, bx + bw) - Math.max(px, bx);
    const overlapY = Math.min(py + ph, by + bh) - Math.max(py, by);
    
    if (overlapX > 0 && overlapY > 0) {
        if (overlapX < overlapY) {
            // Horizontal collision
            player.x = px < bx ? bx - pw : bx + bw;
            player.velocityX = 0;
        } else {
            // Vertical collision
            if (py < by) {
                // Landing on top
                player.y = by - ph;
                player.velocityY = 0;
                player.onGround = true;
            } else {
                // Hitting from below
                player.y = by + bh;
                player.velocityY = 0;
            }
        }
    }
}

/**
 * Spawn enemies for current wave
 */
function spawnEnemies() {
    const wave = getCurrentWave();
    const canvas = GameState.canvas;
    
    for (let i = 0; i < wave.enemies; i++) {
        const x = (canvas.width / (wave.enemies + 1)) * (i + 1);
        const minY = canvas.height / 4;
        const maxY = canvas.height / 2;
        const targetY = Math.random() * (maxY - minY) + minY;
        
        GameState.enemies.push(createEnemy(x, targetY, wave));
    }
    
    console.log(`Spawned ${wave.enemies} enemies for wave ${GameState.currentWave + 1}`);
}

/**
 * Update all enemies
 */
function updateEnemies() {
    const player = GameState.player;
    const currentTime = Date.now();
    
    GameState.enemies.forEach((enemy, index) => {
        // Move towards player horizontally
        const targetX = player.x + player.size / 2;
        const enemyCenter = enemy.x + enemy.width / 2;
        
        if (Math.abs(targetX - enemyCenter) > 5) {
            const direction = targetX > enemyCenter ? 1 : -1;
            let newX = enemy.x + direction * enemy.speed;
            
            // Check for collision with other enemies
            let canMove = true;
            GameState.enemies.forEach((other, otherIndex) => {
                if (index !== otherIndex) {
                    const distance = Math.abs(newX - other.x);
                    if (distance < enemy.width + 10) {
                        canMove = false;
                    }
                }
            });
            
            if (canMove) {
                enemy.x = newX;
            }
        }
        
        // Move towards target Y position
        if (enemy.y < enemy.targetY) {
            enemy.y = Math.min(enemy.y + 2, enemy.targetY);
        }
        
        // Enemy shooting
        if (currentTime - enemy.lastShootTime > enemy.shootInterval) {
            createEnemyProjectile(enemy);
            enemy.lastShootTime = currentTime;
        }
    });
}

/**
 * Update XP gems
 */
function updateXPGems() {
    const player = GameState.player;
    
    for (let i = GameState.xpGems.length - 1; i >= 0; i--) {
        const gem = GameState.xpGems[i];
        
        if (gem.collected) continue;
        
        // Apply physics
        gem.velocityY += gem.gravity;
        gem.x += gem.velocityX;
        gem.y += gem.velocityY;
        
        // Magnet effect if player has magnet upgrade
        if (GameState.activeUpgrades.has('magnet')) {
            const distance = Math.hypot(
                player.x + player.size / 2 - gem.x,
                player.y + player.size / 2 - gem.y
            );
            
            if (distance < gem.magnetRange) {
                const magnetForce = 0.3;
                const dx = (player.x + player.size / 2 - gem.x) / distance;
                const dy = (player.y + player.size / 2 - gem.y) / distance;
                
                gem.velocityX += dx * magnetForce;
                gem.velocityY += dy * magnetForce;
            }
        }
        
        // Check collection
        const distance = Math.hypot(
            player.x + player.size / 2 - gem.x,
            player.y + player.size / 2 - gem.y
        );
        
        if (distance < player.size / 2 + gem.size) {
            gem.collected = true;
            addXP(CONFIG.XP_PER_KILL);
            GameState.xpGems.splice(i, 1);
            continue;
        }
        
        // Remove if off screen or life expired
        gem.life -= 0.005;
        gem.sparkleTime += 0.1;
        
        if (gem.life <= 0 || gem.y > GameState.canvas.height + 50) {
            GameState.xpGems.splice(i, 1);
        }
    }
}

/**
 * Damage player
 */
function damagePlayer(amount) {
    const player = GameState.player;
    const currentTime = Date.now();
    
    if (player.invulnerable) return;
    
    player.health -= amount;
    player.lastDamageTime = currentTime;
    player.invulnerable = true;
    player.flashTime = currentTime;
    
    // Create screen shake effect
    createScreenShake();
    
    if (player.health <= 0) {
        player.lives--;
        player.health = player.maxHealth;
        
        if (player.lives <= 0) {
            triggerGameOver();
        } else {
            // Create respawn effect
            createRespawnEffect();
        }
    }
}

/**
 * Create screen shake effect
 */
function createScreenShake() {
    // This would be implemented in the renderer
    GameState.screenShake = {
        intensity: 10,
        duration: 300,
        startTime: Date.now()
    };
}

/**
 * Create respawn effect
 */
function createRespawnEffect() {
    // Create particles around player
    for (let i = 0; i < 20; i++) {
        createExplosion(
            GameState.player.x + GameState.player.size / 2,
            GameState.player.y + GameState.player.size / 2,
            'respawn'
        );
    }
}

/**
 * Check collision between two rectangular entities
 */
function checkCollision(entity1, entity2) {
    return (
        entity1.x < entity2.x + (entity2.width || entity2.size) &&
        entity1.x + (entity1.width || entity1.size) > entity2.x &&
        entity1.y < entity2.y + (entity2.height || entity2.size) &&
        entity1.y + (entity1.height || entity1.size) > entity2.y
    );
}

/**
 * Check collision between player and enemies
 */
function checkPlayerEnemyCollisions() {
    const player = GameState.player;
    const currentTime = Date.now();
    
    if (player.invulnerable) return;
    
    GameState.enemies.forEach(enemy => {
        if (checkCollision(player, enemy)) {
            damagePlayer(15); // Contact damage
        }
    });
}