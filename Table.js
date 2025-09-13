/**
 * Table.js - Table Class for Snooker Game
 * This class handles the snooker table rendering, cushions, pockets,
 * and table-related calculations.
 */

class Table {
    //Constructor for Table class
    constructor() {
        // Table dimensions maintaining 2:1 ratio
        this.length = 1000;// Table length in pixels
        this.width = 500;// Table width in pixels (length/2)
        this.cushionThickness = 12;// Cushion thickness for physics and visuals
        
        // Calculate table position (centered in canvas)
        this.x = (width - this.length) / 2;
        this.y = (height - this.width) / 2;
        
        // Ball properties 
        this.ballDiameter = this.width / 36; 
        this.ballRadius = this.ballDiameter / 2;
        
        this.pocketRadius = this.ballDiameter * 1.5;// Pocket properties 
        this.cushionBodies = [];// Cushion physics bodies
        this.pocketPositions = [];// Pocket positions array
        
        // Ball spot positions (colored ball designated spots)
        this.ballPositions = {
            brown: { x: 0.25, y: 0.5 },// Center of D
            green: { x: 0.25, y: 0.35 }, // Upper D zone
            yellow: { x: 0.25, y: 0.65 },// lower D zone
            blue: { x: 0.5, y: 0.5 },// Center of table
            pink: { x: 0.735, y: 0.5 },// left of the triangle
            black: { x: 0.88, y: 0.5 } // Near right end
        };
        
        this.initializePockets();// Create pocket positions
        this.createCushions();// Create physics cushions
    }
    
    // Create cushion physics bodies with proper alignment
    createCushions() {
        // Top cushion - INSIDE table boundary, shortened to avoid corner pockets
        let topCushion = Bodies.rectangle(
            this.x + this.length/2, 
            this.y + this.cushionThickness/3, 
            this.length - this.pocketRadius * 2, 
            this.cushionThickness, 
            { 
                isStatic: true, 
                restitution: 0.95, 
                friction: 0.1,
                frictionStatic: 0.1,
                label: 'cushion'
            }
        );
        
        // Bottom cushion - INSIDE table boundary, shortened to avoid corner pockets
        let bottomCushion = Bodies.rectangle(
            this.x + this.length/2, 
            this.y + this.width - this.cushionThickness/2, 
            this.length - this.pocketRadius * 2, 
            this.cushionThickness, 
            { 
                isStatic: true, 
                restitution: 0.95, 
                friction: 0.1,
                frictionStatic: 0.1,
                label: 'cushion'
            }
        );
        
        // Left cushion - INSIDE table boundary, shortened to avoid corner pockets
        let leftCushion = Bodies.rectangle(
            this.x + this.cushionThickness/2, 
            this.y + this.width/2, 
            this.cushionThickness, 
            this.width - this.pocketRadius * 2,
            { 
                isStatic: true, 
                restitution: 0.95, 
                friction: 0.1,
                frictionStatic: 0.1,
                label: 'cushion'
            }
        );
        
        // Right cushion - INSIDE table boundary, shortened to avoid corner pockets
        let rightCushion = Bodies.rectangle(
            this.x + this.length - this.cushionThickness/2, 
            this.y + this.width/2, 
            this.cushionThickness, 
            this.width - this.pocketRadius * 2,
            { 
                isStatic: true, 
                restitution: 0.95, 
                friction: 0.1,
                frictionStatic: 0.1,
                label: 'cushion'
            }
        );
        
        this.cushionBodies = [topCushion, bottomCushion, leftCushion, rightCushion];
        World.add(engine.world, this.cushionBodies);// Add to physics world
    }
    
    // Initialize pocket positions and create physics sensors
    initializePockets() {
        this.pocketPositions = [
            // Corner pockets - move inward diagonally, middle pockets - move inward vertically only
            { x: this.x + this.pocketRadius * 0.5, y: this.y + this.pocketRadius * 0.5, name: "top-left" },
            { x: this.x + this.length - this.pocketRadius * 0.5, y: this.y + this.pocketRadius * 0.5, name: "top-right" },
            { x: this.x + this.pocketRadius * 0.5, y: this.y + this.width - this.pocketRadius * 0.5, name: "bottom-left" },
            { x: this.x + this.length - this.pocketRadius * 0.5, y: this.y + this.width - this.pocketRadius * 0.5, name: "bottom-right" },
            { x: this.x + this.length / 2, y: this.y + this.pocketRadius * 0.5, name: "top-middle" },
            { x: this.x + this.length / 2, y: this.y + this.width - this.pocketRadius * 0.5, name: "bottom-middle" }
        ];
        
        // Add physics sensors to world for pocket detection
        this.pocketPositions.forEach(pocket => {
            let sensor = Bodies.circle(pocket.x, pocket.y, this.pocketRadius * 0.75, {
                isSensor: true,
                isStatic: true,
                label: 'pocket'
            });
            World.add(engine.world, sensor);
        });
    }
    
    // Main drawing method for the table
    draw() { 
        this.drawTableSurface();// Draw playing surface
        this.drawCushions();// Draw cushions around edges
        this.drawPockets();// Draw six pockets
        this.drawTableLines();// Draw baulk line, D area, and spots
    }
    
    // Draw the main table playing surface
     drawTableSurface() { 
        fill(34, 139, 34);// Forest green felt
        stroke(139, 69, 19);// Brown border
        strokeWeight(this.cushionThickness);
        rect(this.x, this.y, this.length, this.width);
    }
    
