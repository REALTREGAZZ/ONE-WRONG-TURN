// Vehicle loader for GLB models with procedural fallback
// Uses global THREE from CDN and GLTFLoader from local file

export class VehicleLoader {
  // Vehicle configurations with local GLTF models
  static VEHICLE_MODELS = {
    'vehicle-1': {
      name: 'Cyber Sportster',
      url: './assets/models/low_poly/scene.gltf',
      scale: { x: 0.6, y: 0.6, z: 0.6 },
      position: { x: 0, y: -0.1, z: 0 },
      rotation: { x: 0, y: 0, z: 0 },
      defaultSkin: 'cyber-yellow'
    },
    'vehicle-2': {
      name: 'Neon Racer',
      url: './assets/models/free/scene.gltf',
      scale: { x: 0.8, y: 0.8, z: 0.8 },
      position: { x: 0, y: -0.4, z: 0 },
      rotation: { x: 0, y: Math.PI, z: 0 },
      defaultSkin: 'neon-blue'
    },
    'vehicle-3': {
      name: 'Synthwave Coupe',
      url: './assets/models/muscle/scene.gltf',
      scale: { x: 0.2, y: 0.2, z: 0.2 },
      position: { x: 0, y: -0.2, z: 0 },
      rotation: { x: 0, y: 0, z: 0 },
      defaultSkin: 'magenta-dream'
    },
    'vehicle-4': {
      name: 'Future Speedster',
      url: './assets/models/blnk/scene.gltf',
      scale: { x: 0.2, y: 0.2, z: 0.2 },
      position: { x: 0, y: 0.1, z: 0 },
      rotation: { x: 0, y: 0, z: 0 },
      defaultSkin: 'orange-blaze'
    }
  };

  // Cache for loaded models
  static modelCache = new Map();

  // Cache for GLTFLoaders per vehicle type
  static loaderCache = new Map();

  /**
   * Get or create a GLTFLoader for a specific vehicle
   */
  static getLoader(vehicleId) {
    if (!this.loaderCache.has(vehicleId)) {
      if (typeof window.GLTFLoader === 'undefined') {
        console.warn('GLTFLoader not available globally');
        return null;
      }
      this.loaderCache.set(vehicleId, new window.GLTFLoader());
    }
    return this.loaderCache.get(vehicleId);
  }

  /**
   * Load and instantiate a GLB vehicle model
   */
  static async loadVehicleModel(vehicleId, car) {
    const modelConfig = this.VEHICLE_MODELS[vehicleId];
    if (!modelConfig) {
      console.warn(`Unknown vehicle type: ${vehicleId}`);
      return this.loadProceduralFallback(car, modelConfig?.defaultSkin);
    }

    // Check cache first
    if (this.modelCache.has(vehicleId)) {
      const cachedModel = this.modelCache.get(vehicleId);
      this.attachModelToCar(cachedModel.clone(), car, modelConfig);
      return true;
    }

    try {
      const loader = this.getLoader(vehicleId);
      if (!loader) {
        throw new Error('GLTFLoader not available');
      }

      console.log(`Loading GLB model for ${vehicleId}: ${modelConfig.url}`);
      
      return new Promise((resolve, reject) => {
        loader.load(
          modelConfig.url,
          (gltf) => {
            const model = gltf.scene;
            
            // Cache the loaded model
            this.modelCache.set(vehicleId, model.clone());
            
            // Attach to car
            this.attachModelToCar(model, car, modelConfig);
            
            console.log(`Successfully loaded GLB model for ${vehicleId}`);
            resolve(true);
          },
          (progress) => {
            // Progress callback - could be used for loading UI
            if (progress.total > 0) {
              const percent = Math.round((progress.loaded / progress.total) * 100);
              console.log(`Loading ${vehicleId}: ${percent}%`);
            }
          },
          (error) => {
            console.warn(`Failed to load GLB model for ${vehicleId}:`, error);
            this.loadProceduralFallback(car, modelConfig.defaultSkin);
            resolve(false); // Resolve instead of reject to maintain game flow
          }
        );
      });

    } catch (error) {
      console.warn(`Error loading GLB model for ${vehicleId}:`, error);
      this.loadProceduralFallback(car, modelConfig.defaultSkin);
      return false;
    }
  }

