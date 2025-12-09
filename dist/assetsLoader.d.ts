import type { AssetsEntryType } from "./assetsEntryType.js";
import { Scene, WebGLRenderer } from "three";
declare module "three/addons/loaders/FontLoader.js" {
    interface Font {
        userData: {
            keepIt?: boolean;
            keepItUntil?: string;
        };
    }
}
export type CloneType = "deep" | "shallow" | "skeleton";
export declare const mappingTypes: {
    readonly EquirectangularReflectionMapping: 303;
    readonly EquirectangularRefractionMapping: 304;
    readonly CubeReflectionMapping: 301;
    readonly CubeRefractionMapping: 302;
};
export default class AssetsLoader {
    private assetsTracker;
    private loadingManager;
    private assetsEntry;
    private modelLoader;
    private textureLoader;
    private audioLoader;
    private audioListener;
    private cubeTextureLoader;
    private hdrCubeTextureLoader;
    private dracoLoader;
    private dracoModelLoader;
    private fontLoader;
    scene: Scene;
    private renderer?;
    constructor(assetsEntry: AssetsEntryType, scene: Scene);
    loadAllAssets(): Promise<void>;
    private loadModels;
    private loadTextures;
    private loadAllAudios;
    private loadCubeTextures;
    private loadFonts;
    private loadHdrCubeTextures;
    private loadHdrTextures;
    setRendererForHdrMap(renderer: WebGLRenderer): void;
}
//# sourceMappingURL=assetsLoader.d.ts.map