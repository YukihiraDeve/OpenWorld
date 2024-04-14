import * as THREE from 'three';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

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



    createCameras() {
        // Similar to game.js
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
    }
    updateCameraPosition() {
        if (this.player && this.player.root && this.player.cameras && this.activeCamera) {
            try {
                const worldPosition = new THREE.Vector3();
                this.activeCamera.getWorldPosition(worldPosition);
                // Augmenter le facteur de lerp pour une réponse plus immédiate de la caméra
                this.camera.position.lerp(worldPosition, 0.1);  // Augmenté de 0.05 à 0.1 pour plus de réactivité
    
                const pos = this.player.root.position.clone();
                pos.y += 50; // Ajustement de la hauteur de la caméra
    
                this.camera.lookAt(pos);
            } catch (error) {
                console.error("Failed to update camera position:", error);
            }
        }
    }
    


    switchCameraOnMovement() {
        if (this.player.isMovingRight) {
            this.activeCamera = this.player.cameras.rightSide;  // Supposons que vous avez une caméra configurée pour les mouvements à droite
        } else if (this.player.isMovingLeft) {
            this.activeCamera = this.player.cameras.leftSide;
        } else {
            this.activeCamera = this.player.cameras.back;  // Caméra par défaut
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
            console.log('loaded', anim);
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


        

    init() {
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 200000);
        this.camera.position.set(112, 100, 400);

        const ambient = new THREE.AmbientLight(0xaaaaFF, 1);
        this.scene.add(ambient);

        const spotLight = new THREE.SpotLight(0xffffff);
        spotLight.position.set(100, 0, 100);
        spotLight.castShadow = true;    
        //show light

        this.scene.add(new THREE.SpotLightHelper(spotLight));
      

        const light = new THREE.DirectionalLight(0xaaaaaa);
        light.position.set(30, 100, 40);
        light.castShadow = true;
        this.scene.add(light);

        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.shadowMap.enabled = true;
        this.container.appendChild(this.renderer.domElement);

        window.addEventListener('resize', () => this.onWindowResize(), false);

        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        const loader = new FBXLoader();

        this.loadEnvironment(loader);

        this.player = new Player(this)
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

            //here

            let waterObject = null;
       


            
            
            object.traverse(function (child) {
                if (child.name == "terrain-world-water") {
                    waterObject = child;
                    console.log("Objet 'water' trouvé:", waterObject);
                    const textureLoader = new THREE.TextureLoader();
                        textureLoader.load('assets/Texture/atlas-LPUP.png', function (texture) {
                            texture.encoding = THREE.sRGBEncoding;
                            child.material.map = texture;
                            child.material.needsUpdate = true;
                        });
                    }
         
                    
                

                if (child.isMesh) {
                    if (child.name.startsWith("proxy")) {
                        game.colliders.push(child);
                        child.material.visible = false;
                    } else {
                        child.castShadow = true;
                        child.receiveShadow = true;
                    }
                }
            });

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

    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }


    animate() {
        requestAnimationFrame(() => this.animate());
        const dt = this.clock.getDelta();
        this.updateCameraPosition();  // Assurez-vous que ceci est appelé avant d'autres mises à jour
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
        this.root.position.set(0, 0, 0);
        this.root.scale.set(0.5, 0.5, 0.5);
        this.root.rotation.y = Math.PI;
    }

    initKeyboardControls() {
        document.addEventListener('keydown', (event) => this.onKeyDown(event));
        document.addEventListener('keyup', (event) => this.onKeyUp(event));
    }

    onKeyDown(event) {
        switch (event.key.toUpperCase()) {
            case 'Z': this.isMovingForward = true; console.log("Z press"); break;
            case 'S': this.isMovingBackward = true; console.log("S press"); break;
            case 'Q': this.isMovingLeft = true; console.log("Q press"); break;
            case 'D': this.isMovingRight = true; console.log("D press"); break;
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
        console.log(`Setting action to ${name}`);
        if (this.actionName === name) return;
        const clip = this.animations[name];
        if (clip) {
            console.log(`Playing animation: ${name}`);
            const action = this.mixer.clipAction(clip);
            if (this.currentAction) {
                const prevAction = this.mixer.clipAction(this.animations[this.actionName]);
                prevAction.fadeOut(0.5);
                console.log(`Fading out previous action: ${this.actionName}`);
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
        const speed = 100.0; 
        const rotationSpeed = Math.PI * 0.5;
        if (this.isMovingForward) {
            this.root.translateZ(speed * delta);
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





const game = new Game();