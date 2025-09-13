/**
 * GameManager.js - Game Manager Class for Snooker Game
 * This class manages overall game state, user interface,
 * game modes, input handling, and coordinates all game components
 */

class GameManager {
    // Constructor for GameManager class - Initialize game state and creates component instances
    constructor() {
        // Game state management
        this.gameState = "PLACE_CUE_BALL"; // States: PLACE_CUE_BALL, AIMING, READY_TO_SHOOT, BALL_MOVING
        this.displayMode = 1; // 1 = starting positions, 2 = random reds, 3 = random all
        this.cueBallPlaced = false; // Whether cue ball has been placed by player
        
        // Game components (initialized in setup)
        this.table = null;
        this.ballManager = null;
        this.cue = null;
        this.ballPrediction = null; 
        this.dynamicObstacles = null; 
        
        // Game message system
        this.gameMessage = "";
        this.gameMessageTimer = 0;
        this.canvas = null;
    }
    
    // Initialize the game - called from setup()
    initialize() {
        this.canvas = createCanvas(1200, 600);// Create canvas
        
        // Create physics engine with NO GRAVITY 
        engine = Engine.create();
        engine.world.gravity.y = 0; 
        engine.world.gravity.x = 0;
        
        // Initialize game components
        this.table = new Table();
        this.ballManager = new BallManager();
        this.cue = new Cue();
        this.ballPrediction = new BallTrailPrediction(); 
        this.dynamicObstacles = new DynamicObstacles(); 
        
        this.ballManager.positionBallsStarting(this.table);// Set initial ball positions
    }
    
    // Main update loop - called from draw()
    update() {
        Engine.update(engine);                              // Update physics
        this.ballManager.updateBallMovementState();         // Update ball movement state
        this.ballManager.handleCollisions(this.table);      // Handle collision detection
        this.ballManager.updateCollisionTimer();            // Update collision message timer
        this.handlePocketEvents();                          // Check for balls in pockets
        
        // Update cue power if charging and balls aren't moving
        if (this.cue.isCharging() && !this.ballManager.areBallsMoving()) {
            this.cue.updatePower();
        }
        
        // Update cue angle based on mouse position
        if (this.cueBallPlaced && this.ballManager.getCueBall().body) {
            this.cue.updateAngle(mouseX, mouseY, this.ballManager.getCueBall());
        }
        
        this.updateBallPrediction();// Update ball trail prediction
        this.dynamicObstacles.update(this.table, this.ballManager);// Update dynamic obstacles
        this.handleCueVisibility();// Auto-show cue when ball stops moving
        this.updateGameMessageTimer();// Update game message timer
    }
    
    // Update ball trail prediction system
    updateBallPrediction() {
        // Only update prediction when cue ball is placed, cue is visible, and balls aren't moving
        if (this.cueBallPlaced && 
            this.cue.isVisible() && 
            !this.ballManager.areBallsMoving() &&
            this.ballManager.getCueBall().body) {
            
            // Calculate prediction trail
            this.ballPrediction.calculatePrediction(
                this.ballManager.getCueBall(), 
                this.cue, 
                this.table
            );
            
            // Show prediction if enabled
            if (this.ballPrediction.enabled) {
                this.ballPrediction.show();
            }
        } else {
            // Hide prediction when not applicable
            this.ballPrediction.hide();
        }
    }
    
    // Main render loop - called from draw()
    render() {
        background(40, 80, 40); // Dark green background
        
        // Draw table with D zone highlight
        this.table.draw();
        this.table.drawDZoneHighlight(this.cueBallPlaced);
        
        // Draw balls based on current mode
        if (this.displayMode > 0) {
            this.ballManager.drawBalls();
        }
        
        this.renderCue();// Draw cue if conditions are met
        this.ballPrediction.draw();// Draw ball trail prediction 
        this.dynamicObstacles.draw();// Draw dynamic obstacles 
        this.drawUI();// Draw user interface
        this.ballManager.drawCollisionMessage();// Draw collision messages
        this.drawGameMessages();// Draw game messages
    }
    
    // Renders cue if appropriate conditions are met
    // Draw cue only if visible, cue ball placed, and balls not moving
    renderCue() {
        let cueBall = this.ballManager.getCueBall();
        if (this.cue.isVisible() && 
            this.cueBallPlaced && 
            cueBall.body && 
            !this.ballManager.areBallsMoving()) {
            this.cue.draw(cueBall);
        }
    }
    
