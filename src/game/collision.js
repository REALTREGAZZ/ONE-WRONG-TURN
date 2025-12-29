export function checkWallCollision(car, roadSample) {
  const half = roadSample.width * 0.5 - car.radius;
  return Math.abs(car.group.position.x - roadSample.centerX) > half;
}
