/**
 * BallTrailPrediction.js - Ball Trail Prediction System for Snooker Game
 * Extension Feature - Physics-based ball trajectory prediction system
 * Shows where the cue ball will travel and bounce before shooting
 */

class BallTrailPrediction {
    //Constructor for BallTrailPrediction class
    constructor() {
        // Prediction calculation parameters
        this.maxPredictionSteps = 300;// Maximum simulation steps
        this.predictionStepSize = 2;// Distance per step (smaller = more accurate)
        this.maxBounces = 5;// Maximum number of bounces to show
        this.speedThreshold = 0.3;// Minimum speed to continue prediction
        
        // Prediction results
        this.predictionTrail = [];// Array of predicted positions
        this.predictionBounces = 0;// Number of bounces in current prediction
        
        // Physics simulation parameters (matching ball physics)
        this.frictionCoefficient = 0.985; // Air resistance (per step)
        this.cushionRestitution = 0.75; // Energy loss on cushion bounce
        this.ballRadius = ballRadius; // Use global ball radius
        
        // Visual properties
        this.trailColors = [
            [255, 255, 0],// Yellow - first segment
            [0, 255, 255],// Cyan - after first bounce
            [255, 0, 255],// Magenta - after second bounce
            [255, 165, 0], // Orange - after third bounce
            [255, 255, 255]// White - further bounces
        ];
        
        // System state
        this.enabled = true;// Whether prediction is enabled
        this.visible = false;// Whether prediction is currently shown
    }
    
    // Calculate predicted ball trajectory
    calculatePrediction(cueBall, cue, table) {
        if (!this.enabled || !cueBall.body || !cue.isVisible()) {
            this.predictionTrail = [];
            return;
        }
        // Reset prediction data
        this.predictionTrail = [];
        this.predictionBounces = 0;
        
        // Get starting position and calculate initial velocity
        let cueBallPos = cueBall.getPosition();
        let startPos = createVector(cueBallPos.x, cueBallPos.y);
        
        // Calculate shooting direction (opposite to cue angle)
        let shootAngle = cue.angle + PI;
        
        // Calculate initial velocity based on cue power or default preview speed
        let speed;
        if (cue.isCharging()) {
            // Use current charging power
            let powerRatio = cue.getCurrentPower() / 100; // Convert to 0-1 ratio
            speed = map(powerRatio, 0, 1, 2, 12); // Scale to reasonable prediction speed
        } else {
            speed = 6;// Default preview speed for aiming
        }
        
        let velocity = createVector(cos(shootAngle) * speed, sin(shootAngle) * speed);
        let currentPos = startPos.copy();// Simulate ball movement step by step
        
        for (let step = 0; step < this.maxPredictionSteps && this.predictionBounces < this.maxBounces; step++) {
            velocity.mult(this.frictionCoefficient);// Apply air resistance
            
            // Calculate next position
            let nextPos = p5.Vector.add(currentPos, p5.Vector.mult(velocity, this.predictionStepSize));
            
            // Check for cushion collisions
            let collision = this.checkCushionCollision(currentPos, nextPos, table);
            if (collision.hit) {
                nextPos = collision.hitPoint;// Update to collision point
                velocity = this.reflectVelocity(velocity, collision.normal); // Reflect velocity
                velocity.mult(this.cushionRestitution);// Apply energy loss
                this.predictionBounces++;// Count bounce
            }

            // Add point to trail with bounce and speed info
            this.predictionTrail.push({
                x: nextPos.x,
                y: nextPos.y,
                bounce: this.predictionBounces,
                speed: velocity.mag()
            });
            
            currentPos = nextPos;// Update current position
            if (velocity.mag() < this.speedThreshold) break; // Stop if ball would be too slow
        }
    }
    
