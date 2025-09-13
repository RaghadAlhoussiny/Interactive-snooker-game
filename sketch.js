/**
 * sketch.js - Main Sketch File for Snooker Game
 * Main file that coordinates all game components using OOP principles
 * Organized with proper separation of concerns and component architecture
 * 
 * === COMMENTARY - APP DESIGN AND EXTENSIONS ===
 * 
 * APP DESIGN DECISIONS:
 * 
 * Mouse-Based Cue System: I implemented a mouse-only cue control because it provides the most 
 * intuitive and precise aiming experience. The cue follows the mouse position in real-time, 
 * calculating the angle for smooth directional tracking. Power is controlled 
 * through spacebar charging, creating a natural "pull back and release" mechanism that mimics 
 * real snooker. This approach eliminates the complexity of keyboard-based angle adjustments 
 * while maintaining professional-level precision for shot execution.
 * 
 * Object-Oriented Architecture: The application is structured using seven distinct classes, 
 * each handling specific responsibilities. The Ball class encapsulates individual ball physics 
 * and properties, BallManager coordinates all ball interactions and game rules, Table handles 
 * rendering and spatial calculations, Cue manages shooting mechanics, and GameManager orchestrates 
 * the entire system. This separation ensures clean and maintainable code.
 * 
 * Physics Integration: I chose Matter.js for realistic ball dynamics, implementing proper 
 * restitution (0.8), friction (0.25), and air resistance (0.015) values. The physics engine 
 * runs without gravity to simulate a horizontal table surface accurately. Cushion collisions 
 * use high restitution (0.95) for authentic bouncing behavior.
 * 
 * UNIQUE EXTENSIONS:
 * 
 * Extension 1 - Ball Trail Prediction System: This is a physics-based trajectory prediction 
 * that calculates where the cue ball will travel before shooting. It simulates ball movement 
 * step-by-step, including cushion bounces with proper reflection mathematics, friction application, 
 * and energy loss calculations. The system displays different colored trail segments for each 
 * bounce, providing players with strategic shot planning capabilities. The prediction  
 * updates in real-time based on cue power and adjusts dynamically during power charging.
 * 
 * Extension 2 - Dynamic Obstacle System: I created spinning rectangular obstacles that spawn 
 * randomly on the table during gameplay. These obstacles follow a three-phase lifecycle: 
 * warning (2-second countdown with pulsing visuals), active (5 seconds of ball interaction), 
 * and fading (1-second disappearance). During the active phase, obstacles apply rotational 
 * forces to nearby balls, creating unpredictable gameplay elements. The system includes 
 * sophisticated safety mechanisms - obstacles spawn only when balls are stationary, avoid 
 * pockets and the D-zone, and include emergency teleportation to prevent ball trapping.
 * 
 * Both extensions add strategic complexity while preserving core snooker mechanics. 
 * The trajectory prediction assists shot planning, while dynamic obstacles introduce 
 * tactical challenges requiring adaptive gameplay strategies.
 * 
 * TECHNICAL IMPLEMENTATION:
 * 
 * The application uses proper game state management with clearly defined states (PLACE_CUE_BALL, 
 * AIMING, READY_TO_SHOOT, BALL_MOVING), ensuring smooth transitions and preventing invalid 
 * actions. All three gaming aspects are fully implemented: cue ball re-placement in the D-zone, 
 * colored ball re-spotting with collision avoidance, and consecutive colored ball mistake 
 * detection.
 * 
 * The random ball positioning system uses p5.js's random() function with collision avoidance 
 * algorithms. Mode 2 randomly positions red balls while maintaining colored balls on their 
 * designated spots. Mode 3 randomizes all balls with validation checks to prevent spawning 
 * near pockets or the D-zone, ensuring fair gameplay across positioning modes. The system 
 * attempts up to 100 placement iterations per ball to find valid positions.
 * 
 * The collision detection system tracks cue ball interactions with all table elements, 
 * providing real-time impact feedback.
 */
//////////////////////////////////////////////////
// GLOBAL VARIABLES AND SETUP
//////////////////////////////////////////////////

// Matter.js module aliases (required globally for all components)
var Engine = Matter.Engine;
var World = Matter.World;
var Bodies = Matter.Bodies;
var Body = Matter.Body;
var Mouse = Matter.Mouse;
var MouseConstraint = Matter.MouseConstraint;
var Constraint = Matter.Constraint;

var engine;// Physics engine (global reference for all components)

// Global ball properties 
var tableLength = 1000;// Table length for calculations
var tableWidth = 500;// Table width for calculations
var ballDiameter = tableWidth / 36; 
var ballRadius = ballDiameter / 2; 

var gameManager;// Main game manager instance

// p5.js setup function - initialize entire game system
function setup() { 
    gameManager = new GameManager();
    gameManager.initialize();
}

// p5.js draw function - main game loop
function draw() { 
    gameManager.update();// Update all game components
    gameManager.render();// Render all game components
}

// Input handling functions
function mousePressed() { // Handle mouse click events
    gameManager.handleMousePressed();
}

function keyPressed() { // Handle key press events
    gameManager.handleKeyPressed();
}

function keyReleased() { // Handle key release events
    gameManager.handleKeyReleased();
}

// Utility functions for compatibility
function getGameState() { return gameManager.getGameState(); } // Get current game state
function getDisplayMode() { return gameManager.getDisplayMode(); } // Get current display mode
function isCueBallPlaced() { return gameManager.isCueBallPlaced(); } // Check if cue ball is placed