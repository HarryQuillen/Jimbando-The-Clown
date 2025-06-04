import Phaser from 'phaser';
import { TitleScene } from './scenes/TitleScene';
import { GameScene } from './scenes/GameScene';
import { DeathScene } from './scenes/DeathScene';
import { UsernameScene } from './scenes/UsernameScene';

const config: Phaser.Types.Core.GameConfig = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    parent: 'game',
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { x: 0, y: 0 },
            debug: false
        }
    },
    input: {
        keyboard: true
    },
    scene: [UsernameScene, TitleScene, GameScene, DeathScene]
};

new Phaser.Game(config); 