  /**
   * Attach a loaded model to the car
   */
  static attachModelToCar(model, car, modelConfig) {
    // Clear existing model
    while (car.model.children.length > 0) {
      car.model.remove(car.model.children[0]);
    }

    // Apply model configuration
    if (modelConfig.scale) {
      model.scale.set(modelConfig.scale.x, modelConfig.scale.y, modelConfig.scale.z);
    }
    if (modelConfig.position) {
      model.position.set(modelConfig.position.x, modelConfig.position.y, modelConfig.position.z);
    }
    if (modelConfig.rotation) {
      model.rotation.set(modelConfig.rotation.x, modelConfig.rotation.y, modelConfig.rotation.z);
    }

    // Add to car model
    car.model.add(model);

    // Set reference for skin application
    car.currentModel = model;
    car.modelType = 'glb';
  }

  /**
   * Load procedural fallback when GLB fails
   */
  static loadProceduralFallback(car, skinId = 'cyber-yellow') {
    console.log('Loading procedural vehicle fallback');
    
    // Clear any existing GLB model
    while (car.model.children.length > 0) {
      car.model.remove(car.model.children[0]);
    }
    
    // Recreate procedural vehicle
    car.createProceduralVehicle();
    
    // Apply skin
    car.applySkin(skinId);
    
    // Mark as procedural
    car.modelType = 'procedural';
    car.currentModel = null;
  }

  /**
   * Apply vehicle skin to either GLB or procedural model
   */
  static async applyVehicleSkin(car, skinId) {
    if (car.modelType === 'glb' && car.currentModel) {
      // For GLB models, try to find and modify materials
      this.applySkinToGLBModel(car.currentModel, skinId);
    } else {
      // For procedural models, use existing method
      car.applySkin(skinId);
    }
  }

  /**
   * Apply skin to GLB model by modifying materials
   */
  static applySkinToGLBModel(model, skinId) {
    const skinColors = {
      'cyber-yellow': 0xffff00,
      'neon-blue': 0x00ffff,
      'magenta-dream': 0xff00ff,
      'orange-blaze': 0xff6b35,
      'ghost-cyan': 0x00ffff,
      'synth-pink': 0xff1493,
      'lime-neon': 0x32cd32,
      'purple-haze': 0x8a2be2
    };

    const color = skinColors[skinId] || 0xffff00;

    // Traverse model and modify materials
    model.traverse((child) => {
      if (child.isMesh && child.material) {
        // Preserve original material properties but change color
        if (child.material.color) {
          child.material.color.setHex(color);
        }
        if (child.material.emissive) {
          child.material.emissive.setHex(color);
          child.material.emissiveIntensity = 0.3;
        }
        child.material.needsUpdate = true;
      }
    });
  }

  /**
   * Apply accessories to either GLB or procedural model
   */
  static async applyAccessory(car, accessoryId) {
    if (car.modelType === 'glb' && car.currentModel) {
      // For GLB models, add accessories as additional meshes
      this.addAccessoryToGLBModel(car.currentModel, accessoryId);
    } else {
      // For procedural models, use existing method
      car.applyAccessories([accessoryId]);
    }
  }

  /**
   * Add accessory to GLB model
   */
  static addAccessoryToGLBModel(model, accessoryId) {
    // This would need to be expanded based on specific accessories
    // For now, we'll use the procedural accessory system as reference
    
    if (accessoryId === 'chrome-wheels') {
      // Could modify wheel materials if they exist in the GLB
      model.traverse((child) => {
        if (child.isMesh && child.material && 
            child.material.color && 
            (child.material.color.getHex() === 0x333333 || child.material.color.getHex() === 0x1a1a1a)) {
          child.material.color.setHex(0xff6b35);
          child.material.metalness = 0.9;
          child.material.roughness = 0.1;
          child.material.needsUpdate = true;
        }
      });
    }
    // Add more accessory types as needed
  }

  /**
   * Preload all vehicle models (optional optimization)
   */
  static async preloadAllModels() {
    const promises = Object.keys(this.VEHICLE_MODELS).map(vehicleId => {
      // Create a dummy car for preloading
      const dummyCar = { model: { children: [] }, modelType: 'procedural' };
      return this.loadVehicleModel(vehicleId, dummyCar);
    });

    try {
      await Promise.all(promises);
      console.log('All vehicle models preloaded successfully');
    } catch (error) {
      console.warn('Some vehicle models failed to preload:', error);
    }
  }

  /**
   * Get vehicle model info
   */
  static getVehicleInfo(vehicleId) {
    return this.VEHICLE_MODELS[vehicleId] || null;
  }

  /**
   * Clear model cache (useful for memory management)
   */
  static clearCache() {
    this.modelCache.clear();
    console.log('Vehicle model cache cleared');
  }
}