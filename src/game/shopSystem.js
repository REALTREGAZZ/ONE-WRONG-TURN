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
  ],
  accessories: [
    {
      id: 'neon-stripes',
      name: 'Neon Stripes',
      price: 100,
      owned: false,
      type: 'stripe',
      description: 'Racing stripes glow.'
    },
    {
      id: 'spoiler-carbon',
      name: 'Carbon Spoiler',
      price: 150,
      owned: false,
      type: 'spoiler',
      description: 'Aerodynamic edge.'
    },
    {
      id: 'wheels-chrome',
      name: 'Chrome Wheels',
      price: 200,
      owned: false,
      type: 'wheels',
      description: 'Shiny metal rims.'
    },
    {
      id: 'underglow-cyan',
      name: 'Cyan Underglow',
      price: 250,
      owned: false,
      type: 'underglow',
      description: 'Light trails beneath.'
    }
  ]
};

export class ShopSystem {
  constructor(coinSystem) {
    this.coinSystem = coinSystem;
    this.selectedSkin = 'yellow-neon';
    this.selectedAccessories = [];
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
    for (const item of SHOP_ITEMS.accessories) {
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
  
  toggleAccessory(accessoryId) {
    const acc = SHOP_ITEMS.accessories.find(a => a.id === accessoryId);
    if (!acc || !acc.owned) return false;
    
    const index = this.selectedAccessories.indexOf(accessoryId);
    if (index > -1) {
      this.selectedAccessories.splice(index, 1);
    } else {
      this.selectedAccessories.push(accessoryId);
    }
    this.saveProgress();
    return true;
  }
  
  isAccessoryActive(accessoryId) {
    return this.selectedAccessories.includes(accessoryId);
  }
  
  getSelectedSkinColor() {
    const skin = SHOP_ITEMS.skins.find(s => s.id === this.selectedSkin);
    return skin ? skin.color : 0xffff00;
  }
  
  saveProgress() {
    localStorage.setItem('owt_shop', JSON.stringify({
      selectedSkin: this.selectedSkin,
      selectedAccessories: this.selectedAccessories
    }));
  }
  
  loadProgress() {
    const saved = localStorage.getItem('owt_shop');
    if (saved) {
      try {
        const data = JSON.parse(saved);
        this.selectedSkin = data.selectedSkin || 'yellow-neon';
        this.selectedAccessories = data.selectedAccessories || [];
      } catch (e) {
        console.warn('Could not load shop progress');
      }
    }
  }
}
