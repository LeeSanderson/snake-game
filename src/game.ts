type Position = {
    x: number;
    y: number;
};

type Food = Position & {
    emoji: string;
    points: number;
};

type Particle = Position & {
    dx: number;
    dy: number;
    life: number;
    color: string;
};

class SnakeGame {
    private canvas: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D;
    private snake: Position[];
    private food: Food;
    private readonly foodItems = [
        { emoji: '🍎', points: 20 },  // Apple scores highest
        { emoji: '🍕', points: 15 },
        { emoji: '🍔', points: 15 },
        { emoji: '🌮', points: 12 },
        { emoji: '🍦', points: 10 },
        { emoji: '🍪', points: 10 },
        { emoji: '🍩', points: 8 },
        { emoji: '🍫', points: 8 },
        { emoji: '🥕', points: 5 },
        { emoji: '🍇', points: 5 }
    ];
    private direction: string;
    private gridSize: number = 0;
    private tileCount: number = 20; // Fixed number of tiles
    private score: number;
    private highScore: number;
    private gameLoop: number;
    private isGameOver: boolean;
    private particles: Particle[] = [];
    private backgroundColor: string = 'white';
    private resizeObserver: ResizeObserver;
    private isNewHighScore: boolean = false;
    private isPaused: boolean = false;
    private readonly backgroundColors = [
        '#FFE4E1', // Misty Rose
        '#E6E6FA', // Lavender
        '#F0FFF0', // Honeydew
        '#F0FFFF', // Azure
        '#FFF0F5', // Lavender Blush
        '#F5F5DC', // Beige
        '#E0FFFF', // Light Cyan
        '#FFF5EE', // Seashell
        '#F8F8FF', // Ghost White
        '#FAFAD2'  // Light Goldenrod
    ];

    constructor() {
        this.canvas = document.getElementById('gameCanvas') as HTMLCanvasElement;
        this.ctx = this.canvas.getContext('2d')!;
        this.score = 0;
        this.highScore = parseInt(localStorage.getItem('snakeHighScore') || '0');
        document.getElementById('highScore')!.textContent = this.highScore.toString();
        this.isGameOver = false;
        
        // Initialize snake
        this.snake = [{ x: 5, y: 5 }];
        this.direction = 'right';
        
        // Set up responsive canvas
        this.setupCanvas();
        
        // Set up resize observer
        this.resizeObserver = new ResizeObserver(() => this.setupCanvas());
        this.resizeObserver.observe(this.canvas);
        
        // Place initial food
        this.food = this.generateFood();
        
        // Set up event listeners
        document.addEventListener('keydown', this.handleKeyPress.bind(this));
        this.canvas.addEventListener('click', this.handlePointerEvent.bind(this));
        this.canvas.addEventListener('touchstart', (e: TouchEvent) => {
            e.preventDefault(); // Prevent scrolling
            this.handlePointerEvent(e);
        });
        
        // Start game loop
        this.gameLoop = setInterval(this.update.bind(this), 100);
    }

    private setupCanvas() {
        const size = Math.min(window.innerWidth * 0.9, window.innerHeight * 0.9);
        this.canvas.width = size;
        this.canvas.height = size;
        this.gridSize = size / this.tileCount;
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
    }

    private generateFood(): Food {
        const x = Math.floor(Math.random() * this.tileCount);
        const y = Math.floor(Math.random() * this.tileCount);
        const foodItem = this.foodItems[Math.floor(Math.random() * this.foodItems.length)];
        return { x, y, ...foodItem };
    }

