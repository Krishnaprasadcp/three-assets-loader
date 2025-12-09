import type { AssetsEntryType } from "./assetsEntryType.js";
import { GLTFLoader, type GLTF } from "three/examples/jsm/Addons.js";
import LoadingManager from "./LoadingManager.js";
import { DRACOLoader } from "three/addons/loaders/DRACOLoader.js";
import { FontLoader, Font } from "three/addons/loaders/FontLoader.js";
import { HDRCubeTextureLoader } from "three/addons/loaders/HDRCubeTextureLoader.js";
import { HDRLoader } from "three/addons/loaders/HDRLoader.js";
import {
  Audio,
  AudioListener,
  AudioLoader,
  CubeTextureLoader,
  PositionalAudio,
  Scene,
  TextureLoader,
  PMREMGenerator,
  WebGLRenderer,
  EquirectangularReflectionMapping,
  EquirectangularRefractionMapping,
  CubeReflectionMapping,
  CubeRefractionMapping,
} from "three";
import {
  AssetsTracker,
  generateUniqueId,
  CloneModels,
  CloneTexture,
} from "./helperModules.js";
import type { SourceTextureData } from "./allTypes.js";
declare module "three/addons/loaders/FontLoader.js" {
  interface Font {
    userData: {
      keepIt?: boolean;
      keepItUntil?: string;
    };
  }
}
export type CloneType = "deep" | "shallow" | "skeleton";

export const mappingTypes = {
  EquirectangularReflectionMapping,
  EquirectangularRefractionMapping,
  CubeReflectionMapping,
  CubeRefractionMapping,
} as const;

export default class AssetsLoader {
  private assetsTracker: AssetsTracker;
  private loadingManager: LoadingManager;
  private assetsEntry: AssetsEntryType;
  private modelLoader: GLTFLoader;
  private textureLoader: TextureLoader;
  private audioLoader: AudioLoader;
  private audioListener: AudioListener | null;
  private cubeTextureLoader: CubeTextureLoader;
  private hdrCubeTextureLoader: HDRCubeTextureLoader;
  private dracoLoader: DRACOLoader;
  private dracoModelLoader: GLTFLoader;
  private fontLoader: FontLoader;
  public scene: Scene;
  private renderer?: WebGLRenderer | undefined;
  constructor(assetsEntry: AssetsEntryType, scene: Scene) {
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
    this.cubeTextureLoader = new CubeTextureLoader(
      this.loadingManager.getManager()
    );
    this.hdrCubeTextureLoader = new HDRCubeTextureLoader(
      this.loadingManager.getManager()
    );
    this.dracoLoader = new DRACOLoader(this.loadingManager.getManager());
    this.dracoLoader.setDecoderPath(
      `https://www.gstatic.com/draco/v1/decoders/`
    );

    this.modelLoader = new GLTFLoader(this.loadingManager.getManager());

    this.dracoModelLoader = new GLTFLoader(this.loadingManager.getManager());
    this.dracoModelLoader.setDRACOLoader(this.dracoLoader);
    this.fontLoader = new FontLoader(this.loadingManager.getManager());
  }

  public async loadAllAssets(): Promise<void> {
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
  private async loadModels(): Promise<void> {
    if (!this.assetsEntry.models) return;
    const assetsTracker = AssetsTracker.getInstance();
    const loadPromises = this.assetsEntry.models.map(
      ({ name, path, isDraco, cloneRequest }) => {
        // Only use Draco loader if isDraco is true AND path ends with .drc
        const useDracoLoader = isDraco && path.toLowerCase().endsWith(".drc");
        const loader = useDracoLoader
          ? this.dracoModelLoader
          : this.modelLoader;

        return new Promise<void>((resolve) => {
          loader.load(
            path,
            (gltf: GLTF) => {
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
              } catch (error) {
                console.error(`Error processing model: ${name}`, error);
              }
              resolve();
            },
            undefined,
            (error) => {
              console.error(`Failed to load model: ${name}`, error);
              resolve();
            }
          );
        });
      }
    );

    await Promise.all(loadPromises);
  }

  private async loadTextures(): Promise<void> {
    if (!this.assetsEntry.textures) return;

    const loadPromises = this.assetsEntry.textures.map(
      ({ name, path, cloneRequest }) => {
        return new Promise<void>((resolve) => {
          this.textureLoader.load(
            path,
            (texture) => {
              const id = generateUniqueId();
              texture.name = name;
              this.assetsTracker.setSourceTexture({
                texture,
                id,
                name,
              } as SourceTextureData);
              if (cloneRequest.enabled) {
                CloneTexture(cloneRequest, id);
              }
              console.log(`Loaded texture: ${name}`);
              resolve();
            },
            undefined,
            (error) => {
              console.error(`Failed to load texture: ${name}`, error);
              resolve(); // resolve anyway
            }
          );
        });
      }
    );

    await Promise.all(loadPromises);
  }

