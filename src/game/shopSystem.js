export const SHOP_ITEMS = {
  skins: [
    {
      id: 'red',
      name: 'Red',
      price: 0,
      owned: true,
      color: 0xFF0000,
      description: 'Classic red car.'
    },
    {
      id: 'blue',
      name: 'Blue',
      price: 100,
      owned: false,
      color: 0x0000FF,
      description: 'Cool blue.'
    },
    {
      id: 'green',
      name: 'Green',
      price: 100,
      owned: false,
      color: 0x00FF00,
      description: 'Fresh green.'
    },
    {
      id: 'yellow',
      name: 'Yellow',
      price: 100,
      owned: false,
      color: 0xFFFF00,
      description: 'Bright yellow.'
    }
  ]
};

export class ShopSystem {
  constructor(coinSystem) {
    this.coinSystem = coinSystem;
    this.selectedSkin = 'red'; // Default to red
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
    // Check skins only
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
    return skin ? skin.color : 0xFF0000;
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
        this.selectedSkin = data.selectedSkin || 'red';
      } catch (e) {
        console.warn('Could not load shop progress');
      }
    }
  }
}
