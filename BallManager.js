/**
 * BallManager.js - Ball Manager Class for Snooker Game
 * This class manages all balls in the game including creation,
 * positioning, physics, collision detection, and pocket handling
 */

class BallManager {
    // Constructor for BallManager class
    // Initializes ball arrays and ball colors
    constructor() {
        this.redBalls = [];
        this.coloredBalls = [];
        this.cueBall = null;
        
        // Ball colors (following the snooker color scheme)
        this.ballColors = {
            red: [200, 50, 50],
            yellow: [255, 255, 0],
            green: [0, 200, 0],
            brown: [139, 69, 19],
            blue: [0, 0, 255],
            pink: [255, 192, 203],
            black: [50, 50, 50],
            white: [255, 255, 255]
        };
        
        // Movement tracking
        this.ballsMoving = false;
        this.speedThreshold = 0.5; // Minimum speed to consider ball as moving
        
        // Game state tracking
        this.lastPottedBallType = "";
        this.consecutiveColoredBalls = 0;
        
        // Collision detection variables
        this.lastCollision = "";
        this.collisionMessage = "";
        this.collisionTimer = 0;
        
        // Initialize ball arrays
        this.initializeBalls();
    }
    
    // Create all ball objects with proper properties
    initializeBalls() {
        // Clear existing arrays
        this.redBalls = [];
        this.coloredBalls = [];
        
        // Create 15 red balls with physics bodies
        for (let i = 0; i < 15; i++) {
            let redBall = new Ball(`red_${i}`, this.ballColors.red, 1);
            this.redBalls.push(redBall);
        }
        
        // Create colored balls with their properties
        let colorData = [
            { name: 'yellow', value: 2 },
            { name: 'green', value: 3 },
            { name: 'brown', value: 4 },
            { name: 'blue', value: 5 },
            { name: 'pink', value: 6 },
            { name: 'black', value: 7 }
        ];

        colorData.forEach(data => {
            let coloredBall = new Ball(data.name, this.ballColors[data.name], data.value);
            this.coloredBalls.push(coloredBall);
        });
        
        // Create cue ball (positioned later by player)
        this.cueBall = new Ball('cue', this.ballColors.white, 0);
    }
    
    //Positions balls in starting formation (Mode 1)
    positionBallsStarting(table) {
        // Position red balls in triangular formation
        this.positionRedBallsTriangle(table);
        
        // Position colored balls on their designated spots
        this.coloredBalls.forEach(ball => {
            let spotPos = table.getBallSpotPosition(ball.id);
            if (spotPos) {
                ball.setPosition(spotPos.x, spotPos.y);
            }
        });
        this.createPhysicsBodies();// Create physics bodies after positioning
    }
    
    //Positions red balls in triangle formation
    positionRedBallsTriangle(table) {
        let trianglePositions = table.getRedBallTrianglePositions();
        
        this.redBalls.forEach((ball, index) => {
            if (index < trianglePositions.length) {
                ball.setPosition(trianglePositions[index].x, trianglePositions[index].y);
            }
        });
    }
    
    //Positions balls randomly (Mode 2 and 3)
    positionBallsRandom(table, includeColored = false) {
        // Random positions for red balls (avoiding pockets and D zone)
        this.redBalls.forEach(ball => {
            let randomPos = table.getRandomValidPosition();
            ball.setPosition(randomPos.x, randomPos.y);
        });
        
        // Random positions for colored balls (Mode 3)
        if (includeColored) {
            this.coloredBalls.forEach(ball => {
                let randomPos = table.getRandomValidPosition();
                ball.setPosition(randomPos.x, randomPos.y);
            });
        } else {
            // Keep colored balls in designated spots (Mode 2)
            this.coloredBalls.forEach(ball => {
                let spotPos = table.getBallSpotPosition(ball.id);
                if (spotPos) {
                    ball.setPosition(spotPos.x, spotPos.y);
                }
            });
        }
        this.createPhysicsBodies(); // Create physics bodies after positioning
    }
    
    // Create physics bodies for all positioned balls
    createPhysicsBodies() {
        this.resetPhysicsBalls();// Remove existing physics bodies first
        
        // Create physics bodies for red balls
        this.redBalls.forEach(ball => {
            ball.createPhysicsBody();
        });
        
        // Create physics bodies for colored balls
        this.coloredBalls.forEach(ball => {
            ball.createPhysicsBody();
        });
    }
    
