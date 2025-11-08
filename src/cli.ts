#!/usr/bin/env node
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const assetsEntryTemplate = `
// assetsEntry.ts
export type AssetsEntryType = {
  models?: Array<{
    name: string;
    path: string;
    scale?: { x: number; y: number; z: number };
    position?: { x: number; y: number; z: number };
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

export const assetsEntry: AssetsEntryType = {
  models: [
    {
      name: "car",
      path: "./models/car.glb",
      scale: { x: 1, y: 1, z: 1 },
      position: { x: 0, y: 0, z: 0 }
    }
  ],
  audios: [
    {
      name: "bgMusic",
      path: "./audio/bgMusic.mp3",
      positional: false,
      loop: true,
      volume: 0.5
    }
  ],
  textures: [
    {
      name: "wallTexture",
      path: "./textures/wall.jpg"
    }
  ],
  cubeTextures: [
    {
      name: "skybox1",
      paths: [
        "./px.jpg",
        "./nx.jpg",
        "./py.jpg",
        "./ny.jpg",
        "./pz.jpg",
        "./nz.jpg"
      ]
    }
  ],
    hdrCubeTextures: [
    {
      name: "skybox2",
      paths: [
        "/Yokohama2/negx.hdr",
        "/Yokohama2/negy.hdr",
        "/Yokohama2/negz.hdr",
        "/Yokohama2/posx.hdr",
        "/Yokohama2/posy.hdr",
        "/Yokohama2/posz.hdr",
      ],
      isPMREMGenerator: true,
    },
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
// exampleScene.ts
import { Scene } from "three";
import { assetsEntry } from "./assetsEntry.js";
import { AssetsLoader, LoadingManager } from "three-assets-loader";


const loadingManager = LoadingManager.getInstance();

//If you have progress bar design on html then that element can be called in onProgress callback

const progressBar = document.getElementById("progress");

loadingManager.onProgress((progress) => {
  if (progressBar) {
    progressBar.style.width = \`\${progress.percent}%\`;
  }
});

const scene = new Scene();
//The scene must be pass to the AssetsLoader for very first time
const assetsLoader = AssetsLoader.getInstance(assetsEntry, scene);

// This is were all assets that you have provided in assets entry began to load
await assetsLoader.loadAllAssets();
console.log(assetsLoader.allAssets.models);
//after this loading you can use the assets anywhere you want .

//For disposing textures.
const assetsLoader =  AssetsLoader.getInstance();
assetsLoader.disposeTexture("textureName")
***The textureName should be match with the exact name that you have provided in assetsEntry

//For disposing model
const assetsLoader =  AssetsLoader.getInstance();
assetsLoader.disposeModel("modelName")
***The modelName should be match with the exact name that you have provided in assetsEntry
*Note
if you dispose anymodel this will dispose its animation and its mixer .

//For removing Audio
const assetsLoader =  AssetsLoader.getInstance();
assetsLoader.disposeAudio("audioName")
***The audioName should be match with the exact name that you have provided in assetsEntry

//For removing cubeTextures
const assetsLoader =  AssetsLoader.getInstance();
assetsLoader.disposeCubeTexture("cubeTextureName")
***The cubeTextureName should be match with the exact name that you have provided in assetsEntry

//For removing hdrCubeTextures
assetsLoader.disposeHdrCubeTexture("hdrCubeTextureName");

//For removing hdriTexture
assetsLoader.disposeHdrTexture("hdriName")

//For removing fonts
assetsLoader.disposeFont("fontName")


//For remove Everything
setTimeout(() => {
  assetsLoader.disposeEverything();
}, 3000);
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
