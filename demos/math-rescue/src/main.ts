import Phaser from "phaser";
import "./style.css";
import { BootScene } from "./game/scenes/BootScene";
import { MenuScene } from "./game/scenes/MenuScene";
import { PlayScene } from "./game/scenes/PlayScene";
import { ResultScene } from "./game/scenes/ResultScene";
import { GAME_HEIGHT, GAME_WIDTH } from "./game/data/gameConfig";

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: "game-container",
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  backgroundColor: "#8fdcf7",
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  scene: [BootScene, MenuScene, PlayScene, ResultScene],
};

new Phaser.Game(config);
