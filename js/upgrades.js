/**
 * ======= SISTEMA DE MELHORIAS =======
 * Lida com melhorias do jogador e progressão
 */

// Melhorias disponíveis com descrições e efeitos aprimorados
const UPGRADES = [
    {
        id: 'tracking',
        name: 'Tiros Teleguiados',
        description: 'Projéteis miram automaticamente no inimigo mais próximo',
        icon: '🎯',
        rarity: 'common'
    },
    {
        id: 'speed',
        name: 'Impulso de Velocidade',
        description: 'Aumenta significativamente a velocidade dos projéteis',
        icon: '⚡',
        rarity: 'common'
    },
    {
        id: 'damage',
        name: 'Surto de Poder',
        description: 'Aumenta o dano dos projéteis',
        icon: '💥',
        rarity: 'common'
    },
    {
        id: 'multishot',
        name: 'Tiro Triplo',
        description: 'Dispara 3 projéteis em padrão espalhado',
        icon: '🔱',
        rarity: 'rare'
    },
    {
        id: 'piercing',
        name: 'Perfuração de Armadura',
        description: 'Projéteis podem atingir múltiplos inimigos',
        icon: '🗡️',
        rarity: 'rare'
    },
    {
        id: 'shield',
        name: 'Escudo de Energia',
        description: '30% de chance de bloquear projéteis inimigos',
        icon: '🛡️',
        rarity: 'rare'
    },
    {
        id: 'magnet',
        name: 'Ímã de XP',
        description: 'Atrai automaticamente gemas de XP',
        icon: '🧲',
        rarity: 'uncommon'
    },
    {
        id: 'health',
        name: 'Impulso de Vitalidade',
        description: 'Aumenta a vida máxima em 50',
        icon: '❤️',
        rarity: 'uncommon'
    },
    {
        id: 'rapid',
        name: 'Tiro Rápido',
        description: 'Aumenta significativamente a taxa de disparo',
        icon: '🔥',
        rarity: 'epic'
    },
    {
        id: 'explosive',
        name: 'Munição Explosiva',
        description: 'Projéteis explodem ao impacto',
        icon: '💣',
        rarity: 'epic'
    }
];

/**
 * Mostrar tela de seleção de melhoria
 */
function showUpgradeSelection() {
    GameState.showingUpgrades = true;
    
    // Obter 3 melhorias aleatórias, ponderadas por raridade
    GameState.availableUpgrades = getRandomUpgrades(3);
    
    console.log('Mostrando seleção de melhoria:', GameState.availableUpgrades.map(u => u.name));
}

/**
 * Obter melhorias aleatórias ponderadas por raridade
 */
function getRandomUpgrades(count) {
    const weights = {
        common: 50,
        uncommon: 30,
        rare: 15,
        epic: 5
    };
    
    const availableUpgrades = UPGRADES.filter(upgrade => 
        !GameState.activeUpgrades.has(upgrade.id) || canStackUpgrade(upgrade.id)
    );
    
    const selected = [];
    
    for (let i = 0; i < count && availableUpgrades.length > 0; i++) {
        // Criar array ponderado
        const weightedUpgrades = [];
        availableUpgrades.forEach(upgrade => {
            const weight = weights[upgrade.rarity] || 10;
            for (let j = 0; j < weight; j++) {
                weightedUpgrades.push(upgrade);
            }
        });
        
        if (weightedUpgrades.length === 0) break;
        
        const randomIndex = Math.floor(Math.random() * weightedUpgrades.length);
        const selectedUpgrade = weightedUpgrades[randomIndex];
        
        selected.push(selectedUpgrade);
        
        // Remover dos disponíveis se não puder empilhar
        if (!canStackUpgrade(selectedUpgrade.id)) {
            const index = availableUpgrades.indexOf(selectedUpgrade);
            if (index > -1) {
                availableUpgrades.splice(index, 1);
            }
        }
    }
    
    return selected;
}

