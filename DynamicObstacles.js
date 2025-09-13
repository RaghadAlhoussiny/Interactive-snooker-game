/**
 * DynamicObstacles.js - Dynamic Obstacle System for Snooker Game 
 * Extension Feature - Implements spinning obstacles that affect ball movement.
 */

class DynamicObstacles {
    // Constructor - Initializes obstacle system with timing and physics parameters
    constructor() {
        // Obstacle arrays and timing
        this.obstacles = []; // Array of active obstacles
        this.spawnTimer = 0; // Timer for spawning new obstacles
        this.spawnRate = 420; // 7 seconds between spawns 
        this.maxObstacles = 2; // Maximum obstacles at once
        
        // Obstacle lifecycle phases 
        this.warningTime = 120; // 2 seconds warning
        this.activeTime = 300; // 5 seconds active
        this.fadeTime = 60;// 1 second fade out
        
        // Obstacle physics properties
        this.interactionRadius = 60; // Radius of ball interaction
        this.emergencyRadius = 25;// Emergency teleport radius
        this.maxPushForce = 6; // Maximum velocity applied to balls
        this.minPushForce = 1.5;// Minimum velocity applied to balls
        
        // Visual properties 
        this.obstacleSize = { width: 20, height: 50 }; // Rectangle dimensions
        this.cornerRadius = 5; // rounded corners radius
        this.obstacleColor = [255, 100, 100]; // Red color
        
        this.enabled = true;// System state - Whether system is active
    }
    
    // Main update method 
    update(table, ballManager) {
        if (!this.enabled) return;

        this.spawnTimer++;// Update spawn timer
        
        // Spawn new obstacle if conditions are met
        if (this.spawnTimer >= this.spawnRate && 
            this.obstacles.length < this.maxObstacles &&
            !ballManager.areBallsMoving()) { // Only spawn when balls are still
            
            this.spawnRandomObstacle(table, ballManager);
            this.spawnTimer = 0;// Reset timer
        } 
        this.updateObstacles(table, ballManager);// Update all existing obstacles
    }
    
    // Spawn new obstacle at safe location
    spawnRandomObstacle(table, ballManager) { 
        let spawnPos = this.findSafeSpawnPosition(table, ballManager);
        
        if (!spawnPos) {
            console.log("No safe position found for obstacle spawn");
            return;// No safe position found
        }
        
        let obstacle = {
            // Position (stays fixed, only spins)
            x: spawnPos.x,
            y: spawnPos.y,
            
            // Lifecycle management
            age: 0, // Current age in frames
            maxAge: this.warningTime + this.activeTime + this.fadeTime,
            phase: 'warning',// warning -> active -> fading -> removed
            
            // Rotation properties 
            rotationAngle: 0,// Current rotation angle
            rotationSpeed: 0.08,// Spin speed in radians per frame
            
            // Physics properties
            body: null,// Matter.js body (created when active)
            active: false// Whether physics is active
        };
        this.obstacles.push(obstacle);
    }
    
    // Find safe position away from balls and pockets
    findSafeSpawnPosition(table, ballManager) {
        let boundaries = table.getBoundaries();
        let pocketPositions = table.getPocketPositions();
        let attempts = 0;
        let maxAttempts = 50;
        
        while (attempts < maxAttempts) {
            let x = random(boundaries.left + 80, boundaries.right - 80);
            let y = random(boundaries.top + 80, boundaries.bottom - 80);
            
            // Check distance from D zone
            if (table.isInDZone(x, y)) {
                attempts++;
                continue;
            }
            
            // Check distance from pockets
            let tooCloseToPockets = false;
            for (let pocket of pocketPositions) {
                if (dist(x, y, pocket.x, pocket.y) < 70) {
                    tooCloseToPockets = true;
                    break;
                }
            }
            if (tooCloseToPockets) {
                attempts++;
                continue;
            }
            
            // Check distance from balls
            let tooCloseToBalls = false;
            
            // Check cue ball
            let cueBall = ballManager.getCueBall();
            if (cueBall.body && dist(x, y, cueBall.body.position.x, cueBall.body.position.y) < 80) {
                tooCloseToBalls = true;
            }
            // Check red balls
            if (!tooCloseToBalls) {
                for (let ball of ballManager.getRedBalls()) {
                    if (ball.body && dist(x, y, ball.body.position.x, ball.body.position.y) < 80) {
                        tooCloseToBalls = true;
                        break;
                    }
                }
            }
            // Check colored balls
            if (!tooCloseToBalls) {
                for (let ball of ballManager.getColoredBalls()) {
                    if (ball.body && dist(x, y, ball.body.position.x, ball.body.position.y) < 80) {
                        tooCloseToBalls = true;
                        break;
                    }
                }
            }
            // Check existing obstacles
            if (!tooCloseToBalls) {
                for (let obstacle of this.obstacles) {
                    if (dist(x, y, obstacle.x, obstacle.y) < 100) {
                        tooCloseToBalls = true;
                        break;
                    }
                }
            }
            if (!tooCloseToBalls) {
                return { x: x, y: y };
            }
            attempts++;
        }
        
        return null; // No safe position found
    }
    
