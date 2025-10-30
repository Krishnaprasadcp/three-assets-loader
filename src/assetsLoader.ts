import type { AssetsEntryType } from "./assetsEntryType.js";
import { GLTFLoader } from "three/examples/jsm/Addons.js";
import LoadingManager from "./LoadingManager.js";
import {
  AnimationAction,
  AnimationClip,
  AnimationMixer,
  Audio,
  AudioListener,
  AudioLoader,
  CubeTexture,
  CubeTextureLoader,
  Material,
  Mesh,
  Object3D,
  PositionalAudio,
  Scene,
  Texture,
  TextureLoader,
} from "three";

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
  private static instance: AssetsLoader;
  private disposed = false;
  public loadingManager: LoadingManager;
  public assetsEntry: AssetsEntryType;
  public modelLoader: GLTFLoader;
  public textureLoader: TextureLoader;
  public audioLoader: AudioLoader;
  public audioListener: AudioListener | null;
  public cubeTextureLoader: CubeTextureLoader;
  public scene: Scene;
  constructor(assetsEntry: AssetsEntryType, scene: Scene) {
    this.loadingManager = LoadingManager.getInstance();
    this.assetsEntry = assetsEntry;
    this.scene = scene;
    this.modelLoader = new GLTFLoader(this.loadingManager.getManager());
    this.textureLoader = new TextureLoader(this.loadingManager.getManager());
    this.audioLoader = new AudioLoader(this.loadingManager.getManager());
    this.audioListener = new AudioListener();
    this.cubeTextureLoader = new CubeTextureLoader(
      this.loadingManager.getManager()
    );
  }
  public static getInstance(assetsEntry?: AssetsEntryType, scene?: Scene) {
    if (!AssetsLoader.instance) {
      if (!assetsEntry || !scene) {
        throw new Error(
          "AssetsEntry and Scene must be provided the first time!"
        );
      }
      AssetsLoader.instance = new AssetsLoader(assetsEntry, scene);
    }
    return AssetsLoader.instance;
  }

  public allAssets: AllAssetsType = {
    models: {
      gltf: [],
      animations: [],
    },
    audios: {},
    textures: {},
    cubeTextures: {},
  };
  public async loadAllAssets(): Promise<void> {
    const loadModelsPromises = this.loadModels();
    const loadTexturesPromises = this.loadTextures();
    const loadAllAudiosPromises = this.loadAllAudios();
    const loadCubeTexturesPromises = this.loadCubeTextures();

    await Promise.all([
      loadModelsPromises,
      loadTexturesPromises,
      loadAllAudiosPromises,
      loadCubeTexturesPromises,
    ]);
  }
  private async loadModels(): Promise<void> {
    if (!this.assetsEntry.models) return;

    const loadPromises = this.assetsEntry.models.map(
      ({ name, path, scale, position }) => {
        return new Promise<void>((resolve, reject) => {
          this.modelLoader.load(
            path,
            (gltf) => {
              const { x: sx = 1, y: sy = 1, z: sz = 1 } = scale || {};
              gltf.scene.scale.set(sx, sy, sz);

              const { x: px = 0, y: py = 0, z: pz = 0 } = position || {};
              gltf.scene.position.set(px, py, pz);

              if (gltf.animations && gltf.animations.length > 0) {
                const { mixer, actions } = this.loadAnimations(
                  gltf.animations,
                  this.scene
                );
                this.allAssets.models.animations[name] = { mixer, actions };
              }

              this.allAssets.models.gltf[name] = gltf.scene;
              resolve();
            },
            undefined,
            (error) => {
              console.error(`Failed to load model:${name}`, error);
              reject(error);
            }
          );
        });
      }
    );
    await Promise.all(loadPromises);
  }

  private async loadTextures(): Promise<void> {
    if (!this.assetsEntry.textures) return;

    const laodPromises = this.assetsEntry.textures?.map(({ name, path }) => {
      return new Promise<void>((resolve, reject) => {
        this.textureLoader.load(
          path,
          (texture) => {
            this.allAssets.textures[name] = texture;
            resolve();
          },
          undefined,
          (error) => {
            console.error(`Failed to load texture:${name}`, error);
            reject(error);
          }
        );
      });
    });
    await Promise.all(laodPromises);
  }
  private async loadAllAudios(): Promise<void> {
    if (!this.assetsEntry.audios) return;
    const loadPromises = this.assetsEntry.audios?.map(
      ({ name, path, positional, loop, volume }) => {
        return new Promise<void>((resolve, reject) => {
          this.audioLoader.load(
            path,
            (buffer) => {
              const sound = positional
                ? new PositionalAudio(this.audioListener!)
                : new Audio(this.audioListener!);
              sound.setBuffer(buffer);
              loop ? sound.setLoop(true) : sound.setLoop(false);
              volume ? sound.setVolume(volume) : sound.setVolume(1);
              this.allAssets.audios[name] = sound;
              resolve();
            },
            undefined,
            (err) => {
              console.error(`Failed to load audio: ${name}`, err);
              reject(err);
            }
          );
        });
      }
    );
    await Promise.all(loadPromises);
  }
  private loadAnimations(animations: AnimationClip[], scene: Scene) {
    const mixer = new AnimationMixer(scene);
    const actions: Record<string, AnimationAction> = {};
    animations.forEach((clip) => {
      actions[clip.name] = mixer.clipAction(clip);
    });

    return { mixer, actions };
  }
  private async loadCubeTextures(): Promise<void> {
    if (!this.assetsEntry.cubeTextures) return;

    const loadPromises = this.assetsEntry.cubeTextures.map(
      ({ name, paths }) => {
        // paths = [px, nx, py, ny, pz, nz]
        return new Promise<void>((resolve, reject) => {
          this.cubeTextureLoader.load(
            paths,
            (cubeTexture) => {
              this.allAssets.cubeTextures[name] = cubeTexture;
              resolve();
            },
            undefined,
            (error) => {
              console.error(`Failed to load cube texture: ${name}`, error);
              reject(error);
            }
          );
        });
      }
    );

    await Promise.all(loadPromises);
  }
  public disposeModel(modelName: string) {
    const model = this.allAssets.models.gltf[modelName];
    const animation = this.allAssets.models.animations[modelName];

    if (!model) return;

    // Remove model from scene
    this.scene.remove(model);

    // Stop all animations first
    if (animation?.mixer) {
      // Stop all actions
      Object.values(
        animation.actions as Record<string, AnimationAction>
      ).forEach((action) => {
        action.stop();
        action.stop(); // Also stop the clip
      });

      // Uncache the root and all children
      animation.mixer.uncacheRoot(model);
      animation.mixer.stopAllAction();
    }

    // Dispose geometries, materials, and textures
    model.traverse((obj: Object3D) => {
      const mesh = obj as Mesh;

      if (mesh.geometry) {
        mesh.geometry.dispose();
      }

      if (mesh.material) {
        const materials = Array.isArray(mesh.material)
          ? mesh.material
          : [mesh.material];

        materials.forEach((mat: Material) => {
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
              const value = (mat as any)[key];
              if (value instanceof Texture) {
                const isGlobal = Object.values(
                  this.allAssets.textures
                ).includes(value);
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
  public disposeTexture(textureName: string) {
    if (!textureName) return;

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
      } else {
        console.warn(`Texture ${textureName} is still in use by scene objects`);
      }

      delete this.allAssets.textures[textureName];
      console.log(`Disposed texture: ${textureName}`);
    } else {
      console.warn(`Invalid texture object: ${textureName}`);
    }
  }
  public disposeAudio(audioName: string) {
    if (!audioName) return;
    const audio = this.allAssets.audios[audioName];

    if (!audio) {
      console.warn(`No texture found: ${audioName}`);
      return;
    }
    audio.stop();
    audio.disconnect();
    if (this.audioListener) {
      // Note: AudioListener disposal is handled by the camera it's attached to
      // But we should still clear references
      this.audioListener = null;
    }
    delete this.allAssets.audios[audioName];
  }
  public disposeCubeTexture(name: string) {
    const cube = this.allAssets.cubeTextures[name];
    if (!cube) return;
    cube.dispose();
    delete this.allAssets.cubeTextures[name];
  }
  public disposeEverything() {
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

    this.loadingManager.dispose();
  }

  // In AssetsLoader class
  public async disposeAll() {
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
    };

    // Clear loaders if needed
    this.modelLoader = null as any;
    this.textureLoader = null as any;
    this.audioLoader = null as any;
    this.cubeTextureLoader = null as any;

    console.log("All assets disposed successfully");
  }
}
