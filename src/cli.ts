#!/usr/bin/env node
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const assetsEntryTemplate = `
// assetsEntry.ts
import type { mappingTypes } from "./assetsLoader.js";

export const CloneMethods = {
  DeepClone: "DeepClone",
  ShallowClone: "ShallowClone",
  SkeletonClone: "SkeletonClone",
} as const;
interface BaseCloneRequest {
  enabled?: boolean;
  count: number;
}

// ---- Variants ----

// For deep and shallow 
export interface StandardCloneRequest extends BaseCloneRequest {
  methods: "DeepClone" | "ShallowClone";
}

// For skeleton clone only 
export interface SkeletonCloneRequest extends BaseCloneRequest {
  methods: "SkeletonClone";
  deepClone?: boolean;
  cloneGeometry?: boolean;
}

// ---- Final union type ----
export type CloneRequestTypeForModel =
  | StandardCloneRequest
  | SkeletonCloneRequest;
export interface CloneRequestTypeForTexture {
  enabled: boolean;
  count: number;
}
export type AssetsEntryType = {
  models?: Array<{
    name: string;
    path: string;
    isDraco?: boolean;
    cloneRequest: CloneRequestTypeForModel;
  }>;
  audios?: Array<{
    name: string;
    path: string;
    positional: boolean;
    loop: boolean;
    volume: number;
  }>;
  textures?: Array<{
    name: string;
    path: string;
    cloneRequest: CloneRequestTypeForTexture;
  }>;
  cubeTextures?: Array<{
    name: string;
    paths: [string, string, string, string, string, string];
  }>;
  hdrCubeTextures?: Array<{
    name: string;
    paths: [string, string, string, string, string, string];
    isPMREMGenerator: boolean;
  }>;
  hdrTextures?: Array<{
    name: string;
    path: string;
    mapping?: keyof typeof mappingTypes;
  }>;
  fonts?: Array<{
    name: string;
    path: string;
  }>;
};

export const assetsEntry = {
  models: [
    {
      name: "oldCar",
      path: "/car.glb",
      scale: { x: 0.01, y: 0.01, z: 0.01 },
      // cloneRequest: {
      //   enabled: true,
      //   count: 5,
      //   methods: "ShallowClone",
      // },
    },
    {
      name: "car2",
      path: "/car2.glb",
      cloneRequest: {
        enabled: true,
        count: 2,
        methods: "SkeletonClone",
        deepClone: true,
        cloneGeometry: false,
      },
    },
    {
      name: "character",
      path: "/character.glb",
      scale: { x: 0.01, y: 0.01, z: 0.01 },
      position: { x: 4, y: 0, z: 0 },
      cloneRequest: {
        enabled: true,
        count: 1,
        methods: "DeepClone",
      },
    },
  ],
  audios: [
    {
      name: "kanmani",
      path: "/kanmani.mp3",
      positional: true,
      loop: true,
      volume: 0.5,
    },
    {
      name: "kanmani2",
      path: "/kanmani.mp3",
      positional: true,
      loop: true,
      volume: 0.5,
    },
  ],
  textures: [
    {
      name: "kp",
      path: "/Kp.jpg",
      cloneRequest: {
        enabled: true,
        count: 4,
      },
    },
    {
      name: "kp2",
      path: "/Kp.jpg",
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
    // {
    //   name: "skybox2",
    //   paths: [
    //     "/Yokohama2/negx.hdr",
    //     "/Yokohama2/negy.hdr",
    //     "/Yokohama2/negz.hdr",
    //     "/Yokohama2/posx.hdr",
    //     "/Yokohama2/posy.hdr",
    //     "/Yokohama2/posz.hdr",
    //   ],
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

`;

