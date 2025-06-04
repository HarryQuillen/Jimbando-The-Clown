import { TitleScene } from './TitleScene';

export class GameScene extends Phaser.Scene {
    private player!: Phaser.Physics.Arcade.Sprite;
    private buzzBar!: Phaser.GameObjects.Graphics;
    private buzzLevel: number = 100;
    private lastBuzzDecrease: number = 0;
    private collectibles!: Phaser.Physics.Arcade.Group;
    private walls!: Phaser.Physics.Arcade.StaticGroup;
    private speedBoostEndTime: number = 0;
    private scoreMultiplierEndTime: number = 0;
    private normalSpeed: number = 525;
    private boostedSpeed: number = 1050;
    private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
    private startTime: number = 0;
    private timerText!: Phaser.GameObjects.Text;
    private score: number = 0;
    private scoreText?: Phaser.GameObjects.Text;
    private multiplierText!: Phaser.GameObjects.Text;
    private timeAlive: number = 0;

    constructor() {
        super({ key: 'GameScene' });
    }

    init() {
        // Reset all game variables
        this.buzzLevel = 100;
        this.lastBuzzDecrease = 0;
        this.speedBoostEndTime = 0;
        this.scoreMultiplierEndTime = 0;
        this.score = 0;
    }

    preload() {
        // Load the assets with correct paths
        this.load.image('player-face', 'assets/jimbando-face.png');
        this.load.svg('beer', 'assets/beer.svg');
        this.load.svg('whiskey', 'assets/whiskey.svg');
        this.load.svg('bag', 'assets/bag.svg');
        this.load.svg('narcan', 'assets/narcan.svg');
    }

    create() {
        // Set start time
        this.startTime = this.time.now;
        
        // Set background color
        this.cameras.main.setBackgroundColor('#1a4d2e');
        
        // Create a larger world
        this.physics.world.setBounds(0, 0, 2400, 2400);
        
        // Create walls for the maze
        this.createMaze();

        // Create player container
        const playerContainer = this.add.container(400, 400);
        
        // Create the player face sprite
        const playerFace = this.add.sprite(0, 0, 'player-face');
        playerFace.setScale(0.24);
        playerFace.setOrigin(0.5, 0.5);
        
        // Add sprite to container
        playerContainer.add([playerFace]);
        
        // Create the physics sprite (invisible) for collision
        this.player = this.physics.add.sprite(400, 400, 'player-face');
        this.player.setVisible(false);
        this.player.setCollideWorldBounds(true);
        this.player.setBounce(0);
        
        // Adjust the player's collision body to be circular
        const bodyRadius = 32;
        this.player.body!.setCircle(bodyRadius);
        this.player.body!.setOffset(
            (this.player.width - bodyRadius * 2) / 2,
            (this.player.height - bodyRadius * 2) / 2
        );

        // Create survival timer text (top right)
        this.timerText = this.add.text(690, 10, 'Time: 0:00', {
            fontFamily: 'Arial',
            fontSize: '20px',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 2
        });
        this.timerText.setScrollFactor(0);

        // Create score text (top center)
        this.scoreText = this.add.text(400, 10, 'Score: 0', {
            fontFamily: 'Arial',
            fontSize: '32px',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 3
        });
        this.scoreText.setScrollFactor(0);
        this.scoreText.setOrigin(0.5, 0);
        this.scoreText.setDepth(999);  // Ensure it's always on top

        // Create multiplier text (below score)
        this.multiplierText = this.add.text(400, 50, '5x MULTIPLIER!', {
            fontFamily: 'Arial',
            fontSize: '24px',
            color: '#ffff00',
            stroke: '#000000',
            strokeThickness: 3
        });
        this.multiplierText.setScrollFactor(0);
        this.multiplierText.setOrigin(0.5, 0);
        this.multiplierText.setDepth(999);  // Ensure it's always on top
        this.multiplierText.setVisible(false);

        // Setup camera to follow player
        this.cameras.main.setBounds(0, 0, 2400, 2400);
        this.cameras.main.startFollow(playerContainer, true);
        this.cameras.main.setZoom(1);

        // Create collectibles group
        this.collectibles = this.physics.add.group();

        // Create buzz bar
        this.createBuzzBar();

        // Add collision detection
        this.physics.add.collider(this.player, this.walls);
        this.physics.add.overlap(
            this.player,
            this.collectibles,
            this.handleCollectible as unknown as Phaser.Types.Physics.Arcade.ArcadePhysicsCallback,
            undefined,
            this
        );

        // Spawn initial collectibles
        this.spawnCollectibles();

        // Set up keyboard controls
        this.cursors = this.input.keyboard!.createCursorKeys();
        
        // Store container reference for update
        (this as any).playerContainer = playerContainer;
    }

