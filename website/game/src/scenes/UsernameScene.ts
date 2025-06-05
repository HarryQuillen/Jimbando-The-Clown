import { GameScene } from './GameScene';

export class UsernameScene extends Phaser.Scene {
    private usernameInput?: HTMLInputElement;
    private submitButton?: HTMLButtonElement;
    private errorText?: Phaser.GameObjects.Text;
    private usernameDOM?: Phaser.GameObjects.DOMElement;
    private buttonDOM?: Phaser.GameObjects.DOMElement;

    constructor() {
        super({ key: 'UsernameScene' });
    }

    init() {
        console.log("UsernameScene: init");
        // Clean up any existing DOM elements
        this.cleanupDOM();
    }

    create() {
        console.log("UsernameScene: create");
        // Clean up any existing DOM elements first
        this.cleanupDOM();

        // Set background color
        this.cameras.main.setBackgroundColor('#000000');

        // Add title screen background image
        const bg = this.add.image(400, 300, 'jimbando-face');
        bg.setScale(0.5);
        
        // Add title text
        this.add.text(400, 100, 'Jimbando\nThe Drunken Clown:\nRAMPAGE', {
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
        this.usernameInput.placeholder = 'Username';
        
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

        // Add DOM elements to the scene
        this.usernameDOM = this.add.dom(400, 270, this.usernameInput);
        this.buttonDOM = this.add.dom(400, 330, this.submitButton);

        console.log("UsernameScene: DOM elements created");
        console.log("usernameDOM:", this.usernameDOM);
        console.log("buttonDOM:", this.buttonDOM);

        // Add error text (initially hidden)
        this.errorText = this.add.text(400, 370, 'Username must be 3-15 characters', {
            fontFamily: 'Arial',
            fontSize: '20px',
            color: '#ff0000'
        }).setOrigin(0.5).setVisible(false);

        // Add event listeners
        this.submitButton.addEventListener('click', () => this.handleSubmit());
        this.usernameInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.handleSubmit();
            }
        });

        // Add scene event listeners for cleanup
        this.events.on('shutdown', () => {
            console.log("UsernameScene: shutdown event");
            this.cleanupDOM();
        });
        this.events.on('destroy', () => {
            console.log("UsernameScene: destroy event");
            this.cleanupDOM();
        });
    }

    private handleSubmit() {
        const username = this.usernameInput?.value.trim() || '';
        
        if (username.length >= 3 && username.length <= 15) {
            // Store username
            localStorage.setItem('currentUsername', username);
            
            // Clean up DOM elements
            this.cleanupDOM();
            
            // Start the game with proper scene cleanup
            this.scene.stop('GameScene');
            this.scene.remove('GameScene');
            this.scene.add('GameScene', GameScene, true);
            this.scene.start('TitleScene');
        } else {
            this.errorText?.setVisible(true);
        }
    }

    private cleanupDOM() {
        console.log("UsernameScene: cleaning up DOM");
        
        // Remove event listeners
        if (this.submitButton) {
            this.submitButton.removeEventListener('click', () => this.handleSubmit());
        }
        if (this.usernameInput) {
            this.usernameInput.removeEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.handleSubmit();
                }
            });
        }

        // Destroy Phaser DOM elements first
        if (this.usernameDOM) {
            console.log("Destroying usernameDOM");
            this.usernameDOM.destroy();
        }
        if (this.buttonDOM) {
            console.log("Destroying buttonDOM");
            this.buttonDOM.destroy();
        }

        // Remove HTML elements
        this.usernameInput?.remove();
        this.submitButton?.remove();

        // Clear references
        this.usernameInput = undefined;
        this.submitButton = undefined;
        this.usernameDOM = undefined;
        this.buttonDOM = undefined;
    }

    shutdown() {
        console.log("UsernameScene: shutdown");
        this.cleanupDOM();
        this.events.removeAllListeners();
    }

    preload() {
        this.load.image('jimbando-face', 'assets/jimbando-face.png');
    }
} 