const exampleSceneTemplate = `
// main.js
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { createScene2 } from "./main2.js"; // <- import second scene
import { AssetsLoader, AllAssets, LoadingManager } from "three-assets-loader";

import { assetsEntry } from "./assetsEntry.js";
import { TextGeometry } from "three/examples/jsm/Addons.js";
// === Scene 1 ===
const scene1 = new THREE.Scene();
const camera1 = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
camera1.position.set(2, 2, 15);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setClearColor(0xffffff);
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);
const assetsLoader = new AssetsLoader(assetsEntry, scene1);
assetsLoader.setRendererForHdrMap(renderer);
const loadingManager = LoadingManager.getInstance();

await assetsLoader.loadAllAssets();
const allAssets = AllAssets.getInstance();
console.log(allAssets);
const group = new THREE.Group();

const source = allAssets.fetchModel("character");

const texture = allAssets.getTextureClone("kpTexture1");
console.log(allAssets.getAllTexturesArray());

const texture2 = allAssets.getTextureClone("kp2Texture1");
const car = allAssets.fetchModel("car2SkeletonClone0");
const car1 = allAssets.fetchModel("car2SkeletonClone1");
const carClone = allAssets.fetchModel("car2", {
  count: 2,
  methods: "SkeletonClone",
});
console.log(carClone);

car.modelRef.position.set(20, 0, 0);
car1.modelRef.position.set(0, 0, 0);
scene1.add(car.modelRef, car1.modelRef);
car.actionsRef["AllAnim"].play();

car1.actionsRef["AllAnim"].play();
const carClone2 = allAssets.fetchModel("car2");
console.log(carClone2);

// scene1.add(clone.sourceModel);
// scene1.add(car2Clone2.modelRef);
// scene1.add(car2Clone1.modelRef);
// clone.actionsRef["Armature|Walk"].play();

// console.log(allAssets.getAllModelInArray());
// console.log(allAssets.getAllModelDataInObject());
// console.log(allAssets.getModel("oldCarDeepClone0"));

const controls1 = new OrbitControls(camera1, renderer.domElement);
controls1.enableDamping = true;
const ambient1 = new THREE.AmbientLight(0xffffff, 0.5);
scene1.add(ambient1);

const directional1 = new THREE.DirectionalLight(0xffffff, 1);
directional1.position.set(3, 5, 2);
scene1.add(directional1);
const cube1 = new THREE.Mesh(
  new THREE.BoxGeometry(1, 1, 1),
  new THREE.MeshStandardMaterial({ color: 0x0077ff, map: texture.texture })
);
const cube2 = new THREE.Mesh(
  new THREE.BoxGeometry(1, 1, 1),
  new THREE.MeshStandardMaterial({ color: 0x0077ff, map: texture2.texture })
);
cube1.position.x = 5;
cube2.position.x = -5;
scene1.add(cube1, cube2);
// allAssets.disposeTexturesByScene(scene1);
console.log(allAssets);

// const cubeTextures = allAssets.fetchCubeTexture("skybox1");
// scene1.background = cubeTextures.cubeMap;
const hdriTexture = allAssets.fetchHdriTexture("hdr1");

// scene1.background = hdriTexture.original;
// scene1.environment = hdriTexture.hdri;
allAssets.setCameraForPositionalAudio(camera1);
// const audio = allAssets.fetchAudio("kanmani");
// audio.audio.setRefDistance(6);
// const audio2 = allAssets.fetchAudio("kanmani2");
// audio.cube1.add(audio.audio);
// audio.audio.play()

// cube2.add(audio2.audio);
// audio2.audio.play()
const material = new THREE.MeshStandardMaterial({ color: 0x0077ff });
const font1 = allAssets.fetchFont("roboto");
const textGeo = new TextGeometry("text", {
  font: font1.font,

  size: 7,
});

const textMesh1 = new THREE.Mesh(textGeo, material);
console.log(allAssets.get);

// scene1.add(textMesh1);
setTimeout(() => {
  // allAssets.disposeCloneModel("car2SkeletonClone0");
  // allAssets.disposeAudio("kanmani");
  // allAssets.disposeCubeMap("skybox1");
  // console.log(allAssets);
  // allAssets.disposeTexturesByScene(scene1);
  console.log(allAssets);
}, 2000);

// === Switch logic ===
let activeScene = 1;
let frameId = null;
window.addEventListener("keydown", (e) => {
  if (e.key.toLowerCase() === "f") {
    activeScene = activeScene === 1 ? 2 : 1;
    // === Scene 2 (load but not active yet) ===
    createScene2(renderer);
    cancelAnimationFrame(frameId);
    console.log("Switched to Scene:", activeScene);
  }
});

// === Animation Loop ===
const clock = new THREE.Clock();
function animate() {
  frameId = requestAnimationFrame(animate);
  const delta = clock.getDelta();
  if (car.mixerRef) car.mixerRef.update(delta);
  if (car1.mixerRef) car1.mixerRef.update(delta);
  // cube1.rotation.x += 0.01;
  // cube1.rotation.y += 0.01;
  controls1.update();
  renderer.render(scene1, camera1);
}

animate();

`;

const cwd = process.cwd();

function writeIfNotExists(filePath: string, content: string) {
  if (fs.existsSync(filePath)) {
    console.log(`⚠️  ${path.basename(filePath)} already exists — skipping.`);
  } else {
    fs.writeFileSync(filePath, content.trimStart());
    console.log(`✅ Created ${path.basename(filePath)}`);
  }
}
writeIfNotExists(path.join(cwd, "assetsEntry.ts"), assetsEntryTemplate);
writeIfNotExists(path.join(cwd, "exampleScene.ts"), exampleSceneTemplate);
console.log("\n🎉 Three.js asset loader setup complete!");
console.log(
  "👉 Now edit 'assetsEntry.ts' to define your models, textures, and audios."
);
