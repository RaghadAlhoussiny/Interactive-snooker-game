/**
 * Ball.js - Ball Class for Snooker Game
 * This class handles individual ball objects with their properties,
 * physics bodies, and rendering methods following OOP principles.
 */

class Ball {
    // Create a new ball with specified properties
    constructor(id, color, value, x = 0, y = 0) {
        this.id = id;
        this.color = color;
        this.value = value;
        this.x = x;
        this.y = y;
        this.body = null; // Matter.js physics body
        this.radius = ballRadius; // Global radius from sketch.js
        this.diameter = ballDiameter; // Global diameter from sketch.js
    }
    
    // Create Matter.js physics body for the ball
    createPhysicsBody() {
        if (this.x > 0 && this.y > 0 && !this.body) {
            this.body = Bodies.circle(this.x, this.y, this.radius, {
                restitution: 0.8,        // Bounce factor
                friction: 0.25,          // Surface friction
                frictionAir: 0.015,      // Air resistance
                frictionStatic: 0.2,     // Static friction
                density: 0.002,          // Ball density
                inertia: Infinity        // Prevent rotation
            });
            
            World.add(engine.world, this.body);
        }
    }
    
    // Removes physics body from the world
    removePhysicsBody() {
        if (this.body) {
            console.log(`Removing physics body for ${this.id} ball`);
            World.remove(engine.world, this.body);
            this.body = null;
        }
    }
    
    // Set new position for the ball
    setPosition(x, y) {
        this.x = x;
        this.y = y;
        
        if (this.body) {
            Body.setPosition(this.body, {x: x, y: y});
        }
    }
    
    // Get current position of the ball
    getPosition() {
        if (this.body) {
            return {
                x: this.body.position.x,
                y: this.body.position.y
            };
        }
        return {x: this.x, y: this.y};
    }
    
    // Get current velocity of the ball
    getVelocity() {
        if (this.body) {
            return {
                x: this.body.velocity.x,
                y: this.body.velocity.y
            };
        }
        return {x: 0, y: 0};
    }
    
    // Gets speed magnitude of the ball
    getSpeed() {
        if (this.body) {
            let velocity = this.getVelocity();
            return Math.sqrt(velocity.x**2 + velocity.y**2);
        }
        return 0;
    }
    
    // Check if ball is moving above threshold
    isMoving(threshold = 0.5) {
        return this.getSpeed() > threshold;
    }
    
    // Set velocity for the ball (used for cue ball shooting)
    setVelocity(velocityX, velocityY) {
        if (this.body) {
            Body.setVelocity(this.body, {x: velocityX, y: velocityY});
        }
    }
    
    // Check if ball is within pocket radius of any pocket
    isInPocket(pocketPositions, pocketRadius) {
        if (!this.body) return false;
        
        let position = this.getPosition();
        for (let pocket of pocketPositions) {
            let distance = dist(position.x, position.y, pocket.x, pocket.y);
            if (distance < pocketRadius) {
                return true;
            }
        }
        return false;
    }
    
    // Check collision with another ball
    isCollidingWith(otherBall) {
        if (!this.body || !otherBall.body) return false;
        
        let pos1 = this.getPosition();
        let pos2 = otherBall.getPosition();
        let distance = dist(pos1.x, pos1.y, pos2.x, pos2.y);
        
        return distance < (this.radius * 2 + 2);
    }
    
    // Draw the ball on canvas
    draw() {
        let position = this.getPosition();
        
        if (position.x > 0 && position.y > 0) {
            fill(this.color[0], this.color[1], this.color[2]);
            stroke(0);
            strokeWeight(this.id === 'cue' ? 2 : 1);
            circle(position.x, position.y, this.diameter);
        }
    }
    
    // Checks if ball is at a specific spot (used for re-spotting)
    isAtSpot(spotX, spotY, tolerance = null) {
        if (!tolerance) tolerance = this.radius * 2.5;
        
        let position = this.getPosition();
        return dist(position.x, position.y, spotX, spotY) < tolerance;
    }
    
    // Reset ball to remove physics body and clear position
    reset() {
        this.removePhysicsBody();
        this.x = 0;
        this.y = 0;
    }
    
    // Get ball type for game logic
    getType() {
        if (this.id === 'cue') return 'cue'; // white ball
        if (this.id.startsWith('red_')) return 'red'; // red balls
        return 'colored'; // colored balls
    }
}