export const SHOP_ITEMS = {
  skins: [
    {
      id: 'yellow-neon',
      name: 'Yellow Neon',
      price: 0,
      owned: true,
      color: 0xffff00,
      description: 'The classic. Fast and furious.'
    },
    {
      id: 'cyan-ghost',
      name: 'Cyan Ghost',
      price: 150,
      owned: false,
      color: 0x00ffff,
      description: 'Vanish into the night.'
    },
    {
      id: 'magenta-phantom',
      name: 'Magenta Phantom',
      price: 150,
      owned: false,
      color: 0xff00ff,
      description: 'Liquid metal aesthetic.'
    },
    {
      id: 'orange-blaze',
      name: 'Orange Blaze',
      price: 200,
      owned: false,
      color: 0xff6b35,
      description: 'Leave a trail of fire.'
    }
  ]
  // Accessories removed - keeping only skins
};

export class ShopSystem {
  constructor(coinSystem) {
    this.coinSystem = coinSystem;
    this.selectedSkin = 'yellow-neon';
    this.loadProgress();
  }
  
  purchaseItem(itemId) {
    const item = this.findItem(itemId);
    if (!item) return false;
    
    if (this.coinSystem.spendCoins(item.price)) {
      item.owned = true;
      this.saveProgress();
      return true;
    }
    return false;
  }
  
  findItem(itemId) {
    for (const item of SHOP_ITEMS.skins) {
      if (item.id === itemId) return item;
    }
    return null;
  }
  
  applySkin(skinId) {
    const skin = SHOP_ITEMS.skins.find(s => s.id === skinId);
    if (skin && skin.owned) {
      this.selectedSkin = skinId;
      this.saveProgress();
      return true;
    }
    return false;
  }
  
  getSelectedSkinColor() {
    const skin = SHOP_ITEMS.skins.find(s => s.id === this.selectedSkin);
    return skin ? skin.color : 0xffff00;
  }
  
  saveProgress() {
    localStorage.setItem('owt_shop', JSON.stringify({
      selectedSkin: this.selectedSkin
    }));
  }
  
  loadProgress() {
    const saved = localStorage.getItem('owt_shop');
    if (saved) {
      try {
        const data = JSON.parse(saved);
        this.selectedSkin = data.selectedSkin || 'yellow-neon';
      } catch (e) {
        console.warn('Could not load shop progress');
      }
    }
  }
}
