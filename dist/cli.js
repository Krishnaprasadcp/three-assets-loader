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
  ]
};
`;
const exampleSceneTemplate = `
// exampleScene.ts
import { Scene } from "three";
import { assetsEntry } from "./assetsEntry.js";
import LoadingManager from "./dist/LoadingManager.js";
import AssetsLoader from "./dist/assetsLoader.js";

const loadingManager = LoadingManager.getInstance();
const progressBar = document.getElementById("progress");

loadingManager.onProgress((progress) => {
  if (progressBar) {
    progressBar.style.width = \`\${progress.percent}%\`;
  }
});

const scene = new Scene();
const assetsLoader = AssetsLoader.getInstance(assetsEntry, scene);

await assetsLoader.loadAllAssets();
console.log(assetsLoader.allAssets.models);

setTimeout(() => {
  assetsLoader.disposeEverything();
}, 3000);
`;
const cwd = process.cwd();
function writeIfNotExists(filePath, content) {
    if (fs.existsSync(filePath)) {
        console.log(`⚠️  ${path.basename(filePath)} already exists — skipping.`);
    }
    else {
        fs.writeFileSync(filePath, content.trimStart());
        console.log(`✅ Created ${path.basename(filePath)}`);
    }
}
writeIfNotExists(path.join(cwd, "assetsEntry.ts"), assetsEntryTemplate);
writeIfNotExists(path.join(cwd, "exampleScene.ts"), exampleSceneTemplate);
console.log("\n🎉 Three.js asset loader setup complete!");
console.log("👉 Now edit 'assetsEntry.ts' to define your models, textures, and audios.");
//# sourceMappingURL=cli.js.map