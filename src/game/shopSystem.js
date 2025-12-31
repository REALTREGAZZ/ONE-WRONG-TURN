export const SHOP_ITEMS = {
  vehicles: [
    {
      id: 'vehicle-1',
      name: 'Cyber Sportster',
      price: 0,
      owned: true,
      type: 'glb',
      description: 'High-tech racer with neon accents.',
      defaultSkin: 'cyber-yellow'
    },
    {
      id: 'vehicle-2',
      name: 'Neon Racer',
      price: 300,
      owned: false,
      type: 'glb',
      description: 'Sleek design with glowing underbody.',
      defaultSkin: 'neon-blue'
    },
    {
      id: 'vehicle-3',
      name: 'Synthwave Coupe',
      price: 300,
      owned: false,
      type: 'glb',
      description: 'Retro-futuristic sports car.',
      defaultSkin: 'magenta-dream'
    },
    {
      id: 'vehicle-4',
      name: 'Future Speedster',
      price: 500,
      owned: false,
      type: 'glb',
      description: 'Ultra-modern performance machine.',
      defaultSkin: 'orange-blaze'
    }
  ],
  skins: [
    {
      id: 'cyber-yellow',
      name: 'Cyber Yellow',
      price: 0,
      owned: true,
      color: 0xffff00,
      description: 'The classic neon yellow.'
    },
    {
      id: 'neon-blue',
      name: 'Neon Blue',
      price: 150,
      owned: false,
      color: 0x00ffff,
      description: 'Electric cyan glow.'
    },
    {
      id: 'magenta-dream',
      name: 'Magenta Dream',
      price: 150,
      owned: false,
      color: 0xff00ff,
      description: 'Psychedelic magenta vibes.'
    },
    {
      id: 'orange-blaze',
      name: 'Orange Blaze',
      price: 200,
      owned: false,
      color: 0xff6b35,
      description: 'Fiery orange intensity.'
    },
    {
      id: 'ghost-cyan',
      name: 'Ghost Cyan',
      price: 150,
      owned: false,
      color: 0x00ffff,
      description: 'Translucent cyan appearance.'
    },
    {
      id: 'synth-pink',
      name: 'Synth Pink',
      price: 150,
      owned: false,
      color: 0xff1493,
      description: 'Hot pink synthwave aesthetic.'
    },
    {
      id: 'lime-neon',
      name: 'Lime Neon',
      price: 200,
      owned: false,
      color: 0x32cd32,
      description: 'Electric lime green glow.'
    },
    {
      id: 'purple-haze',
      name: 'Purple Haze',
      price: 200,
      owned: false,
      color: 0x8a2be2,
      description: 'Deep purple mystique.'
    }
  ],
  accessories: [
    {
      id: 'neon-stripes',
      name: 'Neon Stripes',
      price: 100,
      owned: false,
      type: 'stripe',
      description: 'Racing stripes with glow effect.'
    },
    {
      id: 'spoiler-carbon',
      name: 'Carbon Spoiler',
      price: 150,
      owned: false,
      type: 'spoiler',
      description: 'Aerodynamic carbon fiber spoiler.'
    },
    {
      id: 'chrome-wheels',
      name: 'Chrome Wheels',
      price: 200,
      owned: false,
      type: 'wheels',
      description: 'Shiny chrome wheel upgrade.'
    },
    {
      id: 'underglow-cyan',
      name: 'Cyan Underglow',
      price: 250,
      owned: false,
      type: 'underglow',
      description: 'Underbody neon light strips.'
    }
  ]
};

export class ShopSystem {
  constructor(coinSystem) {
    this.coinSystem = coinSystem;
    this.selectedVehicle = 'vehicle-1'; // Default to first vehicle
    this.selectedSkin = 'cyber-yellow';
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
    // Check vehicles
    for (const item of SHOP_ITEMS.vehicles) {
      if (item.id === itemId) return item;
    }
    // Check skins
    for (const item of SHOP_ITEMS.skins) {
      if (item.id === itemId) return item;
    }
    // Check accessories
    for (const item of SHOP_ITEMS.accessories) {
      if (item.id === itemId) return item;
    }
    return null;
  }
  
  selectVehicle(vehicleId) {
    const vehicle = SHOP_ITEMS.vehicles.find(v => v.id === vehicleId);
    if (vehicle && vehicle.owned) {
      this.selectedVehicle = vehicleId;
      this.saveProgress();
      return true;
    }
    return false;
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
  
  getSelectedVehicle() {
    return SHOP_ITEMS.vehicles.find(v => v.id === this.selectedVehicle) || SHOP_ITEMS.vehicles[0];
  }
  
  getSelectedSkinColor() {
    const skin = SHOP_ITEMS.skins.find(s => s.id === this.selectedSkin);
    return skin ? skin.color : 0xffff00;
  }
  
  saveProgress() {
    localStorage.setItem('owt_shop', JSON.stringify({
      selectedVehicle: this.selectedVehicle,
      selectedSkin: this.selectedSkin,
      selectedAccessories: this.selectedAccessories
    }));
  }
  
  loadProgress() {
    const saved = localStorage.getItem('owt_shop');
    if (saved) {
      try {
        const data = JSON.parse(saved);
        this.selectedVehicle = data.selectedVehicle || 'vehicle-1';
        this.selectedSkin = data.selectedSkin || 'cyber-yellow';
        this.selectedAccessories = data.selectedAccessories || [];
      } catch (e) {
        console.warn('Could not load shop progress');
      }
    }
  }
}
