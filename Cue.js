/**
 * Cue.js - Cue Class for Snooker Game
 * This class handles the cue stick mechanics including aiming,
 * power charging, visual feedback, and shooting functionality
 */

class Cue {
    constructor() {
        this.angle = 0;// Cue angle pointing direction
        this.length = 150;// Visual length of cue stick
        this.visible = false;// Whether cue is shown on screen
        this.power = 0; // Current power level (0-100)
        this.maxPower = 100;// Maximum power for charging
        this.charging = false;// Whether power is being charged
        this.maxSpeed = 20;// Maximum speed for cue ball
        
        // Visual colors
        this.woodColor = [139, 69, 19];           // Brown wood color
        this.tipColor = [255, 255, 255];          // White tip
        this.aimLineColor = [255, 255, 0, 150];   // Semi-transparent yellow
    }
    
    // Update cue angle based on mouse position 
    updateAngle(mouseX, mouseY, cueBall) {
        if (!cueBall.body) return;
        
        let cueBallPos = cueBall.getPosition();// Get cue ball position
        
        // Calculate angle from cue ball to mouse (cue points away from mouse)
        this.angle = atan2(mouseY - cueBallPos.y, mouseX - cueBallPos.x) + PI; // +PI to point away
    }
    
    // Start charging power for the shot
    startCharging() {
        if (this.visible) {
            this.charging = true;
            this.power = 0;
        }
    }

    // Update power while charging - gradually increases power up to maximum
    updatePower() {
        if (this.charging && this.power < this.maxPower) {
            this.power += 2; 
        }
    }
    
    // Stop charging and return final power level
    stopCharging() {
        this.charging = false;
        let finalPower = this.power;
        this.power = 0;
        return finalPower;
    }
    
    // Shoot the cue ball with calculated force
    shoot(cueBall, power) {
        if (!cueBall.body) return;
        
        // Calculate shooting direction (opposite to cue angle)
        let shootAngle = this.angle + PI; // Opposite direction
        
        // Calculate force based on power 
        let speed = map(power, 0, this.maxPower, 1, this.maxSpeed);
        
        let velocityX = cos(shootAngle) * speed;
        let velocityY = sin(shootAngle) * speed;
        
        cueBall.setVelocity(velocityX, velocityY);// Set velocity directly
        
        this.visible = false;// Hide cue temporarily after shooting
    }
    
    // Main drawing method for the cue
    draw(cueBall) {
        if (!this.visible || !cueBall.body) return;
        let cueBallPos = cueBall.getPosition();// Get cue ball position
        this.drawCueStick(cueBallPos.x, cueBallPos.y);// Draw cue stick
        
        // Draw aiming aids
        if (!this.charging) {
            this.drawAimingLine(cueBallPos.x, cueBallPos.y);// Show aiming line when not charging
        } else {
            this.drawChargingEffects(cueBallPos.x, cueBallPos.y);// Show power effects when charging
        }
    }
    
    // Draw the main cue stick
    drawCueStick(cueBallX, cueBallY) {
        // Position cue behind the ball (distance increases with power when charging)
        let cueDistance = 40 + (this.charging ? this.power * 0.8 : 0); // Pull back when charging
        let cueStartX = cueBallX + cos(this.angle) * cueDistance;
        let cueStartY = cueBallY + sin(this.angle) * cueDistance;
        
        // Calculate cue end position
        let cueEndX = cueStartX + cos(this.angle) * this.length;
        let cueEndY = cueStartY + sin(this.angle) * this.length;
        
        // Draw cue stick
        stroke(this.woodColor[0], this.woodColor[1], this.woodColor[2]); // Brown wood color
        strokeWeight(8);
        line(cueStartX, cueStartY, cueEndX, cueEndY);
        
        // Draw cue tip (closer to ball)
        fill(this.tipColor[0], this.tipColor[1], this.tipColor[2]); // White tip
        noStroke();
        circle(cueStartX, cueStartY, 6);
    }
    
    // Draws aiming line when not charging
    drawAimingLine(cueBallX, cueBallY) {
        stroke(this.aimLineColor[0], this.aimLineColor[1], this.aimLineColor[2], this.aimLineColor[3]); // Semi-transparent yellow
        strokeWeight(2);
        drawingContext.setLineDash([5, 5]); // Dashed line
        let aimEndX = cueBallX - cos(this.angle) * 150; // Point in shooting direction
        let aimEndY = cueBallY - sin(this.angle) * 150;
        line(cueBallX, cueBallY, aimEndX, aimEndY);
        drawingContext.setLineDash([]); // Reset to solid lines
    }
    
    // Draw charging effects including power meter and tip glow
    drawChargingEffects(cueBallX, cueBallY) {
        this.drawPowerMeter();// Draw power meter
        
        // Cue tip glow
        let cueDistance = 40 + (this.charging ? this.power * 0.8 : 0);
        let cueStartX = cueBallX + cos(this.angle) * cueDistance;
        let cueStartY = cueBallY + sin(this.angle) * cueDistance;
        
        fill(255, 255, 0, 150);
        noStroke();
        circle(cueStartX, cueStartY, 12 + this.power * 0.1);// Glow grows with power
    }
    
    // Draw power meter during charging
    drawPowerMeter() {
        // Power meter background
        fill(50);
        stroke(255);
        strokeWeight(2);
        rect(width - 220, 20, 200, 20);
        
        // Power meter fill
        let powerRatio = this.power / this.maxPower;
        fill(255 * powerRatio, 255 * (1 - powerRatio), 0); // Red to yellow gradient
        noStroke();
        rect(width - 218, 22, 196 * powerRatio, 16);
        
        // Power text
        fill(255);
        textAlign(RIGHT);
        textSize(14);
        text("Power: " + int(powerRatio * 100) + "%", width - 20, 60);
    }
    
    // State management methods
    show() { this.visible = true; } // Make cue visible
    hide() { this.visible = false; } // Hide cue
    isVisible() { return this.visible; } // Check if cue is visible
    isCharging() { return this.charging; } // Check if power is being charged
    getCurrentPower() { return this.power; } // Get current power level
    getPowerPercentage() { return (this.power / this.maxPower) * 100; } // Get power as percentage
    
    // Resets cue to initial state
    reset() {
        this.angle = 0;
        this.power = 0;
        this.charging = false;
        this.visible = false;
    }
    
    // Set maximum power limit
    setMaxPower(maxPower) {
        this.maxPower = maxPower;
    }
    
    // Sets maximum shooting speed
    setMaxSpeed(maxSpeed) {
        this.maxSpeed = maxSpeed;
    }
    
    // Calculate velocity for current power (used by prediction system)
    calculateVelocity() {
        let shootAngle = this.angle + PI;
        let speed = map(this.power, 0, this.maxPower, 1, this.maxSpeed);
        
        return {
            x: cos(shootAngle) * speed,
            y: sin(shootAngle) * speed
        };
    }
}