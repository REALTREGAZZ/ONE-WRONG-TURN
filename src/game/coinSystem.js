export class CoinSystem {
  constructor() {
    this.totalCoins = Number(localStorage.getItem('owt_coins') || '0');
    this.currentEarned = 0;
  }
  
  calculateCoinsForDistance(distance) {
    const baseCoins = Math.floor(distance / 10);
    const distanceBonus = Math.floor(distance / 100) * 5;
    return baseCoins + distanceBonus;
  }
  
  earnCoins(distance) {
    const earned = this.calculateCoinsForDistance(distance);
    this.currentEarned = earned;
    this.totalCoins += earned;
    this.save();
    return earned;
  }
  
  spendCoins(amount) {
    if (this.totalCoins >= amount) {
      this.totalCoins -= amount;
      this.save();
      return true;
    }
    return false;
  }
  
  save() {
    localStorage.setItem('owt_coins', String(this.totalCoins));
  }
  
  getTotal() {
    return this.totalCoins;
  }
  
  getCurrentEarned() {
    return this.currentEarned;
  }
  
  reset() {
    this.currentEarned = 0;
  }
}
