import * as THREE from 'three';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { Sky } from 'three/addons/objects/Sky.js';
import { Lensflare, LensflareElement } from 'three/examples/jsm/objects/Lensflare.js';

class Game {
    constructor() {
        this.container;
        this.player = {};
        this.animations = {};
        this.stats;
        this.controls = null;
        this.camera;
        this.scene;
        this.renderer;


        this.lampObject = null;  // Variable pour stocker l'objet de la lampe
        this.lampLight = null;

        
        const game = this;

        this.container = document.createElement('div');
        this.container.style.height = '100vh';
        document.body.appendChild(this.container);

        this.assetsPath = '../assets/';

        this.clock = new THREE.Clock();

  
		const options = {
			assets:[
				`${this.assetsPath}images/nx.jpg`,
				`${this.assetsPath}images/px.jpg`,
				`${this.assetsPath}images/ny.jpg`,
				`${this.assetsPath}images/py.jpg`,
				`${this.assetsPath}images/nz.jpg`,
				`${this.assetsPath}images/pz.jpg`
			],
			oncomplete: function(){
				this.init();
			}
		}
        this.anims = ['Walking', 'Left Turn', 'Right Turn', 'Idle'];
        this.anims.forEach( function(anim){ options.assets.push(`${game.assetsPath}anims/${anim}.fbx`)});
		options.assets.push(`${game.assetsPath}Player.fbx`);


        this.cameraTarget = new THREE.Vector3(0, -10, -510);
        
        this.init();

        this.animate()

        
        

    }


    init() {
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 200000);
        this.camera.position.set(112, 100, 400);
    
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.shadowMap.enabled = true;
        this.renderer.toneMapping = THREE.ReinhardToneMapping; // Utilisez ACESFilmicToneMapping ou ReinhardToneMapping selon le résultat souhaité
        this.renderer.toneMappingExposure = 0.5;
        this.container.appendChild(this.renderer.domElement);

        const ambient = new THREE.AmbientLight(0xaaaaFF, 1);
        this.scene.add(ambient);

        const spotLight = new THREE.SpotLight(0xffffff);
        spotLight.position.set(100, 0, 100);
        spotLight.castShadow = true;    
        //show light

        this.scene.add(new THREE.SpotLightHelper(spotLight));
      

        // const light = new THREE.DirectionalLight(0xaaaaaa);
        // light.position.set(30, 100, 40);
        // light.castShadow = true;
        // this.scene.add(light);

  


        const light = new THREE.DirectionalLight(0xffffff, 1.0);
        light.position.set(100, 100, 100);
        light.castShadow = true;

        // Paramètres d'ombre pour une DirectionalLight
        light.shadow.mapSize.width = 4024;  // Résolution des ombres
        light.shadow.mapSize.height = 4024;
        light.shadow.camera.near = 0.5;
        light.shadow.camera.far = 20000;
        light.shadow.camera.left = -5000;
        light.shadow.camera.right = 5000;
        light.shadow.camera.top = 1000;
        light.shadow.camera.bottom = -1000;





        this.scene.add(light);
        this.initSky();

        window.addEventListener('resize', () => this.onWindowResize(), false);

        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        const loader = new FBXLoader();

        this.loadEnvironment(loader);

