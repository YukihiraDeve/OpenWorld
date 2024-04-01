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
        this.anims = ['Walking', 'Walking Backwards', 'Turn', 'Running', 'Pointing', 'Talking', 'Pointing Gesture'];
        this.anims.forEach( function(anim){ options.assets.push(`${game.assetsPath}anims/${anim}.fbx`)});
		options.assets.push(`${game.assetsPath}Firefighter.fbx`);

        
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

        const ambient = new THREE.AmbientLight(0xaaaaaa);
        this.scene.add(ambient);

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
        this.setupGUI();

        this.player = new Player(this)
    }

    setupGUI() {
        /*
        const gui = new GUI();
        gui.add({ focusOnPlayer: () => this.focusCameraOnPlayer() }, 'focusOnPlayer').name('Focus on Player');
        const animationsFolder = gui.addFolder('Animations');
        this.anims.forEach(actionName => {
            animationsFolder.add({ [actionName]: () => this.action(actionName) }, actionName).name(`Play ${actionName}`); // prolbème ici
        });
        animationsFolder.open();
    }
*/

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
        loader.load(`${this.assetsPath}fbx/town.fbx`, function (object) {
            game.environment = object;
            game.colliders = [];
            game.scene.add(object);
            
            object.traverse(function (child) {
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

            game.scene.background = textureCube;

        });

        this.loadNextAnim(loader);
    }

    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    animate(){
        const game = this;
        const dt = this.clock.getDelta(); // Durée depuis la dernière frame
    
        // Mettre à jour le mixer d'animation
        if (this.player && this.player.mixer) {
            this.player.mixer.update(dt);
        }
    
        // Mettre à jour le joueur
        if (this.player) {
            this.player.update(dt);
        }
    
        // Rendre la scène
        this.renderer.render(this.scene, this.camera);
    
        // Demander une nouvelle frame d'animation
        requestAnimationFrame(function() {
            game.animate();
        });
    }

    focusCameraOnPlayer() {
        if (this.player.object) {
            this.camera.position.set(this.player.object.position.x, this.player.object.position.y + 5, this.player.object.position.z + 10);
            this.camera.lookAt(this.player.object.position);
        }
    }
    
}

class Player {
    constructor(game, options){
        this.animations = {};
        this.local = true
        this.game = game;
        this.otherPlayer = {};
        this.initKeyboardControls();
        let model;

        const player = this;
        const loader = new FBXLoader()
        

        loader.load(`/assets/Firefighter.fbx`, function (object) {
            object.mixer = new THREE.AnimationMixer( object );
			player.root = object;
			player.mixer = object.mixer;
            object.name = "Person";
            object.traverse(function (child) {
                if (child.isMesh) {
                    child.castShadow = true;
                    child.receiveShadow = true;
                }
            });
        
            player.object = new THREE.Object3D();
            player.object.add(object);
            game.scene.add(player.object)

            if (object.animations) {
                const animations = object.animations;
                animations.forEach((anim) => {
                    player.animations[anim.name] = anim;
                    console.log(anim.name);

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
            case 'q': // Gauche
            case 's': // Reculer
            case 'd': // Droite
                this.playWalkingAnimation();
                break;
            // Ajoutez d'autres cas au besoin
        }
    }

    onKeyUp(event) {
        switch (event.key) {
            case 'z':
            case 'q':
            case 's':
            case 'd':
                this.stopWalkingAnimation();
                break;
            // Ajoutez d'autres cas au besoin
        }
    }

    playWalkingAnimation() {
        if (this.actionName !== 'Walking') {
            this.action = 'Walking';
        }
    }

    stopWalkingAnimation() {
        if (this.actionName === 'Walking') {
            // Ici, vous pourriez vouloir revenir à une animation "Idle" ou simplement arrêter l'animation actuelle
            this.action = 'Talking'; // Assurez-vous d'avoir une animation "Idle" ou adaptez selon vos besoins
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

    //tests
    

    update(delta) {
        if (this.mixer) {
            this.mixer.update(delta);
        }
    }

    
}


const game = new Game();