  private async loadAllAudios(): Promise<void> {
    if (!this.assetsEntry.audios) return;

    const loadPromises = this.assetsEntry.audios.map(
      ({ name, path, positional, loop, volume }) => {
        return new Promise<void>((resolve) => {
          this.audioLoader.load(
            path,
            (buffer) => {
              try {
                const id = generateUniqueId();
                let sound: Audio<AudioNode>;
                if (positional) {
                  sound = new PositionalAudio(this.audioListener!);
                  this.assetsTracker.setAudio({ audio: sound, id, name });
                } else {
                  sound = new Audio(this.audioListener!);
                  this.assetsTracker.setAudio({ audio: sound, id, name });
                }

                sound.setBuffer(buffer);
                sound.setLoop(!!loop);
                sound.setVolume(volume ?? 1);

                console.log(`Loaded audio: ${name}`);
              } catch (err) {
                console.error(`Error processing audio: ${name}`, err);
              }
              resolve();
            },
            undefined,
            (error) => {
              console.error(`Failed to load audio: ${name}`, error);
              resolve(); // resolve anyway
            }
          );
        });
      }
    );

    await Promise.all(loadPromises);
  }

  private async loadCubeTextures(): Promise<void> {
    if (!this.assetsEntry.cubeTextures) return;

    const loadPromises = this.assetsEntry.cubeTextures.map(
      ({ name, paths }) => {
        return new Promise<void>((resolve) => {
          this.cubeTextureLoader.load(
            paths,
            (cubeTexture) => {
              const id = generateUniqueId();
              this.assetsTracker.setCubeMap({
                cubeMap: cubeTexture,
                id,
                name,
              });
              resolve();
            },
            undefined,
            (error) => {
              console.error(`Failed to load cube texture: ${name}`, error);
              resolve(); // resolve anyway
            }
          );
        });
      }
    );

    await Promise.all(loadPromises);
  }

  private async loadFonts() {
    if (!this.assetsEntry.fonts) return;
    const loadPromises = this.assetsEntry.fonts.map(({ name, path }) => {
      return new Promise<void>(async (resolve) => {
        try {
          const id = generateUniqueId();
          const font = await this.fontLoader.loadAsync(path);
          this.assetsTracker.setFont({ font, name, id });
          resolve();
        } catch (error) {
          console.error(`Failed to load font: ${name}`, error);
          resolve();
        }
      });
    });
    await Promise.all(loadPromises);
  }
  private async loadHdrCubeTextures(): Promise<void> {
    if (
      !this.assetsEntry.hdrCubeTextures ||
      this.assetsEntry.hdrCubeTextures.length === 0
    )
      return;
    if (!this.renderer) {
      console.warn(
        "Renderer not set. Call setRendererForHdrMap(renderer)first."
      );
      return;
    }

    const pmremGenerator = new PMREMGenerator(this.renderer);
    pmremGenerator.compileCubemapShader();

    const loadPromises = this.assetsEntry.hdrCubeTextures.map(
      ({ name, paths, isPMREMGenerator }) => {
        return new Promise<void>((resolve) => {
          this.hdrCubeTextureLoader.load(
            paths,
            (cubeTexture) => {
              const id = generateUniqueId();
              if (isPMREMGenerator) {
                const envMap = pmremGenerator.fromCubemap(cubeTexture).texture;
                cubeTexture.dispose();
                this.assetsTracker.setHdrCubeMap({
                  cubeMap: envMap,
                  id,
                  name,
                });
              } else {
                this.assetsTracker.setHdrCubeMap({
                  cubeMap: cubeTexture,
                  id,
                  name,
                });
              }

              console.log(`Loaded HDR cube texture: ${name}`);
              resolve();
            },
            undefined,
            (error) => {
              console.error(`Failed to load HDR cube texture: ${name}`, error);
              resolve();
            }
          );
        });
      }
    );

    await Promise.all(loadPromises);

    pmremGenerator.dispose();
  }
  private async loadHdrTextures(): Promise<void> {
    console.log(this.renderer);

    if (!this.assetsEntry.hdrTextures || !this.renderer) return;

    const pmremGenerator = new PMREMGenerator(this.renderer);
    pmremGenerator.compileEquirectangularShader();

    const loadPromises = this.assetsEntry.hdrTextures.map(
      ({ name, path, mapping }) =>
        new Promise<void>((resolve) => {
          new HDRLoader(this.loadingManager.getManager()).load(
            path,
            (texture) => {
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
              } else {
                this.assetsTracker.setHdriTexture({
                  hdri: texture,
                  original: texture,
                  id,
                  name,
                });
              }

              console.log(
                `Loaded HDR texture: ${name}${mapping ? ` (${mapping})` : ""}`
              );
              resolve();
            },
            undefined,
            (error) => {
              console.error(`Failed to load HDR texture: ${name}`, error);
              resolve();
            }
          );
        })
    );
    await Promise.all(loadPromises);
    pmremGenerator.dispose();
  }
  public setRendererForHdrMap(renderer: WebGLRenderer) {
    this.renderer = renderer;
  }
}