        this.player = new Player(this)
    }


    initSky() {
        const sky = new Sky();
        sky.scale.setScalar(450000); // Taille suffisamment grande pour couvrir la scène entière
        this.scene.add(sky);
    
        const sun = new THREE.Vector3();
    
        // Les propriétés qui influencent l'apparence du ciel
        const effectController = {
            turbidity: 10, // Impureté de l'atmosphère
            rayleigh: 2, // Diffusion de la lumière par les particules de l'atmosphère
            mieCoefficient: 0.005,
            mieDirectionalG: 0.8,
            elevation: 2, // Hauteur du soleil en degrés
            azimuth: 180, // Position angulaire du soleil sur l'horizon
            exposure: this.renderer.toneMappingExposure
        };
    
        const uniforms = sky.material.uniforms;
        uniforms['turbidity'].value = effectController.turbidity;
        uniforms['rayleigh'].value = effectController.rayleigh;
        uniforms['mieCoefficient'].value = effectController.mieCoefficient;
        uniforms['mieDirectionalG'].value = effectController.mieDirectionalG;
    
        const phi = THREE.MathUtils.degToRad(90 - effectController.elevation);
        const theta = THREE.MathUtils.degToRad(effectController.azimuth);
    
        sun.setFromSphericalCoords(1, phi, theta);
        uniforms['sunPosition'].value.copy(sun);
    
        this.renderer.toneMappingExposure = effectController.exposure;
    }
    



    createCameras() {
        const front = new THREE.Object3D();
        front.position.set(112, 100, 600);
        front.parent = this.player.root;
        const back = new THREE.Object3D();
        back.position.set(0, 100, -1000);
        back.parent = this.player.root;
        const wide = new THREE.Object3D();
        wide.position.set(178, 139, 1665);
        wide.parent = this.player.root;
        const overhead = new THREE.Object3D();
        overhead.position.set(0, 400, 0);
        overhead.parent = this.player.root;
        const collect = new THREE.Object3D();
        collect.position.set(40, 82, 94);
        collect.parent = this.player.root;
        this.player.cameras = { front, back, wide, overhead, collect };
        this.activeCamera = this.player.cameras.back;
        this.controls.enabled = false;
    }


    updateCameraPosition() {
        if (this.player && this.player.root && this.player.cameras && this.activeCamera) {
            try {
                const worldPosition = new THREE.Vector3();
                this.activeCamera.getWorldPosition(worldPosition);
                this.camera.position.lerp(worldPosition, 0.1);  
    
                const pos = this.player.root.position.clone();
                pos.y += 50; 
    
                this.camera.lookAt(pos);
            } catch (error) {
                console.error("Failed to update camera position:", error);
            }
        }
    }
    


    switchCameraOnMovement() {
        if (this.player.isMovingRight) {
            this.activeCamera = this.player.cameras.rightSide; 
        } else if (this.player.isMovingLeft) {
            this.activeCamera = this.player.cameras.leftSide;
        } else {
            this.activeCamera = this.player.cameras.back;  
        }
    }
    


    loadNextAnim(loader){
        if (!this.anims || this.anims.length === 0) {
            console.warn('No more animations to load.');
            return;
        }
		let anim = this.anims.pop();
		const game = this;
		loader.load( `${this.assetsPath}anims/${anim}.fbx`, function( object ){
			game.player.animations[anim] = object.animations[0];
			if (game.anims.length>0){
				game.loadNextAnim(loader);
			}else{
				delete game.anims;
				game.action = "Idle";
				game.animate();
			}

		});	
       
	}

    playAnimation(animationName) {
        const action = this.animations[animationName.toLowerCase()];
        if (action) {
            this.player.mixer.stopAllAction();
            action.play();
        }
    }

    loadEnvironment(loader) {
        const game = this;
        loader.load(`${this.assetsPath}fbx/nottheend.fbx`, function (object) {
            game.environment = object;
            game.colliders = [];
            object.traverse(function (child) {
                console.log(child.name);
                if (child.isMesh) {
                    child.castShadow = true;
                    child.receiveShadow = true;
                    
                    if (child.name.startsWith("proxy")) {
                        game.colliders.push(child);
                        child.material.visible = false;
                    } 
           
                }

                if (child.name === "lantern_long__4_") {  // Trouver l'objet nommé "lampe"
                    game.lampObject = child;  // Sauvegarder l'objet de la lampe
                    console.log("Lamp object found.", game.lampObject.position);
                 //   game.addSpotlightToLamp();  // Appeler la fonction pour ajouter une lumière à la lampe
                }

            });

            object.position.set(0, 0, 0);
            object.scale.set(1, 1, 1);


            const tloader = new THREE.CubeTextureLoader();
            tloader.setPath(`${game.assetsPath}/images/`);

            var textureCube = tloader.load([
                'px.jpg', 'nx.jpg',
                'py.jpg', 'ny.jpg',
                'pz.jpg', 'nz.jpg'
            ]);
            game.scene.add(object);
            game.scene.background = textureCube;
            
        });


        this.loadNextAnim(loader);
    }

    addSpotlightToLamp(){
        if (!this.lampObject) {
            console.error("No lamp object found.");
            return;
        }
        // Créer et configurer la SpotLight
        const spotLight = new THREE.SpotLight(0xffffff, 1.5);
        spotLight.position.set(this.lampObject.position.x, this.lampObject.position.y + 10, this.lampObject.position.z); // Position au-dessus de la lampe
        spotLight.target = this.lampObject; // Cibler la lumière sur l'objet lampe
        spotLight.angle = Math.PI / 4;
        spotLight.penumbra = 0.1;
        spotLight.decay = 2;
        spotLight.distance = 200;
        spotLight.castShadow = true;
        this.scene.add(spotLight);
        this.scene.add(new THREE.SpotLightHelper(spotLight)); 

        this.lampLight = spotLight; // Sauvegarder la référence de la lumière
        console.log("Spotlight added to lamp.");
    }



    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }


    animate() {
        requestAnimationFrame(() => this.animate());
        const dt = this.clock.getDelta();
        this.updateCameraPosition(); 
        if (this.player) {
            this.player.update(dt);
        }
        this.renderer.render(this.scene, this.camera);
    }
    
    
    
}