/**
 * Verificar se a melhoria pode ser empilhada (pega múltiplas vezes)
 */
function canStackUpgrade(upgradeId) {
    const stackableUpgrades = ['damage', 'speed', 'health'];
    return stackableUpgrades.includes(upgradeId);
}

/**
 * Aplicar melhoria selecionada
 */
function applyUpgrade(upgradeId) {
    const upgrade = UPGRADES.find(u => u.id === upgradeId);
    if (!upgrade) return;
    
    GameState.activeUpgrades.add(upgradeId);
    
    // Aplicar efeitos da melhoria
    switch (upgradeId) {
        case 'health':
            GameState.player.maxHealth += 50;
            GameState.player.health += 50; // Também cura o jogador
            break;
            
        case 'rapid':
            CONFIG.SHOOT_INTERVAL = Math.max(100, CONFIG.SHOOT_INTERVAL - 100);
            break;
            
        case 'explosive':
            // Isso será tratado na colisão de projéteis
            break;
            
        // Outras melhorias são tratadas em seus respectivos sistemas
    }
    
    console.log(`Melhoria aplicada: ${upgrade.name}`);
    
    // Ocultar seleção de melhoria e continuar jogo
    GameState.showingUpgrades = false;
    
    // Atualizar UI
    updateActiveUpgradesDisplay();
}

/**
 * Atualizar exibição de melhorias ativas na UI
 */
function updateActiveUpgradesDisplay() {
    const container = document.getElementById('activeUpgrades');
    if (!container) return;
    
    container.innerHTML = '';
    
    GameState.activeUpgrades.forEach(upgradeId => {
        const upgrade = UPGRADES.find(u => u.id === upgradeId);
        if (!upgrade) return;
        
        const element = document.createElement('div');
        element.className = 'upgrade-indicator';
        element.innerHTML = `${upgrade.icon} ${upgrade.name}`;
        container.appendChild(element);
    });
}

/**
 * Lidar com clique de seleção de melhoria
 */
function handleUpgradeClick(x, y) {
    if (!GameState.showingUpgrades) return false;
    
    const canvas = GameState.canvas;
    const cardWidth = 200;
    const cardHeight = 280;
    const spacing = 40;
    const totalWidth = cardWidth * 3 + spacing * 2;
    const startX = (canvas.width - totalWidth) / 2;
    const startY = canvas.height / 2 - cardHeight / 2;
    
    for (let i = 0; i < GameState.availableUpgrades.length; i++) {
        const cardX = startX + i * (cardWidth + spacing);
        
        if (x >= cardX && x <= cardX + cardWidth &&
            y >= startY && y <= startY + cardHeight) {
            
            applyUpgrade(GameState.availableUpgrades[i].id);
            return true;
        }
    }
    
    return false;
}

/**
 * Completar onda atual
 */
function completeWave() {
    GameState.waveComplete = true;
    
    // XP bônus por completar onda
    addXP(50 + GameState.currentWave * 25);
    
    // Avançar para próxima onda
    setTimeout(() => {
        GameState.currentWave++;
        
        if (GameState.currentWave >= WAVES.length) {
            // Jogo completado!
            triggerGameWin();
        } else {
            // Iniciar próxima onda
            GameState.waveComplete = false;
            spawnEnemies();
        }
    }, 2000);
    
    console.log(`Onda ${GameState.currentWave + 1} completada!`);
}

/**
 * Acionar vitória do jogo
 */
function triggerGameWin() {
    GameState.gameOver = true;
    GameState.gameWon = true;
    console.log('Jogo completado! Jogador venceu!');
}

/**
 * Acionar fim de jogo
 */
function triggerGameOver() {
    GameState.gameOver = true;
    GameState.gameOverTime = Date.now();
    GameState.gameWon = false;
    
    // Limpar todos os intervalos
    GameState.intervals.forEach(clearInterval);
    GameState.intervals = [];
    
    console.log('Fim de Jogo!');
}