import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';
import { GLTFLoader } from 'https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/loaders/GLTFLoader.js';

const loader = new GLTFLoader();

export const VEHICLE_MODELS = {
  // Skins con modelos GLB
  'yellow-neon': {
    modelUrl: 'https://models.readyplayer.me/64fbc38fdda0d629a1e07ee2.glb', // Ej: vehículo simple
    scale: 1.0
  },
  'cyan-ghost': {
    modelUrl: 'https://models.readyplayer.me/62d6e5f9e1b40900afdbadd8.glb',
    scale: 1.0
  },
  'magenta-phantom': {
    modelUrl: 'https://models.readyplayer.me/62ca3c97e1b40900afd9c1e4.glb',
    scale: 1.0
  },
  'orange-blaze': {
    modelUrl: 'https://models.readyplayer.me/62d5de9ce1b40900afdadd4c.glb',
    scale: 1.0
  }
};

export const ACCESSORY_MODELS = {
  'spoiler-carbon': {
    modelUrl: 'https://models.readyplayer.me/example-spoiler.glb',
    position: { x: 0, y: 0.4, z: -1 },
    scale: 0.8
  },
  'wheels-chrome': {
    modelUrl: 'https://models.readyplayer.me/example-wheels.glb',
    position: { x: 0, y: 0, z: 0 },
    scale: 1.0
  },
  'underglow-cyan': {
    modelUrl: 'https://models.readyplayer.me/example-underglow.glb',
    position: { x: 0, y: -0.4, z: 0 },
    scale: 1.0
  }
};

export class VehicleLoader {
  static loadModel(modelUrl) {
    return new Promise((resolve, reject) => {
      loader.load(
        modelUrl,
        (gltf) => {
          const model = gltf.scene;
          // Optimizaciones
          model.traverse((child) => {
            if (child.isMesh) {
              child.castShadow = true;
              child.receiveShadow = true;
              // Mejorar materiales
              if (child.material) {
                child.material.metalness = 0.6;
                child.material.roughness = 0.4;
              }
            }
          });
          resolve(model);
        },
        undefined,
        (error) => {
          console.error('Error loading model:', modelUrl, error);
          reject(error);
        }
      );
    });
  }
  
  static async applyVehicleSkin(car, skinId) {
    const vehicleInfo = VEHICLE_MODELS[skinId];
    if (!vehicleInfo) return;
    
    try {
      const model = await this.loadModel(vehicleInfo.modelUrl);
      model.scale.set(vehicleInfo.scale, vehicleInfo.scale, vehicleInfo.scale);
      
      // Reemplazar o agregar modelo al coche
      if (car.vehicleModel) {
        car.group.remove(car.vehicleModel);
      }
      
      car.vehicleModel = model;
      car.group.add(model);
      
    } catch (error) {
      console.error('Failed to load vehicle skin:', skinId);
      // Fallback: usar modelo procedural
      throw error;
    }
  }
  
  static async applyAccessory(car, accessoryId) {
    const accInfo = ACCESSORY_MODELS[accessoryId];
    if (!accInfo) return;
    
    try {
      const model = await this.loadModel(accInfo.modelUrl);
      model.scale.set(accInfo.scale, accInfo.scale, accInfo.scale);
      model.position.set(accInfo.position.x, accInfo.position.y, accInfo.position.z);
      
      car.group.add(model);
      
    } catch (error) {
      console.error('Failed to load accessory:', accessoryId);
      throw error;
    }
  }
}
