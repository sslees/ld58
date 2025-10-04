// Game Configuration
const CONFIG = {
    canvas: {
        width: 960,
        height: 480
    },
    player: {
        x: 150,
        width: 60,
        height: 80,
        speed: 5,
        netLength: 80,
        netSwingDuration: 300
    },
    newspaper: {
        width: 30,
        height: 20,
        minSpawnInterval: 1000,
        maxSpawnInterval: 2500,
        speed: 3
    },
    background: {
        scrollSpeed: 3,
        groundHeight: 240
    },
    colors: {
        gameboy: {
            darkest: '#0f380f',
            dark: '#306230',
            light: '#8bac0f',
            lightest: '#9bbc0f'
        }
    }
};

// Game State
class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.state = 'start'; // start, playing, paused, gameOver
        this.score = 0;
        this.highScore = parseInt(localStorage.getItem('paperboyOverdueHighScore')) || 0;
        this.speed = 1;
        this.frameCount = 0;
        this.lives = 3;
        
        this.player = new Player();
        this.newspapers = [];
        this.newspaperStacks = [];
        this.background = new Background();
        this.particleEffects = [];
        
        this.keys = {};
        this.lastNewspaperSpawn = 0;
        this.isMobile = this.detectMobile();
        
        this.setupEventListeners();
        this.setupMobileControls();
        this.setupResizeListener();
        this.updateDisplay();
        this.gameLoop();
    }
    
    detectMobile() {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) 
            || (window.innerWidth <= 768);
    }
    
    setupResizeListener() {
        let resizeTimeout;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => {
                const wasMobile = this.isMobile;
                this.isMobile = this.detectMobile();
                
                // Toggle mobile controls visibility
                const mobileControls = document.getElementById('mobileControls');
                if (this.isMobile && !wasMobile) {
                    mobileControls.classList.remove('hidden');
                } else if (!this.isMobile && wasMobile) {
                    mobileControls.classList.add('hidden');
                }
            }, 250);
        });
    }
    
    setupEventListeners() {
        // Keyboard
        window.addEventListener('keydown', (e) => {
            this.keys[e.key] = true;
            if (e.key === ' ') {
                e.preventDefault();
                if (this.state === 'playing') {
                    this.player.swingNet();
                }
            }
            if (e.key === 'Enter') {
                e.preventDefault();
                if (this.state === 'start') {
                    this.startGame();
                } else if (this.state === 'gameOver') {
                    this.startGame();
                } else if (this.state === 'paused') {
                    this.resumeGame();
                }
            }
            if (e.key === 'Escape') {
                e.preventDefault();
                if (this.state === 'playing') {
                    this.pauseGame();
                } else if (this.state === 'paused') {
                    this.resumeGame();
                }
            }
        });
        
        window.addEventListener('keyup', (e) => {
            this.keys[e.key] = false;
        });
        
        // UI Buttons
        document.getElementById('startButton').addEventListener('click', () => {
            this.startGame();
        });
        
        document.getElementById('restartButton').addEventListener('click', () => {
            this.startGame();
        });
        
        document.getElementById('resumeButton').addEventListener('click', () => {
            this.resumeGame();
        });
    }
    
    setupMobileControls() {
        const mobileControls = document.getElementById('mobileControls');
        
        if (this.isMobile) {
            mobileControls.classList.remove('hidden');
            
            const btnUp = document.getElementById('btnUp');
            const btnDown = document.getElementById('btnDown');
            const btnSwing = document.getElementById('btnSwing');
            const btnPause = document.getElementById('btnPause');
            
            // Pause button
            btnPause.addEventListener('touchstart', (e) => {
                e.preventDefault();
                if (this.state === 'playing') {
                    this.pauseGame();
                }
            });
            
            // Up button
            btnUp.addEventListener('touchstart', (e) => {
                e.preventDefault();
                this.keys['ArrowUp'] = true;
            });
            btnUp.addEventListener('touchend', (e) => {
                e.preventDefault();
                this.keys['ArrowUp'] = false;
            });
            btnUp.addEventListener('touchcancel', (e) => {
                e.preventDefault();
                this.keys['ArrowUp'] = false;
            });
            
            // Down button
            btnDown.addEventListener('touchstart', (e) => {
                e.preventDefault();
                this.keys['ArrowDown'] = true;
            });
            btnDown.addEventListener('touchend', (e) => {
                e.preventDefault();
                this.keys['ArrowDown'] = false;
            });
            btnDown.addEventListener('touchcancel', (e) => {
                e.preventDefault();
                this.keys['ArrowDown'] = false;
            });
            
            // Swing button
            btnSwing.addEventListener('touchstart', (e) => {
                e.preventDefault();
                if (this.state === 'playing') {
                    this.player.swingNet();
                }
            });
            
            // Also support mouse events for testing on desktop/with small windows
            btnUp.addEventListener('mousedown', (e) => {
                e.preventDefault();
                this.keys['ArrowUp'] = true;
            });
            btnUp.addEventListener('mouseup', (e) => {
                e.preventDefault();
                this.keys['ArrowUp'] = false;
            });
            btnUp.addEventListener('mouseleave', (e) => {
                this.keys['ArrowUp'] = false;
            });
            
            btnDown.addEventListener('mousedown', (e) => {
                e.preventDefault();
                this.keys['ArrowDown'] = true;
            });
            btnDown.addEventListener('mouseup', (e) => {
                e.preventDefault();
                this.keys['ArrowDown'] = false;
            });
            btnDown.addEventListener('mouseleave', (e) => {
                this.keys['ArrowDown'] = false;
            });
            
            btnSwing.addEventListener('mousedown', (e) => {
                e.preventDefault();
                if (this.state === 'playing') {
                    this.player.swingNet();
                }
            });
            
            btnPause.addEventListener('mousedown', (e) => {
                e.preventDefault();
                if (this.state === 'playing') {
                    this.pauseGame();
                }
            });
        }
    }
    
    startGame() {
        this.state = 'playing';
        this.score = 0;
        this.speed = 1;
        this.frameCount = 0;
        this.lives = 3;
        this.newspapers = [];
        this.newspaperStacks = [];
        this.particleEffects = [];
        this.lastNewspaperSpawn = 0;
        this.lastStackSpawn = 0;
        this.player.reset();
        this.background.reset();
        
        document.getElementById('startScreen').classList.add('hidden');
        document.getElementById('gameOverScreen').classList.add('hidden');
        document.getElementById('pauseScreen').classList.add('hidden');
        
        // Show controls during gameplay
        const controlsTip = document.querySelector('.controls-tip');
        if (controlsTip) {
            controlsTip.style.display = 'flex';
        }
        
        if (this.isMobile) {
            const pauseBtn = document.getElementById('btnPause');
            const dpad = document.getElementById('mobileDpad');
            const swingBtn = document.getElementById('btnSwing');
            
            if (pauseBtn) pauseBtn.classList.remove('hidden');
            if (dpad) dpad.classList.remove('hidden');
            if (swingBtn) swingBtn.classList.remove('hidden');
        }
        
        this.updateDisplay();
    }
    
    loseLife() {
        this.lives--;
        this.updateDisplay();
        
        if (this.lives <= 0) {
            this.gameOver();
        }
    }
    
    gameOver() {
        this.state = 'gameOver';
        
        const isNewHighScore = this.score > this.highScore;
        if (isNewHighScore) {
            this.highScore = this.score;
            localStorage.setItem('paperboyOverdueHighScore', this.highScore);
            document.getElementById('newHighScore').classList.remove('hidden');
        } else {
            document.getElementById('newHighScore').classList.add('hidden');
        }
        
        document.getElementById('finalScore').textContent = this.score;
        document.getElementById('gameOverScreen').classList.remove('hidden');
        document.getElementById('pauseScreen').classList.add('hidden');
        
        // Hide controls on game over
        const controlsTip = document.querySelector('.controls-tip');
        if (controlsTip) {
            controlsTip.style.display = 'none';
        }
        
        if (this.isMobile) {
            const pauseBtn = document.getElementById('btnPause');
            const dpad = document.getElementById('mobileDpad');
            const swingBtn = document.getElementById('btnSwing');
            
            if (pauseBtn) pauseBtn.classList.add('hidden');
            if (dpad) dpad.classList.add('hidden');
            if (swingBtn) swingBtn.classList.add('hidden');
        }
        
        this.updateDisplay();
    }
    
    updateDisplay() {
        document.getElementById('score').textContent = this.score;
        document.getElementById('highScore').textContent = this.highScore;
        document.getElementById('speed').textContent = this.speed.toFixed(1);
        
        // Update hearts display
        const heartsContainer = document.getElementById('hearts');
        if (heartsContainer) {
            heartsContainer.innerHTML = '';
            for (let i = 0; i < this.lives; i++) {
                heartsContainer.innerHTML += '♥ ';
            }
        }
    }
    
    spawnNewspaper() {
        const now = Date.now();
        const spawnInterval = CONFIG.newspaper.maxSpawnInterval - (this.speed - 1) * 200;
        
        if (now - this.lastNewspaperSpawn > spawnInterval) {
            // Spawn in upper half of road (240-360) and above houses (down to ~200)
            const minY = 200;
            const maxY = 360;
            const y = Math.random() * (maxY - minY) + minY;
            
            this.newspapers.push(new Newspaper(CONFIG.canvas.width, y));
            this.lastNewspaperSpawn = now;
        }
    }
    
    spawnNewspaperStack() {
        const now = Date.now();
        const stackSpawnInterval = 15000; // Spawn stacks much less frequently (15 seconds)
        
        if (now - this.lastStackSpawn > stackSpawnInterval) {
            const minY = 200;
            const maxY = 360;
            const y = Math.random() * (maxY - minY) + minY;
            
            this.newspaperStacks.push(new NewspaperStack(CONFIG.canvas.width, y));
            this.lastStackSpawn = now;
        }
    }
    
    checkCollisions() {
        // Check newspaper collisions
        for (let i = this.newspapers.length - 1; i >= 0; i--) {
            const newspaper = this.newspapers[i];
            
            // Check if newspaper is caught by net
            if (this.player.isNetSwinging && this.player.netCollision(newspaper)) {
                this.score += 10;
                this.newspapers.splice(i, 1);
                this.createParticleEffect(newspaper.x, newspaper.y, 'catch');
                this.updateDisplay();
                continue;
            }
            
            // Check if newspaper went off screen (missed)
            if (newspaper.x + newspaper.width < 0) {
                this.newspapers.splice(i, 1);
                this.loseLife();
            }
        }
        
        // Check newspaper stack collisions
        for (let i = this.newspaperStacks.length - 1; i >= 0; i--) {
            const stack = this.newspaperStacks[i];
            
            // Check if stack is caught by net
            if (this.player.isNetSwinging && this.player.netCollision(stack)) {
                this.score += 100; // 10x points
                this.newspaperStacks.splice(i, 1);
                this.createParticleEffect(stack.x, stack.y, 'stack');
                this.updateDisplay();
                continue;
            }
            
            // Check if stack went off screen (missed) - no life lost
            if (stack.x + stack.width < 0) {
                this.newspaperStacks.splice(i, 1);
            }
        }
    }
    
    createParticleEffect(x, y, type) {
        for (let i = 0; i < 8; i++) {
            this.particleEffects.push(new Particle(x, y, type));
        }
    }
    
    pauseGame() {
        this.state = 'paused';
        document.getElementById('pauseScreen').classList.remove('hidden');
        
        // Hide controls while paused
        const controlsTip = document.querySelector('.controls-tip');
        if (controlsTip) {
            controlsTip.style.display = 'none';
        }
        
        if (this.isMobile) {
            const pauseBtn = document.getElementById('btnPause');
            const dpad = document.getElementById('mobileDpad');
            const swingBtn = document.getElementById('btnSwing');
            
            if (pauseBtn) pauseBtn.classList.add('hidden');
            if (dpad) dpad.classList.add('hidden');
            if (swingBtn) swingBtn.classList.add('hidden');
        }
    }
    
    resumeGame() {
        this.state = 'playing';
        document.getElementById('pauseScreen').classList.add('hidden');
        
        // Show controls when resuming
        const controlsTip = document.querySelector('.controls-tip');
        if (controlsTip) {
            controlsTip.style.display = 'flex';
        }
        
        if (this.isMobile) {
            const pauseBtn = document.getElementById('btnPause');
            const dpad = document.getElementById('mobileDpad');
            const swingBtn = document.getElementById('btnSwing');
            
            if (pauseBtn) pauseBtn.classList.remove('hidden');
            if (dpad) dpad.classList.remove('hidden');
            if (swingBtn) swingBtn.classList.remove('hidden');
        }
    }
    
    update() {
        if (this.state !== 'playing') return;
        
        this.frameCount++;
        
        // Gradually increase speed
        this.speed = 1 + Math.floor(this.frameCount / 600) * 0.2;
        if (this.frameCount % 60 === 0) {
            this.updateDisplay();
        }
        
        // Player movement
        if (this.keys['ArrowUp'] || this.keys['w']) {
            this.player.moveUp();
        }
        if (this.keys['ArrowDown'] || this.keys['s']) {
            this.player.moveDown();
        }
        
        this.player.update();
        this.background.update(this.speed);
        
        // Spawn newspapers and stacks
        this.spawnNewspaper();
        this.spawnNewspaperStack();
        
        // Update newspapers and stacks
        this.newspapers.forEach(newspaper => newspaper.update(this.speed));
        this.newspaperStacks.forEach(stack => stack.update(this.speed));
        
        // Update particles
        for (let i = this.particleEffects.length - 1; i >= 0; i--) {
            this.particleEffects[i].update();
            if (this.particleEffects[i].isDead()) {
                this.particleEffects.splice(i, 1);
            }
        }
        
        // Check collisions
        this.checkCollisions();
    }
    
    draw() {
        // Clear canvas
        this.ctx.fillStyle = CONFIG.colors.gameboy.lightest;
        this.ctx.fillRect(0, 0, CONFIG.canvas.width, CONFIG.canvas.height);
        
        // Draw background
        this.background.draw(this.ctx);
        
        // Draw newspapers and stacks
        this.newspapers.forEach(newspaper => newspaper.draw(this.ctx));
        this.newspaperStacks.forEach(stack => stack.draw(this.ctx));
        
        // Draw particles
        this.particleEffects.forEach(particle => particle.draw(this.ctx));
        
        // Draw player
        this.player.draw(this.ctx);
    }
    
    gameLoop() {
        this.update();
        this.draw();
        requestAnimationFrame(() => this.gameLoop());
    }
}

