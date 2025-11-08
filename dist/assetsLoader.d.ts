import type { AssetsEntryType } from "./assetsEntryType.js";
import { GLTFLoader } from "three/examples/jsm/Addons.js";
import LoadingManager from "./LoadingManager.js";
import { DRACOLoader } from "three/addons/loaders/DRACOLoader.js";
import { FontLoader, Font } from "three/addons/loaders/FontLoader.js";
import { HDRCubeTextureLoader } from "three/addons/loaders/HDRCubeTextureLoader.js";
import { Audio, AudioListener, AudioLoader, Camera, CubeTexture, CubeTextureLoader, PositionalAudio, Scene, Texture, TextureLoader, WebGLRenderer } from "three";
export type AllAssetsType = {
    models: {
        gltf: Record<string, any>;
        animations: Record<string, any>;
    };
    audios: Record<string, Audio | PositionalAudio>;
    textures: Record<string, Texture>;
    cubeTextures: Record<string, CubeTexture>;
    fonts: Record<string, Font>;
    hdrCubeTextures: Record<string, Texture>;
    hdrTextures: Record<string, Texture>;
};
export declare const mappingTypes: {
    readonly EquirectangularReflectionMapping: 303;
    readonly EquirectangularRefractionMapping: 304;
    readonly CubeReflectionMapping: 301;
    readonly CubeRefractionMapping: 302;
};
export default class AssetsLoader {
    private static instance;
    private disposed;
    loadingManager: LoadingManager;
    assetsEntry: AssetsEntryType;
    modelLoader: GLTFLoader;
    textureLoader: TextureLoader;
    audioLoader: AudioLoader;
    audioListener: AudioListener | null;
    cubeTextureLoader: CubeTextureLoader;
    hdrCubeTextureLoader: HDRCubeTextureLoader;
    dracoLoader: DRACOLoader;
    private dracoModelLoader;
    fontLoader: FontLoader;
    scene: Scene;
    private renderer?;
    constructor(assetsEntry: AssetsEntryType, scene: Scene);
    static getInstance(assetsEntry?: AssetsEntryType, scene?: Scene): AssetsLoader;
    allAssets: AllAssetsType;
    loadAllAssets(): Promise<void>;
    private loadModels;
    private loadTextures;
    private loadAllAudios;
    private loadAnimations;
    private loadCubeTextures;
    setCameraForPositionalAudio(camera: Camera): void;
    private loadFonts;
    private loadHdrCubeTextures;
    private loadHdrTextures;
    setRendererForHdrMap(renderer: WebGLRenderer): void;
    disposeModel(modelName: string): void;
    disposeTexture(textureName: string): void;
    disposeAudio(audioName: string): void;
    disposeCubeTexture(name: string): void;
    disposeHdrCubeTexture(name: string): void;
    disposeHdrTexture(name: string): void;
    disposeFont(name: string): void;
    disposeEverything(): void;
    disposeAll(): Promise<void>;
}
//# sourceMappingURL=assetsLoader.d.ts.map