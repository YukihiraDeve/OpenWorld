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

        this.container = document.createElement('div');
        this.container.style.height = '100vh';
        document.body.appendChild(this.container);

        this.assetsPath = '../assets/';
        var assetsPath = this.assetsPath;

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
        this.anims.forEach( function(anim){ options.assets.push(`${assetsPath}/anims/${anim}.fbx`)});

        
        this.init();
        this.animate()

        

    }

	loadNextAnim(loader){
		let anim = this.anims.pop();
		const game = this;
		loader.load( `${this.assetsPath}/anims/${anim}.fbx`, function( object ){
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

        var joueur = this.player = new Player(this, () => this.focusCameraOnPlayer());
    }

    setupGUI() {
        const gui = new GUI();
        gui.add({ focusOnPlayer: () => this.focusCameraOnPlayer() }, 'focusOnPlayer').name('Focus on Player');
        const animationsFolder = gui.addFolder('Animations');
        this.anims.forEach(actionName => {
            animationsFolder.add({ [actionName]: () => joueur.setAction(actionName) }, actionName).name(`Play ${actionName}`); // prolbème ici
        });
        animationsFolder.open();
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

    animate() {
        requestAnimationFrame(() => this.animate());
        const delta = this.clock.getDelta();
        if (this.player.mixer) this.player.mixer.update(delta);
        this.renderer.render(this.scene, this.camera);
    }

    focusCameraOnPlayer() {
        if (this.player.object) {
            this.camera.position.set(this.player.object.position.x, this.player.object.position.y + 5, this.player.object.position.z + 10);
            this.camera.lookAt(this.player.object.position);
        }
    }
    
}

class Player {
    constructor(game) {
        this.game = game;
        this.mixer = null;
        this.actions = {};
        this.animations = {};
        this.loadModel();
    }

    loadModel() {
        const loader = new FBXLoader();
        const player = this;
        loader.load(`${this.game.assetsPath}FireFighter.fbx`, (object) => {
            this.mixer = new THREE.AnimationMixer(object);
            player.root = object;
            player.mixer = object.mixer;
            object.name = "Player";
            this.game.scene.add(object);

            object.traverse(child => {
                if (child.isMesh) {
                    child.castShadow = true;
                    child.receiveShadow = true;
                }
            })

            
        });

    }

    set action(name){
		//Make a copy of the clip if this is a remote player
		if (this.actionName == name) return;
		const clip = (this.local) ? this.animations[name] : THREE.AnimationClip.parse(THREE.AnimationClip.toJSON(this.animations[name])); 
		const action = this.mixer.clipAction( clip );
        action.time = 0;
		this.mixer.stopAllAction();
		this.actionName = name;
		this.actionTime = Date.now();
		action.clampWhenFinished = true;
		action.fadeIn(0.5);	
		action.play();
	}
    

    update(delta) {
        if (this.mixer) {
            this.mixer.update(delta);
        }
    }

    
}


const game = new Game();
