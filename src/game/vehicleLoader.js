import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';

export class VehicleLoader {
  // No intentar cargar GLB, solo aplicar colores y procedurales
  static async applyVehicleSkin(car, skinId) {
    // Usar modelo procedural existente
    car.applySkin(skinId);
  }
  
  static async applyAccessory(car, accessoryId) {
    // Usar accesorio procedural existente
    car.applyAccessories([accessoryId]);
  }
}
