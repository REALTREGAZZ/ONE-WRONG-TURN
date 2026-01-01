// Using global THREE from CDN - no import needed

/**
 * Check for wall collision with the car using precise box collider
 */
export function checkWallCollision(car, roadSample) {
  // Get car's precise collision box
  const carWidth = car.collider ? car.collider.size.x : car.radius * 2.2;

  // Calculate road boundaries
  const halfRoad = roadSample.width * 0.5;
  const carCenterX = car.group.position.x;
  const roadCenterX = roadSample.centerX;

  // Distance from center of road
  const distanceFromCenter = Math.abs(carCenterX - roadCenterX);

  // Calculate collision margin based on car's box collider
  const collisionMargin = carWidth * 0.5;

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
  if (!car.collider) {
    // Fallback to simple radius-based collision
    return checkWallCollision(car, roadSample);
  }

  const carBox = car.collider.box;
  const carSize = car.collider.size;

  // Get world position of car
  const carWorldPos = car.group.position.clone();

  // Calculate car's bounding box in world space
  const carMinX = carWorldPos.x - carSize.x * 0.5;
  const carMaxX = carWorldPos.x + carSize.x * 0.5;

  // Calculate road boundaries
  const roadLeft = roadSample.centerX - roadSample.width * 0.5;
  const roadRight = roadSample.centerX + roadSample.width * 0.5;

  // Check collision with left wall
  if (carMinX < roadLeft) {
    const penetration = roadLeft - carMinX;
    if (penetration > 0.1) { // Deep penetration = crash
      return { crashed: true, grazed: false };
    } else {
      return {
        crashed: false,
        grazed: true,
        normal: new THREE.Vector3(1, 0, 0),
        penetration: penetration
      };
    }
  }

  // Check collision with right wall
  if (carMaxX > roadRight) {
    const penetration = carMaxX - roadRight;
    if (penetration > 0.1) { // Deep penetration = crash
      return { crashed: true, grazed: false };
    } else {
      return {
        crashed: false,
        grazed: true,
        normal: new THREE.Vector3(-1, 0, 0),
        penetration: penetration
      };
    }
  }

  return { crashed: false, grazed: false };
}
