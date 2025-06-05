import Phaser from 'phaser';
import { TitleScene } from './scenes/TitleScene';
import { GameScene } from './scenes/GameScene';
import { DeathScene } from './scenes/DeathScene';

// Define scene keys as constants to avoid typos
const SCENES = {
    TITLE: 'TitleScene',
    GAME: 'GameScene',
    DEATH: 'DeathScene'
} as const;

const config: Phaser.Types.Core.GameConfig = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    parent: 'game',
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { x: 0, y: 0 },
            fps: 60
        }
    },
    input: {
        keyboard: true
    },
    dom: {
        createContainer: true
    },
    scene: [TitleScene, GameScene, DeathScene]
};

export { SCENES };
new Phaser.Game(config); 