    // Update all obstacles - rotation, physics, lifecycle
    updateObstacles(table, ballManager) {
        for (let i = this.obstacles.length - 1; i >= 0; i--) {
            let obstacle = this.obstacles[i];
            obstacle.age++; // Increment age
            
            this.updateObstaclePhase(obstacle);// Handle phase transitions
            
            obstacle.rotationAngle += obstacle.rotationSpeed;// Update rotation (only movement)
            
            // Handle ball interactions (only during active phase)
            if (obstacle.phase === 'active') {
                this.handleBallInteractions(obstacle, ballManager);
            }
            // Remove expired obstacles
            if (obstacle.age > obstacle.maxAge) {
                this.removeObstacle(i);
            }
        }
    }
    
    // Update obstacle phase based on age
    updateObstaclePhase(obstacle) {
        if (obstacle.age <= this.warningTime) {
            obstacle.phase = 'warning';// Warning phase - showing countdown
            
        } else if (obstacle.age <= this.warningTime + this.activeTime) {
            if (obstacle.phase === 'warning') {
                console.log("Obstacle became ACTIVE - now affecting ball physics");
                this.activateObstacle(obstacle);// Transition to active - create physics body
            }
            obstacle.phase = 'active';// Active phase - affecting balls
            
        } else if (obstacle.age <= obstacle.maxAge) {
            if (obstacle.phase === 'active') {
                console.log("Obstacle fading out - removing physics body");
                this.deactivateObstacle(obstacle);// Transition to fading - remove physics body
            }
            obstacle.phase = 'fading';// Fading phase - disappearing
        }
    }
    
    // Create physics body when obstacle becomes active
    activateObstacle(obstacle) {
        obstacle.body = Bodies.rectangle(
            obstacle.x,
            obstacle.y,
            this.obstacleSize.width,
            this.obstacleSize.height,
            {
                isStatic: true,
                restitution: 1.0,
                friction: 0.01,
                frictionAir: 0,
                frictionStatic: 0,
                density: 0.001,
                label: 'dynamic_obstacle'
            }
        );
        World.add(engine.world, obstacle.body);
        obstacle.active = true;
    }
    
    // Remove physics body when obstacle starts fading
    deactivateObstacle(obstacle) {
        if (obstacle.body) {
            World.remove(engine.world, obstacle.body);
            obstacle.body = null;
        }
        obstacle.active = false;
    }
    
    // Handle ball interactions with active obstacle
    handleBallInteractions(obstacle, ballManager) {
        let allBalls = [];// Get all balls
        
        // Add cue ball if it exists
        let cueBall = ballManager.getCueBall();
        if (cueBall.body) allBalls.push(cueBall);
        
        // Add red balls
        ballManager.getRedBalls().forEach(ball => {
            if (ball.body) allBalls.push(ball);
        });
        
        // Add colored balls
        ballManager.getColoredBalls().forEach(ball => {
            if (ball.body) allBalls.push(ball);
        });
        
        // Apply forces to nearby balls
        allBalls.forEach(ball => {
            let distance = dist(
                obstacle.x, 
                obstacle.y,
                ball.body.position.x, 
                ball.body.position.y
            );
            
            // Push ball if within interaction radius
            if (distance < this.interactionRadius && distance > 5) {
                this.pushBallAway(ball, obstacle, distance);
            }
            
            // Emergency teleport if too close
            if (distance < this.emergencyRadius && distance > 0) {
                this.emergencyPushBall(ball, obstacle);
            }
        });
    }
    
    // Apply push force based on distance
    pushBallAway(ball, obstacle, distance) {
        // Calculate direction away from obstacle
        let pushAngle = atan2(
            ball.body.position.y - obstacle.y,
            ball.body.position.x - obstacle.x
        );
        pushAngle += sin(obstacle.rotationAngle * 2) * 0.2;// Add spinning influence
        // Calculate force magnitude
        let forceMagnitude = map(
            distance, 
            5, 
            this.interactionRadius, 
            this.maxPushForce, 
            this.minPushForce
        );
        
        // Calculate velocity components
        let velocityX = cos(pushAngle) * forceMagnitude;
        let velocityY = sin(pushAngle) * forceMagnitude;
        
        // Get current velocity and add the push
        let currentVel = ball.getVelocity();
        let newVelX = currentVel.x + velocityX * 0.3;
        let newVelY = currentVel.y + velocityY * 0.3;
        
        // Limit maximum velocity
        let maxVel = 10;
        let currentSpeed = Math.sqrt(newVelX * newVelX + newVelY * newVelY);
        if (currentSpeed > maxVel) {
            newVelX = (newVelX / currentSpeed) * maxVel;
            newVelY = (newVelY / currentSpeed) * maxVel;
        }
        
        // Apply the velocity
        ball.setVelocity(newVelX, newVelY);
    }
    
