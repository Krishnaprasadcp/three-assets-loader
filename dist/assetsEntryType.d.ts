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
};
//# sourceMappingURL=assetsEntryType.d.ts.map