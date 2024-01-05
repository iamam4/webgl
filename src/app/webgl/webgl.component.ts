import { Component, ElementRef, HostListener, OnInit, ViewChild } from '@angular/core';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { Pane } from 'tweakpane';


@Component({
  selector: 'app-webgl',
  templateUrl: './webgl.component.html',
  styleUrls: ['./webgl.component.css']
})
export class WebglComponent implements OnInit {

  @ViewChild('canvas', { static: true })
  private canvasRef!: ElementRef<HTMLCanvasElement>;

  // Camera properties
  private camera!: THREE.PerspectiveCamera;
  private CameraX: number = 0;
  private CameraY: number = 0;
  private CameraZ: number = 7;
  private CameraFov: number = 75;
  private CameraNear: number = 0.1;
  private CameraFar: number = 1000;

  // Canvas and scene
  private canvas!: HTMLCanvasElement;
  private scene: THREE.Scene | undefined;
  private loader: GLTFLoader | undefined;
  private dracoLoader: DRACOLoader | undefined;
  private renderer: THREE.WebGLRenderer | undefined;
  private box3: THREE.Box3 | undefined;
  private clock: THREE.Object3D | undefined;
  private pane: Pane | undefined;

  // Controls
  private controls: OrbitControls | undefined;

  // Color picker
  public selectedColor: string = '#000000';

  // Tweakpane
  public PARAMS = {
    colors: '#4e99FF',
    background: '#86B8DC'
  };

  // Sizes and cursor
  private sizes = {
    width: window.innerWidth,
    height: window.innerHeight,
  };
  private cursor = { x: 0, y: 0 };

  // Event listeners for mouse movement and window resize
  @HostListener('document:mousemove', ['$event'])
  onMouseMove(event: any) {
    this.cursor.x = event.clientX / this.sizes.width - 0.5;
    this.cursor.y = -(event.clientY / this.sizes.height - 0.5);
  }

  @HostListener('window:resize', ['$event'])
  onResize(event: any) {
    this.sizes.width = window.innerWidth;
    this.sizes.height = window.innerHeight;
    this.camera.aspect = this.sizes.width / this.sizes.height;
    this.camera.updateProjectionMatrix();
    this.renderer?.setSize(this.sizes.width, this.sizes.height);
    this.renderer?.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  }

  // Create the scene
  private createScene() {
    if (!this.scene) {
      this.scene = new THREE.Scene();
      this.scene.background = new THREE.Color(0x86B8DC);  
    }


    // Load 3D object
    if (!this.loader) {
      this.loader = new GLTFLoader();
      this.dracoLoader = new DRACOLoader();
      this.dracoLoader.setDecoderPath('../../assets/draco/gltf');
      this.loader.setDRACOLoader(this.dracoLoader);

      this.loader.load('../../assets/gltf/clock2.gltf', (gltf) => {
        if (gltf.scene) {
          this.clock = gltf.scene;

          this.clock.scale.set(2, 2, 2);

          this.clock.rotation.x = Math.PI / 2;

          this.scene?.add(this.clock);

          this.box3 = new THREE.Box3();
          this.box3.setFromObject(this.clock);
          const center = this.box3.getCenter(new THREE.Vector3());
          this.clock.position.sub(center);

          // Enable shadow
          this.clock.traverse((child) => {
            if (child instanceof THREE.Mesh) {
              child.castShadow = true;
              child.receiveShadow = true;
            }
          });

          this.clock.traverse((child) => {
            // Directionnal light
            if (child instanceof THREE.DirectionalLight && child.name == "Sun") {
              child.scale.set(0.5, 0.5, 0.5);
              child.castShadow = true;
              child.shadow.mapSize.width = 2048 * 2;
              child.shadow.mapSize.height = 2048 * 2;
              child.shadow.camera.near = 0.1;
              child.shadow.camera.far = 40;
              child.shadow.bias = -0.001;
              child.intensity = 10;
            }
          });
        }
      });
    }
  }




  // Initialize the camera
  private InitCamera() {
    this.camera = new THREE.PerspectiveCamera(
      this.CameraFov,
      this.sizes.width / this.sizes.height,
      this.CameraNear,
      this.CameraFar
    );
    this.camera.position.set(this.CameraX, this.CameraY, this.CameraZ);
    this.scene!.add(this.camera);
  }

  //Initialize lights
  private InitLights() {
    const ambientLight = new THREE.AmbientLight(0xffffff, 1);
    this.scene!.add(ambientLight);


    // Directionnal light behind the scene
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(0, 2, -5);
    this.scene!.add(directionalLight);

  }

  // Initialize controls
  private InitControls() {
    this.controls = new OrbitControls(this.camera, this.canvas);
    this.controls.enableDamping = true;

    // Disable zoom

    this.controls.minDistance = 5;
    this.controls.maxDistance = this.CameraZ;
  }

  // Render the scene
  private render() {
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
    });
    this.renderer.setSize(this.sizes.width, this.sizes.height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  }



  // Tweakpane
  private InitTweakpane() {

   
  
    this.pane = new Pane({
      title: 'Modifie ton horloge',
    });
  
   const colors = this.pane.addBinding(this.PARAMS, 'colors', {
      label: 'Color',
    });

    const colorbackground = this.pane.addBinding(this.PARAMS, 'background', {
      label: 'Background',
    });

    colors.on('change',()  => {
      this.updateColor();
    });

    colorbackground.on('change',()  => {
      this.scene!.background = new THREE.Color(this.PARAMS.background);
    });

  }

  // Color picker

  private updateColor() {
    this.clock?.traverse((child) => {
      if (child.name === 'Circle' && child instanceof THREE.Mesh) {
        // Change the material color of the object
        if (child.material.name == 'block texture') {
          // const colorValue = parseInt(this.selectedColor.replace('#', '0x'), 16);
          this.selectedColor = this.PARAMS.colors;
          child.material.color.set(this.selectedColor);
          console.log(this.selectedColor);
        }
      }
    });
  }

  // End color picker

  // Wireframe
  @HostListener('change', ['$event'])
  public onWireframeChange(event: Event) {
    const inputElement = event.target as HTMLInputElement;

    if (inputElement.type === 'checkbox') {
      this.clock?.traverse((child) => {
        if (child instanceof THREE.Mesh) {

          if (child) {
            child.material.wireframe = inputElement.checked;
          }
        }
      });
    }
  }


  // Animation loop
  private animation() {

    this.controls?.update();
    this.renderer!.shadowMap.enabled = true;
    this.renderer!.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer?.render(this.scene!, this.camera);

    if (this.clock) {

      const time = new Date();
      const hours = time.getHours() % 12;
      const minutes = time.getMinutes();
      const seconds = time.getSeconds();

      const rotationHours = (hours + minutes / 60) * (Math.PI / 6);
      const rotationMinutes = minutes * (Math.PI / 30);
      const rotationSeconds = seconds * (Math.PI / 30);

      this.clock.traverse((child) => {
        if (child.name === "minute") {
          child.rotation.y = - rotationMinutes;
        }
        if (child.name === "heure") {
          child.rotation.y = - rotationHours;
        }
        if (child.name === "seconde") {
          child.rotation.y = - rotationSeconds;
        }
      });

    }
    window.requestAnimationFrame(this.animation.bind(this));
  }

  ngOnInit() {
    this.canvas = this.canvasRef.nativeElement;
    this.createScene();
    this.InitCamera();
    this.InitLights();
    this.InitControls();
    this.render();
    this.animation();
    this.InitTweakpane();
  }
}
