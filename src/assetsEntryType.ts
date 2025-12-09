import type { mappingTypes } from "./assetsLoader.js";

export const CloneMethods = {
  DeepClone: "DeepClone",
  ShallowClone: "ShallowClone",
  SkeletonClone: "SkeletonClone",
} as const;
interface BaseCloneRequest {
  enabled?: boolean;
  count: number;
}

// ---- Variants ----

// For deep and shallow 
export interface StandardCloneRequest extends BaseCloneRequest {
  methods: "DeepClone" | "ShallowClone";
}

// For skeleton clone only 
export interface SkeletonCloneRequest extends BaseCloneRequest {
  methods: "SkeletonClone";
  deepClone?: boolean;
  cloneGeometry?: boolean;
}

// ---- Final union type ----
export type CloneRequestTypeForModel =
  | StandardCloneRequest
  | SkeletonCloneRequest;
export interface CloneRequestTypeForTexture {
  enabled: boolean;
  count: number;
}
export type AssetsEntryType = {
  models?: Array<{
    name: string;
    path: string;
    isDraco?: boolean;
    cloneRequest: CloneRequestTypeForModel;
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
    cloneRequest: CloneRequestTypeForTexture;
  }>;
  cubeTextures?: Array<{
    name: string;
    paths: [string, string, string, string, string, string];
  }>;
  hdrCubeTextures?: Array<{
    name: string;
    paths: [string, string, string, string, string, string];
    isPMREMGenerator: boolean;
  }>;
  hdrTextures?: Array<{
    name: string;
    path: string;
    mapping?: keyof typeof mappingTypes;
  }>;
  fonts?: Array<{
    name: string;
    path: string;
  }>;
};