    private handlePointerEvent(e: MouseEvent | TouchEvent) {
        if (this.isGameOver) {
            this.restart();
            return;
        }

        const rect = this.canvas.getBoundingClientRect();
        let clientX: number, clientY: number;

        if (e instanceof TouchEvent) {
            clientX = e.touches[0].clientX;
            clientY = e.touches[0].clientY;
        } else {
            clientX = e.clientX;
            clientY = e.clientY;
        }

        // Convert click/touch position to canvas coordinates
        const x = ((clientX - rect.left) / rect.width) * this.canvas.width;
        const y = ((clientY - rect.top) / rect.height) * this.canvas.height;

        // Get snake head position in pixels
        const headX = this.snake[0].x * this.gridSize + this.gridSize / 2;
        const headY = this.snake[0].y * this.gridSize + this.gridSize / 2;

        // Calculate angle between snake head and click/touch position
        const angle = Math.atan2(y - headY, x - headX);
        const degrees = angle * (180 / Math.PI);

        // Convert angle to direction
        // Use 45-degree sectors for each direction
        if (degrees >= -45 && degrees < 45) {
            if (this.direction !== 'left') this.direction = 'right';
        } else if (degrees >= 45 && degrees < 135) {
            if (this.direction !== 'up') this.direction = 'down';
        } else if (degrees >= -135 && degrees < -45) {
            if (this.direction !== 'down') this.direction = 'up';
        } else {
            if (this.direction !== 'right') this.direction = 'left';
        }
    }

    private handleKeyPress(e: KeyboardEvent) {
        if (this.isGameOver) {
            if (e.key === 'Enter' || e.code === 'Space') {
                this.restart();
            }
            return;
        }

        if (e.code === 'Space') {
            this.isPaused = !this.isPaused;
            return;
        }

        if (this.isPaused) return;

        switch (e.key) {
            case 'ArrowUp':
                if (this.direction !== 'down') this.direction = 'up';
                break;
            case 'ArrowDown':
                if (this.direction !== 'up') this.direction = 'down';
                break;
            case 'ArrowLeft':
                if (this.direction !== 'right') this.direction = 'left';
                break;
            case 'ArrowRight':
                if (this.direction !== 'left') this.direction = 'right';
                break;
        }
    }

    private update() {
        if (this.isPaused) {
            this.drawPauseScreen();
            return;
        }
        const head = { ...this.snake[0] };

        // Move snake
        switch (this.direction) {
            case 'up': head.y--; break;
            case 'down': head.y++; break;
            case 'left': head.x--; break;
            case 'right': head.x++; break;
        }

        // Check for collisions
        if (
            head.x < 0 || head.x >= this.tileCount ||
            head.y < 0 || head.y >= this.tileCount ||
            this.snake.some(segment => segment.x === head.x && segment.y === head.y)
        ) {
            this.gameOver();
            return;
        }

        // Add new head
        this.snake.unshift(head);

        // Check if food is eaten
        if (head.x === this.food.x && head.y === this.food.y) {
            this.score += this.food.points;
            document.getElementById('score')!.textContent = this.score.toString();
            this.createExplosion(head.x * this.gridSize + this.gridSize/2, head.y * this.gridSize + this.gridSize/2);
            this.backgroundColor = this.backgroundColors[Math.floor(Math.random() * this.backgroundColors.length)];
            this.food = this.generateFood();
        } else {
            this.snake.pop();
        }

        this.draw();
    }

    private createHighScoreCelebration() {
        const colors = ['#FFD700', '#FFA500', '#FF69B4', '#00FF00', '#4169E1'];
        for (let i = 0; i < 50; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 1 + Math.random() * 3;
            const size = 3 + Math.random() * 3;
            this.particles.push({
                x: Math.random() * this.canvas.width,
                y: Math.random() * this.canvas.height,
                dx: Math.cos(angle) * speed,
                dy: Math.sin(angle) * speed,
                life: 1,
                color: colors[Math.floor(Math.random() * colors.length)]
            });
        }
    }

