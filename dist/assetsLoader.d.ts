import type { AssetsEntryType } from "./assetsEntryType.js";
import { GLTFLoader } from "three/examples/jsm/Addons.js";
import LoadingManager from "./LoadingManager.js";
import { Audio, AudioListener, AudioLoader, CubeTexture, CubeTextureLoader, PositionalAudio, Scene, Texture, TextureLoader } from "three";
export type AllAssetsType = {
    models: {
        gltf: Record<string, any>;
        animations: Record<string, any>;
    };
    audios: Record<string, Audio | PositionalAudio>;
    textures: Record<string, Texture>;
    cubeTextures: Record<string, CubeTexture>;
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
    scene: Scene;
    constructor(assetsEntry: AssetsEntryType, scene: Scene);
    static getInstance(assetsEntry?: AssetsEntryType, scene?: Scene): AssetsLoader;
    allAssets: AllAssetsType;
    loadAllAssets(): Promise<void>;
    private loadModels;
    private loadTextures;
    private loadAllAudios;
    private loadAnimations;
    private loadCubeTextures;
    disposeModel(modelName: string): void;
    disposeTexture(textureName: string): void;
    disposeAudio(audioName: string): void;
    disposeCubeTexture(name: string): void;
    disposeEverything(): void;
    disposeAll(): Promise<void>;
}
//# sourceMappingURL=assetsLoader.d.ts.map