export class TitleScene extends Phaser.Scene {
    private spaceBar?: Phaser.Input.Keyboard.Key;
    private instructionsPanel?: Phaser.GameObjects.Container;

    constructor() {
        super({ key: 'TitleScene' });
    }

    preload() {
        // Load the image with correct path and format
        this.load.image('jimbando-face', 'assets/jimbando_image.jpg');
    }

    create() {
        // Clean up any existing keyboard bindings
        this.input.keyboard?.removeAllKeys();
        
        // Set background color
        this.cameras.main.setBackgroundColor('#000000');
        
        // Add Jimbando's face
        const face = this.add.image(400, 300, 'jimbando-face');
        face.setScale(0.5);

        // Add title text with arcade style
        const title = this.add.text(400, 100, 'Jimbando\nThe Drunken Clown:\nRAMPAGE', {
            fontFamily: 'Arial Black',
            fontSize: '64px',
            color: '#ff0000',
            align: 'center',
            stroke: '#ffffff',
            strokeThickness: 8
        }).setOrigin(0.5);

        // Add subtitle
        this.add.text(400, 500, 'Press SPACE to start', {
            fontFamily: 'Arial',
            fontSize: '24px',
            color: '#ffffff'
        }).setOrigin(0.5);

        // Add instructions button
        const instructionsButton = this.add.text(400, 550, '[ HOW TO PLAY ]', {
            fontFamily: 'Arial',
            fontSize: '20px',
            color: '#ffff00',
            stroke: '#000000',
            strokeThickness: 4
        }).setOrigin(0.5);

        // Make button interactive
        instructionsButton.setInteractive({ useHandCursor: true });

        // Create instructions panel (initially hidden)
        this.instructionsPanel = this.add.container(400, 300);
        
        // Add semi-transparent background
        const bg = this.add.rectangle(0, 0, 500, 400, 0x000000, 0.9);
        
        // Add instructions text
        const instructions = this.add.text(0, -180, [
            'HOW TO PLAY',
            '',
            '• Use ARROW KEYS to move',
            '',
            'COLLECTIBLES:',
            '• BEER: +3.75 Buzz, 10 Points',
            '• WHISKEY: Full Buzz, 50 Points',
            '• BAG: Speed Boost & 5x Score',
            '• NARCAN: Instant Game Over!',
            '',
            'OBJECTIVE:',
            '• Keep your Buzz Meter above 0',
            '• Collect items for high score',
            '• Avoid the Narcan!',
            '',
            '(Click anywhere to close)'
        ].join('\n'), {
            fontFamily: 'Arial',
            fontSize: '18px',
            color: '#ffffff',
            align: 'center',
            lineSpacing: 5
        }).setOrigin(0.5);

        // Add border
        const border = this.add.rectangle(0, 0, 520, 420, 0xffff00, 0);
        border.setStrokeStyle(4, 0xffff00);

        // Add all elements to the container
        this.instructionsPanel.add([bg, border, instructions]);
        this.instructionsPanel.setDepth(100);
        this.instructionsPanel.setVisible(false);

        // Add hover effects for the button
        instructionsButton.on('pointerover', () => {
            instructionsButton.setColor('#ffffff');
            this.instructionsPanel?.setVisible(true);
        });

        instructionsButton.on('pointerout', () => {
            instructionsButton.setColor('#ffff00');
            if (!this.input.activePointer.isDown) {
                this.instructionsPanel?.setVisible(false);
            }
        });

        // Add click anywhere to close panel
        this.input.on('pointerdown', () => {
            this.instructionsPanel?.setVisible(false);
        });

        // Add blinking effect to the "Press SPACE" text
        this.tweens.add({
            targets: this.children.list[2],
            alpha: 0,
            duration: 500,
            ease: 'Power2',
            yoyo: true,
            repeat: -1
        });

        // Create and store the space bar key
        this.spaceBar = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
        
        // Add one-time event listener
        this.spaceBar.once('down', () => {
            // Add fade out effect
            this.cameras.main.fadeOut(1000);
            this.time.delayedCall(1000, () => {
                // Clean up before transitioning
                if (this.spaceBar) {
                    this.spaceBar.removeAllListeners();
                }
                this.input.keyboard?.removeAllKeys();
                this.scene.start('GameScene');
            });
        });

        // Add fade-in effect
        this.cameras.main.fadeIn(1000);
    }

    shutdown() {
        // Additional cleanup when scene shuts down
        if (this.spaceBar) {
            this.spaceBar.removeAllListeners();
        }
        this.input.keyboard?.removeAllKeys();
    }
} 