import { TitleScene } from './TitleScene';

interface GameState {
    score: number;
    buzzLevel: number;
    timeAlive: number;
    isGameOver: boolean;
    startTime: number;
    speedBoostEndTime: number;
    scoreMultiplierEndTime: number;
}

export class GameScene extends Phaser.Scene {
    // Core game objects
    private player!: Phaser.Physics.Arcade.Sprite;
    private walls!: Phaser.Physics.Arcade.StaticGroup;
    private collectibles!: Phaser.Physics.Arcade.Group;
    
    // UI elements
    private buzzBar!: Phaser.GameObjects.Graphics;
    private timerText!: Phaser.GameObjects.Text;
    private scoreText!: Phaser.GameObjects.Text;
    private multiplierText!: Phaser.GameObjects.Text;
    private buzzLabel!: Phaser.GameObjects.Text;
    
    // Input
    private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
    
    // Game state
    private state: GameState = {
        score: 0,
        buzzLevel: 100,
        timeAlive: 0,
        isGameOver: false,
        startTime: 0,
        speedBoostEndTime: 0,
        scoreMultiplierEndTime: 0
    };
    
    // Constants
    private readonly NORMAL_SPEED: number = 525;
    private readonly BOOSTED_SPEED: number = 1050;
    private readonly BUZZ_DECREASE_RATE: number = 6;
    private readonly BUZZ_DECREASE_INTERVAL: number = 1000;
    private readonly MAX_COLLECTIBLES: number = 70;
    private readonly WORLD_SIZE: number = 4000;
    
    private lastBuzzDecrease: number = 0;

    constructor() {
        super({ key: 'GameScene' });
    }

    preload() {
        // Load the assets with correct paths
        this.load.image('player-face', 'assets/jimbando-face.png');
        this.load.svg('beer', 'assets/beer.svg');
        this.load.svg('whiskey', 'assets/whiskey.svg');
        this.load.svg('bag', 'assets/bag.svg');
        this.load.svg('narcan', 'assets/narcan.svg');
    }

    init() {
        console.log("GameScene: init");
        this.resetGameState();
        this.cleanupResources();
    }

    private resetGameState() {
        this.state = {
            score: 0,
            buzzLevel: 100,
            timeAlive: 0,
            isGameOver: false,
            startTime: 0,
            speedBoostEndTime: 0,
            scoreMultiplierEndTime: 0
        };
        this.lastBuzzDecrease = 0;
    }

    private cleanupResources() {
        this.cleanupUI();
        this.cleanupPhysics();
        this.cleanupInput();
    }

    private cleanupUI() {
        [this.buzzBar, this.timerText, this.scoreText, this.multiplierText, this.buzzLabel].forEach(element => {
            if (element) {
                element.destroy();
            }
        });
    }

    private cleanupPhysics() {
        if (this.player) {
            this.player.destroy();
        }
        if (this.walls) {
            this.walls.destroy();
        }
        if (this.collectibles) {
            this.collectibles.destroy();
        }
        if (this.physics.world) {
            this.physics.world.colliders.destroy();
            this.physics.world.bodies.clear();
            this.physics.world.staticBodies.clear();
        }
    }

    private cleanupInput() {
        if (this.cursors) {
            this.input.keyboard?.removeAllKeys();
        }
    }

    create() {
        console.log("GameScene: create starting");
        
        this.initializeWorld();
        this.createPlayer();
        this.createUI();
        this.setupCollisions();
        this.setupInput();
        
        // Start game
        this.state.startTime = this.time.now;
        console.log("GameScene: create complete");
    }

    private initializeWorld() {
        // Setup physics
        this.walls = this.physics.add.staticGroup();
        this.collectibles = this.physics.add.group();
        
        // Setup camera
        this.cameras.main.setBackgroundColor('#1a4d2e');
        this.cameras.main.setBounds(0, 0, this.WORLD_SIZE, this.WORLD_SIZE);
        
        // Setup world bounds
        this.physics.world.setBounds(0, 0, this.WORLD_SIZE, this.WORLD_SIZE);
        
        // Create maze
        this.createMaze();
    }