    // Draw the cushions around the table
    drawCushions() {
        fill(139, 69, 19);
        noStroke();
        
        // Top cushion
        rect(this.x - this.cushionThickness, this.y - this.cushionThickness, 
             this.length + 2 * this.cushionThickness, this.cushionThickness);
        
        // Bottom cushion
        rect(this.x - this.cushionThickness, this.y + this.width, 
             this.length + 2 * this.cushionThickness, this.cushionThickness);
        
        // Left cushion
        rect(this.x - this.cushionThickness, this.y - this.cushionThickness, 
             this.cushionThickness, this.width + 2 * this.cushionThickness);
        
        // Right cushion
        rect(this.x + this.length, this.y - this.cushionThickness, 
             this.cushionThickness, this.width + 2 * this.cushionThickness);
    }
    
    // Draw all six pockets with visual enhancement
    drawPockets() {
        // First draw the transparent green circles around pockets for visual effect 
        fill(0, 255, 0, 50); // Transparent green
        noStroke();
        this.pocketPositions.forEach(pocket => {
            circle(pocket.x, pocket.y, this.pocketRadius * 1.5);
        });
        // Then draw the actual black pockets on top
        fill(0); // Black pockets
        this.pocketPositions.forEach(pocket => {
            circle(pocket.x, pocket.y, this.pocketRadius);
        });
    }
    
    // Draw table lines including baulk line, D area, and spot markers
    drawTableLines() {
        stroke(255); // White lines
        strokeWeight(2);
        
        // Baulk line (1/4 from left)
        let baulkX = this.x + this.length * 0.25;
        line(baulkX, this.y, baulkX, this.y + this.width);
        
        // The "D" semicircle for cue ball placement
        noFill();
        let dRadius = 80;
        arc(baulkX, this.y + this.width/2, dRadius * 2, dRadius * 2, PI/2, 3*PI/2);
        
        // Spot markers for colored balls
        fill(255);
        noStroke();
        Object.keys(this.ballPositions).forEach(colorName => {
            let pos = this.ballPositions[colorName];
            let spotX = this.x + this.length * pos.x;
            let spotY = this.y + this.width * pos.y;
            circle(spotX, spotY, 4);
        });
    }
    
    // Highlight D zone when cue ball needs placement
    drawDZoneHighlight(cueBallPlaced) {
        if (!cueBallPlaced) {
            fill(255, 255, 0, 50); // Semi-transparent yellow highlight
            let baulkX = this.x + this.length * 0.25;
            let dRadius = 80;
            arc(baulkX, this.y + this.width/2, dRadius * 2, dRadius * 2, PI/2, 3*PI/2);
        }
    }
    
    // Check if position is within the D zone
    isInDZone(x, y) {
        let baulkX = this.x + this.length * 0.25;
        let dRadius = 80;
        let distanceFromCenter = dist(x, y, baulkX, this.y + this.width/2);
        // Must be behind baulk line and within D radius
        return (x <= baulkX && distanceFromCenter <= dRadius);
    }
    
    // Check if ball position is valid (not in D area, not near pockets)
    isValidBallPosition(x, y) {
        let baulkX = this.x + this.length * 0.25;
        let dRadius = 80;
        let distanceFromD = dist(x, y, baulkX, this.y + this.width/2);
        if (x < baulkX && distanceFromD < dRadius) {
            return false; // Inside D zone - invalid
        }
        // Check if position is not too close to pockets
        for (let pocket of this.pocketPositions) {
            if (dist(x, y, pocket.x, pocket.y) < 40) {
                return false; // Too close to pocket - invalid
            }
        }
        return true;// Valid position
    }
    
    // Get the absolute position for a colored ball spot
    getBallSpotPosition(ballColor) {
        let pos = this.ballPositions[ballColor];
        if (pos) {
            return {
                x: this.x + this.length * pos.x,
                y: this.y + this.width * pos.y
            };
        }
        return null; // Color not found
    }
    
    // Get red ball triangle formation positions
    getRedBallTrianglePositions() {
        let positions = [];
        // Triangle formation for red balls (following snooker rules)
        let triangleStartX = this.x + this.length * 0.75;
        let triangleStartY = this.y + this.width * 0.5;
        let ballIndex = 0;
        let rows = 5; // Standard snooker triangle has 5 rows
        
        for (let row = 0; row < rows; row++) {
            let ballsInRow = row + 1;
            let rowStartY = triangleStartY - (ballsInRow - 1) * this.ballRadius;
            
            for (let col = 0; col < ballsInRow; col++) {
                if (ballIndex < 15) {
                    positions.push({
                        x: triangleStartX + row * this.ballDiameter * 0.87, 
                        y: rowStartY + col * this.ballDiameter
                    });
                    ballIndex++;
                }
            }
        }
        return positions;
    }
    
    // Generate random valid position for ball placement
    getRandomValidPosition() {
        let validPosition = false;
        let attempts = 0;
        let x, y;
        
        while (!validPosition && attempts < 100) {  // Try up to 100 times
            x = random(this.x + this.ballRadius + 50, this.x + this.length - this.ballRadius - 50);
            y = random(this.y + this.ballRadius + 50, this.y + this.width - this.ballRadius - 50);
            
            if (this.isValidBallPosition(x, y)) {
                validPosition = true;
            }
            attempts++;
        }
        
        return {x: x, y: y};
    }
    
    // Get table boundaries for collision detection
    getBoundaries() {
        return {
            left: this.x,
            right: this.x + this.length,
            top: this.y,
            bottom: this.y + this.width
        };
    }
    
    // Getter methods for physics and game logic
    getCushionBodies() { return this.cushionBodies; }// Get cushion bodies for collision
    getPocketPositions() { return this.pocketPositions; }// Get pocket positions for detection
    getPocketRadius() { return this.pocketRadius; }// Get pocket radius for detection
}