// Player (Bike Rider with Net)
class Player {
    constructor() {
        this.x = CONFIG.player.x;
        this.y = 360;
        this.width = CONFIG.player.width;
        this.height = CONFIG.player.height;
        this.speed = CONFIG.player.speed;
        
        this.isNetSwinging = false;
        this.netSwingStartTime = 0;
        this.netAngle = 0;
        this.wheelRotation = 0;
    }
    
    reset() {
        this.y = 360;
        this.isNetSwinging = false;
        this.netAngle = 0;
        this.wheelRotation = 0;
    }
    
    moveUp() {
        this.y = Math.max(160, this.y - this.speed);
    }
    
    moveDown() {
        // Bottom of road minus bike height
        const maxY = CONFIG.canvas.height - this.height;
        this.y = Math.min(maxY, this.y + this.speed);
    }
    
    swingNet() {
        if (!this.isNetSwinging) {
            this.isNetSwinging = true;
            this.netSwingStartTime = Date.now();
        }
    }
    
    update() {
        this.wheelRotation += 0.2;
        
        if (this.isNetSwinging) {
            const elapsed = Date.now() - this.netSwingStartTime;
            const progress = Math.min(elapsed / CONFIG.player.netSwingDuration, 1);
            
            // Swing net up, down further, then back to middle
            if (progress < 0.3) {
                // First 30%: swing up
                this.netAngle = -(progress / 0.3) * Math.PI / 4;
            } else if (progress < 0.7) {
                // Next 40%: swing down further
                const downProgress = (progress - 0.3) / 0.4;
                this.netAngle = -Math.PI / 4 + downProgress * (Math.PI / 2 + Math.PI / 4);
            } else {
                // Last 30%: swing back to middle
                const returnProgress = (progress - 0.7) / 0.3;
                this.netAngle = (Math.PI / 2 + Math.PI / 4) - returnProgress * (Math.PI / 2 + Math.PI / 4);
            }
            
            if (progress >= 1) {
                this.isNetSwinging = false;
                this.netAngle = 0;
            }
        }
    }
    