    // Handle pocket events and update game state 
    handlePocketEvents() {
        let pocketEvents = this.ballManager.checkBallsInPockets(this.table);
        
        // Handle cue ball potted
        if (pocketEvents.cueBallPotted) {
            this.cueBallPlaced = false;
            this.gameState = "PLACE_CUE_BALL";
            this.cue.hide();
            this.ballPrediction.hide(); // Hide prediction when cue ball potted
        }
        
        // Show game messages if any
        if (pocketEvents.gameMessage) {
            this.showGameMessage(pocketEvents.gameMessage);
        }
    }
    
    // Handle cue visibility based on game state
    handleCueVisibility() {
        if (this.cueBallPlaced && 
            this.ballManager.getCueBall().body && 
            !this.cue.isVisible() && 
            !this.ballManager.areBallsMoving()) {
            this.cue.show();
            this.gameState = "AIMING";
        }
    }
    
    // Handles mouse press events
    handleMousePressed() { // Handle mouse press events
        if (this.gameState === "PLACE_CUE_BALL") {
            if (this.table.isInDZone(mouseX, mouseY)) {       // Check if click is in D zone
                if (this.ballManager.placeCueBall(mouseX, mouseY, this.table)) {
                    console.log("CUE BALL PLACED in D-zone at position:", mouseX.toFixed(1), mouseY.toFixed(1));
                    this.cueBallPlaced = true;
                    this.gameState = "AIMING";
                    this.cue.show();
            }
        } else {
            console.log("Invalid placement - Cue ball must be placed in D-zone");
            }
        }
    }
    
    // Handle key press events
    handleKeyPressed() { 
        switch(key) {
            case '1': this.setDisplayMode(1); break;// Starting positions
            case '2': this.setDisplayMode(2); break;// Random red positions
            case '3': this.setDisplayMode(3); break;// Random all positions
                
            case ' ': // Spacebar for cue power - only when balls not moving
                if (this.gameState === "AIMING" && 
                    this.cueBallPlaced && 
                    !this.ballManager.areBallsMoving()) {
                    console.log("CHARGING CUE POWER...");
                    this.cue.startCharging();
                    this.gameState = "READY_TO_SHOOT";
                }
                break;
                
            case 'p': case 'P': // Toggle ball trail prediction
                this.ballPrediction.toggle();
                if (this.ballPrediction.enabled) {
                    console.log("EXTENSION: Ball trail prediction ENABLED");
                    this.showGameMessage("Ball trail prediction enabled");
                } else {
                    console.log("EXTENSION: Ball trail prediction DISABLED");
                    this.showGameMessage("Ball trail prediction disabled");
                }
                break;
                
            case 'o': case 'O': // Toggle dynamic obstacles
                this.dynamicObstacles.toggle();
                if (this.dynamicObstacles.isEnabled()) {
                    console.log("EXTENSION: Dynamic obstacles ENABLED");
                    this.showGameMessage("Dynamic obstacles enabled");
                } else {
                    console.log("EXTENSION: Dynamic obstacles DISABLED");
                    this.showGameMessage("Dynamic obstacles disabled");
                }
                break;
        }
    }
    
    // Handle key release events
    handleKeyReleased() {
        if (key === ' ' && 
            this.gameState === "READY_TO_SHOOT" && 
            !this.ballManager.areBallsMoving()) {
            // Release cue - shoot cue ball
            let power = this.cue.stopCharging();
            console.log(`SHOOTING cue ball with power: ${power.toFixed(1)}%`);
            this.cue.shoot(this.ballManager.getCueBall(), power);
            this.gameState = "BALL_MOVING"; // Set to moving state immediately
            this.ballPrediction.hide(); // Hide prediction during ball movement
        }
    }
    
    // Set display mode and reposition balls
    setDisplayMode(mode) { 
        console.log(`=== SWITCHING TO MODE ${mode} ===`);
        this.displayMode = mode;
        
        // Reset all game state when changing modes
        this.ballManager.resetPhysicsBalls();
        this.cueBallPlaced = false;
        this.gameState = "PLACE_CUE_BALL";
        this.cue.hide();
        this.cue.reset();
        this.ballPrediction.hide(); 
        
        switch(mode) {
            case 1: // Starting positions
                console.log("Mode 1: All balls in starting positions");
                this.ballManager.positionBallsStarting(this.table);
                break;
            case 2: // Random red positions only
                console.log("Mode 2: Random red ball positions, colored balls on spots");
                this.ballManager.positionBallsRandom(this.table, false);
                break;
            case 3: // Random all positions
                console.log("Mode 3: All balls in random positions");
                this.ballManager.positionBallsRandom(this.table, true);
                break;
        }
    }
    
