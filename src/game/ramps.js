import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';
import { CONFIG } from './config.js';

export class RampSystem {
  constructor(scene) {
    this.scene = scene;
    this.ramps = [];
    this.activeRamp = null;
    this.multiplierActive = false;
    this.multiplierValue = 1;
    this.multiplierEndTime = 0;
    this.lastRampDistance = 0;
  }
  
  createRamp(distance, roadX) {
    // Crear rampa aleatoriamente cada X distancia
    const rampGeo = new THREE.BoxGeometry(4.0, 0.5, 1.5);
    const rampMat = new THREE.MeshStandardMaterial({
      color: 0xff6b35,
      emissive: 0xff6b35,
      metalness: 0.7
    });
    const ramp = new THREE.Mesh(rampGeo, rampMat);
    ramp.position.set(roadX, 0.3, distance);
    ramp.rotation.z = 0.3; // Inclinación
    ramp.collected = false;
    
    this.scene.add(ramp);
    return {
      mesh: ramp,
      distance: distance,
      collected: false
    };
  }
  
  checkCollision(carPos, distance) {
    // Crear rampas aleatoriamente cada 200-300 metros
    if (!this.lastRampDistance) this.lastRampDistance = 0;
    const nextRampAt = this.lastRampDistance + 250 + Math.random() * 100;
    
    if (distance > nextRampAt && distance < nextRampAt + 5) {
      if (!this.activeRamp) {
        const roadX = (Math.random() - 0.5) * 2; // Random x position
        this.activeRamp = this.createRamp(nextRampAt, roadX);
        this.lastRampDistance = nextRampAt;
      }
    }
    
    // Detectar si chocaste con la rampa
    if (this.activeRamp && !this.activeRamp.collected) {
      const dist = carPos.distanceTo(this.activeRamp.mesh.position);
      if (dist < 2) {
        this.activeRamp.collected = true;
        return { rampHit: true, distance: this.activeRamp.distance };
      }
    }
    
    return null;
  }
  
  showMultiplierUI(onSelect) {
    // Crear UI circular giratoria con multiplicadores
    const multipliers = [1, 2, 3];
    const container = document.createElement('div');
    container.id = 'multiplier-wheel';
    container.style.cssText = `
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 300px;
      height: 300px;
      z-index: 300;
    `;
    
    const wheel = document.createElement('div');
    wheel.style.cssText = `
      width: 100%;
      height: 100%;
      border: 3px solid #ffff00;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      background: rgba(0,0,0,0.8);
      animation: spin 2s linear infinite;
      position: relative;
    `;
    
    // Agregar CSS animation
    const style = document.createElement('style');
    style.textContent = `
      @keyframes spin {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
      }
      .multiplier-option {
        position: absolute;
        width: 80px;
        height: 80px;
        border-radius: 50%;
        border: 2px solid #00ffff;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 32px;
        font-weight: 900;
        color: #ffff00;
        background: rgba(0,255,255,0.1);
        cursor: pointer;
        transition: all 0.2s;
      }
      .multiplier-option:hover {
        background: rgba(0,255,255,0.3);
        transform: scale(1.1);
      }
    `;
    document.head.appendChild(style);
    
    // Posicionar multiplicadores en círculo
    multipliers.forEach((mult, i) => {
      const angle = (i / multipliers.length) * Math.PI * 2;
      const x = Math.cos(angle) * 100 + 150;
      const y = Math.sin(angle) * 100 + 150;
      
      const btn = document.createElement('div');
      btn.className = 'multiplier-option';
      btn.textContent = `x${mult}`;
      btn.style.left = x + 'px';
      btn.style.top = y + 'px';
      btn.onclick = (e) => {
        e.stopPropagation();
        onSelect(mult);
        container.remove();
      };
      wheel.appendChild(btn);
    });
    
    container.appendChild(wheel);
    document.getElementById('app').appendChild(container);
    
    // Auto-desaparecer después de 10 segundos
    setTimeout(() => {
      if (container.parentNode) container.remove();
      onSelect(1); // Default x1
    }, 10000);
  }
  
  activateMultiplier(value) {
    this.multiplierActive = true;
    this.multiplierValue = value;
    this.multiplierEndTime = Date.now() + (5000 + Math.random() * 5000);
  }
  
  update(currentTime) {
    if (this.multiplierActive && currentTime > this.multiplierEndTime) {
      this.multiplierActive = false;
      this.multiplierValue = 1;
    }
    
    // Limpiar rampas viejas (muy atrás)
    this.ramps = this.ramps.filter(r => {
      if (r.distance < -100) {
        this.scene.remove(r.mesh);
        return false;
      }
      return true;
    });
  }
  
  getMultiplier() {
    return this.multiplierActive ? this.multiplierValue : 1;
  }
}