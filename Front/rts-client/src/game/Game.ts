import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { Unit } from "./Unit";

export class Game {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  renderer: THREE.WebGLRenderer;
  units: Unit[] = [];
  socket: WebSocket;
  raycaster = new THREE.Raycaster();
  mouse = new THREE.Vector2();

  constructor(container: HTMLDivElement) {
    // --- Scene setup ---
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x202020);

    // --- Camera setup ---
    this.camera = new THREE.PerspectiveCamera(
      75,
      container.clientWidth / container.clientHeight,
      0.1,
      1000
    );
    this.camera.position.set(0, 5, 5);
    this.camera.lookAt(0, 0, 0);

    // OrbitControls (optional, for debugging)
    const controls = new OrbitControls(this.camera, container);
    controls.update();

    // --- Renderer setup ---
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    container.appendChild(this.renderer.domElement);

    // --- Lights ---
    const directional = new THREE.DirectionalLight(0xffffff, 1);
    directional.position.set(5, 20, 10);
    this.scene.add(directional);

    const ambient = new THREE.AmbientLight(0x404040);
    this.scene.add(ambient);

    // --- Ground ---
    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(50, 50),
      new THREE.MeshStandardMaterial({ color: 0x555555 })
    );
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    this.scene.add(ground);

    // --- Units ---
    this.units.push(new Unit(new THREE.Vector3(0, 0.5, 0)));
    this.units.push(new Unit(new THREE.Vector3(2, 0.5, 2)));
    this.units.push(new Unit(new THREE.Vector3(-2, 0.5, -2)));

    this.units.forEach((u) => this.scene.add(u.mesh));

    // --- WebSocket (placeholder) ---
    this.socket = new WebSocket("ws://127.0.0.1:8000/ws/game/");

    this.socket.onopen = () => {
      console.log("Connected to backend WebSocket!");
      this.socket.send(JSON.stringify({ type: "hello", msg: "Hello server!" }));
    };

    this.socket.onerror = (event) => {
      console.error("WebSocket error observed:", event);
    };

    this.socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log("Message:", data);
        if (data.type === "init") {
          data.units.forEach((pos: any, i: number) => {
            if (!this.units[i]) {
              const u = new Unit(new THREE.Vector3(pos.x, pos.y, pos.z));
              this.units.push(u);
              this.scene.add(u.mesh);
            }
          });
        } else if (data.type === "move_unit") {
          const u = this.units[data.unit_id];
          if (u) u.moveTo(new THREE.Vector3(data.x, data.y, data.z));
        }
      } catch (e) {
        console.error("Failed to parse WebSocket message:", e);
      }
    };

    // --- Click handler ---
    container.addEventListener("click", (event) => this.onClick(event, container));

    // --- Handle window resize ---
    window.addEventListener("resize", () => {
      this.camera.aspect = container.clientWidth / container.clientHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(container.clientWidth, container.clientHeight);
    });

    // Start animation loop
    this.animate();
  }

  animate() {
    requestAnimationFrame(() => this.animate());
    const dt = 0.016; // ~60fps
    this.units.forEach((u) => u.update(dt));
    this.renderer.render(this.scene, this.camera);
  }

  onClick(event: MouseEvent, container: HTMLDivElement) {
    this.mouse.x = (event.clientX / container.clientWidth) * 2 - 1;
    this.mouse.y = -(event.clientY / container.clientHeight) * 2 + 1;
    this.raycaster.setFromCamera(this.mouse, this.camera);

    // Intersect units
    const intersects = this.raycaster.intersectObjects(this.units.map((u) => u.mesh));
    if (intersects.length > 0) {
      this.units.forEach((u) => u.deselect());
      const unit = this.units.find((u) => u.mesh === intersects[0].object);
      if (unit) unit.select();
    } else {
      // Intersect ground for movement
      const groundIntersects = this.raycaster.intersectObjects(this.scene.children, true);
      if (groundIntersects.length > 0) {
        const point = groundIntersects[0].point;
        this.units.filter((u) => u.selected).forEach((u) => {
          u.moveTo(point);
          this.socket.send(
            JSON.stringify({
              type: "move_unit",
              unit_id: this.units.indexOf(u),
              x: point.x,
              y: point.y,
              z: point.z,
            })
          );
        });
      }
    }
  }
}
