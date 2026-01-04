// Universal Platform Manager wrapper
// Uses window.PlatformManager for multi-platform support

// Interstitial ad wrapper
export async function showInterstitialAd() {
  if (window.PlatformManager) {
    try {
      await window.PlatformManager.triggerAd('midroll');
      return true;
    } catch (e) {
      console.error('Error in showInterstitialAd:', e);
      return false;
    }
  }
  return false;
}

// Rewarded ad wrapper  
export async function showRewardedAd(rewardType) {
  if (window.PlatformManager) {
    try {
      return await window.PlatformManager.requestRewardedAd();
    } catch (e) {
      console.error('Error in showRewardedAd:', e);
      return false;
    }
  }
  return false;
}

// Game state hooks wrapper
export async function gameplayStart() {
  if (window.PlatformManager) {
    try {
      window.PlatformManager.triggerGameplayStart();
    } catch (e) {
      console.error('Error in gameplayStart:', e);
    }
  }
}

export async function gameplayStop() {
  if (window.PlatformManager) {
    try {
      window.PlatformManager.triggerGameplayStop();
    } catch (e) {
      console.error('Error in gameplayStop:', e);
    }
  }
}

// Analytics stub (no external tracking)
export const adAnalytics = {
  getStats() {
    return { intersticial: 0, recompensa: 0 };
  },
  reset() {},
};

export default {
  showInterstitialAd,
  showRewardedAd,
  gameplayStart,
  gameplayStop,
  adAnalytics
};