    private createExplosion(x: number, y: number) {
        const colors = ['#FFD700', '#FFA500', '#FF6347', '#FF69B4'];
        for (let i = 0; i < 20; i++) {
            const angle = (Math.PI * 2 / 20) * i;
            const speed = 2 + Math.random() * 2;
            this.particles.push({
                x: x,
                y: y,
                dx: Math.cos(angle) * speed,
                dy: Math.sin(angle) * speed,
                life: 1,
                color: colors[Math.floor(Math.random() * colors.length)]
            });
        }
    }

    private updateParticles() {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.x += p.dx;
            p.y += p.dy;
            p.life -= 0.02;
            
            if (p.life <= 0) {
                this.particles.splice(i, 1);
            }
        }
    }

    private drawParticles() {
        this.particles.forEach(p => {
            this.ctx.fillStyle = p.color;
            this.ctx.globalAlpha = p.life;
            this.ctx.beginPath();
            this.ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
            this.ctx.fill();
        });
        this.ctx.globalAlpha = 1;
    }

    private drawPauseScreen() {
        this.draw(); // Draw the game state in the background
        this.ctx.save();
        this.ctx.font = '24px Arial';
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.ctx.fillText('⏸️', this.gridSize, this.gridSize);
        this.ctx.restore();
    }

    private draw() {
        this.updateParticles();
        // Clear canvas with current background color
        this.ctx.fillStyle = this.backgroundColor;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw snake
        this.ctx.fillStyle = 'green';
        this.snake.forEach(segment => {
            this.ctx.fillRect(
                segment.x * this.gridSize,
                segment.y * this.gridSize,
                this.gridSize - 2,
                this.gridSize - 2
            );
        });

        // Draw food emoji
        this.ctx.font = `${this.gridSize}px Arial`;
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText(
            this.food.emoji,
            this.food.x * this.gridSize + this.gridSize / 2,
            this.food.y * this.gridSize + this.gridSize / 2
        );
        this.ctx.textAlign = 'start';
        this.ctx.textBaseline = 'alphabetic';

        // Draw particles
        this.drawParticles();
    }

    private gameOver() {
        clearInterval(this.gameLoop);
        this.isGameOver = true;
        
        // Check for new high score
        if (this.score > this.highScore) {
            this.highScore = this.score;
            localStorage.setItem('snakeHighScore', this.score.toString());
            document.getElementById('highScore')!.textContent = this.highScore.toString();
            this.isNewHighScore = true;
            this.createHighScoreCelebration();
        }

        this.ctx.fillStyle = 'black';
        
        // Center Game Over text
        this.ctx.font = '30px Arial';
        const gameOverText = this.isNewHighScore ? 'New High Score!' : 'Game Over!';
        const gameOverMetrics = this.ctx.measureText(gameOverText);
        const gameOverX = (this.canvas.width - gameOverMetrics.width) / 2;
        this.ctx.fillText(gameOverText, gameOverX, this.canvas.height / 2);
        
        // Center score text
        this.ctx.font = '24px Arial';
        const scoreText = `Score: ${this.score}`;
        const scoreMetrics = this.ctx.measureText(scoreText);
        const scoreX = (this.canvas.width - scoreMetrics.width) / 2;
        this.ctx.fillText(scoreText, scoreX, this.canvas.height / 2 - 40);
        
        // Center restart text
        this.ctx.font = '20px Arial';
        const restartText = 'Press Space to Restart';
        const restartMetrics = this.ctx.measureText(restartText);
        const restartX = (this.canvas.width - restartMetrics.width) / 2;
        this.ctx.fillText(restartText, restartX, this.canvas.height / 2 + 40);
    }
    private restart() {
        this.snake = [{ x: 5, y: 5 }];
        this.direction = 'right';
        this.score = 0;
        this.isGameOver = false;
        this.isNewHighScore = false;
        this.backgroundColor = 'white';
        this.food = this.generateFood();
        document.getElementById('score')!.textContent = '0';
        this.particles = [];
        this.gameLoop = setInterval(this.update.bind(this), 100);
    }
}

// Start the game when the page loads
window.onload = () => new SnakeGame();
