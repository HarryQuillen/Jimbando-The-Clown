export class UsernameScene extends Phaser.Scene {
    private usernameInput?: HTMLInputElement;
    private submitButton?: HTMLButtonElement;
    private errorText?: Phaser.GameObjects.Text;

    constructor() {
        super({ key: 'UsernameScene' });
    }

    create() {
        // Set background color
        this.cameras.main.setBackgroundColor('#000000');

        // Add title
        this.add.text(400, 100, 'Enter Your Username', {
            fontFamily: 'Arial',
            fontSize: '32px',
            color: '#ffffff'
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
        this.add.dom(400, 200, this.usernameInput);

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
        this.add.dom(400, 300, this.submitButton);

        // Add error text (initially hidden)
        this.errorText = this.add.text(400, 350, 'Username must be 3-15 characters', {
            fontFamily: 'Arial',
            fontSize: '20px',
            color: '#ff0000'
        }).setOrigin(0.5).setVisible(false);

        // Add button click handler
        this.submitButton.addEventListener('click', () => {
            const username = this.usernameInput?.value.trim() || '';
            
            if (username.length >= 3 && username.length <= 15) {
                // Store username in localStorage
                localStorage.setItem('currentUsername', username);
                
                // Clean up DOM elements
                this.usernameInput?.remove();
                this.submitButton?.remove();
                
                // Start the game
                this.scene.start('GameScene');
            } else {
                this.errorText?.setVisible(true);
            }
        });

        // Add enter key handler
        this.usernameInput.addEventListener('keypress', (event) => {
            if (event.key === 'Enter') {
                this.submitButton?.click();
            }
        });
    }

    shutdown() {
        // Clean up DOM elements
        this.usernameInput?.remove();
        this.submitButton?.remove();
    }
} 