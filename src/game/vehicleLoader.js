// Vehicle loader for GLB models with procedural fallback
// Uses global THREE from CDN and GLTFLoader from local file

export class VehicleLoader {
  // Shared loading manager
  static loadingManager = new THREE.LoadingManager();
  static isAllLoaded = false;
  
  // Vehicle configurations with local GLTF models
  static VEHICLE_MODELS = {
    'vehicle-1': {
      name: 'Cyber Sportster',
      url: './assets/models/low_poly/scene.gltf',
      scale: 2.2,
      position: { x: 0, y: 0, z: 0 },
      rotation: { x: 0, y: Math.PI, z: 0 },
      defaultSkin: 'cyber-yellow'
    },
    'vehicle-2': {
      name: 'Neon Racer',
      url: './assets/models/free/scene.gltf',
      scale: 0.015,
      position: { x: 0, y: 0, z: 0 },
      rotation: { x: 0, y: Math.PI, z: 0 },
      defaultSkin: 'neon-blue'
    },
    'vehicle-3': {
      name: 'Synthwave Coupe',
      url: './assets/models/muscle/scene.gltf',
      scale: 0.012,
      position: { x: 0, y: 0, z: 0 },
      rotation: { x: 0, y: Math.PI, z: 0 },
      defaultSkin: 'magenta-dream'
    },
    'vehicle-4': {
      name: 'Future Speedster',
      url: './assets/models/blnk/scene.gltf',
      scale: 0.6,
      position: { x: 0, y: 0, z: 0 },
      rotation: { x: 0, y: Math.PI, z: 0 },
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
      const loader = new window.GLTFLoader(this.loadingManager);
      this.loaderCache.set(vehicleId, loader);
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
        // Set timeout fallback
        const timeout = setTimeout(() => {
          console.warn(`Load timeout for ${vehicleId}, using fallback`);
          this.loadProceduralFallback(car, modelConfig.defaultSkin);
          resolve(false);
        }, 5000);

        loader.load(
          modelConfig.url,
          (gltf) => {
            clearTimeout(timeout);
            const model = gltf.scene;
            
            // Fix materials and orientation
            this.prepareModel(model);
            
            // Cache the loaded model
            this.modelCache.set(vehicleId, model.clone());
            
            // Attach to car
            this.attachModelToCar(model, car, modelConfig);
            
            console.log(`Successfully loaded GLB model for ${vehicleId}`);
            resolve(true);
          },
          (progress) => {
            if (progress.total > 0) {
              const percent = Math.round((progress.loaded / progress.total) * 100);
              // console.log(`Loading ${vehicleId}: ${percent}%`);
            }
          },
          (error) => {
            clearTimeout(timeout);
            console.warn(`Failed to load GLB model for ${vehicleId}:`, error);
            this.loadProceduralFallback(car, modelConfig.defaultSkin);
            resolve(false);
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
   * Prepare model: fix orientation, materials, etc.
   */
  static prepareModel(model) {
    let meshCount = 0;
    const materials = new Set();

    model.traverse(child => {
      if (child.isMesh) {
        meshCount++;
        // Fix black materials by replacing with MeshStandardMaterial
        const oldMat = child.material;
        const color = oldMat.color ? oldMat.color.clone() : new THREE.Color(0xff0000);
        
        // Success criteria: Red metallic paint visible
        child.material = new THREE.MeshStandardMaterial({
          color: color,
          metalness: 0.5,
          roughness: 0.4,
          side: THREE.DoubleSide,
          map: oldMat.map,
          normalMap: oldMat.normalMap,
          emissive: oldMat.emissive ? oldMat.emissive.clone() : new THREE.Color(0x000000),
          emissiveIntensity: oldMat.emissiveIntensity || 0
        });
        
        if (child.material.map) materials.add('texture');
        materials.add(child.material.type);
        
        // Ensure lighting environment map is applied later if available
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });

    // Debug log: print loaded materials, textures, geometry per vehicle
    console.log(`Model preparation complete:
      Meshes: ${meshCount}
      Materials: ${Array.from(materials).join(', ')}
      Hierarchy: ${model.children.length} root children`);
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
    if (typeof modelConfig.scale === 'number') {
      model.scale.setScalar(modelConfig.scale);
    } else if (modelConfig.scale) {
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
    
    // Find wheels in GLB model
    car.wheels = [];
    model.traverse(child => {
      if (child.isMesh && (child.name.toLowerCase().includes('wheel') || child.name.toLowerCase().includes('tire'))) {
        car.wheels.push(child);
      }
    });
    
    // Adjust bounding box for car physics body if needed
    const box = new THREE.Box3().setFromObject(model);
    const size = box.getSize(new THREE.Vector3());
    
    // Update car radius based on model width (X axis)
    // We use a bit of margin for better gameplay
    car.radius = size.x * 0.45;
    
    console.log(`Loaded vehicle size: ${size.x.toFixed(2)}, ${size.y.toFixed(2)}, ${size.z.toFixed(2)} for ${modelConfig.name}`);
    console.log(`Updated car radius to: ${car.radius.toFixed(2)}`);
    console.log(`Found ${car.wheels.length} wheels in model`);
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
        // Ensure we are using MeshStandardMaterial for better lighting
        if (!(child.material instanceof THREE.MeshStandardMaterial)) {
          const oldMat = child.material;
          child.material = new THREE.MeshStandardMaterial({
            map: oldMat.map,
            normalMap: oldMat.normalMap,
            side: THREE.DoubleSide
          });
        }
        
        // We only want to change the color of the "body" parts.
        // Heuristic: if it's not a wheel/tire and not glass/window
        const name = child.name.toLowerCase();
        const isBody = !name.includes('wheel') && !name.includes('tire') && !name.includes('glass') && !name.includes('window');
        
        if (isBody) {
          child.material.color.setHex(color);
          child.material.metalness = 0.7;
          child.material.roughness = 0.2;
          
          if (child.material.emissive) {
            child.material.emissive.setHex(color);
            child.material.emissiveIntensity = 0.2;
          }
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