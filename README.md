# Three.js Asset Loader

A **lightweight, type-safe, and efficient** asset loading system for **Three.js** projects. Load GLTF models, textures, audio (positional & global), and cube textures — all with built-in **progress tracking**, **animation support**, and **full disposal** for memory safety.

Perfect for games, interactive experiences, or any WebGL/Three.js app where performance and clean resource management matter.

---

## Features

- **Type-safe asset definitions** via `assetsEntry.ts`
- **Parallel loading** with progress feedback
- **GLTF + Animations** (with `AnimationMixer` per model)
- **Positional & Global Audio** support
- **Texture & Cube Texture** loading
- **Smart disposal** of models, materials, geometries, textures, and audio
- **Singleton pattern** — safe to use across modules
- **CLI setup tool** to bootstrap your project

---

## Installation

```bash
npm install three-js-asset-loader
///////////////////////////////////////////////////////////////////////////////////////////

!!!Requires three as a peer dependency.!!!

npm install three

/////////////////////////////////////////////////////////////////////////////////////////////


Quick Start
/****************************************************************************/

1. Generate Config Files (Optional CLI)
npx three-js-asset-loader init

This creates:

assetsEntry.ts – Define your assets
exampleScene.ts – Demo usage
/****************************************************************************/
2. Define Your Assets (assetsEntry.ts)

// assetsEntry.ts
export const assetsEntry = {
  models: [
    {
      name: "character",
      path: "./models/character.glb",
      scale: { x: 1, y: 1, z: 1 },
      position: { x: 0, y: 0, z: 0 }
    }
  ],
  audios: [
    {
      name: "footsteps",
      path: "./audio/footsteps.mp3",
      positional: true,
      loop: false,
      volume: 0.7
    }
  ],
  textures: [
    {
      name: "ground",
      path: "./textures/ground.jpg"
    }
  ],
  cubeTextures: [
    {
      name: "sky",
      paths: [
        "./sky/px.jpg",
        "./sky/nx.jpg",
        "./sky/py.jpg",
        "./sky/ny.jpg",
        "./sky/pz.jpg",
        "./sky/nz.jpg"
      ]
    }
  ]
};

/*************************************************/
3. Load Assets in Your Scene

import { Scene, PerspectiveCamera } from "three";
import { assetsEntry } from "./assetsEntry.js";
import { AssetsLoader } from "three-js-asset-loader";

const scene = new Scene();
const camera = new PerspectiveCamera(75, innerWidth / innerHeight, 0.1, 1000);
camera.position.z = 5;

// Attach audio listener to camera
camera.add(assetsLoader.audioListener);
scene.add(camera);

const assetsLoader = AssetsLoader.getInstance(assetsEntry, scene);

// Optional: Show loading progress
const progressBar = document.getElementById("progress");
assetsLoader.loadingManager.onProgress((progress) => {
  progressBar.style.width = `${progress.percent}%`;
});

// Load everything
await assetsLoader.loadAllAssets();

// Use loaded assets
const character = assetsLoader.allAssets.models.gltf["character"];
scene.add(character);

// Play animation
const { mixer, actions } = assetsLoader.allAssets.models.animations["character"];
actions["Walk"]?.play();

// Update mixer in render loop
function animate() {
  mixer.update(0.016); // 60 FPS
  requestAnimationFrame(animate);
}
animate();
////////////////////////////////////////////////////
//Play audio
const allAssets = assetsLoader.allAssets;
const audio = allAssets.audios.audioName;
audio.play();
//If its Positional
*You need to pass the camera to it 
assetsLoader.setCameraForPositionalAudio(camera);
audio.setRefDistance(0.5);    // full volume within 5 units
audio.setMaxDistance(1);  // silent after 100 units
// audio.setRolloffFactor(2);  // steeper falloff
// audio.setDistanceModel("inverse");
Then you can attach to the mesh you want

/************************************************/
//For adding cubeMaps
const skybox = assetsLoader.allAssets.cubeTextures["skybox1"];
scene.background = skybox;

/*************************************************/

Disposal & Memory Management
Prevent memory leaks with full cleanup:

// Dispose a single model
assetsLoader.disposeModel("character");

// Dispose everything (ideal on scene change)
await assetsLoader.disposeAll(); 
 
this will automatically 
* Removes from scene
* Stops animations
* Disposes geometries, materials, textures
* Stops & disconnects audio
* Clears loaders and listeners

/************************************************/
API
AssetsLoader.getInstance(assetsEntry, scene)
Returns singleton instance.
await loader.loadAllAssets()
Loads all assets in parallel.

////////////////////////////////////
loader.allAssets
# {
#   models: { gltf: { [name]: Object3D }, animations: { [name]: { mixer, actions } } },
#   audios: { [name]: Audio | PositionalAudio },
#   textures: { [name]: Texture },
#   cubeTextures: { [name]: CubeTexture }
# }

loader.disposeModel(name)
Full cleanup of a GLTF model + animations.
loader.disposeAll()
Dispose everything safely.

/////////////////////////////////////////////////////

CLI Commands
Command Description

npx three-js-asset-loader init
Scaffold config + example


Built With

Three.js
TypeScript
ES Modules