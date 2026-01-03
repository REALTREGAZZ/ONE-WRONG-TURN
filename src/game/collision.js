import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';

export function checkWallCollision(car, roadSample) {
  const half = roadSample.width * 0.5 - car.radius;
  const distanceFromCenter = Math.abs(car.group.position.x - roadSample.centerX);

  if (distanceFromCenter > half) {
    return { crashed: true, grazed: false };
  }

  const grazeThreshold = car.rootConfig?.sparks?.grazeThreshold || 0.15;
  const margin = half - grazeThreshold;

  if (distanceFromCenter > margin) {
    const normalX = car.group.position.x > roadSample.centerX ? 1 : -1;
    return { crashed: false, grazed: true, normal: new THREE.Vector3(normalX, 0, 0) };
  }

  return { crashed: false, grazed: false };
}
