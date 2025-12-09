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

```

!!!Requires three as a peer dependency.!!!

```bash
npm install three

/////////////////////////////////////////////////////////////////////////////////////////////
```

Quick Start
/**\*\***\*\*\*\***\*\***\*\*\*\***\*\***\*\*\*\***\*\***\*\*\*\***\*\***\*\*\*\***\*\***\*\*\*\***\*\***\*\*\*\***\*\***/

1. Generate Config Files (Optional CLI)

```bash
npx three-js-asset-loader init
```

# This creates:

# assetsEntry.ts – Define your assets

# exampleScene.ts – Demo usage

/**\*\***\*\*\*\***\*\***\*\*\*\***\*\***\*\*\*\***\*\***\*\*\*\***\*\***\*\*\*\***\*\***\*\*\*\***\*\***\*\*\*\***\*\***/

# 2. Define Your Assets (assetsEntry.ts)

````ts
// assetsEntry.ts
//Assets Entry format must follow this structure
//If yiu dont have any of these assets to load then you can skip it
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


/*************************************************/
```md
3. Load Assets in Your Scene

```ts
import { Scene, PerspectiveCamera } from "three";
import { assetsEntry } from "./assetsEntry.js";
import { AssetsLoader, AllAssets,LoadingManager } from "three-assets-loader";

const scene = new Scene();
const camera = new PerspectiveCamera(75, innerWidth / innerHeight, 0.1, 1000);
camera.position.z = 5;


const assetsLoader = new AssetsLoader(assetsEntry, scene);
//This must be called if you are using HdrCube Textures and HDRI textures
//And it must be call before you call await assetsLoader.loadAllAssets();
assetsLoader.setRendererForHdrMap(renderer);

// Optional: Show loading progress
const loadingManager = LoadingManager.getInstance();
//You must have an div or any element that you are targetting in here progress is the id of that element
//progress.percent will return a number that between 0 to 100
const progressBar = document.getElementById("progress");

loadingManager.onProgress((progress) => {
  progressBar.style.width = `${progress.percent}%`;
});

// Load everything
await assetsLoader.loadAllAssets();

//This will hold every assets you loaded.And Every clone and other are stored here.
const allAssets = AllAssets.getInstance();

// Load Models
//You can use fetchModel function to retrive the loaded model.
//Also you can use this function fetchModel to multiple purpose.
// 1.Load the source Model
      const source = allAssets.fetchModel("character");
      //Note //
      //When you fetch the source/original model, you are getting the same reference object stored in the asset system.
      // So:If you add this model to Scene A and move/rotate/scale it…
      // And later use the same fetchModel("character") in Scene B and modify it…
      // Both scenes will reflect the latest transformation, because they are sharing the exact same object instance.
      // 1.Load the Clone Model

      //Note
      //There are 3 types of clone you can do.
        // 1.DeepClone
              //Means each material and each geometry is cloned you will get the model as a new model.
              //And if there is animations Dont Use this Deep cloneMethod , kindly use SkeletonClone method.
        // 2.ShallowClone
              //Means each model geometry is cloned but not the material. So if you change one model material it will be affected to all other inctances.
        // 3.SkeletonClone
              //Means good for cloning that have animations means bones etc..
              //When using the skeletonclone method you will get two more properties .
                //1.deepClone - by default false. Means you can clone the material too.
                //2.cloneGeometry - by default false. Means you can clone the geometry too.
//2.Create the clones
  //You Can create all three different clones from these by using method overload
    //Create DeepClone
      allAssets.fetchModel("car2",{count:2,methods:"DeepClone"});
      //The car2 is the name of your source model,you can give the count here and the method too.
    //Create ShallowClone
      allAssets.fetchModel("car2",{count:2,methods:"ShallowClone"});
    //Create SkeletonClone
      allAssets.fetchModel("car2",{count:2,methods:"SkeletonClone"});
      //And you can also give the parameter for deepClone and cloneGeometry both are false by default
  //By Creating clones by this method will not directly gives the clones
  //You have to fetch it from the normal way
  //Like this
    const car1 = allAssets.fetchModel("car2SkeletonClone1");
  *******************************************************************************************
  //Note
  //The naming convention of clones be like this
  //Your model name + whatever the clone method + anincrementer
  //That  is if the model name is car2 and method is skeletonClone and you have only clone it for one time so incremeter starts from 0
  //So alltogether car2SkeletonClone0 this is your clone name
  ********************************************************************************************
  //The returned data is not giving directly access to the model you have to dig in one more step.
  // When you call like this
  const carClone = allAssets.fetchModel("car2");
  //This will return some properties
    //1.actionRef this will contains animation actions if any.
    //2.animations this will contains animations clips if any. And this animations property   only exists if you are fetching the source model otherwise this will be undefined.
    //3.id this will contains a unique id for every model you can fetch the model using this id.And this will only available if you are calling the source model.
    //4.mixerRef this will contain the mixer for the model you can use it in the animation loop.
    //5.modelId this is for the cloned models . A unique id for the cloned model.This will not be for the source model.
    //6.modelRef this will contains the actual cloned model means Object3d.This will not be available for source model.
    //7.name this will contains the source model name.This will not be available for the cloned model.
    //8.parentId this will contains the source model id and this property is only available in cloned model.
    //9.parentName this will contains the parent model name . This property is only availabel in cloned model.
    //sourceModel this property contains the Object3d of source model . And this will be only availabel if you only call the sourcemodel.

**********************************************************************************************
// Play animation
const car = allAssets.fetchModel("car2SkeletonClone0");
car.actionsRef["AllAnim"].play();
//In animation loop
if (car.mixerRef) car.mixerRef.update(delta);
//So you have to call like this
      if (car.mixerRef)
//Because if you dispose the model then the mixerRef will not be available so it will throws an error.
**********************************************************************************************

//Play audio
//You Could have use two types of audio
//1.General Audio means when you play this audio you can hear it like an ambient music .
//2.Positional Audio in this you can attach the audio to a mesh or anything and when camera   is near to that object then you can hear the music.

//Usage
  //For General Audio
    const audio = allAssets.fetchAudio("audioName");
    audio.play();
  //For Positional Audio
    //1.First you have to set it as positional audio in assetsEntry
          audios: [
           {
              name: "audio",
              path: "/audio.mp3",
              positional: true,
              loop: true,
              volume: 0.5,
            }
          ],
    //2.Pass the camera to the listner this must be done before the audio playing
        allAssets.setCameraForPositionalAudio(camera);

    //3.Add the audio to object
        const audio = allAssets.fetchAudio("audio");
        //cube1 is a mesh.
        cube1.add(audio.audio);
        audio.audio.play()

        //For adujesting the distance for the camera you can use this function
            audio.audio.setRefDistance(6)

        //Thats it you will get your positional audio
**********************************************************************************************

//For adding cubeMaps
const cubeTextures = allAssets.fetchCubeTexture("skybox1");
scene.background = cubeTextures.cubeMap;

**********************************************************************************************

//For adding hdrCubeTextures
//You must pass renderer before you loadAllAssets
//Like this
const assetsLoader = new AssetsLoader(assetsEntry, scene1);
assetsLoader.setRendererForHdrMap(renderer);

//Then
const hdriTexture = allAssets.fetchHdriTexture("hdr1");

scene1.background = hdriTexture.original;
scene1.environment = hdriTexture.hdri;
**********************************************************************************************

//For adding fonts
const font1 = allAssets.fetchFont("roboto");

const material = new THREE.MeshStandardMaterial({ color: 0x0077ff });
const textGeo = new TextGeometry("text", {
  font: font1.font,

  size: 7,
});

const textMesh1 = new THREE.Mesh(textGeo, material);
scene1.add(textMesh1);
**********************************************************************************************

Disposal & Memory Management
Prevent memory leaks with full cleanup:

//disposeEverything
```md
So this function expects scene as parameter and this will clear all the assets means if you are using the models while calling this method will clear everything and dispose safely.
And also it will not clear your own mehes like if you create a cube and add a texture from the allAssets then the cube will not be cleared by this method but the texture is gone .Like the texture is there but if you update the cube then the texture reference will not be available.
This function will only dispose the files that in the assetsEntry
```
**********************************************************************************************
//disposeAllTextures
```md
This will dispose all textures from the allAssets.
```
**********************************************************************************************
//disposeAudio
```md
This function need a parameter that s audioName
```
allAssets.disposeAudio("audioName");

```md
This will stop the audio first then dispose it
```
**********************************************************************************************
//disposeCloneModel
```md
  This will dispose the clone model if you have any . 
  and you have to pass the cloneName
  like this
