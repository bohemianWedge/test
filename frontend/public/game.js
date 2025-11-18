// Particle System
class Particle {
    constructor(x, y, vx, vy, color, lifetime) {
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.color = color;
        this.lifetime = lifetime;
        this.maxLifetime = lifetime;
        this.size = Math.random() * 3 + 2;
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.vy += 0.2; // Gravity
        this.lifetime--;
    }

    render(ctx) {
        const alpha = this.lifetime / this.maxLifetime;
        ctx.globalAlpha = alpha;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
    }

    isDead() {
        return this.lifetime <= 0;
    }
}

// Animation utilities
class AnimationHelper {
    static lerp(start, end, t) {
        return start + (end - start) * t;
    }

    static easeOutQuad(t) {
        return t * (2 - t);
    }

    static easeInOutQuad(t) {
        return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
    }
}

// Game Client
class GameClient {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.socket = null;
        this.playerId = null;
        this.playerIndex = null;
        this.gameState = null;
        this.previousGameState = null;
        this.gameMode = null; // 'local' or 'online'

        // Input state for player 1 (or single player in online mode)
        this.inputState = {
            up: false,
            down: false,
            left: false,
            right: false,
            shoot: false,
        };

        // Input state for player 2 (only used in local mode)
        this.inputStateP2 = {
            up: false,
            down: false,
            left: false,
            right: false,
            shoot: false,
        };

        this.lastShootState = false;
        this.lastShootStateP2 = false;
        this.particles = [];
        this.animationTime = 0;
        this.cameraShake = { x: 0, y: 0, intensity: 0 };