    // Check for collision with table cushions
    checkCushionCollision(currentPos, nextPos, table) {
        let boundaries = table.getBoundaries();
        let collision = {
            hit: false,
            hitPoint: nextPos.copy(),
            normal: createVector(0, 0)
        };
        
        // Boundaries for ball radius and cushion thickness
        let cushionThickness = 12; 
        let leftBound = boundaries.left + cushionThickness + this.ballRadius;
        let rightBound = boundaries.right - cushionThickness - this.ballRadius;
        let topBound = boundaries.top + cushionThickness + this.ballRadius;
        let bottomBound = boundaries.bottom - cushionThickness - this.ballRadius;
        
        // Check left cushion collision
        if (nextPos.x <= leftBound && currentPos.x > leftBound) {
            collision.hit = true;
            collision.hitPoint = createVector(leftBound, nextPos.y);
            collision.normal = createVector(1, 0); // Normal pointing right
        }
        // Check right cushion collision
        else if (nextPos.x >= rightBound && currentPos.x < rightBound) {
            collision.hit = true;
            collision.hitPoint = createVector(rightBound, nextPos.y);
            collision.normal = createVector(-1, 0); // Normal pointing left
        }
        // Check top cushion collision
        else if (nextPos.y <= topBound && currentPos.y > topBound) {
            collision.hit = true;
            collision.hitPoint = createVector(nextPos.x, topBound);
            collision.normal = createVector(0, 1); // Normal pointing down
        }
        // Check bottom cushion collision
        else if (nextPos.y >= bottomBound && currentPos.y < bottomBound) {
            collision.hit = true;
            collision.hitPoint = createVector(nextPos.x, bottomBound);
            collision.normal = createVector(0, -1); // Normal pointing up
        }
        return collision;
    }
    
    reflectVelocity(incident, normal) { // Reflect velocity vector off surface normal
        // Physics formula: reflected = incident - 2 * (incident · normal) * normal
        let dotProduct = p5.Vector.dot(incident, normal);
        let reflection = p5.Vector.sub(incident, p5.Vector.mult(normal, 2 * dotProduct));
        return reflection;
    }
    
    // Draw the prediction trail with different colors for bounce segments
    draw() {
        if (!this.enabled || !this.visible || this.predictionTrail.length < 2) {
            return;
        }
        
        // Draw trail segments
        for (let i = 0; i < this.predictionTrail.length - 1; i++) {
            let point = this.predictionTrail[i];
            let nextPoint = this.predictionTrail[i + 1];
            
            // Calculate alpha based on distance along trail
            let alpha = map(i, 0, this.predictionTrail.length, 200, 50);
            
            // Select color based on bounce count
            let colorIndex = Math.min(point.bounce, this.trailColors.length - 1);
            let color = this.trailColors[colorIndex];
            
            // Set stroke properties
            stroke(color[0], color[1], color[2], alpha);
            strokeWeight(2);
            
            // Draw dashed line effect (every 3rd segment for performance)
            if (i % 3 === 0) {
                line(point.x, point.y, nextPoint.x, nextPoint.y);
            }
        }     
        this.drawBouncePoints();// Draw small circles at bounce points
        noStroke();// Reset stroke settings
    }
    
    // Draw special markers at bounce points
    drawBouncePoints() {
        let lastBounce = -1;
        
        for (let i = 0; i < this.predictionTrail.length; i++) {
            let point = this.predictionTrail[i];
            
            // Draw marker when bounce count changes
            if (point.bounce > lastBounce) {
                fill(255, 100, 100, 150); // Semi-transparent red
                noStroke();
                circle(point.x, point.y, 8);// Small circle at bounce point
                lastBounce = point.bounce;
            }
        }
    }
    
    // State management methods
    show() { this.visible = true; }// Show prediction trail
    hide() { this.visible = false; }// Hide prediction trail
    enable() { this.enabled = true; }// Enable prediction calculations
    disable() { this.enabled = false; }// Disable prediction calculations
    
    toggle() { // Toggle prediction system on/off
        this.enabled = !this.enabled;
        if (!this.enabled) {
            this.hide();// Hide if disabled
        }
    }
    
    // Getter methods for system information
    isVisible() { return this.visible && this.enabled; }// Check if prediction is visible
    getBounceCount() { return this.predictionBounces; }// Get number of predicted bounces
    getTrailLength() { return this.predictionTrail.length; }// Get number of points in trail

    // Configuration methods
    setMaxBounces(maxBounces) { this.maxBounces = maxBounces; } // Set maximum bounces to predict
    setPredictionAccuracy(stepSize) {// Set prediction accuracy
        this.predictionStepSize = stepSize;// Lower stepSize = more accurate but slower
    }
}