export const SHOP_ITEMS = {
  skins: [
    {
      id: 'yellow',
      name: 'Yellow',
      price: 0,
      color: 0xffff00,
      description: 'The classic. Bright and bold.'
    },
    {
      id: 'blue',
      name: 'Blue',
      price: 1500,
      color: 0x0066ff,
      description: 'Cool and confident.'
    },
    {
      id: 'copper',
      name: 'Copper',
      price: 3000,
      color: 0xb87333,
      description: 'Warm metallic shine.'
    },
    {
      id: 'silver',
      name: 'Silver',
      price: 5000,
      color: 0xc0c0c0,
      description: 'Premium elegance.'
    },
    {
      id: 'gold',
      name: 'Gold',
      price: 7500,
      color: 0xffd700,
      description: 'The ultimate luxury.'
    },
    {
      id: 'diamond',
      name: 'Brilliant Diamond',
      price: 10000,
      color: 0xe0ffff,
      description: 'Radiant perfection.'
    }
  ]
};

export class ShopSystem {
  constructor(coinSystem) {
    this.coinSystem = coinSystem;
    this.selectedSkin = 'yellow';
    this.ownedSkins = new Set(['yellow']); // Yellow is owned by default
    this.loadProgress();
  }

  purchaseItem(itemId) {
    const item = this.findItem(itemId);
    if (!item) return false;

    if (this.ownedSkins.has(itemId)) return false; // Already owned

    if (this.coinSystem.spendCoins(item.price)) {
      this.ownedSkins.add(itemId);
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
    if (skin && this.ownedSkins.has(skinId)) {
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

  isOwned(itemId) {
    return this.ownedSkins.has(itemId);
  }

  canAfford(price) {
    return this.coinSystem.getTotal() >= price;
  }

  saveProgress() {
    const data = {
      selectedSkin: this.selectedSkin,
      ownedSkins: Array.from(this.ownedSkins)
    };
    localStorage.setItem('owt_shop', JSON.stringify(data));
  }

  loadProgress() {
    const saved = localStorage.getItem('owt_shop');
    if (saved) {
      try {
        const data = JSON.parse(saved);
        this.selectedSkin = data.selectedSkin || 'yellow';
        if (data.ownedSkins && Array.isArray(data.ownedSkins)) {
          this.ownedSkins = new Set(data.ownedSkins);
          // Ensure yellow is always owned
          this.ownedSkins.add('yellow');
        }
      } catch (e) {
        console.warn('Could not load shop progress', e);
      }
    }
  }

  reset() {
    this.selectedSkin = 'yellow';
    this.ownedSkins = new Set(['yellow']);
    this.saveProgress();
  }
}