    private createPlayer() {
        this.player = this.physics.add.sprite(400, 400, 'player-face');
        this.player.setScale(0.24);
        this.player.setOrigin(0.5, 0.5);
        this.player.setCollideWorldBounds(true);
        this.player.setBounce(0);
        
        if (this.player.body) {
            this.player.body.setCircle(150, 0, 20);
        }
        
        this.cameras.main.startFollow(this.player, true);
        this.cameras.main.setZoom(1);
    }

    private createUI() {
        // Timer
        this.timerText = this.add.text(690, 10, 'Time: 0:00', {
            fontFamily: 'Arial',
            fontSize: '20px',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 2
        }).setScrollFactor(0).setDepth(999);

        // Score
        this.scoreText = this.add.text(400, 10, 'Score: 0', {
            fontFamily: 'Arial',
            fontSize: '32px',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 3
        }).setScrollFactor(0).setOrigin(0.5, 0).setDepth(999);

        // Multiplier
        this.multiplierText = this.add.text(400, 50, '5x MULTIPLIER!', {
            fontFamily: 'Arial',
            fontSize: '24px',
            color: '#ffff00',
            stroke: '#000000',
            strokeThickness: 3
        }).setScrollFactor(0).setOrigin(0.5, 0).setDepth(999).setVisible(false);

        this.createBuzzBar();
    }

    private createBuzzBar() {
        this.buzzBar = this.add.graphics();
        this.buzzBar.setScrollFactor(0).setDepth(999);
        
        this.buzzLabel = this.add.text(10, 32, 'BUZZ METER', {
            fontFamily: 'Arial',
            fontSize: '16px',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 2
        }).setScrollFactor(0).setDepth(999);
        
        this.updateBuzzBar();
    }

    private setupCollisions() {
        this.physics.add.collider(this.player, this.walls);
        this.physics.add.overlap(
            this.player,
            this.collectibles,
            this.handleCollectible as unknown as Phaser.Types.Physics.Arcade.ArcadePhysicsCallback,
            undefined,
            this
        );
        
        this.spawnCollectibles();
    }

    private setupInput() {
        this.cursors = this.input.keyboard!.createCursorKeys();
    }

    update(time: number, delta: number) {
        if (!this.player || !this.cursors || this.state.isGameOver) return;

        this.updatePlayerMovement();
        this.updateGameState(time);
        this.updateUI();
    }

    private updatePlayerMovement() {
        const leftRight = this.cursors.left.isDown ? -1 : (this.cursors.right.isDown ? 1 : 0);
        const upDown = this.cursors.up.isDown ? -1 : (this.cursors.down.isDown ? 1 : 0);
        
        const currentSpeed = this.getCurrentSpeed();
        this.player.setVelocity(
            leftRight * currentSpeed,
            upDown * currentSpeed
        );
    }

    private updateGameState(time: number) {
        // Update time alive
        this.state.timeAlive = time - this.state.startTime;
        
        // Update buzz level
        if (time > this.lastBuzzDecrease + this.BUZZ_DECREASE_INTERVAL) {
            this.state.buzzLevel = Math.max(0, this.state.buzzLevel - this.BUZZ_DECREASE_RATE);
            this.lastBuzzDecrease = time;
            
            if (this.state.buzzLevel <= 0 && !this.state.isGameOver) {
                this.initiateGameOver();
            }
        }
    }