    netCollision(newspaper) {
        if (!this.isNetSwinging) return false;
        
        const netX = this.x + this.width / 2 + Math.cos(this.netAngle) * CONFIG.player.netLength;
        const netY = this.y + this.height / 2 + Math.sin(this.netAngle) * CONFIG.player.netLength;
        
        const dx = netX - (newspaper.x + newspaper.width / 2);
        const dy = netY - (newspaper.y + newspaper.height / 2);
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        return distance < 30;
    }
    
    draw(ctx) {
        const colors = CONFIG.colors.gameboy;
        
        // Draw bike
        // Wheels (keeping these as requested)
        const wheelRadius = 12;
        const backWheelX = this.x + 15;
        const frontWheelX = this.x + 45;
        const wheelY = this.y + this.height - 15;
        
        // Back wheel
        ctx.strokeStyle = colors.dark;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(backWheelX, wheelY, wheelRadius, 0, Math.PI * 2);
        ctx.stroke();
        
        // Spokes
        ctx.save();
        ctx.translate(backWheelX, wheelY);
        ctx.rotate(this.wheelRotation);
        ctx.beginPath();
        ctx.moveTo(-wheelRadius, 0);
        ctx.lineTo(wheelRadius, 0);
        ctx.moveTo(0, -wheelRadius);
        ctx.lineTo(0, wheelRadius);
        ctx.stroke();
        ctx.restore();
        
        // Front wheel
        ctx.beginPath();
        ctx.arc(frontWheelX, wheelY, wheelRadius, 0, Math.PI * 2);
        ctx.stroke();
        
        ctx.save();
        ctx.translate(frontWheelX, wheelY);
        ctx.rotate(this.wheelRotation);
        ctx.beginPath();
        ctx.moveTo(-wheelRadius, 0);
        ctx.lineTo(wheelRadius, 0);
        ctx.moveTo(0, -wheelRadius);
        ctx.lineTo(0, wheelRadius);
        ctx.stroke();
        ctx.restore();
        
        // Bike frame - proper triangle frame
        ctx.strokeStyle = colors.dark;
        ctx.lineWidth = 3;
        const seatX = this.x + 20;
        const seatY = this.y + 45;
        const handlebarX = this.x + 42;
        const handlebarY = this.y + 42;
        
        ctx.beginPath();
        // Main triangle
        ctx.moveTo(backWheelX, wheelY);
        ctx.lineTo(seatX, seatY);
        ctx.lineTo(handlebarX, handlebarY);
        ctx.lineTo(frontWheelX, wheelY);
        // Seat post
        ctx.moveTo(seatX, seatY);
        ctx.lineTo(backWheelX, wheelY - 8);
        // Front fork
        ctx.moveTo(handlebarX, handlebarY);
        ctx.lineTo(frontWheelX, wheelY - 2);
        ctx.stroke();
        
        // Seat
        ctx.fillStyle = colors.dark;
        ctx.fillRect(seatX - 8, seatY - 2, 12, 4);
        
        // Handlebars
        ctx.strokeStyle = colors.dark;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(handlebarX - 6, handlebarY - 2);
        ctx.lineTo(handlebarX + 6, handlebarY - 2);
        ctx.stroke();
        
        // Rider
        const riderX = this.x + 25;
        const riderY = this.y + 28;
        
        // Rider head
        ctx.fillStyle = colors.dark;
        ctx.beginPath();
        ctx.arc(riderX, riderY, 8, 0, Math.PI * 2);
        ctx.fill();
        
        // Rider body (torso)
        ctx.strokeStyle = colors.dark;
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(riderX, riderY + 8);
        ctx.lineTo(riderX + 8, riderY + 22);
        ctx.stroke();
        
        // Rider arm to handlebars
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(riderX + 3, riderY + 12);
        ctx.lineTo(handlebarX - 2, handlebarY - 2);
        ctx.stroke();
        
        // Rider legs (pedaling position)
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(riderX + 8, riderY + 22);
        ctx.lineTo(backWheelX - 8, wheelY - 8);
        ctx.moveTo(riderX + 8, riderY + 22);
        ctx.lineTo(backWheelX + 6, wheelY - 2);
        ctx.stroke();
        
        // Net
        const netBaseX = this.x + 38;
        const netBaseY = this.y + 25;
        const netEndX = netBaseX + Math.cos(this.netAngle) * CONFIG.player.netLength;
        const netEndY = netBaseY + Math.sin(this.netAngle) * CONFIG.player.netLength;
        
        // Net handle (thicker and more visible)
        ctx.strokeStyle = colors.dark;
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(netBaseX, netBaseY);
        ctx.lineTo(netEndX, netEndY);
        ctx.stroke();
        
        // Handle grip
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.moveTo(netBaseX, netBaseY);
        ctx.lineTo(netBaseX + Math.cos(this.netAngle) * 12, netBaseY + Math.sin(this.netAngle) * 12);
        ctx.stroke();
        
        // Net hoop (more prominent)
        ctx.strokeStyle = colors.dark;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(netEndX, netEndY, 18, 0, Math.PI * 2);
        ctx.stroke();
        
        // Net mesh (always visible, more detailed)
        ctx.strokeStyle = this.isNetSwinging ? colors.darkest : colors.dark;
        ctx.lineWidth = 1;
        
        // Radial lines
        for (let i = 0; i < 8; i++) {
            const angle = (Math.PI * 2 * i) / 8;
            ctx.beginPath();
            ctx.moveTo(netEndX, netEndY);
            ctx.lineTo(netEndX + Math.cos(angle) * 18, netEndY + Math.sin(angle) * 18);
            ctx.stroke();
        }
        
        // Concentric circles
        ctx.strokeStyle = this.isNetSwinging ? colors.light : colors.dark;
        for (let i = 1; i < 3; i++) {
            ctx.beginPath();
            ctx.arc(netEndX, netEndY, 18 * (i / 3), 0, Math.PI * 2);
            ctx.stroke();
        }
    }
}