    // Show a game message for specified duration
    showGameMessage(message) {
        this.gameMessage = message;
        this.gameMessageTimer = 180; // Show for 3 seconds
        console.log("Game message:", message);
    }
    
    // Update game message timer
    updateGameMessageTimer() {
        if (this.gameMessageTimer > 0) {
            this.gameMessageTimer--;
        }
    }
    
    // Draw complete user interface
    drawUI() {
        this.drawGameInfo();
        this.drawInstructions();
    }
    
    // Draw game state information
    drawGameInfo() {
        fill(255);
        textAlign(LEFT);
        textSize(14);
        
        let infoY = height - 180; 
        text("Game State: " + this.gameState, 20, infoY);
        text("Red balls remaining: " + this.ballManager.getRedBallCount(), 20, infoY + 20);
        text("Consecutive colored balls: " + this.ballManager.getConsecutiveColoredBalls(), 20, infoY + 40);
        text("Balls moving: " + (this.ballManager.areBallsMoving() ? "YES" : "NO"), 20, infoY + 60);
        text("Ball prediction: " + (this.ballPrediction.enabled ? "ON" : "OFF"), 20, infoY + 80);
        if (this.ballPrediction.isVisible()) {
            text("Predicted bounces: " + this.ballPrediction.getBounceCount(), 20, infoY + 100);
        }
        text("Dynamic obstacles: " + (this.dynamicObstacles.isEnabled() ? "ON" : "OFF"), 20, infoY + 120);
        if (this.dynamicObstacles.isEnabled()) {
            text("Active obstacles: " + this.dynamicObstacles.getObstacleCount(), 20, infoY + 140);
        }
        // Current instruction based on game state
        if (!this.cueBallPlaced) {
            text("Click in the highlighted D zone to place cue ball", 20, infoY + 160);
        } else if (this.gameState === "AIMING") {
            text("Move mouse to aim, hold SPACE to charge power", 20, infoY + 160);
        } else if (this.gameState === "READY_TO_SHOOT") {
            text("Release SPACE to shoot!", 20, infoY + 160);
        } else if (this.gameState === "BALL_MOVING") {
            text("Wait for balls to stop moving...", 20, infoY + 160);
        }
    }
    
    // Draw instructions and current mode 
    drawInstructions() {
        fill(255);
        textSize(16);
        textAlign(LEFT);

        text("Press '1' - Starting positions", 20, 50);
        text("Press '2' - Random red positions", 20, 70);
        text("Press '3' - Random all positions", 20, 90);
        text("Press 'P' - Toggle ball trail prediction", 20, 110); 
        text("Press 'O' - Toggle dynamic obstacles", 20, 130); 
        // Current mode display
        let modeText = "";
        switch(this.displayMode) {
            case 0: modeText = "No balls displayed"; break;
            case 1: modeText = "Starting positions"; break;
            case 2: modeText = "Random red positions"; break;
            case 3: modeText = "Random all positions"; break;
        }
        text("Current mode: " + modeText, 20, 170); 
        
        // Status indicators
        let statusY = 110;
        if (this.ballPrediction.enabled) {
            fill(255, 255, 0); 
            text(" Ball Trail Prediction: ENABLED", 350, statusY);
        }
        if (this.dynamicObstacles.isEnabled()) {
            fill(255, 100, 100); 
            text(" Dynamic Obstacles: ENABLED", 350, statusY + 20);
        }
        fill(255); // Reset to white
    }
    
    // Draw game messages
    drawGameMessages() {
        if (this.gameMessageTimer > 0) {
            fill(255, 100, 100); // Red text for warnings
            textAlign(CENTER);
            textSize(20);
            text(this.gameMessage, width/2, 80);
        }
    }
    
    // Getter methods for accessing game components
    getGameState() { return this.gameState; }// Get current game state
    getDisplayMode() { return this.displayMode; }// Get current display mode
    isCueBallPlaced() { return this.cueBallPlaced; }// Check if cue ball is placed
    getTable() { return this.table; }// Get table object
    getBallManager() { return this.ballManager; }// Get ball manager object
    getCue() { return this.cue; }// Get cue object
    getBallPrediction() { return this.ballPrediction; }// Get prediction object
    getDynamicObstacles() { return this.dynamicObstacles; }// Get obstacles object

    // Reset game to initial state
    resetGame() {  
        this.gameState = "PLACE_CUE_BALL";
        this.cueBallPlaced = false;
        this.ballManager.resetPhysicsBalls();
        this.cue.reset();
        this.ballPrediction.hide(); 
        this.gameMessage = "";
        this.gameMessageTimer = 0;
    }
}