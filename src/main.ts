import { GameEngine } from './game/GameEngine';
import { UIManager } from './ui/UIManager';
import { AudioManager } from './audio/AudioManager';

const gameEngine = new GameEngine();
const uiManager = new UIManager(gameEngine);
const audioManager = new AudioManager();

gameEngine.setAudioManager(audioManager);
gameEngine.setUIManager(uiManager);

gameEngine.init();

window.addEventListener('resize', () => {
  gameEngine.handleResize();
});