    private createMaze() {
        this.walls = this.physics.add.staticGroup();

        // Create outer walls - adjusted to ensure they're at the edges
        this.createWall(0, 0, 2400, 40); // Top
        this.createWall(0, 2360, 2400, 40); // Bottom
        this.createWall(0, 0, 40, 2400); // Left
        this.createWall(2360, 0, 40, 2400); // Right

        // Create maze walls with more space between them
        const mazeWalls = [
            // Horizontal walls - adjusted positions
            [300, 300, 400, 40],
            [900, 300, 400, 40],
            [500, 500, 800, 40],
            [300, 700, 400, 40],
            [900, 700, 400, 40],
            [500, 900, 800, 40],
            [300, 1100, 1000, 40],
            [1500, 300, 400, 40],
            [1500, 500, 400, 40],
            [1500, 700, 400, 40],
            [1500, 900, 400, 40],
            // Vertical walls - adjusted positions
            [300, 300, 40, 400],
            [700, 500, 40, 400],
            [1100, 300, 40, 400],
            [1500, 500, 40, 400],
            [1900, 300, 40, 600],
            [300, 1100, 40, 400],
            [700, 900, 40, 400],
            [1100, 1100, 40, 400],
            [1500, 900, 40, 400]
        ];

        mazeWalls.forEach(([x, y, width, height]) => {
            this.createWall(x, y, width, height);
        });
    }

    private createWall(x: number, y: number, width: number, height: number) {
        // Create the visual rectangle
        const wall = this.add.rectangle(x + width/2, y + height/2, width, height, 0x964B00);
        
        // Create the physics body
        const wallBody = this.physics.add.existing(wall, true) as unknown as Phaser.GameObjects.Rectangle;
        this.walls.add(wallBody);
        
        // Add a stroke to make walls more visible
        const stroke = this.add.rectangle(x + width/2, y + height/2, width, height);
        stroke.setStrokeStyle(2, 0x000000);
    }

