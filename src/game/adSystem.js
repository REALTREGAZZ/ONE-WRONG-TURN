// Clean Poki SDK stubs (no external ad dependencies)
// These forward to PokiSDK if available, otherwise do nothing

function getSDK() {
  return globalThis.PokiSDK || null;
}

// Interstitial ad stub - Poki will call commercialBreak()
export async function showInterstitialAd() {
  const sdk = getSDK();
  if (sdk?.commercialBreak) {
    try {
      await sdk.commercialBreak();
    } catch {
      // ignore
    }
  }
  return false;
}

// Rewarded ad stub - Poki will call rewardedBreak()
export async function showRewardedAd(rewardType) {
  const sdk = getSDK();
  if (sdk?.rewardedBreak) {
    try {
      return await sdk.rewardedBreak();
    } catch {
      return false;
    }
  }
  return false;
}

// Game state hooks for Poki
export async function gameplayStart() {
  const sdk = getSDK();
  if (sdk?.gameplayStart) {
    try {
      sdk.gameplayStart();
    } catch {
      // ignore
    }
  }
}

export async function gameplayStop() {
  const sdk = getSDK();
  if (sdk?.gameplayStop) {
    try {
      sdk.gameplayStop();
    } catch {
      // ignore
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