// Newspaper
class Newspaper {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = CONFIG.newspaper.width;
        this.height = CONFIG.newspaper.height;
        this.rotation = Math.random() * Math.PI * 2;
        this.rotationSpeed = 0.05;
    }
    
    update(speedMultiplier) {
        this.x -= CONFIG.newspaper.speed * speedMultiplier;
        this.rotation += this.rotationSpeed;
    }
    
    draw(ctx) {
        ctx.save();
        ctx.translate(this.x + this.width / 2, this.y + this.height / 2);
        ctx.rotate(this.rotation);
        
        const colors = CONFIG.colors.gameboy;
        
        // Folded/flying newspaper (flat rectangle)
        // Main paper body
        ctx.fillStyle = colors.lightest;
        ctx.fillRect(-this.width / 2, -this.height / 2, this.width, this.height);
        
        // Border/shadow
        ctx.strokeStyle = colors.dark;
        ctx.lineWidth = 2;
        ctx.strokeRect(-this.width / 2, -this.height / 2, this.width, this.height);
        
        // Headline (bold)
        ctx.fillStyle = colors.darkest;
        ctx.fillRect(-this.width / 2 + 3, -this.height / 2 + 2, this.width - 6, 3);
        
        // Text lines (article text)
        ctx.fillStyle = colors.dark;
        for (let i = 0; i < 3; i++) {
            ctx.fillRect(-this.width / 2 + 3, -this.height / 2 + 8 + i * 3, this.width - 6, 1);
        }
        
        // Center fold line
        ctx.strokeStyle = colors.light;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0, -this.height / 2);
        ctx.lineTo(0, this.height / 2);
        ctx.stroke();
        
        // Corner fold effect (top right)
        ctx.fillStyle = colors.light;
        ctx.beginPath();
        ctx.moveTo(this.width / 2, -this.height / 2);
        ctx.lineTo(this.width / 2 - 4, -this.height / 2);
        ctx.lineTo(this.width / 2, -this.height / 2 + 4);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = colors.dark;
        ctx.lineWidth = 1;
        ctx.stroke();
        
        ctx.restore();
    }
}

