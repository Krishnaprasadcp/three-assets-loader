import type { mappingTypes } from "./assetsLoader.js";
export declare const CloneMethods: {
    readonly DeepClone: "DeepClone";
    readonly ShallowClone: "ShallowClone";
    readonly SkeletonClone: "SkeletonClone";
};
interface BaseCloneRequest {
    enabled?: boolean;
    count: number;
}
export interface StandardCloneRequest extends BaseCloneRequest {
    methods: "DeepClone" | "ShallowClone";
}
export interface SkeletonCloneRequest extends BaseCloneRequest {
    methods: "SkeletonClone";
    deepClone?: boolean;
    cloneGeometry?: boolean;
}
export type CloneRequestTypeForModel = StandardCloneRequest | SkeletonCloneRequest;
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
export {};
//# sourceMappingURL=assetsEntryType.d.ts.map