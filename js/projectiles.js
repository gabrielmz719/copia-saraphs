/**
 * ======= PROJECTILE SYSTEM =======
 * Handles player and enemy projectiles, explosions
 */

/**
 * Create player projectile
 */
function createPlayerProjectile() {
    if (!isGamePlayable()) return;
    
    const currentTime = Date.now();
    if (currentTime - GameState.lastShootTime < CONFIG.SHOOT_INTERVAL) return;
    
    const player = GameState.player;
    const originX = player.x + player.size / 2;
    const originY = player.y + player.size / 2;
    
    let dx, dy;
    
    // Check for tracking shot upgrade
    if (GameState.activeUpgrades.has('tracking') && GameState.enemies.length > 0) {
        // Find nearest enemy
        let nearestEnemy = GameState.enemies.reduce((nearest, enemy) => {
            const distToCurrent = Math.hypot(
                originX - (enemy.x + enemy.width / 2),
                originY - (enemy.y + enemy.height / 2)
            );
            const distToNearest = Math.hypot(
                originX - (nearest.x + nearest.width / 2),
                originY - (nearest.y + nearest.height / 2)
            );
            return distToCurrent < distToNearest ? enemy : nearest;
        }, GameState.enemies[0]);
        
        dx = (nearestEnemy.x + nearestEnemy.width / 2) - originX;
        dy = (nearestEnemy.y + nearestEnemy.height / 2) - originY;
    } else {
        // Aim towards mouse
        dx = GameState.mouse.x - originX;
        dy = GameState.mouse.y - originY;
    }
    
    const distance = Math.sqrt(dx * dx + dy * dy);
    if (distance === 0) return;
    
    // Normalize direction
    dx /= distance;
    dy /= distance;
    
    // Create projectile
    const projectile = {
        x: originX,
        y: originY,
        dx: dx,
        dy: dy,
        size: 6,
        speed: CONFIG.PROJECTILE_SPEED + (GameState.activeUpgrades.has('speed') ? 4 : 0),
        damage: 25 + (GameState.activeUpgrades.has('damage') ? 15 : 0),
        piercing: GameState.activeUpgrades.has('piercing'),
        pierceCount: 0,
        maxPierce: 3,
        trail: []
    };
    
    GameState.playerProjectiles.push(projectile);
    GameState.lastShootTime = currentTime;
    
    // Multi-shot upgrade
    if (GameState.activeUpgrades.has('multishot')) {
        const angleOffset = 0.3;
        
        // Create additional projectiles
        for (let i = 0; i < 2; i++) {
            const angle = Math.atan2(dy, dx) + (i === 0 ? -angleOffset : angleOffset);
            const extraProjectile = {
                ...projectile,
                dx: Math.cos(angle),
                dy: Math.sin(angle),
                trail: []
            };
            GameState.playerProjectiles.push(extraProjectile);
        }
    }
}

/**
 * Create enemy projectile
 */
function createEnemyProjectile(enemy) {
    const player = GameState.player;
    const originX = enemy.x + enemy.width / 2;
    const originY = enemy.y + enemy.height / 2;
    
    const dx = (player.x + player.size / 2) - originX;
    const dy = (player.y + player.size / 2) - originY;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    if (distance === 0) return;
    
    GameState.enemyProjectiles.push({
        x: originX,
        y: originY,
        dx: dx / distance,
        dy: dy / distance,
        size: 5,
        speed: 4,
        damage: 20
    });
}

/**
 * Update all projectiles
 */
function updateProjectiles() {
    updatePlayerProjectiles();
    updateEnemyProjectiles();
    checkProjectileCollisions();
}

/**
 * Update player projectiles
 */
