/**
 * ======= GERENCIAMENTO DE UI =======
 * Lida com todas as atualizações e interações da interface do usuário
 */

/**
 * Inicializar elementos da UI
 */
function initializeUI() {
    updateAllUI();
    
    // Configurar intervalo de atualização da UI
    setInterval(updateAllUI, 100); // Atualizar UI 10 vezes por segundo
}

/**
 * Atualizar todos os elementos da UI
 */
function updateAllUI() {
    updateWaveDisplay();
    updateLivesDisplay();
    updateHealthDisplay();
    updateTimeDisplay();
    updateKillsDisplay();
    updateXPDisplay();
    updatePauseMenu();
}

/**
 * Atualizar exibição da onda
 */
function updateWaveDisplay() {
    const element = document.getElementById('waveDisplay');
    if (element) {
        element.textContent = `${GameState.currentWave + 1}/${WAVES.length}`;
    }
}

/**
 * Atualizar exibição de vidas
 */
function updateLivesDisplay() {
    const element = document.getElementById('livesDisplay');
    if (element) {
        element.textContent = GameState.player.lives.toString();
        
        // Mudar cor baseado nas vidas restantes
        if (GameState.player.lives <= 1) {
            element.style.color = '#ff4444';
        } else if (GameState.player.lives <= 2) {
            element.style.color = '#ffaa44';
        } else {
            element.style.color = '#00ff88';
        }
    }
}

/**
 * Atualizar exibição de vida
 */
function updateHealthDisplay() {
    const element = document.getElementById('healthDisplay');
    if (element) {
        const health = Math.max(0, GameState.player.health);
        element.textContent = `${health}/${GameState.player.maxHealth}`;
        
        // Mudar cor baseado na porcentagem de vida
        const healthPercent = health / GameState.player.maxHealth;
        if (healthPercent <= 0.25) {
            element.style.color = '#ff4444';
        } else if (healthPercent <= 0.5) {
            element.style.color = '#ffaa44';
        } else {
            element.style.color = '#00ff88';
        }
    }
}

/**
 * Atualizar exibição de tempo
 */
function updateTimeDisplay() {
    const element = document.getElementById('timeDisplay');
    if (element) {
        const elapsed = Date.now() - GameState.gameStartTime;
        element.textContent = formatTime(elapsed);
    }
}

/**
 * Atualizar exibição de mortes
 */
function updateKillsDisplay() {
    const element = document.getElementById('killsDisplay');
    if (element) {
        element.textContent = GameState.kills.toString();
    }
}

/**
 * Atualizar exibição e barra de XP
 */
function updateXPDisplay() {
    const textElement = document.getElementById('xpText');
    const fillElement = document.getElementById('xpFill');
    
    if (textElement) {
        textElement.textContent = `XP: ${GameState.xp}/${CONFIG.XP_TO_LEVEL}`;
    }
    
    if (fillElement) {
        const percentage = (GameState.xp / CONFIG.XP_TO_LEVEL) * 100;
        fillElement.style.width = `${percentage}%`;
    }
}

/**
 * Atualizar visibilidade do menu de pausa
 */
function updatePauseMenu() {
    const element = document.getElementById('pauseMenu');
    if (element) {
        if (GameState.gamePaused) {
            element.classList.remove('hidden');
        } else {
            element.classList.add('hidden');
        }
    }
}

/**
 * Mostrar tela de fim de jogo
 */
function showGameOverScreen() {
    // Isso será tratado pelo renderizador desenhando no canvas
    // Mas também podemos atualizar elementos HTML se necessário
}

/**
 * Criar texto de dano flutuante
 */
function createFloatingText(x, y, text, color = '#ffffff', size = 16) {
    // Isso criaria efeitos de texto flutuante
    // A implementação dependeria do sistema de renderização
    console.log(`Texto flutuante: ${text} em (${x}, ${y})`);
}

/**
 * Criar notificação
 */
function createNotification(message, type = 'info', duration = 3000) {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    
    // Estilizar a notificação
    Object.assign(notification.style, {
        position: 'fixed',
        top: '100px',
        left: '50%',
        transform: 'translateX(-50%)',
        background: type === 'success' ? 'rgba(0, 255, 136, 0.9)' : 
                   type === 'warning' ? 'rgba(255, 170, 68, 0.9)' : 
                   type === 'error' ? 'rgba(255, 68, 68, 0.9)' : 
                   'rgba(255, 255, 255, 0.9)',
        color: type === 'success' || type === 'warning' || type === 'error' ? '#000' : '#fff',
        padding: '12px 24px',
        borderRadius: '20px',
        fontSize: '14px',
        fontWeight: '600',
        zIndex: '1000',
        pointerEvents: 'none',
        animation: 'slideInDown 0.3s ease-out'
    });
    
    document.body.appendChild(notification);
    
    // Remover após duração
    setTimeout(() => {
        notification.style.animation = 'slideOutUp 0.3s ease-in';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, duration);
}

/**
 * Adicionar estilos CSS para notificações
 */
function addNotificationStyles() {
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideInDown {
            from {
                opacity: 0;
                transform: translateX(-50%) translateY(-20px);
            }
            to {
                opacity: 1;
                transform: translateX(-50%) translateY(0);
            }
        }
        
        @keyframes slideOutUp {
            from {
                opacity: 1;
                transform: translateX(-50%) translateY(0);
            }
            to {
                opacity: 0;
                transform: translateX(-50%) translateY(-20px);
            }
        }
    `;
    document.head.appendChild(style);
}

// Inicializar estilos de notificação
addNotificationStyles();