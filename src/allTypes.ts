import type {
  AnimationAction,
  AnimationClip,
  AnimationMixer,
  Audio,
  CubeTexture,
  DataTexture,
  Object3D,
  Scene,
  Texture,
} from "three";
import type { Font, GLTF } from "three/examples/jsm/Addons.js";

export interface PrepareModelOptions {
  name: string;
  path: string;

  isDraco?: boolean;

}
export interface CloneModelType {
  source: GLTF;
  isCloned: boolean;
  scene: Scene;
  options: PrepareModelOptions;
}
export interface ClonedReturnModelType {
  model: Object3D;
  animations?: AnimationData;
}
export interface AnimationData {
  mixer: AnimationMixer;
  actions: Record<string, AnimationAction>;
}

export interface TrackedModelDataType {
  parentId: number;
  parentName: string;
  modelId: number;
  modelRef: Object3D;
  mixerRef?: AnimationMixer | null;
  actionsRef?: Record<string, AnimationAction> | null;
}
export interface SourceRecordType {
  name: string;
  id: number;
  sourceModel: Object3D;
  animations: AnimationClip[];

  mixerRef?: AnimationMixer | null;
  actionsRef?: Record<string, AnimationAction> | null;
}
export interface SourceTextureData {
  texture: Texture;
  id: number;
  name: string;
}
export interface SourceCubeMapDataType {
  cubeMap: CubeTexture;
  name: string;
  id: number;
}
export interface TextureCloneType {
  texture: Texture;
  id: number;
  name: string;
}
export interface HdrCubeMapType {
  cubeMap: Texture | CubeTexture;
  id: number;
  name: string;
}
export interface HdriTextureType {
  hdri: DataTexture | Texture;
  original: Texture;
  id: number;
  name: string;
}
export interface FontType {
  font: Font;
  name: string;
  id: number;
}
export interface AudioType {
  audio: Audio<AudioNode>;
  name: string;
  id: number;
}
export type ModelCloneType = Record<string, TrackedModelDataType>;
export interface ModelRecordsType {
  source: SourceRecordType;

  deepCloneCount: number;
  shallowCloneCount: number;
  skeletonCloneCount: number;

  clones: {
    DeepClone: Record<string, TrackedModelDataType>;
    ShallowClone: Record<string, TrackedModelDataType>;
    SkeletonClone: Record<string, TrackedModelDataType>;
  };
}
export interface TextureRecordType {
  source: SourceTextureData;
  textureCount: number;
  clones: Record<string, TextureCloneType>;
}
export interface AssetsTrackerModelMapType {
  [modelName: string]: ModelRecordsType;
}
export interface AssetsTrackerTextureMapType {
  [textureName: string]: TextureRecordType;
}
export interface AssetsTrackerCubeMapType {
  [cubeMapName: string]: SourceCubeMapDataType;
}
export interface AssetsTrackerHdrCubeMapType {
  [hdrCubeMapName: string]: HdrCubeMapType;
}
export interface AssetsTrackerHdriTextureType {
  [hdriTextureName: string]: HdriTextureType;
}
export interface AssetsTrackerFontType {
  [fontName: string]: FontType;
}
export interface AssetsTrackerAudioType {
  [fontName: string]: AudioType;
}