// Newspaper Stack (5x points)
class NewspaperStack {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 40;
        this.height = 30;
        this.rotation = Math.random() * Math.PI * 2;
        this.rotationSpeed = 0.02;
    }
    
    update(speedMultiplier) {
        this.x -= CONFIG.newspaper.speed * speedMultiplier;
        this.rotation += this.rotationSpeed;
    }
    
    draw(ctx) {
        ctx.save();
        ctx.translate(this.x + this.width / 2, this.y + this.height / 2);
        ctx.rotate(this.rotation);
        
        const colors = CONFIG.colors.gameboy;
        
        // Bundle of newspapers wrapped with twine
        // Main bundle body (rectangular stack)
        ctx.fillStyle = colors.light;
        ctx.fillRect(-this.width / 2, -this.height / 2, this.width, this.height);
        
        // Individual newspaper layers (edges visible)
        ctx.strokeStyle = colors.darkest;
        ctx.lineWidth = 1;
        for (let i = 1; i < 5; i++) {
            const y = -this.height / 2 + (i * this.height / 5);
            ctx.beginPath();
            ctx.moveTo(-this.width / 2, y);
            ctx.lineTo(this.width / 2, y);
            ctx.stroke();
        }
        
        // Side edges showing stack depth
        ctx.fillStyle = colors.dark;
        ctx.fillRect(-this.width / 2 - 2, -this.height / 2 + 2, 2, this.height - 2);
        ctx.fillRect(this.width / 2, -this.height / 2 + 2, 2, this.height - 2);
        ctx.fillRect(-this.width / 2, this.height / 2, this.width, 2);
        
        // Headlines/text on top newspaper
        ctx.strokeStyle = colors.darkest;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        // Bold headline
        ctx.moveTo(-this.width / 2 + 4, -this.height / 2 + 5);
        ctx.lineTo(this.width / 2 - 4, -this.height / 2 + 5);
        ctx.stroke();
        
        // Smaller text lines
        ctx.lineWidth = 0.5;
        for (let i = 0; i < 3; i++) {
            ctx.beginPath();
            ctx.moveTo(-this.width / 2 + 4, -this.height / 2 + 10 + i * 3);
            ctx.lineTo(this.width / 2 - 4, -this.height / 2 + 10 + i * 3);
            ctx.stroke();
        }
        
        // Twine/string wrapped in X pattern
        ctx.strokeStyle = colors.darkest;
        ctx.lineWidth = 2;
        ctx.beginPath();
        // Horizontal wrapping
        ctx.moveTo(-this.width / 2 - 2, 0);
        ctx.lineTo(this.width / 2 + 2, 0);
        // Vertical wrapping
        ctx.moveTo(0, -this.height / 2 - 2);
        ctx.lineTo(0, this.height / 2 + 2);
        ctx.stroke();
        
        // Knot in center
        ctx.fillStyle = colors.darkest;
        ctx.fillRect(-3, -3, 6, 6);
        
        // String highlights
        ctx.strokeStyle = colors.light;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(-2, -1);
        ctx.lineTo(2, -1);
        ctx.stroke();
        
        ctx.restore();
    }
}

