// Poki hook structure (no SDK required here). If PokiSDK is present, we forward calls.
//
// Typical usage:
// - gameplayStart() when the run begins
// - gameplayStop() on crash
// - commercialBreak() every N deaths
// - rewardedBreak() for optional power-ups

function getSDK() {
  return globalThis.PokiSDK || null;
}

export async function gameplayStart() {
  const sdk = getSDK();
  if (!sdk?.gameplayStart) return;
  try {
    sdk.gameplayStart();
  } catch {
    // ignore
  }
}

export async function gameplayStop() {
  const sdk = getSDK();
  if (!sdk?.gameplayStop) return;
  try {
    sdk.gameplayStop();
  } catch {
    // ignore
  }
}

export async function commercialBreak() {
  const sdk = getSDK();
  if (!sdk?.commercialBreak) return;
  try {
    await sdk.commercialBreak();
  } catch {
    // ignore
  }
}

export async function rewardedBreak() {
  const sdk = getSDK();
  if (!sdk?.rewardedBreak) return false;

  try {
    const result = await sdk.rewardedBreak();
    return !!result;
  } catch {
    return false;
  }
}
