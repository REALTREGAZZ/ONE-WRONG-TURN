import { GameEngine } from './game/GameEngine';
import { UIManager } from './ui/UIManager';
import { AudioManager } from './audio/AudioManager';

let gameEngine: GameEngine | null = null;
let uiManager: UIManager | null = null;
let audioManager: AudioManager | null = null;

function initializeGame() {
  try {
    console.log('[ONE WRONG TURN] Initializing game components...');

    gameEngine = new GameEngine();
    uiManager = new UIManager(gameEngine);
    audioManager = new AudioManager();

    gameEngine.setAudioManager(audioManager);
    gameEngine.setUIManager(uiManager);

    gameEngine.init();

    window.addEventListener('resize', () => {
      try {
        gameEngine?.handleResize();
      } catch (error) {
        console.error('[ONE WRONG TURN] Error handling resize:', error);
      }
    });

    // Setup cleanup on page unload
    window.addEventListener('beforeunload', () => {
      cleanup();
    });

    console.log('[ONE WRONG TURN] Game initialization complete');
  } catch (error) {
    console.error('[ONE WRONG TURN] Fatal error during initialization:', error);
    // Show user-friendly error message
    const container = document.getElementById('game-container');
    if (container) {
      container.innerHTML = `
        <div style="
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          height: 100vh;
          color: white;
          font-family: 'Courier New', monospace;
          text-align: center;
          padding: 2rem;
        ">
          <h1 style="font-size: 2rem; margin-bottom: 1rem;">ERROR</h1>
          <p style="font-size: 1.2rem; margin-bottom: 2rem;">Failed to initialize game. Please refresh the page.</p>
          <p style="font-size: 1rem; opacity: 0.7;">Check browser console for details</p>
        </div>
      `;
    }
  }
}

function cleanup() {
  console.log('[ONE WRONG TURN] Cleaning up...');

  try {
    if (gameEngine) {
      gameEngine.dispose();
      gameEngine = null;
    }
  } catch (error) {
    console.error('[ONE WRONG TURN] Error during game cleanup:', error);
  }

  try {
    if (audioManager) {
      audioManager.dispose();
      audioManager = null;
    }
  } catch (error) {
    console.error('[ONE WRONG TURN] Error during audio cleanup:', error);
  }

  uiManager = null;

  console.log('[ONE WRONG TURN] Cleanup complete');
}

// Initialize game when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeGame);
} else {
  initializeGame();
}
