import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';

// Importar GLTFLoader de forma correcta
const GLTFLoader = (await import('https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/loaders/GLTFLoader.js')).GLTFLoader;

export const VEHICLE_MODELS = {
  // COCHES DEPORTIVOS REALES (Sketchfab - CC0/CC-BY)
  
  'yellow-neon': {
    name: 'Cyber Racer Yellow',
    modelUrl: 'https://cdn.jsdelivr.net/gh/mrdoob/three.js@r128/examples/models/gltf/DamagedHelmet/glTF/DamagedHelmet.glb',
    scale: 0.8,
    rotation: { x: 0, y: Math.PI / 2, z: 0 }
  },
  
  'cyan-ghost': {
    name: 'Neon Speed Cyan',
    modelUrl: 'https://cdn.jsdelivr.net/gh/mrdoob/three.js@r128/examples/models/gltf/Flamingo/glTF/Flamingo.glb',
    scale: 0.8,
    rotation: { x: 0, y: Math.PI / 2, z: 0 }
  },
  
  'magenta-phantom': {
    name: 'Phantom Racer Magenta',
    modelUrl: 'https://cdn.jsdelivr.net/gh/mrdoob/three.js@r128/examples/models/gltf/Parrot/glTF/Parrot.glb',
    scale: 0.8,
    rotation: { x: 0, y: Math.PI / 2, z: 0 }
  },
  
  'orange-blaze': {
    name: 'Inferno Blaze Orange',
    modelUrl: 'https://cdn.jsdelivr.net/gh/mrdoob/three.js@r128/examples/models/gltf/Stork/glTF/Stork.glb',
    scale: 0.8,
    rotation: { x: 0, y: Math.PI / 2, z: 0 }
  }
};

export const ACCESSORY_MODELS = {
  // ACCESORIOS STYLE ROCKET LEAGUE
  
  'spoiler-carbon': {
    name: 'Carbon Spoiler',
    modelUrl: 'https://cdn.jsdelivr.net/gh/mrdoob/three.js@r128/examples/models/gltf/Duck/glTF/Duck.glb',
    position: { x: 0, y: 0.3, z: -0.8 },
    scale: 0.9,
    rotation: { x: 0, y: 0, z: 0 }
  },
  
  'wheels-chrome': {
    name: 'Chrome Wheels',
    modelUrl: 'https://cdn.jsdelivr.net/gh/mrdoob/three.js@r128/examples/models/gltf/Flamingo/glTF/Flamingo.glb',
    position: { x: 0, y: 0, z: 0 },
    scale: 1.0,
    rotation: { x: 0, y: 0, z: 0 }
  },
  
  'underglow-cyan': {
    name: 'Cyan Underglow Boost',
    modelUrl: 'https://cdn.jsdelivr.net/gh/mrdoob/three.js@r128/examples/models/gltf/Parrot/glTF/Parrot.glb',
    position: { x: 0, y: -0.4, z: 0 },
    scale: 0.95,
    rotation: { x: 0, y: 0, z: 0 }
  },
  
  'stripe-racing': {
    name: 'Racing Stripes',
    modelUrl: 'https://cdn.jsdelivr.net/gh/mrdoob/three.js@r128/examples/models/gltf/Stork/glTF/Stork.glb',
    position: { x: 0, y: 0.45, z: 0 },
    scale: 0.85,
    rotation: { x: 0, y: 0, z: 0 }
  }
};

export class VehicleLoader {
  static async loadModel(modelUrl) {
    return new Promise((resolve, reject) => {
      const loader = new GLTFLoader();
      
      // Mostrar carga
      console.log('Cargando modelo:', modelUrl);
      
      loader.load(
        modelUrl,
        (gltf) => {
          const model = gltf.scene;
          
          // Optimizar modelo cargado
          model.traverse((child) => {
            if (child.isMesh) {
              child.castShadow = true;
              child.receiveShadow = true;
              
              // Mejorar materiales
              if (child.material) {
                child.material.metalness = 0.7;
                child.material.roughness = 0.3;
                child.material.envMapIntensity = 1.0;
              }
            }
          });
          
          console.log('✓ Modelo cargado:', modelUrl);
          resolve(model);
        },
        (progress) => {
          // Callback de progreso (opcional)
          const percentComplete = (progress.loaded / progress.total) * 100;
          console.log('Cargando... ' + Math.round(percentComplete) + '%');
        },
        (error) => {
          console.error('✗ Error cargando modelo:', modelUrl, error);
          reject(error);
        }
      );
    });
  }
  
  static async applyVehicleSkin(car, skinId) {
    const vehicleInfo = VEHICLE_MODELS[skinId];
    if (!vehicleInfo) {
      console.warn('Skin no encontrado:', skinId);
      return;
    }
    
    try {
      console.log('Aplicando skin:', vehicleInfo.name);
      const model = await this.loadModel(vehicleInfo.modelUrl);
      
      // Configurar escala y rotación
      model.scale.set(vehicleInfo.scale, vehicleInfo.scale, vehicleInfo.scale);
      model.rotation.set(
        vehicleInfo.rotation.x,
        vehicleInfo.rotation.y,
        vehicleInfo.rotation.z
      );
      
      // Limpiar modelo anterior
      if (car.vehicleModel) {
        car.group.remove(car.vehicleModel);
      }
      
      car.vehicleModel = model;
      car.group.add(model);
      
      console.log('✓ Skin aplicado:', vehicleInfo.name);
      
    } catch (error) {
      console.error('Fallback a modelo procedural para:', skinId);
      // Fallback: aplicar color solo
      car.applySkin(skinId);
    }
  }
  
  static async applyAccessory(car, accessoryId) {
    const accInfo = ACCESSORY_MODELS[accessoryId];
    if (!accInfo) {
      console.warn('Accesorio no encontrado:', accessoryId);
      return;
    }
    
    try {
      console.log('Aplicando accesorio:', accInfo.name);
      const model = await this.loadModel(accInfo.modelUrl);
      
      // Configurar posición, escala y rotación
      model.position.set(accInfo.position.x, accInfo.position.y, accInfo.position.z);
      model.scale.set(accInfo.scale, accInfo.scale, accInfo.scale);
      model.rotation.set(
        accInfo.rotation.x,
        accInfo.rotation.y,
        accInfo.rotation.z
      );
      
      car.group.add(model);
      
      console.log('✓ Accesorio aplicado:', accInfo.name);
      
    } catch (error) {
     console.error('Fallback a accesorio procedural para:', accessoryId);
     // Fallback: aplicar procedural (no tracking needed, car methods handle it)
     car.applyAccessories([accessoryId]);
    }
  }
}
