export const VEHICLE_MODELS = {
  'yellow-neon': { scale: 1.0 },
  'cyan-ghost': { scale: 1.0 },
  'magenta-phantom': { scale: 1.0 },
  'orange-blaze': { scale: 1.0 },
};

export const ACCESSORY_MODELS = {
  'spoiler-carbon': { position: { x: 0, y: 0.4, z: -1 }, scale: 0.8 },
  'wheels-chrome': { position: { x: 0, y: 0, z: 0 }, scale: 1.0 },
  'underglow-cyan': { position: { x: 0, y: -0.4, z: 0 }, scale: 1.0 },
};

export class VehicleLoader {
  static async applyVehicleSkin(car, skinId) {
    if (car?.applySkin) car.applySkin(skinId);
  }

  static async applyAccessory(car, accessoryId) {
    if (car?.applyAccessories) car.applyAccessories([accessoryId]);
  }
}
