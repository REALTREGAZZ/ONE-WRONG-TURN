import { CarBounds } from './Car';

interface Wall {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
}

export class Collision {
  public checkCollision(carBounds: CarBounds, walls: Wall[]): boolean {
    for (const wall of walls) {
      if (this.aabbIntersect(carBounds, wall)) {
        return true;
      }
    }
    return false;
  }

  private aabbIntersect(a: CarBounds, b: Wall): boolean {
    return (
      a.minX < b.maxX &&
      a.maxX > b.minX &&
      a.minZ < b.maxZ &&
      a.maxZ > b.minZ
    );
  }
}
