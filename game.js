// Configuración inicial del Canvas y el Contexto
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

/** * Clase Ball: Gestiona las propiedades y el comportamiento de cada pelota 
 */
class Ball {
    constructor(x, y, radius, speedX, speedY, color) {
        this.x = x; // Posición horizontal
        this.y = y; // Posición vertical
        this.radius = radius; // Tamaño de la pelota
        this.speedX = speedX; // Velocidad en eje X
        this.speedY = speedY; // Velocidad en eje Y
        this.color = color; // Color único
    }

    // Dibuja la pelota en el canvas
    draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();
        ctx.shadowBlur = 10; // Efecto de brillo
        ctx.shadowColor = this.color;
        ctx.closePath();
    }

    // Actualiza la posición y detecta colisiones con bordes verticales (techo/suelo)
    move() {
        this.x += this.speedX;
        this.y += this.speedY;

        // Rebote en parte superior e inferior
        if (this.y - this.radius <= 0 || this.y + this.radius >= canvas.height) {
            this.speedY = -this.speedY;
        }
    }

    // Reposiciona la pelota en el centro al marcar un punto
    reset() {
        this.x = canvas.width / 2;
        this.y = canvas.height / 2;
        this.speedX = -this.speedX; // Invierte dirección del saque
    }
}

/** * Clase Paddle: Gestiona las paletas del jugador y la IA 
 */
class Paddle {
    constructor(x, y, width, height, color) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.color = color;
        this.speed = 8; // Velocidad de movimiento
    }

    // Dibuja la paleta con estilo rectangular
    draw() {
        ctx.fillStyle = this.color;
        ctx.shadowBlur = 15;
        ctx.shadowColor = this.color;
        ctx.fillRect(this.x, this.y, this.width, this.height);
        ctx.shadowBlur = 0; // Reset de sombra para no afectar otros dibujos
    }

    // Mueve la paleta asegurando que no se salga del canvas
    move(direction) {
        if (direction === 'up' && this.y > 0) {
            this.y -= this.speed;
        } else if (direction === 'down' && this.y + this.height < canvas.height) {
            this.y += this.speed;
        }
    }

    // Lógica simple para que la CPU siga a la pelota más cercana en el eje Y
    autoMove(balls) {
        if (balls.length === 0) return;
        // Encuentra la pelota que viene hacia la derecha (hacia la CPU)
        let targetBall = balls.reduce((prev, curr) => (curr.x > prev.x ? curr : prev));
        
        let center = this.y + this.height / 2;
        if (targetBall.y < center - 10) this.y -= this.speed - 2;
        if (targetBall.y > center + 10) this.y += this.speed - 2;
    }
}

/** * Clase Game: Motor principal del juego 
 */
class Game {
    constructor() {
        this.balls = [];
        this.playerScore = 0;
        this.cpuScore = 0;
        this.keys = {}; // Registro de teclas presionadas
        
        // Inicializar 5 pelotas con valores aleatorios
        this.initBalls(5);
        
        // Paleta Jugador: Altura 200 (doble de la estándar), color Verde Neón
        this.paddle1 = new Paddle(10, canvas.height/2 - 100, 15, 200, '#39FF14'); 
        // Paleta CPU: Altura 100, color Cian Neón
        this.paddle2 = new Paddle(canvas.width - 25, canvas.height/2 - 50, 15, 100, '#00F3FF'); 
    }

    // Genera pelotas con tamaños, velocidades y colores distintos
    initBalls(count) {
        const colors = ['#FF007F', '#FFD700', '#FF5733', '#BF00FF', '#FFFFFF'];
        for (let i = 0; i < count; i++) {
            let radius = Math.random() * 8 + 6; // Entre 6 y 14
            let speedX = (Math.random() * 3 + 3) * (Math.random() > 0.5 ? 1 : -1);
            let speedY = (Math.random() * 3 + 3) * (Math.random() > 0.5 ? 1 : -1);
            this.balls.push(new Ball(canvas.width/2, canvas.height/2, radius, speedX, speedY, colors[i]));
        }
    }

    // Dibuja el marcador en pantalla
    drawScore() {
        ctx.font = "bold 40px Courier New";
        ctx.fillStyle = "white";
        ctx.fillText(this.playerScore, canvas.width / 4, 50);
        ctx.fillText(this.cpuScore, (canvas.width / 4) * 3, 50);
    }

    // Dibuja todos los elementos en cada frame
    draw() {
        // Limpiar el fondo
        ctx.fillStyle = "#1a1a1a";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Línea central decorativa
        ctx.setLineDash([15, 15]);
        ctx.strokeStyle = "rgba(255,255,255,0.2)";
        ctx.beginPath();
        ctx.moveTo(canvas.width/2, 0);
        ctx.lineTo(canvas.width/2, canvas.height);
        ctx.stroke();
        ctx.setLineDash([]); // Reset de línea discontinua

        this.drawScore();
        this.balls.forEach(ball => ball.draw());
        this.paddle1.draw();
        this.paddle2.draw();
    }

    // Actualiza la lógica de movimiento y colisiones
    update() {
        // Movimiento de jugador
        if (this.keys['ArrowUp']) this.paddle1.move('up');
        if (this.keys['ArrowDown']) this.paddle1.move('down');

        // Movimiento de CPU
        this.paddle2.autoMove(this.balls);

        this.balls.forEach(ball => {
            ball.move();

            // Colisión con Paleta Jugador (Izquierda)
            if (ball.x - ball.radius <= this.paddle1.x + this.paddle1.width &&
                ball.y >= this.paddle1.y && ball.y <= this.paddle1.y + this.paddle1.height) {
                ball.speedX = Math.abs(ball.speedX) * 1.05; // Aumenta velocidad gradualmente
                ball.x = this.paddle1.x + this.paddle1.width + ball.radius; // Corregir posición
            }

            // Colisión con Paleta CPU (Derecha)
            if (ball.x + ball.radius >= this.paddle2.x &&
                ball.y >= this.paddle2.y && ball.y <= this.paddle2.y + this.paddle2.height) {
                ball.speedX = -Math.abs(ball.speedX) * 1.05;
                ball.x = this.paddle2.x - ball.radius;
            }

            // Detección de puntos
            if (ball.x - ball.radius <= 0) {
                this.cpuScore++; // Punto para CPU
                ball.reset();
            } else if (ball.x + ball.radius >= canvas.width) {
                this.playerScore++; // Punto para Jugador
                ball.reset();
            }
        });
    }

    // Configura los eventos de teclado
    handleInput() {
        window.addEventListener('keydown', (e) => {
            // Evita que las flechas muevan el scroll de la página
            if(["ArrowUp", "ArrowDown", " "].includes(e.key)) {
                e.preventDefault();
            }
            this.keys[e.key] = true;
        });

        window.addEventListener('keyup', (e) => {
            this.keys[e.key] = false;
        });
    }

    // Bucle principal del juego
    run() {
        this.handleInput();
        const loop = () => {
            this.update();
            this.draw();
            requestAnimationFrame(loop);
        };
        loop();
    }
}

// Iniciar el juego
const game = new Game();
game.run();