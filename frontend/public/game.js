// Game Client
class GameClient {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.socket = null;
        this.playerId = null;
        this.playerIndex = null; // Track player index (0 or 1)
        this.gameState = null;
        this.inputState = {
            up: false,
            down: false,
            left: false,
            right: false,
            shoot: false,
        };
        this.lastShootState = false;

        this.init();
    }

    init() {
        this.connectToServer();
        this.setupControls();
        this.startRenderLoop();
    }

    connectToServer() {
        // Connect to backend WebSocket
        const backendUrl = window.location.hostname === 'localhost'
            ? 'http://localhost:3000'
            : `http://${window.location.hostname}:3000`;

        this.socket = io(backendUrl);

        this.socket.on('connect', () => {
            console.log('Connected to server');
            this.updateStatus('Connecté au serveur');
        });

        this.socket.on('playerJoined', (data) => {
            this.playerId = data.playerId;
            console.log('Joined as player:', this.playerId);
            this.updateStatus('Vous avez rejoint la partie!');
        });

        this.socket.on('gameState', (state) => {
            this.gameState = state;

            // Determine our player index (0 or 1)
            if (this.playerId && state.players) {
                this.playerIndex = state.players.findIndex(p => p.id === this.playerId);
            }

            if (state.gameStarted && !state.winner) {
                this.updateStatus('Partie en cours...');
            } else if (state.winner) {
                const isWinner = state.winner === this.playerId;
                this.updateStatus(isWinner ? '🎉 Vous avez gagné!' : '😢 Vous avez perdu');
            }
        });

        this.socket.on('playerConnected', (data) => {
            this.updateStatus('Un joueur a rejoint la partie!');
        });

        this.socket.on('playerDisconnected', (data) => {
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
        // Keyboard controls
        window.addEventListener('keydown', (e) => {
            this.handleKeyEvent(e, true);
        });

        window.addEventListener('keyup', (e) => {
            this.handleKeyEvent(e, false);
        });
    }

    handleKeyEvent(e, isPressed) {
        // Only process keys if we know our player index
        if (this.playerIndex === null) return;

        let keyHandled = false;

        // Player 1 controls (WASD + E) - index 0
        if (this.playerIndex === 0) {
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
                    keyHandled = true;
                    break;
            }
        }

        // Player 2 controls (Arrow keys + Enter) - index 1
        if (this.playerIndex === 1) {
            switch (e.key) {
                case 'ArrowUp':
                    this.inputState.up = isPressed;
                    keyHandled = true;
                    e.preventDefault();
                    break;
                case 'ArrowDown':
                    this.inputState.down = isPressed;
                    keyHandled = true;
                    e.preventDefault();
                    break;
                case 'ArrowLeft':
                    this.inputState.left = isPressed;
                    keyHandled = true;
                    e.preventDefault();
                    break;
                case 'ArrowRight':
                    this.inputState.right = isPressed;
                    keyHandled = true;
                    e.preventDefault();
                    break;
                case 'Enter':
                    this.inputState.shoot = isPressed;
                    keyHandled = true;
                    e.preventDefault();
                    break;
            }
        }

        // Only send input if we handled a key
        if (keyHandled) {
            // Send input to server only on shoot press (not hold)
            if (this.inputState.shoot && !this.lastShootState) {
                this.sendInput();
            } else if (!this.inputState.shoot) {
                this.sendInput();
            }

            this.lastShootState = this.inputState.shoot;
        }
    }

    sendInput() {
        if (this.socket && this.socket.connected) {
            this.socket.emit('input', this.inputState);
        }
    }

    startRenderLoop() {
        const render = () => {
            this.render();
            requestAnimationFrame(render);
        };
        render();
    }

    render() {
        // Clear canvas
        this.ctx.fillStyle = '#0f3460';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        if (!this.gameState) {
            this.drawWaitingScreen();
            return;
        }

        // Draw level
        this.drawLevel();

        // Draw players
        this.drawPlayers();

        // Draw projectiles
        this.drawProjectiles();

        // Draw goals
        this.drawGoals();

        // Draw UI
        this.drawUI();
    }

    drawWaitingScreen() {
        this.ctx.fillStyle = 'white';
        this.ctx.font = '30px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('En attente de joueurs...', this.canvas.width / 2, this.canvas.height / 2);
    }

    drawLevel() {
        const level = this.gameState.level;

        // Draw platforms
        level.platforms.forEach(platform => {
            switch (platform.type) {
                case 'fire':
                    this.ctx.fillStyle = '#FF6B6B';
                    break;
                case 'water':
                    this.ctx.fillStyle = '#4ECDC4';
                    break;
                default:
                    this.ctx.fillStyle = '#95A5A6';
            }
            this.ctx.fillRect(platform.x, platform.y, platform.width, platform.height);

            // Draw border
            this.ctx.strokeStyle = '#34495E';
            this.ctx.lineWidth = 2;
            this.ctx.strokeRect(platform.x, platform.y, platform.width, platform.height);
        });

        // Draw buttons
        level.buttons.forEach(button => {
            this.ctx.fillStyle = button.pressed ? '#2ECC71' : '#E74C3C';
            this.ctx.fillRect(button.x, button.y, button.width, button.height);
        });

        // Draw doors
        level.doors.forEach(door => {
            if (!door.open) {
                this.ctx.fillStyle = '#8B4513';
                this.ctx.fillRect(door.x, door.y, door.width, door.height);

                // Door pattern
                this.ctx.strokeStyle = '#654321';
                this.ctx.lineWidth = 3;
                this.ctx.strokeRect(door.x, door.y, door.width, door.height);
            }
        });
    }

    drawPlayers() {
        if (!this.gameState.players) return;

        this.gameState.players.forEach((player, index) => {
            // Draw player
            this.ctx.fillStyle = player.color;
            this.ctx.fillRect(player.position.x, player.position.y, player.width, player.height);

            // Draw border
            this.ctx.strokeStyle = 'white';
            this.ctx.lineWidth = 2;
            this.ctx.strokeRect(player.position.x, player.position.y, player.width, player.height);

            // Draw direction indicator
            this.ctx.fillStyle = 'white';
            const centerX = player.position.x + player.width / 2;
            const centerY = player.position.y + player.height / 2;

            switch (player.direction) {
                case 'right':
                    this.ctx.beginPath();
                    this.ctx.moveTo(centerX - 5, centerY - 5);
                    this.ctx.lineTo(centerX + 5, centerY);
                    this.ctx.lineTo(centerX - 5, centerY + 5);
                    this.ctx.fill();
                    break;
                case 'left':
                    this.ctx.beginPath();
                    this.ctx.moveTo(centerX + 5, centerY - 5);
                    this.ctx.lineTo(centerX - 5, centerY);
                    this.ctx.lineTo(centerX + 5, centerY + 5);
                    this.ctx.fill();
                    break;
            }

            // Draw player name/number
            this.ctx.fillStyle = 'white';
            this.ctx.font = '12px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText(`P${index + 1}`, centerX, player.position.y - 5);
        });
    }

    drawProjectiles() {
        if (!this.gameState.projectiles) return;

        this.gameState.projectiles.forEach(projectile => {
            if (projectile.active) {
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

                // Glow effect
                this.ctx.strokeStyle = '#FFA500';
                this.ctx.lineWidth = 2;
                this.ctx.stroke();
            }
        });
    }

    drawGoals() {
        if (!this.gameState.level.goals) return;

        this.gameState.level.goals.forEach((goal, index) => {
            // Draw goal
            const colors = ['#FF4444', '#4444FF'];
            this.ctx.fillStyle = colors[index];
            this.ctx.globalAlpha = 0.3;
            this.ctx.fillRect(goal.x, goal.y, goal.width, goal.height);
            this.ctx.globalAlpha = 1.0;

            // Draw border
            this.ctx.strokeStyle = colors[index];
            this.ctx.lineWidth = 3;
            this.ctx.strokeRect(goal.x, goal.y, goal.width, goal.height);

            // Draw "GOAL" text
            this.ctx.fillStyle = colors[index];
            this.ctx.font = 'bold 14px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('GOAL', goal.x + goal.width / 2, goal.y + goal.height / 2 + 5);
        });
    }

    drawUI() {
        // Draw game info
        this.ctx.fillStyle = 'white';
        this.ctx.font = '16px Arial';
        this.ctx.textAlign = 'left';

        if (this.gameState.winner) {
            const isWinner = this.gameState.winner === this.playerId;
            this.ctx.font = 'bold 40px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillStyle = isWinner ? '#2ECC71' : '#E74C3C';
            this.ctx.fillText(
                isWinner ? '🎉 VICTOIRE!' : '😢 DÉFAITE',
                this.canvas.width / 2,
                this.canvas.height / 2
            );
        }
    }

    updateStatus(message) {
        const statusElement = document.getElementById('status');
        if (statusElement) {
            statusElement.textContent = message;
        }
    }
}

// Start the game when page loads
window.addEventListener('load', () => {
    new GameClient();
});
