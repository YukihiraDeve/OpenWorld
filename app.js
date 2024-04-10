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
        document.addEventListener('keydown', (e) => this.update(e));
        document.addEventListener('keyup', (e) => this.update(e));
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

    updateCameraTarget(moveX, moveZ){
        this.camera.position.x += moveX;
        this.camera.position.z += moveZ;

        this.updateCameraTarget.x = this.object.position.x;
        this.updateCameraTarget.z = this.object.position.z;
        this.updateCameraTarget.y = this.object.position.y + 1;
        this.OrbitControls.target = this.cameraTarget;
    
    }



    update(delta, keysPressed = null) {
        this.mixer.update(delta);
        if (this.isMovingForward) {
            var angleYCameraDirection = Math.atan2(game.camera.position.x - this.object.position.x, game.camera.position.z - this.object.position.z);
            var directionOffset = directionOffset(keysPressed);

            this.rotateQuarternion.setFromAxisAngle(this.rotateAngle, angleYCameraDirection + directionOffset);
            this.object.rotateToward(this.rotateQuarternion, delta * 0.1);

            this.camera.getWorldDirection(this.walkDirection);
            this.walkDirection.y = 0;
            this.walkDirection.normalize();
            this.walkDirection.applyAxisAngle(this.rotateAngle, directionOffset);

            const velocity =  this.currentAction == 'Walking' ? this.runVelocity : this.walkVelocity;

            const moveX = this.walkDirection.x * velocity * delta;
            const moveZ = this.walkDirection.z * velocity * delta;

            this.object.position.x += moveX;
            this.object.position.z += moveZ;

            this.updateCameraTarget(moveX, moveZ);
         //   console.log(this.object.position.x)
        }
        
    }

    directionOffset(keysPressed) {
        var directionOffset = 0 // w
        if (keysPressed[Z]) {
            if (keysPressed[A]) {
                directionOffset = Math.PI / 4 // w+a
            } else if (keysPressed[D]) {
                directionOffset = - Math.PI / 4 // w+d
            }
        } else if (keysPressed[S]) {
            if (keysPressed[A]) {
                directionOffset = Math.PI / 4 + Math.PI / 2 // s+a
            } else if (keysPressed[D]) {
                directionOffset = -Math.PI / 4 - Math.PI / 2 // s+d
            } else {
                directionOffset = Math.PI // s
            }
        } else if (keysPressed[A]) {
            directionOffset = Math.PI / 2 // a
        } else if (keysPressed[D]) {
            directionOffset = - Math.PI / 2 // d
        }

        return directionOffset
    }
    


}


const game = new Game();