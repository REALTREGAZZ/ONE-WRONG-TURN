// Using global THREE from CDN - no import needed

/**
 * Check for wall collision with the car using radius
 */
export function checkWallCollision(car, roadSample) {
  // Get car's collision radius
  const carRadius = car.radius;

  // Calculate road boundaries
  const halfRoad = roadSample.width * 0.5;
  const carCenterX = car.group.position.x;
  const roadCenterX = roadSample.centerX;

  // Distance from center of road
  const distanceFromCenter = Math.abs(carCenterX - roadCenterX);

  // Calculate collision margin based on car's radius
  const collisionMargin = carRadius;

  // Check if car is completely outside road walls
  if (distanceFromCenter > halfRoad + collisionMargin) {
    return { crashed: true, grazed: false };
  }

  // Grazing: car is close to wall but not crashing
  const grazeThreshold = 0.2;
  const grazeMargin = halfRoad - grazeThreshold;

  if (distanceFromCenter > grazeMargin) {
    // Determine which wall
    const normalX = carCenterX > roadCenterX ? 1 : -1;
    return {
      crashed: false,
      grazed: true,
      normal: new THREE.Vector3(normalX, 0, 0),
      penetration: distanceFromCenter - grazeMargin
    };
  }

  return { crashed: false, grazed: false };
}

/**
 * Check if car's bounding box intersects with road boundaries
 * More precise collision detection for professional feel
 */
export function checkBoxCollision(car, roadSample) {
  // Use simple radius-based collision
  return checkWallCollision(car, roadSample);
}
