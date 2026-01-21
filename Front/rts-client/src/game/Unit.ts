import * as THREE from "three";

export class Unit {
  mesh: THREE.Mesh;
  speed: number = 5;
  target: THREE.Vector3 | null = null;
  selected: boolean = false;

  constructor(position: THREE.Vector3) {
    const geometry = new THREE.BoxGeometry(1, 1, 1);
    const material = new THREE.MeshStandardMaterial({ color: 0x00ff00 });
    this.mesh = new THREE.Mesh(geometry, material);
    this.mesh.position.copy(position);
  }

  moveTo(target: THREE.Vector3) {
    this.target = target.clone();
  }

  select() {
    this.selected = true;
    (this.mesh.material as THREE.MeshStandardMaterial).color.set(0xffff00); // yellow highlight
  }

  deselect() {
    this.selected = false;
    (this.mesh.material as THREE.MeshStandardMaterial).color.set(0x00ff00); // green
  }

  update(dt: number) {
    if (!this.target) return;

    const dir = new THREE.Vector3().subVectors(this.target, this.mesh.position);
    const distance = dir.length();

    if (distance < 0.1) {
      this.mesh.position.copy(this.target);
      this.target = null;
      return;
    }

    dir.normalize();
    this.mesh.position.add(dir.multiplyScalar(this.speed * dt));
  }
}