    update() {
        // Update timer
        const elapsedSeconds = Math.floor((this.time.now - this.startTime) / 1000);
        const minutes = Math.floor(elapsedSeconds / 60);
        const seconds = elapsedSeconds % 60;
        this.timerText.setText(`Time: ${minutes}:${seconds.toString().padStart(2, '0')}`);

        // Check if speed boost is active
        const currentSpeed = this.time.now < this.speedBoostEndTime ? this.boostedSpeed : this.normalSpeed;

        // Use cursors for movement
        if (this.cursors.left.isDown) {
            this.player.setVelocityX(-currentSpeed);
            (this as any).playerContainer.x = this.player.x;
        } else if (this.cursors.right.isDown) {
            this.player.setVelocityX(currentSpeed);
            (this as any).playerContainer.x = this.player.x;
        } else {
            this.player.setVelocityX(0);
        }

        if (this.cursors.up.isDown) {
            this.player.setVelocityY(-currentSpeed);
            (this as any).playerContainer.y = this.player.y;
        } else if (this.cursors.down.isDown) {
            this.player.setVelocityY(currentSpeed);
            (this as any).playerContainer.y = this.player.y;
        } else {
            this.player.setVelocityY(0);
        }
        
        // Update container position to match physics sprite
        (this as any).playerContainer.x = this.player.x;
        (this as any).playerContainer.y = this.player.y;

        // Update buzz bar
        this.updateBuzzBar();

        // Decrease buzz over time
        const time = this.time.now;
        if (time > this.lastBuzzDecrease + 1000) {
            this.decreaseBuzzLevel();
            this.lastBuzzDecrease = time;
        }

        // Check game over condition
        if (this.buzzLevel <= 0) {
            // Add fade out effect
            this.cameras.main.fadeOut(1000, 255, 0, 0);
            
            // Wait for fade out to complete
            this.time.delayedCall(1000, () => {
                // Clean up the current scene
                this.input.keyboard?.removeAllKeys();
                this.events.removeAllListeners();
                this.scene.stop();
                // Start the death scene
                this.scene.start('DeathScene');
            });
        }

        // Update multiplier visibility
        if (this.time.now >= this.scoreMultiplierEndTime && this.multiplierText.visible) {
            this.multiplierText.setVisible(false);
        }
    }

    private createBuzzBar() {
        this.buzzBar = this.add.graphics();
        this.buzzBar.setScrollFactor(0); // Fix to camera
        this.updateBuzzBar();
    }

    private updateBuzzBar() {
        this.buzzBar.clear();
        
        // Background
        this.buzzBar.fillStyle(0x000000, 0.8);
        this.buzzBar.fillRect(10, 10, 200, 20);

        // Buzz level
        const color = this.buzzLevel > 30 ? 0x00ff00 : 0xff0000;
        this.buzzBar.fillStyle(color, 1);
        const width = Math.max(0, Math.min(200, this.buzzLevel * 2));  // Ensure width is between 0 and 200
        this.buzzBar.fillRect(10, 10, width, 20);

        // Add "BUZZ METER" label if it doesn't exist
        if (!this.children.getByName('buzzLabel')) {
            this.add.text(10, 32, 'BUZZ METER', {
                fontFamily: 'Arial',
                fontSize: '16px',
                color: '#ffffff',
                stroke: '#000000',
                strokeThickness: 2
            }).setName('buzzLabel').setScrollFactor(0);
        }
    }

    private decreaseBuzzLevel() {
        // Decrease the reduction rate by 15% (from 7 to ~6)
        this.buzzLevel = Math.max(0, this.buzzLevel - 6);
    }

    private handleCollectible(player: Phaser.Physics.Arcade.Sprite, collectible: Phaser.Physics.Arcade.Sprite) {
        collectible.destroy();
        
        let oldBuzzLevel = this.buzzLevel;  // Store old buzz level for comparison
        
        // Handle different types of collectibles
        switch (collectible.texture.key) {
            case 'beer':
                // Increased potency by another 20% (from 3.125 to 3.75)
                this.buzzLevel = Math.min(100, this.buzzLevel + 3.75);
                // Add 10 points (multiplied if multiplier is active)
                this.addPoints(10);
                break;
            case 'whiskey':
                // Set buzz to maximum
                this.buzzLevel = 100;
                // Add 50 points (multiplied if multiplier is active)
                this.addPoints(50);
                break;
            case 'bag':
                // Speed boost for 7 seconds
                this.speedBoostEndTime = this.time.now + 7000;
                // Score multiplier for same duration
                this.scoreMultiplierEndTime = this.time.now + 7000;
                // Show multiplier text
                this.multiplierText.setVisible(true);
                // Decrease buzz by 20%
                this.buzzLevel = Math.max(0, this.buzzLevel - 20);
                break;
            case 'narcan':
                // Completely drain buzz
                this.buzzLevel = 0;
                break;
        }

        // Only update if buzz level changed
        if (oldBuzzLevel !== this.buzzLevel) {
            this.updateBuzzBar();
        }

        // Spawn new collectible
        this.spawnCollectibles();
    }

