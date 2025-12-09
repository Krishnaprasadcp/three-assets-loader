Three.js Asset Loader

A lightweight, type-safe, and efficient asset loading system for Three.js projects.
Load GLTF models, textures, audio (positional & global), and cube textures — all with built-in progress tracking, animation support, and full disposal for memory safety.

Perfect for games, interactive experiences, or any WebGL/Three.js application where performance and clean resource management matter.

Features

Type-safe asset definitions via assetsEntry.ts

Parallel loading with progress feedback

GLTF + Animation support (with an AnimationMixer per model)

Positional & Global Audio

Texture & CubeTexture loading

Automatic memory-safe disposal

Singleton architecture — safe across modules

Optional CLI setup tool to bootstrap configuration

Installation
npm install three-js-asset-loader
///////////////////////////////////////////////////////////////////////////////////////////


⚠️ Requires three as a peer dependency

npm install three
/////////////////////////////////////////////////////////////////////////////////////////////

Quick Start

/*********************************/

1. Generate Config Files (Optional via CLI)
npx three-js-asset-loader init


This creates:

assetsEntry.ts – Define your assets

exampleScene.ts – Usage example

/*********************************/

2. Define Your Assets (assetsEntry.ts)
// assetsEntry.ts
// Asset format must follow this structure.
// If you don’t have any category (like fonts, HDRIs etc.), you may omit it.

export const assetsEntry = {
  models: [
    {
      name: "oldCar",
      path: "/car.glb",
      cloneRequest: {
        enabled: true,
        count: 5,
        methods: "DeepClone",
      },
    },
    {
      name: "character",
      path: "/character.glb",
      cloneRequest: {
        enabled: false,
      },
    },
  ],
  audios: [
    {
      name: "audio",
      path: "/audio.mp3",
      positional: true,
      loop: true,
      volume: 0.5,
    },
  ],
  textures: [
    {
      name: "texture1",
      path: "/texture.jpg",
      cloneRequest: {
        enabled: true,
        count: 4,
      },
    },
    {
      name: "texture2",
      path: "/texture2.jpg",
      cloneRequest: {
        enabled: true,
        count: 4,
      },
    },
  ],
  cubeTextures: [
    {
      name: "skybox1",
      paths: [
        "/Yokohama2/negx.jpg",
        "/Yokohama2/negy.jpg",
        "/Yokohama2/negz.jpg",
        "/Yokohama2/posx.jpg",
        "/Yokohama2/posy.jpg",
        "/Yokohama2/posz.jpg",
      ],
    },
  ],
  hdrCubeTextures: [
    // Example:
    // {
    //   name: "skybox2",
    //   paths: [...],
    //   isPMREMGenerator: true,
    // },
  ],
  hdrTextures: [
    {
      name: "hdr1",
      path: "/hdri1.hdr",
      mapping: "EquirectangularReflectionMapping",
    },
  ],
  fonts: [
    {
      name: "roboto",
      path: "/gentilis_regular.typeface.json",
    },
  ],
};

### 3. Load Assets in Your Scene

import { Scene, PerspectiveCamera } from "three";
import { assetsEntry } from "./assetsEntry.js";
import { AssetsLoader, AllAssets,LoadingManager } from "three-assets-loader";

const scene = new Scene();
const camera = new PerspectiveCamera(75, innerWidth / innerHeight, 0.1, 1000);
camera.position.z = 5;

const assetsLoader = new AssetsLoader(assetsEntry, scene);

// Must be called if using HDR CubeTextures or HDRI textures.
// Call BEFORE: await assetsLoader.loadAllAssets();
assetsLoader.setRendererForHdrMap(renderer);

// Optional: Show loading progress
const loadingManager = LoadingManager.getInstance();
const progressBar = document.getElementById("progress");

loadingManager.onProgress((progress) => {
  progressBar.style.width = `${progress.percent}%`;
});

// Load everything
await assetsLoader.loadAllAssets();

// This instance holds every loaded asset (including generated clones).
const allAssets = AllAssets.getInstance();

Working With Models
// Fetch source model
const source = allAssets.fetchModel("character");

/*
 NOTE:
 When fetching a source model, you receive the exact original reference.
 If the same model is fetched and modified in multiple places,
 transformations will apply everywhere because the reference is shared.
*/

Clone Types
Clone Type	Description
DeepClone	Fully clones geometry and materials. Not recommended for animated models.
ShallowClone	Clones geometry only; materials remain shared.
SkeletonClone	Best for animated models (bones/skin). Extra options: deepClone, cloneGeometry.
// Generate clones
allAssets.fetchModel("car2", { count: 2, methods: "DeepClone" });
allAssets.fetchModel("car2", { count: 2, methods: "ShallowClone" });
allAssets.fetchModel("car2", { count: 2, methods: "SkeletonClone" });

// Fetch a clone later:
const car = allAssets.fetchModel("car2SkeletonClone1");


Clone naming format:

<modelName><method><index>
Example → car2SkeletonClone0

Returned Model Properties Overview
const carClone = allAssets.fetchModel("car2");


This returns:

Property	Meaning
actionRef	Animation actions (if available)
animations	Animation clips (source model only)
id	Unique model ID (source only)
mixerRef	Animation mixer
modelRef	Object3D clone (for clone models only)
name	Source model name
parentName / parentId	Parent source info (clone only)
sourceModel	Original Object3D (source only)
Animation Example
const car = allAssets.fetchModel("car2SkeletonClone0");
car.actionsRef["AllAnim"].play();

if (car.mixerRef) car.mixerRef.update(delta);

Audio Usage

Global audio:

const audio = allAssets.fetchAudio("audioName");
audio.play();


Positional audio:

allAssets.setCameraForPositionalAudio(camera);

const audio = allAssets.fetchAudio("audio");
cube1.add(audio.audio);
audio.audio.setRefDistance(6);
audio.audio.play();

Environment Maps
const cubeTextures = allAssets.fetchCubeTexture("skybox1");
scene.background = cubeTextures.cubeMap;


HDR environment:

const hdriTexture = allAssets.fetchHdriTexture("hdr1");
scene.background = hdriTexture.original;
scene.environment = hdriTexture.hdri;

Fonts
const font1 = allAssets.fetchFont("roboto");

Disposal & Memory Management

Use these to avoid memory leaks.

### disposeEverything
Clears ALL assets loaded from assetsEntry — including models, textures, audio, etc.
Your manually created custom meshes will not be removed, but their asset-based texture references will.

Additional Disposal APIs
- disposeAllTextures
- disposeAudio("audioName")
- disposeCloneModel("car2DeepClone0")
- disposeCloneTexture("textureCloneName")
- disposeCubeMap("cubeMapName")
- disposeFont()
- disposeHdrCubeMap()
- disposeHdriTexture("hdriName", scene)
- disposeModelsByScene(scene1)
- disposeSourceModel("car2")
- disposeSourceTexture("textureName")
- disposeTexturesByScene(scene1)

Helper Functions
allAssets.getAllTexturesArray();
allAssets.getClone("car2SkeletonClone1");
allAssets.getClones("car2");


Result format:

car2: {
  deep: [],
  shallow: [],
  skeleton: [],
}

CLI Commands
Command	Description
npx three-js-asset-loader init	Generates configuration and example files
Built With

Three.js

TypeScript

ES Modules