    //Removes all physics bodies from the world (for mode switching)
    resetPhysicsBalls() {
        // Remove red ball physics bodies
        this.redBalls.forEach(ball => {
            ball.removePhysicsBody();
        });
        
        // Remove colored ball physics bodies
        this.coloredBalls.forEach(ball => {
            ball.removePhysicsBody();
        });
        
        // Reset cue ball completely so it needs to be placed again
        if (this.cueBall.body) {
            this.cueBall.removePhysicsBody();
        }
        this.cueBall.setPosition(0, 0);
    }
    
    //Places cue ball at specified position
    placeCueBall(x, y, table) {
        // Check that position is valid
        if (!table.isInDZone(x, y)) {
            return false;
        }
        
        this.cueBall.removePhysicsBody();// Remove existing cue ball if present
        
        // Set position and create physics body
        this.cueBall.setPosition(x, y);
        this.cueBall.createPhysicsBody();
        return true;
    }
    
    // Check if any balls are moving
    // Update ball movement state for game logic
    updateBallMovementState() {
        this.ballsMoving = false;
        
        // Check cue ball
        if (this.cueBall.body && this.cueBall.isMoving(this.speedThreshold)) {
            this.ballsMoving = true;
        }
        
        // Check red balls
        this.redBalls.forEach(ball => {
            if (ball.body && ball.isMoving(this.speedThreshold)) {
                this.ballsMoving = true;
            }
        });
        
        // Check colored balls
        this.coloredBalls.forEach(ball => {
            if (ball.body && ball.isMoving(this.speedThreshold)) {
                this.ballsMoving = true;
            }
        });
    }
    
    // Draw all balls on the canvas
    drawBalls() {
        // Draw red balls
        this.redBalls.forEach(ball => {
            ball.draw();
        });
        
        // Draw colored balls
        this.coloredBalls.forEach(ball => {
            ball.draw();
        });
        
        // Draw cue ball if positioned
        if (this.cueBall.body) {
            this.cueBall.draw();
        }
    }

    // Handle collisions between cue ball and other objects    
    handleCollisions(table) {
        if (!this.cueBall.body) return;
        
        // Check cue ball collisions with red balls
        this.redBalls.forEach((ball, index) => {
            if (ball.body && this.cueBall.isCollidingWith(ball)) {
                this.detectCollision("cue-red", index);
            }
        });
        
        // Check cue ball collisions with colored balls
        this.coloredBalls.forEach((ball, index) => {
            if (ball.body && this.cueBall.isCollidingWith(ball)) {
                this.detectCollision("cue-" + ball.id, index);
            }
        });
        
        // Check cue ball collision with cushions
        let cushionBodies = table.getCushionBodies();
        cushionBodies.forEach(cushion => {
            if (this.isCollidingWithCushion(this.cueBall.body, cushion, table)) {
                this.detectCollision("cue-cushion", 0);
            }
        }); }
    
    // Check if ball is colliding with cushion (table boundaries)
    isCollidingWithCushion(ballBody, cushionBody, table) {
        // Check if ball is too close to table edges
        let ballX = ballBody.position.x;
        let ballY = ballBody.position.y;
        let boundaries = table.getBoundaries();
        
        // Check if ball is within cushion boundaries 
        return (ballX - ballRadius <= boundaries.left || 
                ballX + ballRadius >= boundaries.right ||
                ballY - ballRadius <= boundaries.top || 
                ballY + ballRadius >= boundaries.bottom);
    }
    
    // Display collision messages with spam prevention
    detectCollision(type, ballIndex) {
        // Prevent spam by checking if same collision just happened
        if (this.lastCollision === type && this.collisionTimer > 30) {
            return;
        }
        console.log(`COLLISION DETECTED: ${type.toUpperCase()}`);
        
        this.lastCollision = type;
        this.collisionMessage = "Impact: " + type.toUpperCase();
        this.collisionTimer = 120; // Show message for 2 seconds at 60fps
    }
    
