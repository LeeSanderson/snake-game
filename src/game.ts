type Position = {
    x: number;
    y: number;
};

type Food = Position & {
    emoji: string;
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
    private readonly foodEmojis = ['🍎', '🍕', '🍔', '🌮', '🍦', '🍪', '🍩', '🍫', '🥕', '🍇'];
    private direction: string;
    private gridSize: number;
    private tileCount: number;
    private score: number;
    private gameLoop: number;
    private isGameOver: boolean;
    private particles: Particle[] = [];
    private backgroundColor: string = 'white';
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
        this.gridSize = 20;
        this.tileCount = this.canvas.width / this.gridSize;
        this.score = 0;
        this.isGameOver = false;
        
        // Initialize snake
        this.snake = [{ x: 5, y: 5 }];
        this.direction = 'right';
        
        // Place initial food
        this.food = this.generateFood();
        
        // Set up event listeners
        document.addEventListener('keydown', this.handleKeyPress.bind(this));
        
        // Start game loop
        this.gameLoop = setInterval(this.update.bind(this), 100);
    }

    private generateFood(): Food {
        const x = Math.floor(Math.random() * this.tileCount);
        const y = Math.floor(Math.random() * this.tileCount);
        const emoji = this.foodEmojis[Math.floor(Math.random() * this.foodEmojis.length)];
        return { x, y, emoji };
    }

    private handleKeyPress(e: KeyboardEvent) {
        if (this.isGameOver && e.code === 'Space') {
            this.restart();
            return;
        }

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
            this.score += 10;
            document.getElementById('score')!.textContent = this.score.toString();
            this.createExplosion(head.x * this.gridSize + this.gridSize/2, head.y * this.gridSize + this.gridSize/2);
            this.backgroundColor = this.backgroundColors[Math.floor(Math.random() * this.backgroundColors.length)];
            this.food = this.generateFood();
        } else {
            this.snake.pop();
        }

        this.draw();
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
        this.ctx.fillStyle = 'black';
        
        // Center Game Over text
        this.ctx.font = '30px Arial';
        const gameOverText = 'Game Over!';
        const gameOverMetrics = this.ctx.measureText(gameOverText);
        const gameOverX = (this.canvas.width - gameOverMetrics.width) / 2;
        this.ctx.fillText(gameOverText, gameOverX, this.canvas.height / 2);
        
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
        this.backgroundColor = 'white';
        this.food = this.generateFood();
        document.getElementById('score')!.textContent = '0';
        this.gameLoop = setInterval(this.update.bind(this), 100);
    }
}

// Start the game when the page loads
window.onload = () => new SnakeGame();
