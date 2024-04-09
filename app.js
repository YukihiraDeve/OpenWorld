import * as THREE from 'three';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

import GUI from 'lil-gui'; 

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

        
        this.init();
        this.animate()

        

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
    
        if (this.player && this.player.object) {
            this.player.update(dt);
    
            // Ajustez la position Y de la cible pour élever légèrement le point focal au-dessus du joueur
            const targetPosition = this.player.object.position.clone().add(new THREE.Vector3(0, 0, 0)); // Ajustez 50 selon les besoins pour élever la cible
            this.controls.target.copy(targetPosition);
        }
    
        this.controls.update(); 
        this.renderer.render(this.scene, this.camera);
    }
    
    
}

class Player {
    constructor(game){
        this.animations = {};
        this.local = true
        this.game = game;
        this.otherPlayer = {};
        this.initKeyboardControls();


        this.isMovingForward = false; 
        this.isMovingLeft = false;  
        this.isMovingRight = false; 

        let model;

        const player = this;
        const loader = new FBXLoader()
        

        loader.load(`/assets/Mec.fbx`, function (object) {
            object.mixer = new THREE.AnimationMixer( object );
			player.root = object;
			player.mixer = object.mixer;
            object.name = "Person";
            object.scale.set(0.5, 0.5, 0.5);
            object.position.set(0, -500, 0);
            console.log(object)
            object.traverse(function (child) {
                if (child.isMesh) {
                    child.castShadow = true;
                    child.receiveShadow = true;
                }
            });
        

            player.object = new THREE.Object3D();
            player.object.add(object);
            game.scene.add(player.object)

            game.camera.position.set(
                player.object.position.x + 1000,
                player.object.position.y - 1000 ,
                player.object.position.z + 1000
            );
            game.controls.target.copy(player.object.position);

            if (object.animations) {
                const animations = object.animations;
                animations.forEach((anim) => {
                    player.animations[anim.name] = anim;
                    

                });
            } else {
                console.error('Aucune animation trouvée dans le modèle FBX.');
            }


            game.loadNextAnim(loader); 
            game.animate()

        });



    }



    initKeyboardControls() {
        document.addEventListener('keydown', (e) => this.onKeyDown(e));
        document.addEventListener('keyup', (e) => this.onKeyUp(e));
    }

    onKeyDown(event) {
        switch (event.key) {
            case 'z': // Avancer
                this.isMovingForward = true;
                this.playWalkingAnimation();
                break;
            case 'q': // Gauche
                this.isMovingLeft = true;
                break;
            case 'd': // Droite
                this.isMovingRight = true;
                break;
        }
   //    this.updateMovementDirection();
    }
    
    onKeyUp(event) {
        switch (event.key) {
            case 'z':
                this.isMovingForward = false;
                this.stopWalkingAnimation();
                break;
            case 'q':
                this.isMovingLeft = false;
                break;
            case 'd':
                this.isMovingRight = false;
                break;
        }
       // this.updateMovementDirection();
    }


    playWalkingAnimation() {
        if (this.actionName !== 'Walking') {
            this.action = 'Walking';
        }
    }

    stopWalkingAnimation() {
        if (this.actionName === 'Walking') {
            // Ici, vous pourriez vouloir revenir à une animation "Idle" ou simplement arrêter l'animation actuelle
            this.action = 'Idle'; // Assurez-vous d'avoir une animation "Idle" ou adaptez selon vos besoins
        }
    }

    set action(name) {
        if (this.actionName == name) return;
        if (!this.animations[name]) {
            console.warn(`L'animation ${name} n'est pas disponible.`);
            return;
        }
        const clip = (this.local) ? this.animations[name] : THREE.AnimationClip.parse(THREE.AnimationClip.toJSON(this.animations[name])); 
        
        if (!clip) {
            console.error(`L'animation ${name} n'a pas été trouvée.`);
            return;
        }
    
    
        if (this.previousAction) {
            const prevAction = this.mixer.clipAction(this.animations[this.actionName]);
            prevAction.fadeOut(0.5); // Définissez la durée du fondu sortant
        }
        this.actionName = name;
        this.actionTime = Date.now();

        const action = this.mixer.clipAction(clip);
        action.reset();
        action.fadeIn(0.5); 
        action.play();
    
        this.previousAction = action; // Mémorisez l'action actuelle pour la prochaine fois
    }


    

    //testsetsetset

    update(delta) {
        if (this.mixer) this.mixer.update(delta);
    
        const speed = 5000; // Ajustez selon les besoins
        if (this.isMovingForward) {
            this.object.translateZ(delta * speed);
            console.log(this.object.position.x)
        }
        if (this.isMovingLeft) {
            this.object.rotateY(delta);
        }
        if (this.isMovingRight) {
            this.object.rotateY(-delta);
        }
    }
    


}


const game = new Game();