    // Check all balls for pocket entry and handle game logic
    checkBallsInPockets(table) {
        let pocketPositions = table.getPocketPositions();
        let pocketRadius = table.getPocketRadius();
        let gameEvents = {
            redPotted: false,
            coloredPotted: false,
            cueBallPotted: false,
            gameMessage: ""
        };
        
        // Check red balls 
        for (let i = this.redBalls.length - 1; i >= 0; i--) {
            let ball = this.redBalls[i];
            if (ball.body && ball.isInPocket(pocketPositions, pocketRadius)) {
                
                console.log("RED BALL POTTED - Removing from array and physics world");
                console.log(`Red balls remaining: ${this.redBalls.length - 1}`);
                
                // Remove from physics world and array
                ball.removePhysicsBody();
                this.redBalls.splice(i, 1);
                
                // Update game state
                this.lastPottedBallType = "red";
                this.consecutiveColoredBalls = 0; // Reset consecutive colored counter
                gameEvents.redPotted = true;
            }
        }
        
        // Check colored balls - re-spot when potted 
        this.coloredBalls.forEach(ball => {
            if (ball.body && ball.isInPocket(pocketPositions, pocketRadius)) {
                console.log(`COLORED BALL POTTED: ${ball.id.toUpperCase()}`);
                
                // Check for consecutive colored balls mistake
                if (this.lastPottedBallType !== "red") {
                    this.consecutiveColoredBalls++;
                    console.log(`Consecutive colored balls: ${this.consecutiveColoredBalls}`);
                    if (this.consecutiveColoredBalls >= 2) {
                        console.log("ERROR: Two consecutive colored balls potted!");
                        gameEvents.gameMessage = "MISTAKE: Two consecutive colored balls potted!";
                    }
                } else {
                    this.consecutiveColoredBalls = 1;
                }
                
                console.log(`Re-spotting ${ball.id} ball on designated spot`);
                // Re-spot the colored ball 
                this.respotColoredBall(ball, table);
                this.lastPottedBallType = "colored";
                gameEvents.coloredPotted = true;
            }
        });
        
        // Check cue ball - return to player 
        if (this.cueBall.body && this.cueBall.isInPocket(pocketPositions, pocketRadius)) {
            console.log("CUE BALL POTTED - Returning to player for D-zone placement");
            this.cueBall.removePhysicsBody();// Remove cue ball
            gameEvents.cueBallPotted = true;
            gameEvents.gameMessage = "Cue ball potted! Click in D zone to replace.";
        }  
        return gameEvents;
    }
    
    // Re-spot colored ball on its designated spot
    respotColoredBall(ball, table) {
        ball.removePhysicsBody();// Remove from current position
        
        // Get original spot position
        let spotPos = table.getBallSpotPosition(ball.id);
        if (spotPos) {
            let newX = spotPos.x;
            let newY = spotPos.y;
            
            // Check if spot is occupied by another ball
            if (this.isSpotOccupied(newX, newY)) {
                // Find alternative position nearby
                newX += random(-30, 30);
                newY += random(-30, 30);
            }
            
            // Set new position and create physics body
            ball.setPosition(newX, newY);
            ball.createPhysicsBody();
        } }
    
    // Check if a spot is occupied by any ball
    isSpotOccupied(x, y) {
        let checkRadius = ballRadius * 2.5;
        // Check against red balls
        for (let ball of this.redBalls) {
            if (ball.body && ball.isAtSpot(x, y, checkRadius)) {
                return true;
            }
        }
        // Check against colored balls
        for (let ball of this.coloredBalls) {
            if (ball.body && ball.isAtSpot(x, y, checkRadius)) {
                return true;
            } }
        
        // Check against cue ball
        if (this.cueBall.body && this.cueBall.isAtSpot(x, y, checkRadius)) {
            return true;
        }
        return false;
    }
    
    // Update collision message timer
    updateCollisionTimer() {
        if (this.collisionTimer > 0) {
            this.collisionTimer--;
        } }
    
    // Draw collision detection messages
    drawCollisionMessage() {
        if (this.collisionTimer > 0) {
            fill(255, 255, 0); 
            textAlign(CENTER);
            textSize(18);
            text(this.collisionMessage, width/2, 50);
        }
    }
    
    // Gets count of remaining red balls
    getRedBallCount() {
        return this.redBalls.length;
    }
    
    // Gets consecutive colored balls count
    getConsecutiveColoredBalls() {
        return this.consecutiveColoredBalls;
    }
    
    // Check if balls are currently moving
    areBallsMoving() {
        return this.ballsMoving;
    }

    // Gets cue ball object
    getCueBall() {
        return this.cueBall;
    }
    
    // Checks if cue ball is placed
    isCueBallPlaced() {
        return this.cueBall.body !== null;
    }
    
    // Gets all red balls
    getRedBalls() {
        return this.redBalls;
    }
    
    // Gets all colored balls
    getColoredBalls() {
        return this.coloredBalls;
    }
}