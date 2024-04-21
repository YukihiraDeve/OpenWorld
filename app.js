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


        //Sky
        this.light;

        
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
        this.startTime = Date.now();
  



        this.animate()

        
        

    }


    init() {
        this.scene = new THREE.Scene();
        // Réduction de la position de la caméra en fonction du nouveau scale
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 10000);
        // Les valeurs positionnelles sont ajustées pour correspondre à la nouvelle échelle
        this.camera.position.set(1.12, 1.0, 40.0); // Ces valeurs sont à affiner selon votre scène spécifique




    
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap; // Utilisation de PCFSoftShadowMap pour des ombres plus douces
        this.container.appendChild(this.renderer.domElement);

        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;  // Utilisez ACESFilmicToneMapping pour un rendu plus cinématographique
        this.renderer.toneMappingExposure = 0.5;




        this.scene = new THREE.Scene();
        this.scene.fog = new THREE.Fog(0xaaccff, 0.1, 500);


    
        const ambient = new THREE.AmbientLight(0x87CEEB, 1);
     //  this.scene.add(ambient);
    
        // Réglage de la lumière avec les paramètres d'ombres ajustés pour la nouvelle échelle
        this.light = new THREE.DirectionalLight(0xffffff, 1.0);
        this.light.position.set(1000, 1000, 1000);  // Position haute pour couvrir toute la carte
        this.light.castShadow = true;
        this.light.shadow.mapSize.width = 8192;  // Augmentez si nécessaire pour une meilleure résolution d'ombre
        this.light.shadow.mapSize.height = 8192;
        this.light.shadow.camera.near = 0.1;
        this.light.shadow.camera.far = 5000;
        this.light.shadow.camera.left = -2000;
        this.light.shadow.camera.right = 2000;
        this.light.shadow.camera.top = 2000;
        this.light.shadow.camera.bottom = -2000;
        
        this.scene.add(this.light);
        this.scene.add(new THREE.DirectionalLightHelper(this.light, 100));
    
        window.addEventListener('resize', () => this.onWindowResize(), false);
        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        const loader = new FBXLoader();
        this.loadEnvironment(loader);
        this.initSky();
        this.player = new Player(this);
    }
    


    initSky() {
        this.sky = new Sky();
        this.sky.scale.setScalar(450000);
        this.scene.add(this.sky);
        this.sun = new THREE.Vector3();
    
        const uniforms = this.sky.material.uniforms;
        uniforms['turbidity'].value = 10;
        uniforms['rayleigh'].value = 2;  // Essayer de diminuer si le ciel est trop lumineux
        uniforms['mieCoefficient'].value = 0.005;
        uniforms['mieDirectionalG'].value = 0.8;
    
        const phi = THREE.MathUtils.degToRad(90 - 10);  // Ajustez cette valeur pour modifier la hauteur du soleil
        const theta = THREE.MathUtils.degToRad(180);
        this.sun.setFromSphericalCoords(1, phi, theta);
        uniforms['sunPosition'].value.copy(this.sun);
    
        this.renderer.toneMappingExposure = 0.5;  // Ajustez pour l'exposition globale, réduisez la nuit
    }
    
    //te    
    fd
    // Fonction pour mettre à jour la position du soleil et de la lumière directionnelle
    

    updateSunPosition() {
        const elapsed = (Date.now() - this.startTime) / 1000;  // Temps écoulé en secondes
        const daysElapsed = elapsed / 60;  // Un cycle complet de jour (changez cela selon la durée d'un jour dans votre jeu)
        const sunCycle = daysElapsed * 360;  // 360 degrés pour un cycle complet
    
        const phi = THREE.MathUtils.degToRad(90 - (sunCycle % 360));  // 90 degrés moins la position en degrés du soleil dans le cycle
        const theta = THREE.MathUtils.degToRad(180);  // Angle pour le cycle est-ouest, ajustez selon vos besoins
    
        // Mettre à jour la position du soleil dans le shader du ciel
        this.sun.setFromSphericalCoords(1, phi, theta);
        this.sky.material.uniforms['sunPosition'].value.copy(this.sun);
    
        // Mettre à jour la position de la lumière directionnelle pour qu'elle corresponde à celle du soleil
        this.light.position.set(
            this.sun.x * 4000,  // Multipliez pour s'adapter à la taille de votre scène
            this.sun.y * 4000,
            this.sun.z * 4000
        );
    }

    



    createCameras() {
        const scale = 0.1; // Votre facteur d'échelle actuel
        // Ajustement des valeurs de position pour les adapter au nouveau scale tout en éloignant les caméras du corps du joueur
        const front = new THREE.Object3D();
        front.position.set(1.12 * scale * 5, 1.0 * scale * 5, 6.0 * scale * 5); // Multipliez par un facteur pour éloigner la caméra
        front.parent = this.player.root;
    
        const back = new THREE.Object3D();
        back.position.set(0, 200, -654); // Augmentez la distance pour la caméra arrière
        back.parent = this.player.root;
    
        const wide = new THREE.Object3D();
        wide.position.set(1.78 * scale * 5, 1.39 * scale * 5, 16.65 * scale * 5);
        wide.parent = this.player.root;
    
        const overhead = new THREE.Object3D();
        overhead.position.set(0, 4.0 * scale * 10, 0); // Augmentez l'altitude pour une vue d'en haut
        overhead.parent = this.player.root;
    
        const collect = new THREE.Object3D();
        collect.position.set(0.4 * scale * 5, 0.82 * scale * 5, 0.94 * scale * 5);
        collect.parent = this.player.root;
    
        this.player.cameras = { front, back, wide, overhead, collect };
        this.activeCamera = this.player.cameras.back;
        this.controls.enabled = false;

        // const gui = new dat.GUI();
        // const camFolder = gui.addFolder('Camera');
        // camFolder.add(back.position.set(0, 15.0 * scale * 5, -10.0 * scale * 10), 'x', -5000, 5000);
        // camFolder.add(back.position.set(0, 15.0 * scale * 5, -10.0 * scale * 10), 'y', -5000, 5000);
        // camFolder.add(back.position.set(0, 15.0 * scale * 5, -10.0 * scale * 10), 'z', -5000, 5000);
        // camFolder.open();

    }
    


    updateCameraPosition() {
        if (this.player && this.player.root && this.player.cameras && this.activeCamera) {
            try {
                const worldPosition = new THREE.Vector3();
                this.activeCamera.getWorldPosition(worldPosition);
                this.camera.position.lerp(worldPosition, 0.1);  
    
                const pos = this.player.root.position.clone();
                pos.y -= 0; 
    
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
            console.log("loaded", anim, object.animations[0]);
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
          //      console.log(child.name);
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
            object.scale.set(0.05, 0.05, 0.05);


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
        const spotLight = new THREE.SpotLight(0xffffff, 1.5);
        
        spotLight.position.set(this.lampObject.position.x , this.lampObject.position.y + 10 , this.lampObject.position.z ); // Position au-dessus de la lampe
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
        this.updateSunPosition();
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
                    console.log(animation.name);
                });
            } else {
                console.error('No animations found in the model.');
            }

            this.setInitialPosition();
            this.action = 'Idle';

            this.game.createCameras();

            console.log(this.root)
        });
    }

    setInitialPosition() {
        this.root.position.set(0, -100, 0); // //6532.9345703125, y: -577.6206970214844, z: 15476.263427734375} Si scale descendu de 1 tenter de diviser par 10
        this.root.scale.set(0.02, 0.02, 0.02);
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
        const speed = 100.0; 
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