    private spawnCollectibles() {
        const maxCollectibles = 15;
        const currentCollectibles = this.collectibles.getChildren().length;
        const collectiblesToSpawn = maxCollectibles - currentCollectibles;

        // Define safe zones where collectibles can spawn - expanded and more distributed
        const safeZones = [
            // Left side zones
            { x1: 50, y1: 50, x2: 250, y2: 250 },
            { x1: 50, y1: 800, x2: 250, y2: 1000 },
            { x1: 50, y1: 1600, x2: 250, y2: 1800 },
            
            // Center-left zones
            { x1: 600, y1: 400, x2: 800, y2: 600 },
            { x1: 600, y1: 1200, x2: 800, y2: 1400 },
            { x1: 600, y1: 1800, x2: 800, y2: 2000 },
            
            // Center-right zones
            { x1: 1200, y1: 200, x2: 1400, y2: 400 },
            { x1: 1200, y1: 1000, x2: 1400, y2: 1200 },
            { x1: 1200, y1: 1600, x2: 1400, y2: 1800 },
            
            // Far right zones
            { x1: 1800, y1: 400, x2: 2000, y2: 600 },
            { x1: 1800, y1: 1200, x2: 2000, y2: 1400 },
            { x1: 1800, y1: 1800, x2: 2000, y2: 2000 }
        ];

        for (let i = 0; i < collectiblesToSpawn; i++) {
            // Pick a random safe zone
            const zone = safeZones[Math.floor(Math.random() * safeZones.length)];
            
            // Generate position within the safe zone
            const x = Phaser.Math.Between(zone.x1, zone.x2);
            const y = Phaser.Math.Between(zone.y1, zone.y2);

            // Randomly choose item type with adjusted spawn rates
            const rand = Math.random();
            let type;
            if (rand < 0.95) {  // Beer at 95%
                type = 'beer';
            } else if (rand < 0.985) {  // Whiskey at 3.5%
                type = 'whiskey';
            } else if (rand < 0.99) {  // Bags at 0.5%
                type = 'bag';
            } else {  // Narcan increased to 1% (from 0.5%)
                type = 'narcan';
            }

            const collectible = this.physics.add.sprite(x, y, type);
            collectible.setScale(0.8);
            if (type === 'bag') {
                collectible.setScale(0.9);
            } else if (type === 'narcan') {
                collectible.setScale(0.7);  // Slightly smaller scale for narcan
            }
            this.collectibles.add(collectible);
        }
    }

    private addPoints(basePoints: number) {
        const multiplier = this.time.now < this.scoreMultiplierEndTime ? 5 : 1;
        this.score += basePoints * multiplier;
        this.scoreText?.setText(`Score: ${this.score}`);
    }

    private collectBeer(beer: Phaser.GameObjects.Sprite) {
        this.buzzLevel += 4.5;
        this.score += 10;
        this.updateScore();
        // ... existing code ...
    }

    private collectWhiskey(whiskey: Phaser.GameObjects.Sprite) {
        this.buzzLevel = 100;
        this.score += 50;
        this.updateScore();
        // ... existing code ...
    }

    private collectBag(bag: Phaser.GameObjects.Sprite) {
        this.buzzLevel *= 0.8;
        this.score += 5;
        this.updateScore();
        // ... existing code ...
    }

    private updateScore() {
        this.scoreText?.setText(`Score: ${this.score}`);
    }

    private gameOver() {
        // Get current username
        const username = localStorage.getItem('currentUsername') || 'Anonymous';
        
        // Save score to leaderboard
        this.saveScore(username, this.score);
        
        // Pass score to death scene
        this.scene.start('DeathScene', { 
            score: this.score,
            timeAlive: this.timeAlive
        });
    }

    private async saveScore(username: string, score: number) {
        try {
            const response = await fetch('https://api.jimbando.com/scores', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    username,
                    score,
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
} 