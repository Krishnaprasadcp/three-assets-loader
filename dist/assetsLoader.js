import { GLTFLoader } from "three/examples/jsm/Addons.js";
import LoadingManager from "./LoadingManager.js";
import { DRACOLoader } from "three/addons/loaders/DRACOLoader.js";
import { FontLoader, Font } from "three/addons/loaders/FontLoader.js";
import { HDRCubeTextureLoader } from "three/addons/loaders/HDRCubeTextureLoader.js";
import { HDRLoader } from "three/addons/loaders/HDRLoader.js";
import { AnimationAction, AnimationClip, AnimationMixer, Audio, AudioListener, AudioLoader, Camera, CubeTexture, CubeTextureLoader, Material, Mesh, Object3D, PositionalAudio, Scene, Texture, TextureLoader, PMREMGenerator, WebGLRenderer, EquirectangularReflectionMapping, EquirectangularRefractionMapping, CubeReflectionMapping, CubeRefractionMapping, } from "three";
export const mappingTypes = {
    EquirectangularReflectionMapping,
    EquirectangularRefractionMapping,
    CubeReflectionMapping,
    CubeRefractionMapping,
};
export default class AssetsLoader {
    static instance;
    disposed = false;
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
        this.loadingManager = LoadingManager.getInstance();
        this.assetsEntry = assetsEntry;
        this.scene = scene;
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
    static getInstance(assetsEntry, scene) {
        if (!AssetsLoader.instance) {
            if (!assetsEntry || !scene) {
                throw new Error("AssetsEntry and Scene must be provided the first time!");
            }
            AssetsLoader.instance = new AssetsLoader(assetsEntry, scene);
        }
        return AssetsLoader.instance;
    }
    allAssets = {
        models: {
            gltf: {},
            animations: {},
        },
        audios: {},
        textures: {},
        cubeTextures: {},
        hdrCubeTextures: {},
        hdrTextures: {},
        fonts: {},
    };
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
    }
    async loadModels() {
        if (!this.assetsEntry.models)
            return;
        const loadPromises = this.assetsEntry.models.map(({ name, path, scale, position, isDraco }) => {
            // Only use Draco loader if isDraco is true AND path ends with .drc
            const useDracoLoader = isDraco && path.toLowerCase().endsWith(".drc");
            const loader = useDracoLoader
                ? this.dracoModelLoader
                : this.modelLoader;
            return new Promise((resolve) => {
                loader.load(path, (gltf) => {
                    try {
                        const { x: sx = 1, y: sy = 1, z: sz = 1 } = scale || {};
                        gltf.scene.scale.set(sx, sy, sz);
                        const { x: px = 0, y: py = 0, z: pz = 0 } = position || {};
                        gltf.scene.position.set(px, py, pz);
                        if (gltf.animations && gltf.animations.length > 0) {
                            const { mixer, actions } = this.loadAnimations(gltf.animations, this.scene);
                            this.allAssets.models.animations[name] = { mixer, actions };
                        }
                        this.allAssets.models.gltf[name] = gltf.scene;
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
        const loadPromises = this.assetsEntry.textures.map(({ name, path }) => {
            return new Promise((resolve) => {
                this.textureLoader.load(path, (texture) => {
                    this.allAssets.textures[name] = texture;
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
                        const sound = positional
                            ? new PositionalAudio(this.audioListener)
                            : new Audio(this.audioListener);
                        sound.setBuffer(buffer);
                        sound.setLoop(!!loop);
                        sound.setVolume(volume ?? 1);
                        this.allAssets.audios[name] = sound;
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
    loadAnimations(animations, scene) {
        const mixer = new AnimationMixer(scene);
        const actions = {};
        animations.forEach((clip) => {
            actions[clip.name] = mixer.clipAction(clip);
        });
        return { mixer, actions };
    }
    async loadCubeTextures() {
        if (!this.assetsEntry.cubeTextures)
            return;
        const loadPromises = this.assetsEntry.cubeTextures.map(({ name, paths }) => {
            return new Promise((resolve) => {
                this.cubeTextureLoader.load(paths, (cubeTexture) => {
                    this.allAssets.cubeTextures[name] = cubeTexture;
                    resolve();
                }, undefined, (error) => {
                    console.error(`Failed to load cube texture: ${name}`, error);
                    resolve(); // resolve anyway
                });
            });
        });
        await Promise.all(loadPromises);
    }
    setCameraForPositionalAudio(camera) {
        if (!this.audioListener) {
            this.audioListener = new AudioListener();
        }
        if (this.audioListener.parent) {
            this.audioListener.parent.remove(this.audioListener);
        }
        camera.add(this.audioListener);
        Object.values(this.allAssets.audios).forEach((audio) => {
            if (audio instanceof PositionalAudio) {
                // @ts-ignore - private property
                audio.listener = this.audioListener;
            }
        });
    }
    async loadFonts() {
        if (!this.assetsEntry.fonts)
            return;
        const loadPromises = this.assetsEntry.fonts.map(({ name, path }) => {
            return new Promise(async (resolve) => {
                try {
                    const font = await this.fontLoader.loadAsync(path);
                    this.allAssets.fonts[name] = font;
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
        if (!this.assetsEntry.hdrCubeTextures)
            return;
        if (!this.renderer) {
            console.warn("Renderer not set. Call setRendererForHdrCubeMap(renderer) first.");
            return;
        }
        const pmremGenerator = new PMREMGenerator(this.renderer);
        pmremGenerator.compileCubemapShader();
        const loadPromises = this.assetsEntry.hdrCubeTextures.map(({ name, paths, isPMREMGenerator }) => {
            return new Promise((resolve) => {
                this.hdrCubeTextureLoader.load(paths, (cubeTexture) => {
                    if (isPMREMGenerator) {
                        const envMap = pmremGenerator.fromCubemap(cubeTexture).texture;
                        this.allAssets.hdrCubeTextures[name] = envMap;
                    }
                    else {
                        this.allAssets.hdrCubeTextures[name] = cubeTexture;
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
        // Clear the temporary renderer reference
        this.renderer = undefined;
    }
    async loadHdrTextures() {
        if (!this.assetsEntry.hdrTextures || !this.renderer)
            return;
        const pmremGenerator = new PMREMGenerator(this.renderer);
        pmremGenerator.compileEquirectangularShader();
        const loadPromises = this.assetsEntry.hdrTextures.map(({ name, path, mapping }) => new Promise((resolve) => {
            new HDRLoader(this.loadingManager.getManager()).load(path, (texture) => {
                // Only apply mapping if provided
                if (mapping && mappingTypes[mapping]) {
                    texture.mapping = mappingTypes[mapping];
                }
                // If mapping is reflection and equirectangular → convert to envmap
                if (texture.mapping === EquirectangularReflectionMapping) {
                    const envMap = pmremGenerator.fromEquirectangular(texture).texture;
                    this.allAssets.hdrTextures[name] = envMap;
                    texture.dispose();
                }
                else {
                    this.allAssets.hdrTextures[name] = texture;
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
        this.renderer = undefined;
    }
    setRendererForHdrMap(renderer) {
        this.renderer = renderer;
    }
    disposeModel(modelName) {
        const model = this.allAssets.models.gltf[modelName];
        const animation = this.allAssets.models.animations[modelName];
        if (!model)
            return;
        // Remove model from scene
        this.scene.remove(model);
        // Stop all animations first
        if (animation?.mixer) {
            // Stop all actions
            Object.values(animation.actions).forEach((action) => {
                action.stop();
                action.stop(); // Also stop the clip
            });
            // Uncache the root and all children
            animation.mixer.uncacheRoot(model);
            animation.mixer.stopAllAction();
        }
        // Dispose geometries, materials, and textures
        model.traverse((obj) => {
            const mesh = obj;
            if (mesh.geometry) {
                mesh.geometry.dispose();
            }
            if (mesh.material) {
                const materials = Array.isArray(mesh.material)
                    ? mesh.material
                    : [mesh.material];
                materials.forEach((mat) => {
                    // Dispose textures safely
                    if (mat && mat.dispose) {
                        // Check for textures in materials
                        const textureKeys = [
                            "map",
                            "normalMap",
                            "specularMap",
                            "emissiveMap",
                            "lightMap",
                            "aoMap",
                            "displacementMap",
                            "roughnessMap",
                            "metalnessMap",
                            "alphaMap",
                            "envMap",
                        ];
                        textureKeys.forEach((key) => {
                            const value = mat[key];
                            if (value instanceof Texture) {
                                const isGlobal = Object.values(this.allAssets.textures).includes(value);
                                if (!isGlobal && value.dispose) {
                                    value.dispose();
                                }
                            }
                        });
                        mat.dispose();
                    }
                });
            }
        });
        // Clean up references
        delete this.allAssets.models.gltf[modelName];
        if (animation) {
            // Dispose of the mixer itself
            if (animation.mixer) {
                animation.mixer.dispose();
            }
            delete this.allAssets.models.animations[modelName];
        }
        console.log(`Disposed model: ${modelName}`);
    }
    disposeTexture(textureName) {
        if (!textureName)
            return;
        const texture = this.allAssets.textures[textureName];
        if (!texture) {
            console.warn(`No texture found: ${textureName}`);
            return;
        }
        if (texture.isTexture && texture.dispose) {
            // Ensure texture isn't being used by any materials
            const isInUse = Object.values(this.scene.children).some((child) => {
                if (child instanceof Mesh && child.material) {
                    const mat = Array.isArray(child.material)
                        ? child.material
                        : [child.material];
                    return mat.some((m) => {
                        const textureKeys = Object.keys(m).filter((k) => m[k] === texture);
                        return textureKeys.length > 0;
                    });
                }
                return false;
            });
            if (!isInUse) {
                texture.dispose();
            }
            else {
                console.warn(`Texture ${textureName} is still in use by scene objects`);
            }
            delete this.allAssets.textures[textureName];
            console.log(`Disposed texture: ${textureName}`);
        }
        else {
            console.warn(`Invalid texture object: ${textureName}`);
        }
    }
    disposeAudio(audioName) {
        if (!audioName)
            return;
        const audio = this.allAssets.audios[audioName];
        if (!audio) {
            console.warn(`No texture found: ${audioName}`);
            return;
        }
        audio.stop();
        audio.disconnect();
        // if (this.audioListener) {
        //   // Note: AudioListener disposal is handled by the camera it's attached to
        //   // But we should still clear references
        //   this.audioListener = null;
        // }
        delete this.allAssets.audios[audioName];
    }
    disposeCubeTexture(name) {
        const cube = this.allAssets.cubeTextures[name];
        if (!cube)
            return;
        cube.dispose();
        delete this.allAssets.cubeTextures[name];
    }
    disposeHdrCubeTexture(name) {
        const cube = this.allAssets.hdrCubeTextures[name];
        if (!cube)
            return;
        cube.dispose(); // frees GPU memory
        delete this.allAssets.hdrCubeTextures[name];
        console.log(`Disposed HDR cube texture: ${name}`);
    }
    disposeHdrTexture(name) {
        const tex = this.allAssets.hdrTextures[name];
        if (!tex)
            return;
        this.scene.environment = null;
        this.scene.background = null;
        tex.dispose?.();
        if (tex.source?.data?.dispose) {
            console.log(tex.source.data);
            tex.source.data.dispose();
        }
        delete this.allAssets.hdrTextures[name];
        console.log(`Disposed HDR texture: ${name}`);
    }
    disposeFont(name) {
        delete this.allAssets.fonts[name];
    }
    disposeEverything() {
        this.assetsEntry.textures?.forEach(({ name }) => {
            this.disposeTexture(name);
        });
        this.assetsEntry.models?.forEach(({ name }) => {
            this.disposeModel(name);
        });
        this.assetsEntry.audios?.forEach(({ name }) => {
            this.disposeAudio(name);
        });
        this.assetsEntry.cubeTextures?.forEach(({ name }) => {
            this.disposeCubeTexture(name);
        });
        this.assetsEntry.hdrCubeTextures?.forEach(({ name }) => {
            this.disposeHdrCubeTexture(name);
        });
        this.assetsEntry.hdrTextures?.forEach(({ name }) => {
            this.disposeHdrTexture(name);
        });
        this.assetsEntry.fonts?.forEach(({ name }) => {
            this.disposeFont(name);
        });
        this.loadingManager.dispose();
    }
    // In AssetsLoader class
    async disposeAll() {
        console.log("Starting comprehensive asset disposal...");
        // Stop all audio
        Object.values(this.allAssets.audios).forEach((audio) => {
            if (audio && audio.isPlaying) {
                audio.stop();
            }
        });
        // Dispose everything
        this.disposeEverything();
        // Clear all asset references
        this.allAssets = {
            models: { gltf: {}, animations: {} },
            audios: {},
            textures: {},
            cubeTextures: {},
            hdrCubeTextures: {},
            hdrTextures: {},
            fonts: {},
        };
        // Clear loaders if needed
        this.modelLoader = null;
        this.textureLoader = null;
        this.audioLoader = null;
        this.cubeTextureLoader = null;
        this.hdrCubeTextureLoader = null;
        this.fontLoader = null;
        console.log("All assets disposed successfully");
    }
}
//# sourceMappingURL=assetsLoader.js.map