function updatePlayerProjectiles() {
    for (let i = GameState.playerProjectiles.length - 1; i >= 0; i--) {
        const projectile = GameState.playerProjectiles[i];
        
        // Update trail
        projectile.trail.unshift({ x: projectile.x, y: projectile.y, alpha: 1.0 });
        for (let j = projectile.trail.length - 1; j >= 0; j--) {
            projectile.trail[j].alpha -= 0.15;
            if (projectile.trail[j].alpha <= 0 || j > 6) {
                projectile.trail.splice(j, 1);
            }
        }
        
        // Move projectile
        projectile.x += projectile.dx * projectile.speed;
        projectile.y += projectile.dy * projectile.speed;
        
        // Check bounds
        if (projectile.x < 0 || projectile.x > GameState.canvas.width ||
            projectile.y < 0 || projectile.y > GameState.canvas.height) {
            GameState.playerProjectiles.splice(i, 1);
            continue;
        }
        
        // Check collision with blocks
        let hitBlock = false;
        for (const block of GameState.blocks) {
            if (checkProjectileBlockCollision(projectile, block)) {
                createExplosion(projectile.x, projectile.y, 'impact');
                GameState.playerProjectiles.splice(i, 1);
                hitBlock = true;
                break;
            }
        }
        
        if (hitBlock) continue;
        
        // Check collision with enemies
        for (let j = GameState.enemies.length - 1; j >= 0; j--) {
            const enemy = GameState.enemies[j];
            if (checkProjectileEnemyCollision(projectile, enemy)) {
                // Damage enemy
                enemy.health -= projectile.damage;
                
                // Create hit effect
                createExplosion(projectile.x, projectile.y, 'hit');
                
                // Check if enemy is dead
                if (enemy.health <= 0) {
                    // Create XP gems
                    for (let k = 0; k < 3; k++) {
                        GameState.xpGems.push(createXPGem(
                            enemy.x + enemy.width / 2 + (Math.random() - 0.5) * 20,
                            enemy.y + enemy.height / 2 + (Math.random() - 0.5) * 20
                        ));
                    }
                    
                    // Create death explosion
                    createExplosion(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2, 'death');
                    
                    GameState.enemies.splice(j, 1);
                    GameState.kills++;
                    
                    // Check wave completion
                    if (GameState.enemies.length === 0) {
                        completeWave();
                    }
                }
                
                // Handle piercing
                if (projectile.piercing && projectile.pierceCount < projectile.maxPierce) {
                    projectile.pierceCount++;
                } else {
                    GameState.playerProjectiles.splice(i, 1);
                }
                break;
            }
        }
    }
}

/**
 * Update enemy projectiles
 */
function updateEnemyProjectiles() {
    for (let i = GameState.enemyProjectiles.length - 1; i >= 0; i--) {
        const projectile = GameState.enemyProjectiles[i];
        
        // Move projectile
        projectile.x += projectile.dx * projectile.speed;
        projectile.y += projectile.dy * projectile.speed;
        
        // Check bounds
        if (projectile.x < 0 || projectile.x > GameState.canvas.width ||
            projectile.y < 0 || projectile.y > GameState.canvas.height) {
            GameState.enemyProjectiles.splice(i, 1);
            continue;
        }
        
        // Check collision with blocks
        let hitBlock = false;
        for (const block of GameState.blocks) {
            if (checkProjectileBlockCollision(projectile, block)) {
                createExplosion(projectile.x, projectile.y, 'impact');
                GameState.enemyProjectiles.splice(i, 1);
                hitBlock = true;
                break;
            }
        }
        
        if (hitBlock) continue;
        
        // Check collision with player
        if (checkProjectilePlayerCollision(projectile)) {
            // Check for shield upgrade
            if (GameState.activeUpgrades.has('shield') && Math.random() < 0.3) {
                // Shield blocked the projectile
                createExplosion(projectile.x, projectile.y, 'shield');
            } else {
                damagePlayer(projectile.damage);
                createExplosion(projectile.x, projectile.y, 'hit');
            }
            
            GameState.enemyProjectiles.splice(i, 1);
        }
    }
}

