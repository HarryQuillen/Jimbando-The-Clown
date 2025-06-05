import { TitleScene } from './TitleScene';
import { GameScene } from './GameScene';

export class DeathScene extends Phaser.Scene {
    private score: number = 0;
    private timeAlive: number = 0;
    private leaderboardData: Array<{username: string, score: number}> = [];
    private leaderboardVisible: boolean = false;
    private leaderboardContainer?: Phaser.GameObjects.Container;
    private leaderboardLoading: boolean = false;
    private leaderboardError: boolean = false;

    constructor() {
        super({ key: 'DeathScene' });
    }

    init(data: { score?: number, timeAlive?: number }) {
        // Add debug log
        console.log('DeathScene init data:', data);
        this.score = typeof data.score === 'number' ? data.score : 0;
        this.timeAlive = typeof data.timeAlive === 'number' ? data.timeAlive : 0;
    }

    async create() {
        // Add death screen background image
        this.add.image(400, 300, 'passed-out').setDisplaySize(800, 600);
        // Add semi-transparent overlay for text visibility
        this.add.rectangle(400, 300, 800, 600, 0x000000, 0.5);
        // Add death screen text
        this.add.text(400, 100, 'PASSED OUT', {
            fontFamily: 'Arial Black',
            fontSize: '64px',
            color: '#ff3366',
            align: 'center',
            stroke: '#ffffff',
            strokeThickness: 8
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
            // Clean up any DOM elements if they exist
            if (this.leaderboardContainer) {
                this.leaderboardContainer.destroy();
                this.leaderboardContainer = undefined;
            }
            
            this.cameras.main.fadeOut(1000);
            this.time.delayedCall(1000, () => {
                // Make sure GameScene is stopped and restarted cleanly
                if (this.scene.get('GameScene')) {
                    this.scene.stop('GameScene');
                }
                this.scene.start('TitleScene');
                this.scene.stop(); // Stop DeathScene
            });
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
        this.leaderboardLoading = true;
        this.leaderboardError = false;
        await this.loadLeaderboard();
        this.leaderboardLoading = false;
    }

    private async loadLeaderboard() {
        try {
            const response = await fetch('https://jimbando-the-clown.onrender.com/scores/top');
            if (response.ok) {
                this.leaderboardData = await response.json();
                console.log('Leaderboard data:', this.leaderboardData);
            } else {
                this.leaderboardError = true;
            }
        } catch (error) {
            this.leaderboardError = true;
            console.error('Error loading leaderboard:', error);
        }
    }

    private toggleLeaderboard() {
        // Remove previous leaderboard container if it exists
        this.leaderboardContainer?.destroy();
        this.leaderboardContainer = undefined;
        this.leaderboardVisible = !this.leaderboardVisible;
        if (this.leaderboardVisible) {
            this.leaderboardContainer = this.add.container(400, 350);
            // Add semi-transparent black background
            const bg = this.add.rectangle(0, 60, 400, 320, 0x000000, 0.85).setOrigin(0.5);
            this.leaderboardContainer.add(bg);
            // Add title
            const title = this.add.text(0, -80, 'Top 5 Scores', {
                fontFamily: 'Arial',
                fontSize: '32px',
                color: '#ffffff'
            }).setOrigin(0.5);
            this.leaderboardContainer.add(title);
            if (this.leaderboardLoading) {
                const loadingText = this.add.text(0, 50, 'Loading...', {
                    fontFamily: 'Arial',
                    fontSize: '24px',
                    color: '#ffffff'
                }).setOrigin(0.5);
                this.leaderboardContainer.add(loadingText);
            } else if (this.leaderboardError) {
                const errorText = this.add.text(0, 50, 'Failed to load leaderboard.', {
                    fontFamily: 'Arial',
                    fontSize: '24px',
                    color: '#ff0000'
                }).setOrigin(0.5);
                this.leaderboardContainer.add(errorText);
            } else if (this.leaderboardData.length === 0) {
                const noScoresText = this.add.text(0, 50, 'No scores yet!', {
                    fontFamily: 'Arial',
                    fontSize: '24px',
                    color: '#ffffff'
                }).setOrigin(0.5);
                this.leaderboardContainer.add(noScoresText);
            } else {
                this.leaderboardData.slice(0, 5).forEach((entry, index) => {
                    const y = (index + 1) * 40;
                    const text = this.add.text(0, y, `${entry.username}: ${entry.score}`, {
                        fontFamily: 'Arial',
                        fontSize: '24px',
                        color: '#ffffff'
                    }).setOrigin(0.5);
                    this.leaderboardContainer.add(text);
                });
            }
            // Add close button
            const closeButton = this.add.text(0, 180, 'Close', {
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
            this.leaderboardContainer.add(closeButton);
        }
    }

    preload() {
        this.load.image('passed-out', 'assets/passed_out.jpeg');
    }
} 