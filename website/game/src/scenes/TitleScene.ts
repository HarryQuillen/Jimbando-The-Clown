export class TitleScene extends Phaser.Scene {
    constructor() {
        super({ key: 'TitleScene' });
    }

    preload() {
        // Load the SVG assets
        this.load.svg('jimbando-face', '/src/assets/images/jimbando-face.svg');
    }

    create() {
        // Add Jimbando's face
        const face = this.add.image(400, 250, 'jimbando-face');
        face.setScale(1.5);

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
        this.add.text(400, 400, 'Press SPACE to start', {
            fontFamily: 'Arial',
            fontSize: '24px',
            color: '#ffffff'
        }).setOrigin(0.5);

        // Add blinking effect to the "Press SPACE" text
        this.tweens.add({
            targets: this.children.list[2],
            alpha: 0,
            duration: 500,
            ease: 'Power2',
            yoyo: true,
            repeat: -1
        });

        // Handle space bar press
        this.input.keyboard.once('keydown-SPACE', () => {
            this.scene.start('GameScene');
        });
    }
} 