/**
 * Check projectile collisions between player and enemy projectiles
 */
function checkProjectileCollisions() {
    for (let i = GameState.playerProjectiles.length - 1; i >= 0; i--) {
        for (let j = GameState.enemyProjectiles.length - 1; j >= 0; j--) {
            const playerProj = GameState.playerProjectiles[i];
            const enemyProj = GameState.enemyProjectiles[j];
            
            const distance = Math.hypot(playerProj.x - enemyProj.x, playerProj.y - enemyProj.y);
            
            if (distance < (playerProj.size + enemyProj.size) / 2) {
                createExplosion(
                    (playerProj.x + enemyProj.x) / 2,
                    (playerProj.y + enemyProj.y) / 2,
                    'collision'
                );
                
                GameState.playerProjectiles.splice(i, 1);
                GameState.enemyProjectiles.splice(j, 1);
                break;
            }
        }
    }
}

/**
 * Check projectile collision with block
 */
function checkProjectileBlockCollision(projectile, block) {
    return (
        projectile.x < block.x + block.width &&
        projectile.x + projectile.size > block.x &&
        projectile.y < block.y + block.height &&
        projectile.y + projectile.size > block.y
    );
}

/**
 * Check projectile collision with enemy
 */
function checkProjectileEnemyCollision(projectile, enemy) {
    return (
        projectile.x < enemy.x + enemy.width &&
        projectile.x + projectile.size > enemy.x &&
        projectile.y < enemy.y + enemy.height &&
        projectile.y + projectile.size > enemy.y
    );
}

/**
 * Check projectile collision with player
 */
function checkProjectilePlayerCollision(projectile) {
    const player = GameState.player;
    return (
        projectile.x < player.x + player.size &&
        projectile.x + projectile.size > player.x &&
        projectile.y < player.y + player.size &&
        projectile.y + projectile.size > player.y
    );
}

/**
 * Create explosion effect
 */
function createExplosion(x, y, type = 'default') {
    const particles = [];
    const particleCount = type === 'death' ? 30 : type === 'impact' ? 15 : 20;
    
    const colors = {
        default: ['#ffaa00', '#ff6600', '#ff0000'],
        hit: ['#ff4444', '#ffaa44', '#ffffff'],
        death: ['#ff0000', '#ff4400', '#ffaa00', '#ffffff'],
        impact: ['#888888', '#aaaaaa', '#ffffff'],
        shield: ['#00aaff', '#0066ff', '#ffffff'],
        collision: ['#ff00ff', '#aa00aa', '#ffffff'],
        respawn: ['#00ff88', '#00ccff', '#ffffff']
    };
    
    const colorSet = colors[type] || colors.default;
    
    for (let i = 0; i < particleCount; i++) {
        const angle = Math.random() * 2 * Math.PI;
        const speed = Math.random() * 6 + 2;
        const size = Math.random() * 4 + 2;
        
        particles.push({
            x: x,
            y: y,
            dx: Math.cos(angle) * speed,
            dy: Math.sin(angle) * speed,
            size: size,
            life: 1.0,
            decay: 0.02 + Math.random() * 0.02,
            color: colorSet[Math.floor(Math.random() * colorSet.length)],
            gravity: type === 'death' ? 0.1 : 0.05
        });
    }
    
    GameState.explosions.push(particles);
}

/**
 * Update all explosions
 */
function updateExplosions() {
    for (let i = GameState.explosions.length - 1; i >= 0; i--) {
        const particles = GameState.explosions[i];
        let aliveCount = 0;
        
        for (const particle of particles) {
            particle.x += particle.dx;
            particle.y += particle.dy;
            particle.dy += particle.gravity;
            particle.life -= particle.decay;
            
            if (particle.life > 0) {
                aliveCount++;
            }
        }
        
        if (aliveCount === 0) {
            GameState.explosions.splice(i, 1);
        }
    }
}