        this.init();
    }

    init() {
        this.setupModeSelection();
        this.setupRestartButton();
        this.startRenderLoop();
    }

    setupModeSelection() {
        const modeSelection = document.getElementById('modeSelection');
        const localModeBtn = document.getElementById('localModeBtn');
        const onlineModeBtn = document.getElementById('onlineModeBtn');

        localModeBtn.addEventListener('click', () => {
            this.gameMode = 'local';
            modeSelection.classList.add('hidden');
            this.startLocalMode();
        });

        onlineModeBtn.addEventListener('click', () => {
            this.gameMode = 'online';
            modeSelection.classList.add('hidden');
            this.startOnlineMode();
        });
    }

    startLocalMode() {
        this.connectToServer();
        this.setupControls();
        this.updateStatus('Mode local - Les deux joueurs peuvent jouer!');
    }

    startOnlineMode() {
        this.connectToServer();
        this.setupControls();
    }

    setupRestartButton() {
        const restartButton = document.getElementById('restartButton');
        restartButton.addEventListener('click', () => {
            if (this.socket && this.socket.connected) {
                this.socket.emit('resetGame');
                restartButton.style.display = 'none';
            }
        });
    }

    connectToServer() {
        const backendUrl = window.location.hostname === 'localhost'
            ? 'http://localhost:3000'
            : `http://${window.location.hostname}:3000`;

        this.socket = io(backendUrl, {
            query: {
                gameMode: this.gameMode
            }
        });

        this.socket.on('connect', () => {
            console.log('Connected to server');
            if (this.gameMode === 'local') {
                this.updateStatus('Mode local activé - Les deux joueurs peuvent jouer!');
            } else {
                this.updateStatus('Connecté au serveur');
            }
        });

        this.socket.on('playerJoined', (data) => {
            this.playerId = data.playerId;
            console.log('Joined as player:', this.playerId);
            this.updateStatus('Vous avez rejoint la partie!');
        });

        this.socket.on('gameState', (state) => {
            this.previousGameState = this.gameState;
            this.gameState = state;

            if (this.playerId && state.players) {
                this.playerIndex = state.players.findIndex(p => p.id === this.playerId);
            }

            // Update scores display
            if (state.scores) {
                this.updateScoreBoard(state.scores);
            }

            if (state.gameStarted && !state.winner) {
                this.updateStatus('Partie en cours...');
                document.getElementById('restartButton').style.display = 'none';
            } else if (state.winner) {
                const isWinner = state.winner === this.playerId;
                this.updateStatus(isWinner ? 'Vous avez gagné!' : 'Vous avez perdu');
                document.getElementById('restartButton').style.display = 'block';
            }
        });

        this.socket.on('gameReset', () => {
            this.updateStatus('Nouvelle partie!');
            document.getElementById('restartButton').style.display = 'none';
        });

        this.socket.on('playerConnected', () => {
            this.updateStatus('Un joueur a rejoint la partie!');
        });

        this.socket.on('playerDisconnected', () => {
            this.updateStatus('Un joueur s\'est déconnecté');
        });

        this.socket.on('error', (data) => {
            this.updateStatus('Erreur: ' + data.message);
        });

        this.socket.on('disconnect', () => {
            this.updateStatus('Déconnecté du serveur');
        });
    }

    setupControls() {
        window.addEventListener('keydown', (e) => {
            this.handleKeyEvent(e, true);
        });

        window.addEventListener('keyup', (e) => {
            this.handleKeyEvent(e, false);
        });
    }

    handleKeyEvent(e, isPressed) {
        // In online mode, wait for playerIndex to be assigned
        if (this.gameMode === 'online' && this.playerIndex === null) return;

        let keyHandled = false;

        // Player 1 controls (WASD + E) - Always active in local mode, or for player 1 in online mode
        if (this.gameMode === 'local' || this.playerIndex === 0) {
            switch (e.key.toLowerCase()) {
                case 'w':
                    this.inputState.up = isPressed;
                    keyHandled = true;
                    break;
                case 's':
                    this.inputState.down = isPressed;
                    keyHandled = true;
                    break;
                case 'a':
                    this.inputState.left = isPressed;
                    keyHandled = true;
                    break;
                case 'd':
                    this.inputState.right = isPressed;
                    keyHandled = true;
                    break;
                case 'e':
                    this.inputState.shoot = isPressed;
                    if (isPressed && !this.lastShootState) {
                        this.createShootEffect(0);
                    }
                    keyHandled = true;
                    break;
            }
        }

        // Player 2 controls (Arrow keys + Enter) - Always active in local mode, or for player 2 in online mode
        if (this.gameMode === 'local' || this.playerIndex === 1) {
            switch (e.key) {
                case 'ArrowUp':
                    if (this.gameMode === 'local') {
                        this.inputStateP2.up = isPressed;
                    } else {
                        this.inputState.up = isPressed;
                    }
                    keyHandled = true;
                    e.preventDefault();
                    break;
                case 'ArrowDown':
                    if (this.gameMode === 'local') {
                        this.inputStateP2.down = isPressed;
                    } else {
                        this.inputState.down = isPressed;
                    }
                    keyHandled = true;
                    e.preventDefault();
                    break;
                case 'ArrowLeft':
                    if (this.gameMode === 'local') {
                        this.inputStateP2.left = isPressed;
                    } else {
                        this.inputState.left = isPressed;
                    }
                    keyHandled = true;
                    e.preventDefault();
                    break;
                case 'ArrowRight':
                    if (this.gameMode === 'local') {
                        this.inputStateP2.right = isPressed;
                    } else {
                        this.inputState.right = isPressed;
                    }
                    keyHandled = true;
                    e.preventDefault();
                    break;
                case 'Enter':
                    if (this.gameMode === 'local') {
                        this.inputStateP2.shoot = isPressed;
                        if (isPressed && !this.lastShootStateP2) {
                            this.createShootEffect(1);
                        }
                    } else {
                        this.inputState.shoot = isPressed;
                        if (isPressed && !this.lastShootState) {
                            this.createShootEffect(1);
                        }
                    }
                    keyHandled = true;
                    e.preventDefault();
                    break;
            }
        }

        if (keyHandled) {
            // Always send input when any key state changes
            this.sendInput();
            this.lastShootState = this.inputState.shoot;
            this.lastShootStateP2 = this.inputStateP2.shoot;
        }
    }

    sendInput() {
        if (this.socket && this.socket.connected) {
            if (this.gameMode === 'local') {
                // Send both players' inputs in local mode
                this.socket.emit('localInput', {
                    player1: this.inputState,
                    player2: this.inputStateP2
                });
            } else {
                // Send only this player's input in online mode
                this.socket.emit('input', this.inputState);
            }
        }
    }

    createShootEffect(playerIndex) {
        if (!this.gameState || !this.gameState.players) return;

        // In local mode, use the provided playerIndex
        // In online mode, use this.playerIndex
        const targetPlayerIndex = this.gameMode === 'local' ? playerIndex : this.playerIndex;
        const player = this.gameState.players[targetPlayerIndex];
        if (!player) return;

        const centerX = player.position.x + player.width / 2;
        const centerY = player.position.y + player.height / 2;

        for (let i = 0; i < 8; i++) {
            const angle = (Math.PI * 2 * i) / 8;
            const speed = Math.random() * 2 + 1;
            this.particles.push(new Particle(
                centerX,
                centerY,
                Math.cos(angle) * speed,
                Math.sin(angle) * speed,
                '#FFD700',
                20
            ));
        }
    }

    createPlatformEffect(platform, playerX, playerY) {
        const colors = {
            'fire': '#FF6B6B',
            'water': '#4ECDC4',
            'ice': '#A8E6FF'
        };

        const color = colors[platform.type];
        if (!color) return;

        for (let i = 0; i < 2; i++) {
            this.particles.push(new Particle(
                playerX + Math.random() * 30,
                playerY + 40,
                (Math.random() - 0.5) * 2,
                -Math.random() * 2,
                color,
                30
            ));
        }
    }

    createExplosionEffect(x, y, color) {
        for (let i = 0; i < 20; i++) {
            const angle = (Math.PI * 2 * i) / 20;
            const speed = Math.random() * 4 + 2;
            this.particles.push(new Particle(
                x,
                y,
                Math.cos(angle) * speed,
                Math.sin(angle) * speed,
                color,
                40
            ));
        }
        this.cameraShake.intensity = 10;
    }

    startRenderLoop() {
        const render = () => {
            this.animationTime++;
            this.updateParticles();
            this.updateCameraShake();
            this.render();
            requestAnimationFrame(render);
        };
        render();
    }

    updateParticles() {
        this.particles = this.particles.filter(p => {
            p.update();
            return !p.isDead();
        });
    }

    updateCameraShake() {
        if (this.cameraShake.intensity > 0) {
            this.cameraShake.x = (Math.random() - 0.5) * this.cameraShake.intensity;
            this.cameraShake.y = (Math.random() - 0.5) * this.cameraShake.intensity;
            this.cameraShake.intensity *= 0.9;
        } else {
            this.cameraShake.x = 0;
            this.cameraShake.y = 0;
        }
    }

    render() {
        this.ctx.save();
        this.ctx.translate(this.cameraShake.x, this.cameraShake.y);

        // Draw background
        this.drawBackground();

        if (!this.gameState) {
            this.drawWaitingScreen();
            this.ctx.restore();
            return;
        }

        // Draw level
        this.drawLevel();

        // Draw particles behind players
        this.particles.forEach(p => p.render(this.ctx));

        // Draw players
        this.drawPlayers();

        // Draw projectiles
        this.drawProjectiles();

        // Draw goals
        this.drawGoals();

        // Draw UI
        this.drawUI();

        this.ctx.restore();
    }

    drawBackground() {
        // Gradient background
        const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
        gradient.addColorStop(0, '#0f3460');
        gradient.addColorStop(0.5, '#16213e');
        gradient.addColorStop(1, '#0f3460');
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Animated stars
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        for (let i = 0; i < 50; i++) {
            const x = (i * 73 + this.animationTime * 0.1) % this.canvas.width;
            const y = (i * 127) % this.canvas.height;
            const size = (Math.sin(this.animationTime * 0.05 + i) + 1) * 0.5 + 0.5;
            this.ctx.fillRect(x, y, size, size);
        }
    }

    drawWaitingScreen() {
        this.ctx.fillStyle = 'white';
        this.ctx.font = '30px Arial';
        this.ctx.textAlign = 'center';
        const pulse = Math.sin(this.animationTime * 0.05) * 0.2 + 0.8;
        this.ctx.globalAlpha = pulse;
        this.ctx.fillText('En attente de joueurs...', this.canvas.width / 2, this.canvas.height / 2);
        this.ctx.globalAlpha = 1;
    }

    drawLevel() {
        const level = this.gameState.level;

        // Draw platforms with enhanced visuals
        level.platforms.forEach(platform => {
            this.ctx.save();

            switch (platform.type) {
                case 'fire':
                    // Animated fire platform
                    const fireGradient = this.ctx.createLinearGradient(
                        platform.x, platform.y,
                        platform.x, platform.y + platform.height
                    );
                    const fireFlicker = Math.sin(this.animationTime * 0.1) * 0.2 + 0.8;
                    fireGradient.addColorStop(0, `rgba(255, 107, 107, ${fireFlicker})`);
                    fireGradient.addColorStop(1, '#E74C3C');
                    this.ctx.fillStyle = fireGradient;
                    this.ctx.fillRect(platform.x, platform.y, platform.width, platform.height);

                    // Fire particles on top
                    if (Math.random() < 0.3) {
                        this.particles.push(new Particle(
                            platform.x + Math.random() * platform.width,
                            platform.y,
                            (Math.random() - 0.5) * 0.5,
                            -Math.random() * 2 - 1,
                            '#FF6B6B',
                            20
                        ));
                    }
                    break;

                case 'water':
                    // Animated water platform
                    const waterGradient = this.ctx.createLinearGradient(
                        platform.x, platform.y,
                        platform.x, platform.y + platform.height
                    );
                    waterGradient.addColorStop(0, '#4ECDC4');
                    waterGradient.addColorStop(1, '#3AAFA9');
                    this.ctx.fillStyle = waterGradient;
                    this.ctx.fillRect(platform.x, platform.y, platform.width, platform.height);

                    // Water wave effect
                    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
                    this.ctx.lineWidth = 2;
                    this.ctx.beginPath();
                    for (let x = 0; x < platform.width; x += 5) {
                        const y = Math.sin((x + this.animationTime) * 0.1) * 2;
                        if (x === 0) {
                            this.ctx.moveTo(platform.x + x, platform.y + 5 + y);
                        } else {
                            this.ctx.lineTo(platform.x + x, platform.y + 5 + y);
                        }
                    }
                    this.ctx.stroke();
                    break;

                default:
                    // Regular platform with texture
                    const neutralGradient = this.ctx.createLinearGradient(
                        platform.x, platform.y,
                        platform.x, platform.y + platform.height
                    );
                    neutralGradient.addColorStop(0, '#95A5A6');
                    neutralGradient.addColorStop(1, '#7F8C8D');
                    this.ctx.fillStyle = neutralGradient;
                    this.ctx.fillRect(platform.x, platform.y, platform.width, platform.height);
            }

            // Enhanced border
            this.ctx.strokeStyle = '#34495E';
            this.ctx.lineWidth = 3;
            this.ctx.strokeRect(platform.x, platform.y, platform.width, platform.height);

            // Inner highlight
            this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
            this.ctx.lineWidth = 1;
            this.ctx.strokeRect(platform.x + 2, platform.y + 2, platform.width - 4, platform.height - 4);

            this.ctx.restore();
        });

        // Draw buttons with animation
        level.buttons.forEach(button => {
            const pulse = button.pressed ? 1 : Math.sin(this.animationTime * 0.1) * 0.2 + 0.8;
            this.ctx.globalAlpha = pulse;
            this.ctx.fillStyle = button.pressed ? '#2ECC71' : '#E74C3C';
            this.ctx.fillRect(button.x, button.y, button.width, button.height);

            // Button glow
            if (button.pressed) {
                this.ctx.shadowBlur = 10;
                this.ctx.shadowColor = '#2ECC71';
                this.ctx.fillRect(button.x, button.y, button.width, button.height);
                this.ctx.shadowBlur = 0;
            }
            this.ctx.globalAlpha = 1;
        });

        // Draw doors with animation
        level.doors.forEach(door => {
            if (!door.open) {
                const doorGradient = this.ctx.createLinearGradient(
                    door.x, door.y,
                    door.x + door.width, door.y
                );
                doorGradient.addColorStop(0, '#654321');
                doorGradient.addColorStop(0.5, '#8B4513');
                doorGradient.addColorStop(1, '#654321');
                this.ctx.fillStyle = doorGradient;
                this.ctx.fillRect(door.x, door.y, door.width, door.height);

                // Door details
                this.ctx.strokeStyle = '#654321';
                this.ctx.lineWidth = 3;
                this.ctx.strokeRect(door.x, door.y, door.width, door.height);

                // Door handle
                this.ctx.fillStyle = '#FFD700';
                this.ctx.fillRect(door.x + door.width - 5, door.y + door.height / 2 - 3, 3, 6);
            }
        });
    }

    drawPlayers() {
        if (!this.gameState.players) return;

        this.gameState.players.forEach((player, index) => {
            this.ctx.save();

            // Check for effects
            const hasEffect = player.effects && player.effects.length > 0;

            if (hasEffect) {
                player.effects.forEach(effect => {
                    switch (effect.type) {
                        case 'burning':
                            // Create fire particles around player
                            if (Math.random() < 0.5) {
                                this.particles.push(new Particle(
                                    player.position.x + Math.random() * player.width,
                                    player.position.y + Math.random() * player.height,
                                    (Math.random() - 0.5) * 2,
                                    -Math.random() * 3,
                                    '#FF6B6B',
                                    20
                                ));
                            }
                            break;
                        case 'invincible':
                            // Flashing effect
                            this.ctx.globalAlpha = Math.sin(this.animationTime * 0.3) * 0.5 + 0.5;
                            this.ctx.shadowBlur = 15;
                            this.ctx.shadowColor = player.color;
                            break;
                    }
                });
            }

            // Draw player with gradient
            const gradient = this.ctx.createLinearGradient(
                player.position.x, player.position.y,
                player.position.x, player.position.y + player.height
            );
            gradient.addColorStop(0, player.color);
            gradient.addColorStop(1, this.darkenColor(player.color, 0.3));
            this.ctx.fillStyle = gradient;

            // Round corners
            this.roundRect(
                player.position.x,
                player.position.y,
                player.width,
                player.height,
                5
            );
            this.ctx.fill();

            // Border with glow
            this.ctx.strokeStyle = 'white';
            this.ctx.lineWidth = 2;
            this.ctx.shadowBlur = 5;
            this.ctx.shadowColor = 'white';
            this.roundRect(
                player.position.x,
                player.position.y,
                player.width,
                player.height,
                5
            );
            this.ctx.stroke();
            this.ctx.shadowBlur = 0;

            // Direction indicator with animation
            this.ctx.fillStyle = 'white';
            const centerX = player.position.x + player.width / 2;
            const centerY = player.position.y + player.height / 2;
            const arrowSize = 8;

            this.ctx.beginPath();
            switch (player.direction) {
                case 'right':
                    this.ctx.moveTo(centerX - arrowSize/2, centerY - arrowSize/2);
                    this.ctx.lineTo(centerX + arrowSize/2, centerY);
                    this.ctx.lineTo(centerX - arrowSize/2, centerY + arrowSize/2);
                    break;
                case 'left':
                    this.ctx.moveTo(centerX + arrowSize/2, centerY - arrowSize/2);
                    this.ctx.lineTo(centerX - arrowSize/2, centerY);
                    this.ctx.lineTo(centerX + arrowSize/2, centerY + arrowSize/2);
                    break;
            }
            this.ctx.fill();

            // Player label with background
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
            this.ctx.fillRect(centerX - 15, player.position.y - 20, 30, 15);
            this.ctx.fillStyle = 'white';
            this.ctx.font = 'bold 12px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText(`P${index + 1}`, centerX, player.position.y - 8);

            this.ctx.restore();

            // Create platform effect particles
            if (player.isGrounded && player.currentPlatformType && Math.random() < 0.1) {
                this.createPlatformEffect(
                    { type: player.currentPlatformType },
                    player.position.x,
                    player.position.y
                );
            }
        });
    }

    drawProjectiles() {
        if (!this.gameState.projectiles) return;

        this.gameState.projectiles.forEach(projectile => {
            if (projectile.active) {
                this.ctx.save();

                // Glow effect
                const gradient = this.ctx.createRadialGradient(
                    projectile.position.x, projectile.position.y, 0,
                    projectile.position.x, projectile.position.y, projectile.radius * 3
                );
                gradient.addColorStop(0, '#FFD700');
                gradient.addColorStop(0.5, 'rgba(255, 165, 0, 0.5)');
                gradient.addColorStop(1, 'rgba(255, 165, 0, 0)');

                this.ctx.fillStyle = gradient;
                this.ctx.beginPath();
                this.ctx.arc(
                    projectile.position.x,
                    projectile.position.y,
                    projectile.radius * 3,
                    0,
                    Math.PI * 2
                );
                this.ctx.fill();

                // Core projectile
                this.ctx.fillStyle = '#FFD700';
                this.ctx.beginPath();
                this.ctx.arc(
                    projectile.position.x,
                    projectile.position.y,
                    projectile.radius,
                    0,
                    Math.PI * 2
                );
                this.ctx.fill();

                // Bright center
                this.ctx.fillStyle = '#FFED4E';
                this.ctx.beginPath();
                this.ctx.arc(
                    projectile.position.x - 1,
                    projectile.position.y - 1,
                    projectile.radius * 0.5,
                    0,
                    Math.PI * 2
                );
                this.ctx.fill();

                // Trail particles
                if (Math.random() < 0.5) {
                    this.particles.push(new Particle(
                        projectile.position.x,
                        projectile.position.y,
                        (Math.random() - 0.5) * 0.5,
                        (Math.random() - 0.5) * 0.5,
                        '#FFA500',
                        15
                    ));
                }

                this.ctx.restore();
            }
        });
    }

    drawGoals() {
        if (!this.gameState.level.goals) return;

        this.gameState.level.goals.forEach((goal, index) => {
            const colors = ['#FF4444', '#4444FF'];
            const color = colors[index];

            // Animated pulse
            const pulse = Math.sin(this.animationTime * 0.05) * 0.2 + 0.3;

            // Outer glow
            this.ctx.save();
            this.ctx.shadowBlur = 20;
            this.ctx.shadowColor = color;
            this.ctx.fillStyle = color;
            this.ctx.globalAlpha = pulse;
            this.ctx.fillRect(goal.x - 5, goal.y - 5, goal.width + 10, goal.height + 10);
            this.ctx.restore();

            // Main goal area
            this.ctx.fillStyle = color;
            this.ctx.globalAlpha = 0.3;
            this.ctx.fillRect(goal.x, goal.y, goal.width, goal.height);
            this.ctx.globalAlpha = 1.0;

            // Animated border
            this.ctx.strokeStyle = color;
            this.ctx.lineWidth = 3;
            this.ctx.setLineDash([5, 5]);
            this.ctx.lineDashOffset = -this.animationTime * 0.2;
            this.ctx.strokeRect(goal.x, goal.y, goal.width, goal.height);
            this.ctx.setLineDash([]);

            // Goal text with shadow
            this.ctx.save();
            this.ctx.shadowBlur = 5;
            this.ctx.shadowColor = 'black';
            this.ctx.fillStyle = color;
            this.ctx.font = 'bold 14px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('GOAL', goal.x + goal.width / 2, goal.y + goal.height / 2 + 5);
            this.ctx.restore();
        });
    }

    drawUI() {
        if (this.gameState.winner) {
            const isWinner = this.gameState.winner === this.playerId;

            // Victory/Defeat overlay
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

            // Animated text
            const scale = Math.sin(this.animationTime * 0.05) * 0.1 + 1;
            this.ctx.save();
            this.ctx.translate(this.canvas.width / 2, this.canvas.height / 2);
            this.ctx.scale(scale, scale);

            this.ctx.font = 'bold 60px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.shadowBlur = 20;

            if (isWinner) {
                this.ctx.shadowColor = '#2ECC71';
                this.ctx.fillStyle = '#2ECC71';
                this.ctx.fillText('VICTOIRE!', 0, 0);

                // Confetti
                if (Math.random() < 0.3) {
                    this.particles.push(new Particle(
                        Math.random() * this.canvas.width,
                        -10,
                        (Math.random() - 0.5) * 2,
                        Math.random() * 2 + 2,
                        ['#FF6B6B', '#4ECDC4', '#FFD700', '#2ECC71'][Math.floor(Math.random() * 4)],
                        60
                    ));
                }
            } else {
                this.ctx.shadowColor = '#E74C3C';
                this.ctx.fillStyle = '#E74C3C';
                this.ctx.fillText('DÉFAITE', 0, 0);
            }

            this.ctx.restore();
        }
    }

    roundRect(x, y, width, height, radius) {
        this.ctx.beginPath();
        this.ctx.moveTo(x + radius, y);
        this.ctx.lineTo(x + width - radius, y);
        this.ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
        this.ctx.lineTo(x + width, y + height - radius);
        this.ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
        this.ctx.lineTo(x + radius, y + height);
        this.ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
        this.ctx.lineTo(x, y + radius);
        this.ctx.quadraticCurveTo(x, y, x + radius, y);
        this.ctx.closePath();
    }

    darkenColor(color, amount) {
        const num = parseInt(color.replace('#', ''), 16);
        const r = Math.max(0, (num >> 16) - amount * 255);
        const g = Math.max(0, ((num >> 8) & 0x00FF) - amount * 255);
        const b = Math.max(0, (num & 0x0000FF) - amount * 255);
        return '#' + ((r << 16) | (g << 8) | b).toString(16).padStart(6, '0');
    }

    updateStatus(message) {
        const statusElement = document.getElementById('status');
        if (statusElement) {
            statusElement.textContent = message;
        }
    }

    updateScoreBoard(scores) {
        const scoreList = document.getElementById('scoreList');
        if (!scoreList) return;

        if (!scores || scores.length === 0) {
            scoreList.innerHTML = `
                <div style="text-align: center; color: #aaa; padding: 20px;">
                    Aucun score pour le moment
                </div>
            `;
            return;
        }

        // Sort by wins descending
        const sortedScores = [...scores].sort((a, b) => b.wins - a.wins);

        scoreList.innerHTML = sortedScores.map((score, index) => {
            const playerClass = index === 0 ? 'player1' : 'player2';
            const isCurrentPlayer = score.playerId === this.playerId;
            const highlight = isCurrentPlayer ? 'style="background: rgba(255, 215, 0, 0.2);"' : '';

            return `
                <div class="score-entry ${playerClass}" ${highlight}>
                    <div class="score-name">
                        ${score.playerName} ${isCurrentPlayer ? '(Vous)' : ''}
                    </div>
                    <div class="score-stats">
                        <span class="score-wins">V: ${score.wins}</span>
                        <span class="score-losses">D: ${score.losses}</span>
                    </div>
                </div>
            `;
        }).join('');
    }
}

// Start the game when page loads
window.addEventListener('load', () => {
    new GameClient();
});
