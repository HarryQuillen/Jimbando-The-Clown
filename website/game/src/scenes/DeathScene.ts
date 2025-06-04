import { TitleScene } from './TitleScene';
import { GameScene } from './GameScene';

export class DeathScene extends Phaser.Scene {
    private score: number = 0;
    private timeAlive: number = 0;
    private leaderboardData: Array<{username: string, score: number}> = [];
    private leaderboardVisible: boolean = false;

    constructor() {
        super({ key: 'DeathScene' });
    }

    init(data: { score: number, timeAlive: number }) {
        this.score = data.score;
        this.timeAlive = data.timeAlive;
    }

    async create() {
        // Set background color
        this.cameras.main.setBackgroundColor('#000000');

        // Add game over text
        this.add.text(400, 100, 'GAME OVER', {
            fontFamily: 'Arial',
            fontSize: '48px',
            color: '#ff0000'
        }).setOrigin(0.5);

        // Add score text
        this.add.text(400, 200, `Final Score: ${this.score}`, {
            fontFamily: 'Arial',
            fontSize: '32px',
            color: '#ffffff'
        }).setOrigin(0.5);

        // Add time alive text
        const minutes = Math.floor(this.timeAlive / 60);
        const seconds = Math.floor(this.timeAlive % 60);
        this.add.text(400, 250, `Time Alive: ${minutes}:${seconds.toString().padStart(2, '0')}`, {
            fontFamily: 'Arial',
            fontSize: '24px',
            color: '#ffffff'
        }).setOrigin(0.5);

        // Add restart button
        const restartButton = this.add.text(400, 350, 'Play Again', {
            fontFamily: 'Arial',
            fontSize: '32px',
            color: '#ffffff',
            backgroundColor: '#ff0000',
            padding: { x: 20, y: 10 }
        })
        .setOrigin(0.5)
        .setInteractive()
        .on('pointerdown', () => {
            this.scene.start('UsernameScene');
        });

        // Add leaderboard button
        const leaderboardButton = this.add.text(400, 420, 'View Leaderboard', {
            fontFamily: 'Arial',
            fontSize: '32px',
            color: '#ffffff',
            backgroundColor: '#ff0000',
            padding: { x: 20, y: 10 }
        })
        .setOrigin(0.5)
        .setInteractive()
        .on('pointerdown', () => {
            this.toggleLeaderboard();
        });

        // Load initial leaderboard data
        await this.loadLeaderboard();
    }

    private async loadLeaderboard() {
        try {
            const response = await fetch('https://jimbando-the-clown.onrender.com/scores/top');
            if (response.ok) {
                this.leaderboardData = await response.json();
            }
        } catch (error) {
            console.error('Error loading leaderboard:', error);
        }
    }

    private toggleLeaderboard() {
        this.leaderboardVisible = !this.leaderboardVisible;
        
        if (this.leaderboardVisible) {
            // Create leaderboard container
            const container = this.add.container(400, 550);
            
            // Add title
            const title = this.add.text(0, 0, 'Top 5 Scores', {
                fontFamily: 'Arial',
                fontSize: '32px',
                color: '#ffffff'
            }).setOrigin(0.5);
            container.add(title);

            // Add scores
            this.leaderboardData.slice(0, 5).forEach((entry, index) => {
                const y = (index + 1) * 40;
                const text = this.add.text(0, y, `${entry.username}: ${entry.score}`, {
                    fontFamily: 'Arial',
                    fontSize: '24px',
                    color: '#ffffff'
                }).setOrigin(0.5);
                container.add(text);
            });

            // Add close button
            const closeButton = this.add.text(0, 250, 'Close', {
                fontFamily: 'Arial',
                fontSize: '24px',
                color: '#ffffff',
                backgroundColor: '#ff0000',
                padding: { x: 10, y: 5 }
            })
            .setOrigin(0.5)
            .setInteractive()
            .on('pointerdown', () => {
                this.toggleLeaderboard();
            });
            container.add(closeButton);
        } else {
            // Remove all leaderboard elements
            this.children.list.forEach(child => {
                if (child instanceof Phaser.GameObjects.Container) {
                    child.destroy();
                }
            });
        }
    }
} 