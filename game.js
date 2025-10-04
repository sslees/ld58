// Game Configuration
const CONFIG = {
    canvas: {
        width: 800,
        height: 600
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
        groundHeight: 150
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
        this.state = 'start'; // start, playing, gameOver
        this.score = 0;
        this.highScore = parseInt(localStorage.getItem('paperCatcherHighScore')) || 0;
        this.speed = 1;
        this.frameCount = 0;
        
        this.player = new Player();
        this.newspapers = [];
        this.background = new Background();
        this.particleEffects = [];
        
        this.keys = {};
        this.lastNewspaperSpawn = 0;
        
        this.setupEventListeners();
        this.updateDisplay();
        this.gameLoop();
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
    }
    
    startGame() {
        this.state = 'playing';
        this.score = 0;
        this.speed = 1;
        this.frameCount = 0;
        this.newspapers = [];
        this.particleEffects = [];
        this.lastNewspaperSpawn = 0;
        this.player.reset();
        this.background.reset();
        
        document.getElementById('startScreen').classList.add('hidden');
        document.getElementById('gameOverScreen').classList.add('hidden');
        
        this.updateDisplay();
    }
    
    gameOver() {
        this.state = 'gameOver';
        
        const isNewHighScore = this.score > this.highScore;
        if (isNewHighScore) {
            this.highScore = this.score;
            localStorage.setItem('paperCatcherHighScore', this.highScore);
            document.getElementById('newHighScore').classList.remove('hidden');
        } else {
            document.getElementById('newHighScore').classList.add('hidden');
        }
        
        document.getElementById('finalScore').textContent = this.score;
        document.getElementById('gameOverScreen').classList.remove('hidden');
        this.updateDisplay();
    }
    
    updateDisplay() {
        document.getElementById('score').textContent = this.score;
        document.getElementById('highScore').textContent = this.highScore;
        document.getElementById('speed').textContent = this.speed.toFixed(1);
    }
    
    spawnNewspaper() {
        const now = Date.now();
        const spawnInterval = CONFIG.newspaper.maxSpawnInterval - (this.speed - 1) * 200;
        
        if (now - this.lastNewspaperSpawn > spawnInterval) {
            const minY = 50;
            const maxY = CONFIG.canvas.height - CONFIG.background.groundHeight - 50;
            const y = Math.random() * (maxY - minY) + minY;
            
            this.newspapers.push(new Newspaper(CONFIG.canvas.width, y));
            this.lastNewspaperSpawn = now;
        }
    }
    
    checkCollisions() {
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
                this.gameOver();
            }
        }
    }
    
    createParticleEffect(x, y, type) {
        for (let i = 0; i < 8; i++) {
            this.particleEffects.push(new Particle(x, y, type));
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
        
        // Spawn newspapers
        this.spawnNewspaper();
        
        // Update newspapers
        this.newspapers.forEach(newspaper => newspaper.update(this.speed));
        
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
        
        // Draw newspapers
        this.newspapers.forEach(newspaper => newspaper.draw(this.ctx));
        
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
        this.y = CONFIG.canvas.height / 2;
        this.width = CONFIG.player.width;
        this.height = CONFIG.player.height;
        this.speed = CONFIG.player.speed;
        
        this.isNetSwinging = false;
        this.netSwingStartTime = 0;
        this.netAngle = 0;
        this.wheelRotation = 0;
    }
    
    reset() {
        this.y = CONFIG.canvas.height / 2;
        this.isNetSwinging = false;
        this.netAngle = 0;
        this.wheelRotation = 0;
    }
    
    moveUp() {
        this.y = Math.max(30, this.y - this.speed);
    }
    
    moveDown() {
        const maxY = CONFIG.canvas.height - CONFIG.background.groundHeight - this.height + 20;
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
            
            // Swing net forward and back
            if (progress < 0.5) {
                this.netAngle = (progress * 2) * Math.PI / 2;
            } else {
                this.netAngle = (2 - progress * 2) * Math.PI / 2;
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
        // Wheels
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
        
        // Bike frame
        ctx.strokeStyle = colors.dark;
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(backWheelX, wheelY);
        ctx.lineTo(this.x + 30, this.y + 40);
        ctx.lineTo(frontWheelX, wheelY);
        ctx.moveTo(this.x + 30, this.y + 40);
        ctx.lineTo(this.x + 30, this.y + 20);
        ctx.stroke();
        
        // Rider body
        ctx.fillStyle = colors.dark;
        ctx.fillRect(this.x + 20, this.y + 10, 20, 30);
        
        // Rider head
        ctx.beginPath();
        ctx.arc(this.x + 30, this.y, 10, 0, Math.PI * 2);
        ctx.fill();
        
        // Rider legs
        ctx.strokeStyle = colors.dark;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(this.x + 25, this.y + 40);
        ctx.lineTo(backWheelX, wheelY - 5);
        ctx.moveTo(this.x + 35, this.y + 40);
        ctx.lineTo(frontWheelX - 5, wheelY - 5);
        ctx.stroke();
        
        // Net
        const netBaseX = this.x + 40;
        const netBaseY = this.y + 20;
        const netEndX = netBaseX + Math.cos(this.netAngle) * CONFIG.player.netLength;
        const netEndY = netBaseY + Math.sin(this.netAngle) * CONFIG.player.netLength;
        
        // Net handle
        ctx.strokeStyle = colors.dark;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(netBaseX, netBaseY);
        ctx.lineTo(netEndX, netEndY);
        ctx.stroke();
        
        // Net hoop
        ctx.strokeStyle = colors.dark;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(netEndX, netEndY, 15, 0, Math.PI * 2);
        ctx.stroke();
        
        // Net mesh
        if (this.isNetSwinging) {
            ctx.strokeStyle = colors.light;
            ctx.lineWidth = 1;
            for (let i = 0; i < 4; i++) {
                ctx.beginPath();
                ctx.arc(netEndX, netEndY, 15 - i * 3, 0, Math.PI * 2);
                ctx.stroke();
            }
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
        
        // Newspaper
        ctx.fillStyle = CONFIG.colors.gameboy.dark;
        ctx.fillRect(-this.width / 2, -this.height / 2, this.width, this.height);
        
        // Newspaper details (lines representing text)
        ctx.strokeStyle = CONFIG.colors.gameboy.darkest;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(-this.width / 2 + 3, -this.height / 2 + 5);
        ctx.lineTo(this.width / 2 - 3, -this.height / 2 + 5);
        ctx.moveTo(-this.width / 2 + 3, -this.height / 2 + 10);
        ctx.lineTo(this.width / 2 - 3, -this.height / 2 + 10);
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
            this.houses.push({
                x: i * 250,
                y: CONFIG.canvas.height - CONFIG.background.groundHeight - 100,
                width: 80 + Math.random() * 40,
                height: 80 + Math.random() * 40,
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
            this.trees.push({
                x: i * 200 + 100,
                y: CONFIG.canvas.height - CONFIG.background.groundHeight - 60,
                height: 50 + Math.random() * 30
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
            this.houses.push({
                x: lastHouse.x + 250,
                y: CONFIG.canvas.height - CONFIG.background.groundHeight - 100,
                width: 80 + Math.random() * 40,
                height: 80 + Math.random() * 40,
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
            this.trees.push({
                x: lastTree.x + 200,
                y: CONFIG.canvas.height - CONFIG.background.groundHeight - 60,
                height: 50 + Math.random() * 30
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
        
        // Road line (center of ground)
        ctx.strokeStyle = colors.darkest;
        ctx.lineWidth = 2;
        ctx.setLineDash([15, 10]);
        ctx.beginPath();
        ctx.moveTo(0, groundY + CONFIG.background.groundHeight / 2);
        ctx.lineTo(CONFIG.canvas.width, groundY + CONFIG.background.groundHeight / 2);
        ctx.stroke();
        ctx.setLineDash([]);
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
        }
        
        ctx.globalAlpha = 1;
    }
}

// Initialize game when page loads
window.addEventListener('load', () => {
    new Game();
});

