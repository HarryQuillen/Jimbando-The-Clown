import { GameScene } from './GameScene';

export class TitleScene extends Phaser.Scene {
    private spaceBar?: Phaser.Input.Keyboard.Key;
    private instructionsPanel?: Phaser.GameObjects.Container;
    private usernameInput?: HTMLInputElement;
    private submitButton?: HTMLButtonElement;
    private usernameDOM?: Phaser.GameObjects.DOMElement;
    private buttonDOM?: Phaser.GameObjects.DOMElement;

    constructor() {
        super({ key: 'TitleScene' });
    }

    preload() {
        // Load the correct image for the title screen
        this.load.image('jimbando-image', 'assets/jimbando-image.png');
    }

    create() {
        // Clean up any existing keyboard bindings
        this.input.keyboard?.removeAllKeys();
        
        // Set background color
        this.cameras.main.setBackgroundColor('#000000');
        
        // Reset camera effects and fade in
        this.cameras.main.resetFX();
        this.cameras.main.fadeIn(1000);
        
        // Add Jimbando's image as full-screen background
        const background = this.add.image(400, 300, 'jimbando-image');
        background.setDisplaySize(800, 600); // Set to match game dimensions
        background.setDepth(-1); // Ensure it's behind other elements

        // Add semi-transparent overlay for better text visibility
        const overlay = this.add.rectangle(400, 300, 800, 600, 0x000000, 0.3); // Reduced opacity
        overlay.setDepth(-0.5);

        // Add title text with arcade style
        const title = this.add.text(400, 100, 'Jimbando\nThe Drunken Clown:\nRAMPAGE', {
            fontFamily: 'Arial Black',
            fontSize: '64px',
            color: '#ff0000',
            align: 'center',
            stroke: '#ffffff',
            strokeThickness: 8
        }).setOrigin(0.5);

        // Create HTML input element
        this.usernameInput = document.createElement('input');
        this.usernameInput.type = 'text';
        this.usernameInput.maxLength = 15;
        this.usernameInput.style.width = '200px';
        this.usernameInput.style.height = '30px';
        this.usernameInput.style.fontSize = '20px';
        this.usernameInput.style.textAlign = 'center';
        this.usernameInput.placeholder = 'Enter Username';
        
        // Create submit button
        this.submitButton = document.createElement('button');
        this.submitButton.textContent = 'Start Game';
        this.submitButton.style.width = '200px';
        this.submitButton.style.height = '40px';
        this.submitButton.style.fontSize = '20px';
        this.submitButton.style.backgroundColor = '#ff0000';
        this.submitButton.style.color = '#ffffff';
        this.submitButton.style.border = 'none';
        this.submitButton.style.cursor = 'pointer';
        this.submitButton.style.marginTop = '10px';

        // Add DOM elements to the scene
        this.usernameDOM = this.add.dom(400, 350, this.usernameInput);
        this.buttonDOM = this.add.dom(400, 400, this.submitButton);

        // Add instructions button
        const instructionsButton = this.add.text(400, 500, '[ HOW TO PLAY ]', {
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

        // Handle start game button click
        this.submitButton.onclick = () => {
            const username = this.usernameInput?.value.trim() || 'Anonymous';
            if (username) {
                localStorage.setItem('currentUsername', username);
                
                // Clean up DOM elements first
                if (this.usernameDOM) {
                    this.usernameDOM.destroy();
                }
                if (this.buttonDOM) {
                    this.buttonDOM.destroy();
                }
                
                this.cameras.main.fadeOut(1000);
                this.time.delayedCall(1000, () => {
                    this.scene.start('GameScene');
                });
            }
        };

        // Add fade-in effect
        this.cameras.main.fadeIn(1000);
    }

    shutdown() {
        if (this.usernameDOM) {
            this.usernameDOM.destroy();
        }
        if (this.buttonDOM) {
            this.buttonDOM.destroy();
        }
        this.input.keyboard?.removeAllKeys();
    }
} 