    // Emergency teleport for balls too close
    emergencyPushBall(ball, obstacle) { 
        let escapeAngle = atan2(
            ball.body.position.y - obstacle.y,
            ball.body.position.x - obstacle.x
        );
        let escapeDistance = 40;// Safe distance
        let newX = obstacle.x + cos(escapeAngle) * escapeDistance;
        let newY = obstacle.y + sin(escapeAngle) * escapeDistance;
        
        ball.setPosition(newX, newY);// Teleport ball to safe position
        ball.setVelocity(cos(escapeAngle) * 3, sin(escapeAngle) * 3);// Small velocity away
    }
    
    // Remove obstacle at specified index
    removeObstacle(index) {
        let obstacle = this.obstacles[index];
        // Remove physics body if it exists
        if (obstacle.body) {
            World.remove(engine.world, obstacle.body);
        }
        this.obstacles.splice(index, 1);// Remove from array
    }
    
    // Main drawing method for all obstacles
    draw() {
        if (!this.enabled) return;
        this.obstacles.forEach(obstacle => {
            this.drawObstacle(obstacle);
        });
    }
    
    // Draw individual obstacle with phase-appropriate effects
    drawObstacle(obstacle) {
        push();
        translate(obstacle.x, obstacle.y);
        
        // Apply rotation for spinning effect
        rotate(obstacle.rotationAngle);
        
        if (obstacle.phase === 'warning') {
            this.drawWarningPhase(obstacle);
        } else if (obstacle.phase === 'active') {
            this.drawActivePhase(obstacle);
        } else if (obstacle.phase === 'fading') {
            this.drawFadingPhase(obstacle);
        }
        pop();
    }
    
  // Draw obstacle during warning phase with countdown
  drawWarningPhase(obstacle) { 
        let pulseAlpha = map(sin(obstacle.age * 0.4), -1, 1, 100, 255); // Pulsing effect
        
        // Warning circle
        noFill();
        stroke(255, 255, 0, pulseAlpha); 
        strokeWeight(3);
        circle(0, 0, 60);
        
        // Countdown timer
        let countdown = Math.ceil((this.warningTime - obstacle.age) / 60);
        fill(255, 0, 0, pulseAlpha);  
        noStroke();
        textAlign(CENTER, CENTER);
        textSize(20);
        text(countdown, 0, 0);
        
        // Preview of obstacle shape
        fill(this.obstacleColor[0], this.obstacleColor[1], this.obstacleColor[2], pulseAlpha * 0.5);
        stroke(255, 255, 255, pulseAlpha);
        strokeWeight(2);
        rect(0, 0, this.obstacleSize.width, this.obstacleSize.height, this.cornerRadius);
    }
    
    // Draw obstacle during active phase
    drawActivePhase(obstacle) {
        // Main obstacle body
        fill(this.obstacleColor[0], this.obstacleColor[1], this.obstacleColor[2]);
        stroke(255, 255, 255);
        strokeWeight(3);
        rect(0, 0, this.obstacleSize.width, this.obstacleSize.height, this.cornerRadius);
        
        // center dot to show rotation
        fill(255, 255, 255);
        noStroke();
        circle(0, 0, 6);
        
        // interaction radius indicator
        noFill();
        stroke(255, 255, 255, 80);
        strokeWeight(1);
        circle(0, 0, this.interactionRadius);
    }
    
    // Draw obstacle during fading phase with decreasing alpha
    drawFadingPhase(obstacle) {
        let fadeProgress = (obstacle.age - this.warningTime - this.activeTime) / this.fadeTime;
        let alpha = map(fadeProgress, 0, 1, 255, 0);
        // Fading obstacle
        fill(this.obstacleColor[0], this.obstacleColor[1], this.obstacleColor[2], alpha);
        stroke(255, 255, 255, alpha);
        strokeWeight(2);
        rect(0, 0, this.obstacleSize.width, this.obstacleSize.height, this.cornerRadius);
    }
    
    // System control methods
    enable() { // Enable obstacle system
        this.enabled = true;
    }
    
    disable() { // Disable system and remove all obstacles
        this.enabled = false;
        
        while (this.obstacles.length > 0) {// Remove all existing obstacles
            this.removeObstacle(0);
        }
    }
    
    toggle() { // Toggle obstacle system on/off
        if (this.enabled) {
            this.disable();
        } else {
            this.enable();
        }
    }
    
    // Getter methods for game information
    getObstacleCount() { return this.obstacles.length; }// Get current obstacle count
    isEnabled() { return this.enabled; }// Check if system is enabled
}