// Background (Neighborhood)
class Background {
    constructor() {
        this.houses = [];
        this.clouds = [];
        this.trees = [];
        this.offset = 0;
        this.groundOffset = 0;
        
        this.initializeScenery();
    }
    
    reset() {
        this.houses = [];
        this.clouds = [];
        this.trees = [];
        this.offset = 0;
        this.groundOffset = 0;
        this.initializeScenery();
    }
    
    initializeScenery() {
        // Create initial houses
        for (let i = 0; i < 5; i++) {
            const houseWidth = 80 + Math.random() * 40;
            const houseHeight = 80 + Math.random() * 40;
            this.houses.push({
                x: i * 250,
                y: CONFIG.canvas.height - CONFIG.background.groundHeight - houseHeight,
                width: houseWidth,
                height: houseHeight,
                roofHeight: 30 + Math.random() * 20,
                windows: Math.floor(Math.random() * 3) + 2,
                hasChimney: Math.random() > 0.5
            });
        }
        
        // Create clouds
        for (let i = 0; i < 4; i++) {
            this.clouds.push({
                x: Math.random() * CONFIG.canvas.width,
                y: 30 + Math.random() * 100,
                width: 60 + Math.random() * 40,
                height: 30
            });
        }
        
        // Create trees
        for (let i = 0; i < 6; i++) {
            const treeHeight = 50 + Math.random() * 30;
            this.trees.push({
                x: i * 200 + 100,
                y: CONFIG.canvas.height - CONFIG.background.groundHeight - treeHeight,
                height: treeHeight
            });
        }
    }
    