    private updateUI() {
        // Update timer
        const elapsedSeconds = Math.floor(this.state.timeAlive / 1000);
        const minutes = Math.floor(elapsedSeconds / 60);
        const seconds = elapsedSeconds % 60;
        this.timerText.setText(`Time: ${minutes}:${seconds.toString().padStart(2, '0')}`);
        
        // Update buzz bar
        this.updateBuzzBar();
        
        // Update multiplier visibility
        if (this.time.now >= this.state.scoreMultiplierEndTime && this.multiplierText.visible) {
            this.multiplierText.setVisible(false);
        }
    }

    private updateBuzzBar() {
        this.buzzBar.clear();
        
        // Background
        this.buzzBar.fillStyle(0x000000, 0.8);
        this.buzzBar.fillRect(10, 10, 200, 20);
        
        // Buzz level
        const color = this.state.buzzLevel > 30 ? 0x00ff00 : 0xff0000;
        this.buzzBar.fillStyle(color, 1);
        const width = Math.max(0, Math.min(200, this.state.buzzLevel * 2));
        this.buzzBar.fillRect(10, 10, width, 20);
    }

    private getCurrentSpeed(): number {
        return this.time.now < this.state.speedBoostEndTime ? 
            this.BOOSTED_SPEED : this.NORMAL_SPEED;
    }

    private initiateGameOver() {
        if (this.state.isGameOver) return;
        
        this.state.isGameOver = true;
        this.saveScore();
        
        // Create transition overlay
        const overlay = this.add.rectangle(0, 0, this.WORLD_SIZE, this.WORLD_SIZE, 0xff0000)
            .setDepth(9999)
            .setOrigin(0, 0)
            .setAlpha(0)
            .setScrollFactor(0);
        
        // Transition to death scene
        this.tweens.add({
            targets: overlay,
            alpha: 1,
            duration: 1000,
            onComplete: () => {
                this.cleanupResources();
                overlay.destroy();
                this.scene.start('DeathScene', {
                    score: this.state.score,
                    timeAlive: Math.floor(this.state.timeAlive / 1000)
                });
            }
        });
    }

