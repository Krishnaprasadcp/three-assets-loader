import { GLTFLoader } from "three/examples/jsm/Addons.js";
import LoadingManager from "./LoadingManager.js";
import { DRACOLoader } from "three/addons/loaders/DRACOLoader.js";
import { FontLoader, Font } from "three/addons/loaders/FontLoader.js";
import { HDRCubeTextureLoader } from "three/addons/loaders/HDRCubeTextureLoader.js";
import { HDRLoader } from "three/addons/loaders/HDRLoader.js";
import { Audio, AudioListener, AudioLoader, CubeTextureLoader, PositionalAudio, Scene, TextureLoader, PMREMGenerator, WebGLRenderer, EquirectangularReflectionMapping, EquirectangularRefractionMapping, CubeReflectionMapping, CubeRefractionMapping, } from "three";
import { AssetsTracker, generateUniqueId, CloneModels, CloneTexture, } from "./helperModules.js";
export const mappingTypes = {
    EquirectangularReflectionMapping,
    EquirectangularRefractionMapping,
    CubeReflectionMapping,
    CubeRefractionMapping,
};
export default class AssetsLoader {
    assetsTracker;
    loadingManager;
    assetsEntry;
    modelLoader;
    textureLoader;
    audioLoader;
    audioListener;
    cubeTextureLoader;
    hdrCubeTextureLoader;
    dracoLoader;
    dracoModelLoader;
    fontLoader;
    scene;
    renderer;
    constructor(assetsEntry, scene) {
        if (!assetsEntry || !scene) {
            throw new Error("AssetsEntry and Scene must be provided.");
        }
        this.loadingManager = LoadingManager.getInstance();
        this.assetsEntry = assetsEntry;
        this.scene = scene;
        this.assetsTracker = AssetsTracker.getInstance();
        this.textureLoader = new TextureLoader(this.loadingManager.getManager());
        this.audioLoader = new AudioLoader(this.loadingManager.getManager());
        this.audioListener = new AudioListener();
        this.cubeTextureLoader = new CubeTextureLoader(this.loadingManager.getManager());
        this.hdrCubeTextureLoader = new HDRCubeTextureLoader(this.loadingManager.getManager());
        this.dracoLoader = new DRACOLoader(this.loadingManager.getManager());
        this.dracoLoader.setDecoderPath(`https://www.gstatic.com/draco/v1/decoders/`);
        this.modelLoader = new GLTFLoader(this.loadingManager.getManager());
        this.dracoModelLoader = new GLTFLoader(this.loadingManager.getManager());
        this.dracoModelLoader.setDRACOLoader(this.dracoLoader);
        this.fontLoader = new FontLoader(this.loadingManager.getManager());
    }
    async loadAllAssets() {
        const loadModelsPromises = this.loadModels();
        const loadTexturesPromises = this.loadTextures();
        const loadAllAudiosPromises = this.loadAllAudios();
        const loadCubeTexturesPromises = this.loadCubeTextures();
        const loadHdrCubeTextures = this.loadHdrCubeTextures();
        const loadHdrTexturesPromises = this.loadHdrTextures();
        const loadFontsPromises = this.loadFonts();
        await Promise.all([
            loadModelsPromises,
            loadTexturesPromises,
            loadAllAudiosPromises,
            loadCubeTexturesPromises,
            loadHdrCubeTextures,
            loadHdrTexturesPromises,
            loadFontsPromises,
        ]);
        this.renderer = undefined;
    }
    async loadModels() {
        if (!this.assetsEntry.models)
            return;
        const assetsTracker = AssetsTracker.getInstance();
        const loadPromises = this.assetsEntry.models.map(({ name, path, isDraco, cloneRequest }) => {
            // Only use Draco loader if isDraco is true AND path ends with .drc
            const useDracoLoader = isDraco && path.toLowerCase().endsWith(".drc");
            const loader = useDracoLoader
                ? this.dracoModelLoader
                : this.modelLoader;
            return new Promise((resolve) => {
                loader.load(path, (gltf) => {
                    try {
                        const animations = gltf.animations;
                        const id = generateUniqueId();
                        const sourceModel = gltf.scene;
                        sourceModel.name = name;
                        assetsTracker.setModelSource({
                            animations,
                            id,
                            sourceModel,
                            name,
                        });
                        if (cloneRequest?.enabled) {
                            CloneModels(cloneRequest, id);
                        }
                    }
                    catch (error) {
                        console.error(`Error processing model: ${name}`, error);
                    }
                    resolve();
                }, undefined, (error) => {
                    console.error(`Failed to load model: ${name}`, error);
                    resolve();
                });
            });
        });
        await Promise.all(loadPromises);
    }
    async loadTextures() {
        if (!this.assetsEntry.textures)
            return;
        const loadPromises = this.assetsEntry.textures.map(({ name, path, cloneRequest }) => {
            return new Promise((resolve) => {
                this.textureLoader.load(path, (texture) => {
                    const id = generateUniqueId();
                    texture.name = name;
                    this.assetsTracker.setSourceTexture({
                        texture,
                        id,
                        name,
                    });
                    if (cloneRequest.enabled) {
                        CloneTexture(cloneRequest, id);
                    }
                    console.log(`Loaded texture: ${name}`);
                    resolve();
                }, undefined, (error) => {
                    console.error(`Failed to load texture: ${name}`, error);
                    resolve(); // resolve anyway
                });
            });
        });
        await Promise.all(loadPromises);
    }
    async loadAllAudios() {
        if (!this.assetsEntry.audios)
            return;
        const loadPromises = this.assetsEntry.audios.map(({ name, path, positional, loop, volume }) => {
            return new Promise((resolve) => {
                this.audioLoader.load(path, (buffer) => {
                    try {
                        const id = generateUniqueId();
                        let sound;
                        if (positional) {
                            sound = new PositionalAudio(this.audioListener);
                            this.assetsTracker.setAudio({ audio: sound, id, name });
                        }
                        else {
                            sound = new Audio(this.audioListener);
                            this.assetsTracker.setAudio({ audio: sound, id, name });
                        }
                        sound.setBuffer(buffer);
                        sound.setLoop(!!loop);
                        sound.setVolume(volume ?? 1);
                        console.log(`Loaded audio: ${name}`);
                    }
                    catch (err) {
                        console.error(`Error processing audio: ${name}`, err);
                    }
                    resolve();
                }, undefined, (error) => {
                    console.error(`Failed to load audio: ${name}`, error);
                    resolve(); // resolve anyway
                });
            });
        });
        await Promise.all(loadPromises);
    }
    async loadCubeTextures() {
        if (!this.assetsEntry.cubeTextures)
            return;
        const loadPromises = this.assetsEntry.cubeTextures.map(({ name, paths }) => {
            return new Promise((resolve) => {
                this.cubeTextureLoader.load(paths, (cubeTexture) => {
                    const id = generateUniqueId();
                    this.assetsTracker.setCubeMap({
                        cubeMap: cubeTexture,
                        id,
                        name,
                    });
                    resolve();
                }, undefined, (error) => {
                    console.error(`Failed to load cube texture: ${name}`, error);
                    resolve(); // resolve anyway
                });
            });
        });
        await Promise.all(loadPromises);
    }
    async loadFonts() {
        if (!this.assetsEntry.fonts)
            return;
        const loadPromises = this.assetsEntry.fonts.map(({ name, path }) => {
            return new Promise(async (resolve) => {
                try {
                    const id = generateUniqueId();
                    const font = await this.fontLoader.loadAsync(path);
                    this.assetsTracker.setFont({ font, name, id });
                    resolve();
                }
                catch (error) {
                    console.error(`Failed to load font: ${name}`, error);
                    resolve();
                }
            });
        });
        await Promise.all(loadPromises);
    }
    async loadHdrCubeTextures() {
        if (!this.assetsEntry.hdrCubeTextures ||
            this.assetsEntry.hdrCubeTextures.length === 0)
            return;
        if (!this.renderer) {
            console.warn("Renderer not set. Call setRendererForHdrMap(renderer)first.");
            return;
        }
        const pmremGenerator = new PMREMGenerator(this.renderer);
        pmremGenerator.compileCubemapShader();
        const loadPromises = this.assetsEntry.hdrCubeTextures.map(({ name, paths, isPMREMGenerator }) => {
            return new Promise((resolve) => {
                this.hdrCubeTextureLoader.load(paths, (cubeTexture) => {
                    const id = generateUniqueId();
                    if (isPMREMGenerator) {
                        const envMap = pmremGenerator.fromCubemap(cubeTexture).texture;
                        cubeTexture.dispose();
                        this.assetsTracker.setHdrCubeMap({
                            cubeMap: envMap,
                            id,
                            name,
                        });
                    }
                    else {
                        this.assetsTracker.setHdrCubeMap({
                            cubeMap: cubeTexture,
                            id,
                            name,
                        });
                    }
                    console.log(`Loaded HDR cube texture: ${name}`);
                    resolve();
                }, undefined, (error) => {
                    console.error(`Failed to load HDR cube texture: ${name}`, error);
                    resolve();
                });
            });
        });
        await Promise.all(loadPromises);
        pmremGenerator.dispose();
    }
    async loadHdrTextures() {
        if (!this.assetsEntry.hdrTextures || !this.renderer)
            return;
        const pmremGenerator = new PMREMGenerator(this.renderer);
        pmremGenerator.compileEquirectangularShader();
        const loadPromises = this.assetsEntry.hdrTextures.map(({ name, path, mapping }) => new Promise((resolve) => {
            new HDRLoader(this.loadingManager.getManager()).load(path, (texture) => {
                const id = generateUniqueId();
                // Only apply mapping if provided
                if (mapping && mappingTypes[mapping]) {
                    texture.mapping = mappingTypes[mapping];
                }
                // If mapping is reflection and equirectangular → convert to envmap
                if (texture.mapping === EquirectangularReflectionMapping) {
                    const rt = pmremGenerator.fromEquirectangular(texture);
                    const envMap = rt.texture;
                    // 👉 Don't dispose original texture — we need it for skybox
                    this.assetsTracker.setHdriTexture({
                        hdri: envMap, // reflection map
                        original: texture, // raw HDR for background
                        id,
                        name,
                    });
                    rt.dispose();
                }
                else {
                    this.assetsTracker.setHdriTexture({
                        hdri: texture,
                        original: texture,
                        id,
                        name,
                    });
                }
                console.log(`Loaded HDR texture: ${name}${mapping ? ` (${mapping})` : ""}`);
                resolve();
            }, undefined, (error) => {
                console.error(`Failed to load HDR texture: ${name}`, error);
                resolve();
            });
        }));
        await Promise.all(loadPromises);
        pmremGenerator.dispose();
    }
    setRendererForHdrMap(renderer) {
        this.renderer = renderer;
    }
}
//# sourceMappingURL=assetsLoader.js.map