    update(speedMultiplier) {
        this.offset += CONFIG.background.scrollSpeed * speedMultiplier;
        this.groundOffset += CONFIG.background.scrollSpeed * speedMultiplier;
        
        // Update houses
        this.houses.forEach(house => {
            house.x -= CONFIG.background.scrollSpeed * speedMultiplier;
        });
        
        // Remove houses that are off screen and add new ones
        this.houses = this.houses.filter(house => house.x > -200);
        while (this.houses.length < 5) {
            const lastHouse = this.houses[this.houses.length - 1];
            const houseWidth = 80 + Math.random() * 40;
            const houseHeight = 80 + Math.random() * 40;
            this.houses.push({
                x: lastHouse.x + 250,
                y: CONFIG.canvas.height - CONFIG.background.groundHeight - houseHeight,
                width: houseWidth,
                height: houseHeight,
                roofHeight: 30 + Math.random() * 20,
                windows: Math.floor(Math.random() * 3) + 2,
                hasChimney: Math.random() > 0.5
            });
        }
        
        // Update clouds (slower)
        this.clouds.forEach(cloud => {
            cloud.x -= 0.5 * speedMultiplier;
            if (cloud.x < -cloud.width) {
                cloud.x = CONFIG.canvas.width;
            }
        });
        
        // Update trees
        this.trees.forEach(tree => {
            tree.x -= CONFIG.background.scrollSpeed * speedMultiplier;
        });
        
        this.trees = this.trees.filter(tree => tree.x > -50);
        while (this.trees.length < 6) {
            const lastTree = this.trees[this.trees.length - 1];
            const treeHeight = 50 + Math.random() * 30;
            this.trees.push({
                x: lastTree.x + 200,
                y: CONFIG.canvas.height - CONFIG.background.groundHeight - treeHeight,
                height: treeHeight
            });
        }
    }
    
