import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';
import { CONFIG } from './config.js';

export class RampSystem {
  constructor(scene) {
    this.scene = scene;
    this.ramps = [];
    this.nextRampDistance = 250;
    this.isInAir = false;
    this.airTime = 0;
    this.verticalVelocity = 0;
    this.multiplierActive = false;
    this.multiplierValue = 1;
    this.multiplierEndTime = 0;
  }
  
  createRamp(distance, roadWidth, centerX) {
    // Rampa en MITAD del camino (centered on road)
    const rampWidth = roadWidth - 0.5; // Ligeramente más estrecha que el camino
    const rampGeo = new THREE.BoxGeometry(rampWidth, 0.3, 2.0);
    const rampMat = new THREE.MeshStandardMaterial({
      color: 0xff6b35,
      emissive: 0xff6b35,
      metalness: 0.8,
      roughness: 0.2
    });
    const ramp = new THREE.Mesh(rampGeo, rampMat);
    
    // Posicionar en el CENTER of the road
    ramp.position.set(centerX, 0.2, distance);
    ramp.rotation.z = Math.PI / 8; // 22.5 grados de inclinación
    ramp.userData = {
      distance: distance,
      triggered: false,
      rampWidth: rampWidth
    };
    
    this.scene.add(ramp);
    this.ramps.push(ramp);
    
    return ramp;
  }
  
  update(carPos, carVelocity, distance, roadWidth, centerX, onRampHit) {
    // Crear rampas cada 300-400 metros
    if (distance > this.nextRampDistance) {
      this.createRamp(distance, roadWidth, centerX);
      this.nextRampDistance += 300 + Math.random() * 100;
    }
    
    // Detectar colisión con rampa
    for (const ramp of this.ramps) {
      if (!ramp.userData.triggered) {
        const dist = carPos.distanceTo(ramp.position);
        
        // Si el coche toca la rampa
        if (dist < ramp.userData.rampWidth / 2 + 0.5) {
          ramp.userData.triggered = true;
          
          // Lanzar coche al aire
          this.isInAir = true;
          this.airTime = 0;
          this.verticalVelocity = 15; // Velocidad inicial hacia arriba (m/s)
          
          // Callback para pausar juego y mostrar ruleta
          onRampHit?.();
          
          return true;
        }
      }
    }
    
    // Actualizar física del aire
    if (this.isInAir) {
      this.airTime += 0.016; // ~60fps
      this.verticalVelocity -= 9.8 * 0.016; // Gravedad (m/s²)
      
      // Si vuelve al suelo (Y <= 0.55)
      if (carPos.y <= 0.55 && this.verticalVelocity < 0) {
        this.isInAir = false;
        this.verticalVelocity = 0;
        this.airTime = 0;
      }
    }
    
    // Limpiar rampas antiguas
    this.ramps = this.ramps.filter(r => {
      if (r.position.z < distance - 50) {
        this.scene.remove(r);
        return false;
      }
      return true;
    });
  }
  
  getVerticalVelocity() {
    return this.isInAir ? this.verticalVelocity : 0;
  }
  
  isCarInAir() {
    return this.isInAir;
  }
  
  showMultiplierWheel(onSelect) {
    // Crear UI giratoria más atractiva
    const container = document.createElement('div');
    container.id = 'multiplier-wheel';
    container.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 320px;
      height: 320px;
      z-index: 300;
      pointer-events: auto;
    `;
    
    const style = document.createElement('style');
    if (!document.getElementById('wheel-styles')) {
      style.id = 'wheel-styles';
      style.textContent = `
        @keyframes wheelSpin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        
        #multiplier-wheel .wheel {
          width: 100%;
          height: 100%;
          border: 4px solid #ffff00;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(0,255,255,0.2) 0%, rgba(0,0,0,0.8) 100%);
          animation: wheelSpin 2s linear infinite;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          box-shadow: 0 0 40px #ffff00;
        }
        
        #multiplier-wheel .center {
          width: 60px;
          height: 60px;
          background: #ff00ff;
          border-radius: 50%;
          border: 3px solid #ffff00;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 24px;
          font-weight: 900;
          color: #ffff00;
          z-index: 10;
        }
        
        #multiplier-wheel .multiplier-option {
          position: absolute;
          width: 80px;
          height: 80px;
          border-radius: 50%;
          border: 3px solid #00ffff;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 36px;
          font-weight: 900;
          color: #ffff00;
          background: rgba(0,255,255,0.15);
          cursor: pointer;
          transition: all 0.2s;
          box-shadow: 0 0 20px rgba(0,255,255,0.5);
        }
        
        #multiplier-wheel .multiplier-option:hover {
          background: rgba(0,255,255,0.35);
          transform: scale(1.15);
          box-shadow: 0 0 40px rgba(0,255,255,0.8);
        }
      `;
      document.head.appendChild(style);
    }
    
    const wheel = document.createElement('div');
    wheel.className = 'wheel';
    
    const multipliers = [1, 2, 3];
    
    // Posicionar multiplicadores en círculo (sin rotar con la rueda)
    multipliers.forEach((mult, i) => {
      const angle = (i / multipliers.length) * Math.PI * 2 - Math.PI / 2;
      const radius = 120;
      const x = Math.cos(angle) * radius + 160;
      const y = Math.sin(angle) * radius + 160;
      
      const btn = document.createElement('div');
      btn.className = 'multiplier-option';
      btn.textContent = `x${mult}`;
      btn.style.left = (x - 40) + 'px'; // Center the 80px button
      btn.style.top = (y - 40) + 'px'; // Center the 80px button
      btn.onclick = (e) => {
        e.stopPropagation();
        onSelect(mult);
        container.remove();
      };
      wheel.appendChild(btn);
    });
    
    // Centro de la rueda
    const center = document.createElement('div');
    center.className = 'center';
    center.textContent = '↓';
    wheel.appendChild(center);
    
    container.appendChild(wheel);
    document.getElementById('app').appendChild(container);
    
    // Auto-seleccionar x1 después de 8 segundos
    setTimeout(() => {
      if (container.parentNode) {
        container.remove();
        onSelect(1);
      }
    }, 8000);
  }
  
  activateMultiplier(value) {
    this.multiplierActive = true;
    this.multiplierValue = value;
    this.multiplierEndTime = Date.now() + (5000 + Math.random() * 5000);
  }
  
  getMultiplier() {
    // Check if multiplier has expired
    if (this.multiplierActive && Date.now() > this.multiplierEndTime) {
      this.multiplierActive = false;
      this.multiplierValue = 1;
    }
    return this.multiplierActive ? this.multiplierValue : 1;
  }
}
