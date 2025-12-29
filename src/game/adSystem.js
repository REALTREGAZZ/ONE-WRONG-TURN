// Comprehensive ad system for Poki monetization
// Handles interstitials and rewarded ads with proper flow

let sdk = null;
let adCooldown = false;
let adLastShownTime = 0;
const COOLDOWN_MS = 60000; // 60 second minimum between ads

// Mock ad tracking for testing
let adImpressions = {
  intersticial: 0,
  recompensa: 0
};

function init() {
  // Busca Poki SDK
  sdk = globalThis.PokiSDK || null;
  
  if (sdk) {
    console.log('✅ Poki SDK encontrado - monetización habilitada');
  } else {
    console.log('⚠️ Poki SDK no encontrado - usando modo simulado para pruebas');
  }
}

// Hook para intersticiales (cada 2-3 muertes)
export async function showInterstitialAd() {
  const currentTime = Date.now();
  
  // Verifica cooldown
  if (adCooldown && currentTime - adLastShownTime < COOLDOWN_MS) {
    console.log('⏱️ Advertencia: Los anuncios aún están en cooldown');
    return false;
  }

  console.log('📺 Mostrando anuncio intersticial...');
  adImpressions.intersticial++;
  adCooldown = true;
  adLastShownTime = currentTime;

  // Muestra overlay de ad
  showAdOverlay();

  try {
    if (sdk?.commercialBreak) {
      await sdk.commercialBreak();
      console.log('✅ Anuncio intersticial completado (Poki SDK)');
    } else {
      // Simula ad delay de 2 segundos para pruebas
      await new Promise(resolve => setTimeout(resolve, 2000));
      console.log('✅ Anuncio intersticial completado (simulado)');
    }
  } catch (error) {
    console.error('❌ Fallo al mostrar anuncio intersticial:', error);
  } finally {
    hideAdOverlay();
    // Libera cooldown después de que el anuncio haya terminado
    setTimeout(() => { adCooldown = false; }, 1000);
  }

  return true;
}

// Hook para anuncios recompensados
export async function showRewardedAd(rewardType) {
  console.log(`🎁 Mostrando anuncio recompensado [${rewardType}]...`);
  adImpressions.recompensa++;

  // Muestra overlay de ad
  showAdOverlay('REWARDED');

  let success = false;

  try {
    if (sdk?.rewardedBreak) {
      success = await sdk.rewardedBreak();
      console.log(`✅ Anuncio recompensado ${success ? 'completado' : 'cancelado'} (Poki SDK)`);
    } else {
      // Para pruebas - simula que el jugador completó el ad
      success = true;
      await new Promise(resolve => setTimeout(resolve, 1500));
      console.log('✅ Anuncio recompensado completado (simulado)');
    }
  } catch (error) {
    console.error('❌ Fallo al mostrar anuncio recompensado:', error);
  } finally {
    hideAdOverlay();
  }

  return success;
}

// Hooks del juego para Poki
export async function gameplayStart() {
  if (sdk?.gameplayStart) {
    try {
      sdk.gameplayStart();
      console.log('🎮 gameplayStart() llamado');
    } catch (error) {
      console.error('❌ Error en gameplayStart:', error);
    }
  }
}

export async function gameplayStop() {
  if (sdk?.gameplayStop) {
    try {
      sdk.gameplayStop();
      console.log('🛑 gameplayStop() llamado');
    } catch (error) {
      console.error('❌ Error en gameplayStop:', error);
    }
  }
}

// Funciones de overlay de AD
function showAdOverlay(type = 'INTERSTITIAL') {
  const overlay = document.getElementById('ad-overlay');
  if (overlay) {
    overlay.classList.add('visible');
    overlay.innerHTML = `
      <div>
        ${type === 'REWARDED' ? '🎁' : '📺'} ADVERTISEMENT
        <br><small>Jugando por 2 segundos...</small>
      </div>
    `;
  }
  
  // Deshabilita los botones del juego durante el anuncio
  const restartBtn = document.getElementById('restart');
  if (restartBtn) restartBtn.disabled = true;
  
  const rewardedBtns = document.querySelectorAll('.rewarded-btn');
  rewardedBtns.forEach(btn => btn.disabled = true);
}

function hideAdOverlay() {
  const overlay = document.getElementById('ad-overlay');
  if (overlay) {
    overlay.classList.remove('visible');
  }
  
  // Habilita los botones del juego después del anuncio
  const restartBtn = document.getElementById('restart');
  if (restartBtn) restartBtn.disabled = false;
  
  const rewardedBtns = document.querySelectorAll('.rewarded-btn');
  rewardedBtns.forEach(btn => btn.disabled = false);
}

// Tormenta de análisis
export const adAnalytics = {
  getStats() {
    return { ...adImpressions };
  },
  
  reset() {
    adImpressions = { intersticial: 0, recompensa: 0 };
  }
};

// Initialize when module loads
init();

export default {
  showInterstitialAd,
  showRewardedAd,
  gameplayStart,
  gameplayStop,
  adAnalytics
};