    private async saveScore() {
        try {
            const username = localStorage.getItem('currentUsername') || 'Anonymous';
            const response = await fetch('https://jimbando-the-clown.onrender.com/scores', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    username,
                    score: this.state.score,
                    timestamp: new Date().toISOString()
                })
            });
            
            if (!response.ok) {
                console.error('Failed to save score');
            }
        } catch (error) {
            console.error('Error saving score:', error);
        }
    }

    private createMaze() {
        // Create outer walls
        this.createWall(0, 0, 4000, 40); // Top
        this.createWall(0, 3960, 4000, 40); // Bottom
        this.createWall(0, 0, 40, 4000); // Left
        this.createWall(3960, 0, 40, 4000); // Right

        // Create a more maze-like structure with bends and multiple paths
        const mazeWalls = [
            // Horizontal segments (with gaps)
            [400, 400, 600, 40], [1200, 400, 400, 40], [1800, 400, 400, 40], [2400, 400, 400, 40], [3000, 400, 600, 40],
            [400, 800, 400, 40], [900, 800, 400, 40], [1400, 800, 400, 40], [1900, 800, 400, 40], [2400, 800, 400, 40], [2900, 800, 400, 40], [3400, 800, 400, 40],
            [400, 1200, 600, 40], [1200, 1200, 400, 40], [1800, 1200, 400, 40], [2400, 1200, 400, 40], [3000, 1200, 600, 40],
            [400, 1600, 400, 40], [900, 1600, 400, 40], [1400, 1600, 400, 40], [1900, 1600, 400, 40], [2400, 1600, 400, 40], [2900, 1600, 400, 40], [3400, 1600, 400, 40],
            [400, 2000, 600, 40], [1200, 2000, 400, 40], [1800, 2000, 400, 40], [2400, 2000, 400, 40], [3000, 2000, 600, 40],
            [400, 2400, 400, 40], [900, 2400, 400, 40], [1400, 2400, 400, 40], [1900, 2400, 400, 40], [2400, 2400, 400, 40], [2900, 2400, 400, 40], [3400, 2400, 400, 40],
            [400, 2800, 600, 40], [1200, 2800, 400, 40], [1800, 2800, 400, 40], [2400, 2800, 400, 40], [3000, 2800, 600, 40],
            [400, 3200, 400, 40], [900, 3200, 400, 40], [1400, 3200, 400, 40], [1900, 3200, 400, 40], [2400, 3200, 400, 40], [2900, 3200, 400, 40], [3400, 3200, 400, 40],
            [400, 3600, 600, 40], [1200, 3600, 400, 40], [1800, 3600, 400, 40], [2400, 3600, 400, 40], [3000, 3600, 600, 40],
            // Vertical segments (with gaps)
            [400, 400, 40, 400], [400, 900, 40, 400], [400, 1400, 40, 400], [400, 1900, 40, 400], [400, 2400, 40, 400], [400, 2900, 40, 400], [400, 3400, 40, 400],
            [800, 800, 40, 400], [800, 1300, 40, 400], [800, 1800, 40, 400], [800, 2300, 40, 400], [800, 2800, 40, 400], [800, 3300, 40, 400],
            [1200, 400, 40, 400], [1200, 900, 40, 400], [1200, 1400, 40, 400], [1200, 1900, 40, 400], [1200, 2400, 40, 400], [1200, 2900, 40, 400], [1200, 3400, 40, 400],
            [1600, 800, 40, 400], [1600, 1300, 40, 400], [1600, 1800, 40, 400], [1600, 2300, 40, 400], [1600, 2800, 40, 400], [1600, 3300, 40, 400],
            [2000, 400, 40, 400], [2000, 900, 40, 400], [2000, 1400, 40, 400], [2000, 1900, 40, 400], [2000, 2400, 40, 400], [2000, 2900, 40, 400], [2000, 3400, 40, 400],
            [2400, 800, 40, 400], [2400, 1300, 40, 400], [2400, 1800, 40, 400], [2400, 2300, 40, 400], [2400, 2800, 40, 400], [2400, 3300, 40, 400],
            [2800, 400, 40, 400], [2800, 900, 40, 400], [2800, 1400, 40, 400], [2800, 1900, 40, 400], [2800, 2400, 40, 400], [2800, 2900, 40, 400], [2800, 3400, 40, 400],
            [3200, 800, 40, 400], [3200, 1300, 40, 400], [3200, 1800, 40, 400], [3200, 2300, 40, 400], [3200, 2800, 40, 400], [3200, 3300, 40, 400],
            [3600, 400, 40, 400], [3600, 900, 40, 400], [3600, 1400, 40, 400], [3600, 1900, 40, 400], [3600, 2400, 40, 400], [3600, 2900, 40, 400], [3600, 3400, 40, 400],
        ];

        mazeWalls.forEach(([x, y, width, height]) => {
            this.createWall(x, y, width, height);
        });
    }

    private createWall(x: number, y: number, width: number, height: number) {
        // Create a static sprite for the wall
        const wall = this.add.rectangle(x + width/2, y + height/2, width, height, 0x964B00);
        
        // Enable physics on the wall
        this.physics.add.existing(wall, true); // true makes it static
        
        // Get the physics body and ensure it matches the wall size
        const body = wall.body as Phaser.Physics.Arcade.Body;
        body.setSize(width, height);
        body.setOffset(0, 0);
        
        // Add to walls group
        this.walls.add(wall);
        
        return wall;
    }

    private handleCollectible(player: Phaser.Physics.Arcade.Sprite, collectible: Phaser.Physics.Arcade.Sprite) {
        collectible.destroy();
        
        let oldBuzzLevel = this.state.buzzLevel;  // Store old buzz level for comparison
        
        // Handle different types of collectibles
        switch (collectible.texture.key) {
            case 'beer':
                // Increased potency by another 20% (from 3.125 to 3.75)
                this.state.buzzLevel = Math.min(100, this.state.buzzLevel + 3.75);
                // Add 10 points (multiplied if multiplier is active)
                this.addPoints(10);
                break;
            case 'whiskey':
                // Set buzz to maximum
                this.state.buzzLevel = 100;
                // Add 50 points (multiplied if multiplier is active)
                this.addPoints(50);
                break;
            case 'bag':
                // Speed boost for 7 seconds
                this.state.speedBoostEndTime = this.time.now + 7000;
                // Score multiplier for same duration
                this.state.scoreMultiplierEndTime = this.time.now + 7000;
                // Show multiplier text
                this.multiplierText.setVisible(true);
                // Decrease buzz by 20%
                this.state.buzzLevel = Math.max(0, this.state.buzzLevel - 20);
                break;
            case 'narcan':
                // Completely drain buzz
                this.state.buzzLevel = 0;
                break;
        }

        // Only update if buzz level changed
        if (oldBuzzLevel !== this.state.buzzLevel) {
            this.updateBuzzBar();
        }

        // Spawn new collectible
        this.spawnCollectibles();
    }

    private spawnCollectibles() {
        const currentCollectibles = this.collectibles.getChildren().length;
        const collectiblesToSpawn = this.MAX_COLLECTIBLES - currentCollectibles;
        // Expanded safe zones for larger map
        const safeZones = [
            // Corners
            { x1: 100, y1: 100, x2: 600, y2: 600 },
            { x1: 3400, y1: 100, x2: 3900, y2: 600 },
            { x1: 100, y1: 3400, x2: 600, y2: 3900 },
            { x1: 3400, y1: 3400, x2: 3900, y2: 3900 },
            // Edges
            { x1: 1800, y1: 100, x2: 2200, y2: 600 },
            { x1: 100, y1: 1800, x2: 600, y2: 2200 },
            { x1: 3400, y1: 1800, x2: 3900, y2: 2200 },
            { x1: 1800, y1: 3400, x2: 2200, y2: 3900 },
            // Center quadrants
            { x1: 1000, y1: 1000, x2: 1500, y2: 1500 },
            { x1: 2500, y1: 1000, x2: 3000, y2: 1500 },
            { x1: 1000, y1: 2500, x2: 1500, y2: 3000 },
            { x1: 2500, y1: 2500, x2: 3000, y2: 3000 },
            // Center
            { x1: 1800, y1: 1800, x2: 2200, y2: 2200 },
        ];
        for (let i = 0; i < collectiblesToSpawn; i++) {
            let tries = 0;
            let valid = false;
            let x = 0, y = 0;
            let collectible: Phaser.Physics.Arcade.Sprite | null = null;
            while (!valid && tries < 10) {
                const zone = safeZones[Math.floor(Math.random() * safeZones.length)];
                x = Phaser.Math.Between(zone.x1, zone.x2);
                y = Phaser.Math.Between(zone.y1, zone.y2);
                const rand = Math.random();
                let type;
                if (rand < 0.93) {
                    type = 'beer';
                } else if (rand < 0.965) {
                    type = 'whiskey';
                } else if (rand < 0.99) {
                    type = 'bag';
                } else {
                    type = 'narcan';
                }
                collectible = this.physics.add.sprite(x, y, type);
                collectible.setScale(type === 'bag' ? 0.9 : type === 'narcan' ? 0.7 : 0.8);
                valid = !this.physics.overlap(collectible, this.walls);
                if (!valid) {
                    collectible.destroy();
                }
                tries++;
            }
            if (valid && collectible) {
                this.collectibles.add(collectible);
            }
        }
    }

    private addPoints(basePoints: number) {
        const multiplier = this.time.now < this.state.scoreMultiplierEndTime ? 5 : 1;
        this.state.score += basePoints * multiplier;
        this.scoreText?.setText(`Score: ${this.state.score}`);
    }
} 