class Player {
    constructor(game) {
        this.game = game;
        this.mixer = null;
        this.animations = {};
        this.actionName = '';
        this.isMovingForward = false;
        this.isMovingBackward = false;
        this.isMovingLeft = false;
        this.isMovingRight = false;
        this.currentAction = null;
        this.initPlayer();
        this.initKeyboardControls();
    }

    initPlayer() {
        const loader = new FBXLoader();
        loader.load(`${this.game.assetsPath}Mec.fbx`, (object) => {
            this.root = object;
            this.mixer = new THREE.AnimationMixer(object);
            this.game.scene.add(object);
            object.traverse((child) => {
                if (child.isMesh) {
                    child.castShadow = true;
                    child.receiveShadow = true;
                }
            });

            if (object.animations) {
                object.animations.forEach((animation) => {
                    this.animations[animation.name] = animation;
                });
            } else {
                console.error('No animations found in the model.');
            }

            this.setInitialPosition();
            this.action = 'Idle';

            this.game.createCameras();
        });
    }

    setInitialPosition() {
        this.root.position.set(6532, -577, 15476); // //6532.9345703125, y: -577.6206970214844, z: 15476.263427734375} Si scale descendu de 1 tenter de diviser par 10
        this.root.scale.set(0.4, 0.4, 0.4);
        this.root.rotation.y = Math.PI;
    }

    initKeyboardControls() {
        document.addEventListener('keydown', (event) => this.onKeyDown(event));
        document.addEventListener('keyup', (event) => this.onKeyUp(event));
    }

    onKeyDown(event) {
        switch (event.key.toUpperCase()) {
            case 'Z': this.isMovingForward = true; break;
            case 'S': this.isMovingBackward = true; break;
            case 'Q': this.isMovingLeft = true;  break;
            case 'D': this.isMovingRight = true; break;
        }
        this.updateMovement();
    }

    onKeyUp(event) {
        switch (event.key.toUpperCase()) {
            case 'Z': this.isMovingForward = false; break;
            case 'S': this.isMovingBackward = false; break;
            case 'Q': this.isMovingLeft = false; break;
            case 'D': this.isMovingRight = false; break;
        }
        this.updateMovement();
    }

    updateMovement() {
        if (this.isMovingForward || this.isMovingBackward || this.isMovingLeft || this.isMovingRight) {
            this.action = 'Walking';
        } else {
            this.action = 'Idle';
        }
    }

    set action(name) {
        if (this.actionName === name) return;
        const clip = this.animations[name];
        if (clip) {
            const action = this.mixer.clipAction(clip);
            if (this.currentAction) {
                const prevAction = this.mixer.clipAction(this.animations[this.actionName]);
                prevAction.fadeOut(0.5);
            }
            action.reset();
            action.fadeIn(0.5);
            action.play();
            this.currentAction = action;
            this.actionName = name;
        } else {
            console.warn(`Animation ${name} not found`);
        }
    }

    update(delta) {

        if (this.mixer) {
            this.mixer.update(delta);
        }

        this.moveCharacter(delta);
        
    }

    moveCharacter(delta) {
        const speed = 10000.0; 
        const rotationSpeed = Math.PI * 0.5;
        if (this.isMovingForward) {
            this.root.translateZ(speed * delta);
            console.log(this.root.position);
        }
        if (this.isMovingBackward) {

            this.root.translateZ(-speed * delta);
        }
        if (this.isMovingLeft) {
            this.root.rotateY(rotationSpeed * delta);
        }
        if (this.isMovingRight) {
            this.root.rotateY(-rotationSpeed * delta);

        }
    }
    
}


//6532.9345703125, y: -577.6206970214844, z: 15476.263427734375}






const game = new Game();