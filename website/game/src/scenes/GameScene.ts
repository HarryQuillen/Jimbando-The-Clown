export class GameScene extends Phaser.Scene {
    private player!: Phaser.Physics.Arcade.Sprite;
    private buzzBar!: Phaser.GameObjects.Graphics;
    private buzzLevel: number = 100;
    private lastBuzzDecrease: number = 0;
    private collectibles!: Phaser.Physics.Arcade.Group;
    private walls!: Phaser.Physics.Arcade.StaticGroup;
    private camera!: Phaser.Cameras.Scene2D.Camera;

    constructor() {
        super({ key: 'GameScene' });
    }

    preload() {
        // Load the SVG assets
        this.load.svg('player', '/src/assets/images/jimbando-top.svg');
        this.load.svg('beer', '/src/assets/images/beer.svg');
        this.load.svg('whiskey', '/src/assets/images/whiskey.svg');
    }

    create() {
        // Create a larger world
        this.physics.world.setBounds(0, 0, 2400, 2400);
        
        // Create walls for the maze
        this.createMaze();

        // Create player
        this.player = this.physics.add.sprite(100, 100, 'player');
        this.player.setCollideWorldBounds(true);
        this.player.setScale(0.8);

        // Setup camera to follow player
        this.cameras.main.setBounds(0, 0, 2400, 2400);
        this.cameras.main.startFollow(this.player, true);
        this.cameras.main.setZoom(1);

        // Create collectibles group
        this.collectibles = this.physics.add.group();

        // Create buzz bar (fixed to camera)
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
    }

    private createMaze() {
        this.walls = this.physics.add.staticGroup();

        // Create outer walls
        this.createWall(0, 0, 2400, 40); // Top
        this.createWall(0, 2360, 2400, 40); // Bottom
        this.createWall(0, 0, 40, 2400); // Left
        this.createWall(2360, 0, 40, 2400); // Right

        // Create maze walls - these are just example walls, you can adjust the pattern
        const mazeWalls = [
            // Horizontal walls
            [200, 200, 400, 40],
            [800, 200, 400, 40],
            [400, 400, 800, 40],
            [200, 600, 400, 40],
            [800, 600, 400, 40],
            [400, 800, 800, 40],
            [200, 1000, 1000, 40],
            [1400, 200, 400, 40],
            [1400, 400, 400, 40],
            [1400, 600, 400, 40],
            [1400, 800, 400, 40],
            // Vertical walls
            [200, 200, 40, 400],
            [600, 400, 40, 400],
            [1000, 200, 40, 400],
            [1400, 400, 40, 400],
            [1800, 200, 40, 600],
            [200, 1000, 40, 400],
            [600, 800, 40, 400],
            [1000, 1000, 40, 400],
            [1400, 800, 40, 400]
        ];

        mazeWalls.forEach(([x, y, width, height]) => {
            this.createWall(x, y, width, height);
        });
    }

    private createWall(x: number, y: number, width: number, height: number) {
        const wall = this.add.rectangle(x, y, width, height, 0x666666);
        this.walls.add(wall);
        wall.setOrigin(0, 0);
    }

    update(time: number) {
        // Handle player movement
        const cursors = this.input.keyboard.createCursorKeys();
        const speed = 300; // Increased speed for larger map

        this.player.setVelocity(0);

        if (cursors.left.isDown) {
            this.player.setVelocityX(-speed);
        } else if (cursors.right.isDown) {
            this.player.setVelocityX(speed);
        }

        if (cursors.up.isDown) {
            this.player.setVelocityY(-speed);
        } else if (cursors.down.isDown) {
            this.player.setVelocityY(speed);
        }

        // Normalize diagonal movement
        if (this.player.body?.velocity) {
            const velocity = this.player.body.velocity;
            if (velocity.x !== 0 && velocity.y !== 0) {
                const normalizedVelocity = velocity.normalize().scale(speed);
                this.player.setVelocity(normalizedVelocity.x, normalizedVelocity.y);
            }
        }

        // Decrease buzz level over time
        if (time > this.lastBuzzDecrease + 1000) {
            this.decreaseBuzzLevel();
            this.lastBuzzDecrease = time;
        }

        // Update buzz bar (fixed to camera)
        this.updateBuzzBar();

        // Check game over condition
        if (this.buzzLevel <= 0) {
            this.scene.start('TitleScene');
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
        this.buzzBar.fillRect(10, 10, this.buzzLevel * 2, 20);
    }

    private decreaseBuzzLevel() {
        this.buzzLevel = Math.max(0, this.buzzLevel - 1);
    }

    private handleCollectible(player: Phaser.Physics.Arcade.Sprite, collectible: Phaser.Physics.Arcade.Sprite) {
        collectible.destroy();
        
        // Increase buzz based on type
        const increase = collectible.texture.key === 'beer' ? 5 : 10;
        this.buzzLevel = Math.min(100, this.buzzLevel + increase);

        // Spawn new collectible
        this.spawnCollectibles();
    }

    private spawnCollectibles() {
        const maxCollectibles = 15; // Increased number of collectibles
        const currentCollectibles = this.collectibles.getChildren().length;
        const collectiblesToSpawn = maxCollectibles - currentCollectibles;

        for (let i = 0; i < collectiblesToSpawn; i++) {
            let x, y, canPlace;
            do {
                x = Phaser.Math.Between(50, 2350);
                y = Phaser.Math.Between(50, 2350);
                canPlace = true;

                // Check if position overlaps with walls
                const testBody = this.physics.add.body(x, y, 32, 32);
                const overlaps = this.physics.world.bodies.getArray()
                    .some(body => body !== testBody && Phaser.Geom.Rectangle.Overlaps(body.getBounds(), testBody.getBounds()));
                testBody.destroy();

                if (overlaps) {
                    canPlace = false;
                    continue;
                }
            } while (!canPlace);

            const type = Math.random() > 0.7 ? 'whiskey' : 'beer';
            const collectible = this.physics.add.sprite(x, y, type);
            collectible.setScale(0.8);
            this.collectibles.add(collectible);
        }
    }
} 