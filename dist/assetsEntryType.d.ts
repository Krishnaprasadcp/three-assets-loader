import type { mappingTypes } from "./assetsLoader.js";
export type AssetsEntryType = {
    models?: Array<{
        name: string;
        path: string;
        scale?: {
            x: number;
            y: number;
            z: number;
        };
        position?: {
            x: number;
            y: number;
            z: number;
        };
        isDraco?: boolean;
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
//# sourceMappingURL=assetsEntryType.d.ts.map