```  
allAssets.disposeCloneModel("car2DeepClone0");

**********************************************************************************************
//disposeCloneTexture
```md
  This will dispose the cloned textures if any
  and you have to pass the cloneName
```
allAssets.disposeCloneTexture("textureCloneName");
**********************************************************************************************
//disposeCubeMap
```md
  This will dispose the cubeMap 
  and you have to pass the cubeMap name
```
allAssets.disposeCubeMap("cubeMapName");
**********************************************************************************************
//disposeFont
```md
  This will dispose the Font 
  and you have to pass the Font name
```
allAssets.disposeFont();
**********************************************************************************************
//disposeHdrCubeMap
```md
  This will dispose the HdrCubeMap 
  and you have to pass the cubeMap name
```
allAssets.disposeHdrCubeMap();
**********************************************************************************************
//disposeHdriTextures
```md
  This will dispose the HdriTexture 
  and you have to pass the hdri name 
  You have to pass the scene also this will remove the hdri from scene too
```
allAssets.disposeHdriTexture("hdriName",scene);
**********************************************************************************************
//disposeModelByScene
```md
  This will only remove the model clones added to the scene.
  Only clones will disposed not source.
```
allAssets.disposeModelsByScene(scene1);
**********************************************************************************************
//disposeSourceModel
```md 
    This will remove the source model.And the clones too.
```
allAssets.disposeSourceModel("car2");
**********************************************************************************************
//disposeSourceTexture
```md
  This will remove the source textures .By calling this ,this will disposing the clones too
```
allAssets.disposeSourceTexture("textureName");
**********************************************************************************************
//disposeTexturesByScene
```md
  This will remove the textures that are added to any mesh . The non -adding mesh will not be disposed
```
allAssets.disposeTexturesByScene(scene1);
**********************************************************************************************
//Other helper functions
//1.
allAssets.getAllTexturesArray()//This will returns all textures in an array format
//2.
allAssets.getClone("car2SkeletonClone1")//This will returns the cloneModel
//3.
allAssets.getClones("car2")//The parameter is sourceModel name
//This will returns all the clones that made with this paraent
//This is the format what you will recieve

car2:{
deep: [],
shallow:[],
skeleton:[],
} 



CLI Commands
Command Description

npx three-js-asset-loader init
Scaffold config + example


Built With

Three.js
TypeScript
ES Modules
````
