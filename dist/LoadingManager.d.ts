import { LoadingManager as ThreeLoadingManager } from "three";
export type LoadingProgress = {
    percent: number;
    url: string;
    itemsLoaded: number;
    itemsTotal: number;
};
export type ProgressListener = (progress: LoadingProgress) => void;
export default class LoadingManager {
    private static _instance;
    private loadingManager;
    private loadingProgress;
    private listeners;
    private constructor();
    static getInstance(): LoadingManager;
    getManager(): ThreeLoadingManager;
    getProgress(): LoadingProgress | null;
    onProgress(callback: ProgressListener): void;
    dispose(): void;
}
//# sourceMappingURL=LoadingManager.d.ts.map