    draw(ctx) {
        const colors = CONFIG.colors.gameboy;
        
        // Sky (already drawn as background)
        
        // Clouds
        this.clouds.forEach(cloud => {
            ctx.fillStyle = colors.light;
            ctx.beginPath();
            ctx.arc(cloud.x, cloud.y, 20, 0, Math.PI * 2);
            ctx.arc(cloud.x + 20, cloud.y, 25, 0, Math.PI * 2);
            ctx.arc(cloud.x + 40, cloud.y, 20, 0, Math.PI * 2);
            ctx.fill();
        });
        
        // Houses
        this.houses.forEach(house => {
            // House body
            ctx.fillStyle = colors.light;
            ctx.fillRect(house.x, house.y, house.width, house.height);
            ctx.strokeStyle = colors.dark;
            ctx.lineWidth = 2;
            ctx.strokeRect(house.x, house.y, house.width, house.height);
            
            // Roof
            ctx.fillStyle = colors.dark;
            ctx.beginPath();
            ctx.moveTo(house.x - 10, house.y);
            ctx.lineTo(house.x + house.width / 2, house.y - house.roofHeight);
            ctx.lineTo(house.x + house.width + 10, house.y);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
            
            // Chimney
            if (house.hasChimney) {
                ctx.fillRect(house.x + house.width - 20, house.y - house.roofHeight + 10, 12, 20);
            }
            
            // Windows
            const windowWidth = 15;
            const windowHeight = 15;
            const spacing = house.width / (house.windows + 1);
            
            for (let i = 0; i < house.windows; i++) {
                const wx = house.x + spacing * (i + 1) - windowWidth / 2;
                const wy = house.y + 25;
                
                ctx.fillStyle = colors.darkest;
                ctx.fillRect(wx, wy, windowWidth, windowHeight);
            }
            
            // Door
            ctx.fillStyle = colors.darkest;
            ctx.fillRect(house.x + house.width / 2 - 10, house.y + house.height - 30, 20, 30);
        });
        
        // Trees
        this.trees.forEach(tree => {
            // Trunk
            ctx.fillStyle = colors.dark;
            ctx.fillRect(tree.x - 5, tree.y, 10, tree.height);
            
            // Foliage
            ctx.fillStyle = colors.light;
            ctx.beginPath();
            ctx.arc(tree.x, tree.y - 10, 20, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(tree.x - 15, tree.y, 15, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(tree.x + 15, tree.y, 15, 0, Math.PI * 2);
            ctx.fill();
        });
        
        // Ground
        const groundY = CONFIG.canvas.height - CONFIG.background.groundHeight;
        ctx.fillStyle = colors.light;
        ctx.fillRect(0, groundY, CONFIG.canvas.width, CONFIG.background.groundHeight);
        
        // Ground line
        ctx.strokeStyle = colors.dark;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(0, groundY);
        ctx.lineTo(CONFIG.canvas.width, groundY);
        ctx.stroke();
        
        // Grass tufts
        ctx.strokeStyle = colors.dark;
        ctx.lineWidth = 2;
        for (let x = (-this.groundOffset % 40); x < CONFIG.canvas.width; x += 40) {
            ctx.beginPath();
            ctx.moveTo(x, groundY);
            ctx.lineTo(x + 5, groundY + 10);
            ctx.moveTo(x + 10, groundY);
            ctx.lineTo(x + 15, groundY + 8);
            ctx.moveTo(x + 20, groundY);
            ctx.lineTo(x + 25, groundY + 12);
            ctx.stroke();
        }
        
        // Road line (center of ground) - scrolling dashed line
        const roadY = groundY + CONFIG.background.groundHeight / 2;
        ctx.strokeStyle = colors.darkest;
        ctx.lineWidth = 2;
        ctx.setLineDash([15, 10]);
        ctx.lineDashOffset = this.groundOffset; // Make it scroll in the right direction
        ctx.beginPath();
        ctx.moveTo(0, roadY);
        ctx.lineTo(CONFIG.canvas.width, roadY);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.lineDashOffset = 0;
    }
}

// Particle Effect
class Particle {
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.vx = (Math.random() - 0.5) * 4;
        this.vy = (Math.random() - 0.5) * 4;
        this.life = 30;
        this.maxLife = 30;
        this.type = type;
    }
    
    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.life--;
    }
    
    isDead() {
        return this.life <= 0;
    }
    
    draw(ctx) {
        const alpha = this.life / this.maxLife;
        ctx.globalAlpha = alpha;
        
        if (this.type === 'catch') {
            ctx.fillStyle = CONFIG.colors.gameboy.dark;
            ctx.beginPath();
            ctx.arc(this.x, this.y, 3, 0, Math.PI * 2);
            ctx.fill();
        } else if (this.type === 'stack') {
            ctx.fillStyle = CONFIG.colors.gameboy.darkest;
            ctx.beginPath();
            ctx.arc(this.x, this.y, 6, 0, Math.PI * 2);
            ctx.fill();
            // Add a bright center
            ctx.fillStyle = CONFIG.colors.gameboy.lightest;
            ctx.beginPath();
            ctx.arc(this.x, this.y, 2, 0, Math.PI * 2);
            ctx.fill();
        }
        
        ctx.globalAlpha = 1;
    }
}

// Initialize game when page loads
window.addEventListener('load', () => {
    new Game();
});

