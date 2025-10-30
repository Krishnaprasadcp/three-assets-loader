import { LoadingManager as ThreeLoadingManager } from "three";

export type LoadingProgress = {
  percent: number;
  url: string;
  itemsLoaded: number;
  itemsTotal: number;
};
export type ProgressListener = (progress: LoadingProgress) => void;
export default class LoadingManager {
  private static _instance: LoadingManager | null = null;
  private loadingManager: ThreeLoadingManager;
  private loadingProgress: LoadingProgress | null = null;
  private listeners: ProgressListener[] = [];
  private constructor() {
    this.loadingManager = new ThreeLoadingManager();

    this.loadingManager.onStart = (url, itemsLoaded, itemsTotal) => {
      console.log(`Started loading: ${url} (${itemsLoaded}/${itemsTotal})`);
    };

    this.loadingManager.onLoad = () => {
      this.loadingProgress!.percent = 100;
      console.log("All assets loaded!");
    };

    this.loadingManager.onProgress = (url, itemsLoaded, itemsTotal) => {
      const percent = (itemsLoaded / itemsTotal) * 100;
      this.loadingProgress = {
        percent,
        url,
        itemsLoaded,
        itemsTotal,
      };
      this.listeners.forEach((cb) => cb(this.loadingProgress!));

      console.log(`Loaded ${itemsLoaded} of ${itemsTotal}: ${url}`);
    };

    this.loadingManager.onError = (url) => {
      console.error(`Error loading: ${url}`);
    };
  }
  public static getInstance(): LoadingManager {
    if (!LoadingManager._instance) {
      LoadingManager._instance = new LoadingManager();
    }
    return LoadingManager._instance;
  }

  public getManager(): ThreeLoadingManager {
    return this.loadingManager;
  }
  public getProgress(): LoadingProgress | null {
    return this.loadingProgress;
  }
  public onProgress(callback: ProgressListener) {
    this.listeners.push(callback);
  }

  public dispose() {
    this.listeners = [];
    this.loadingProgress = null;
    console.log("LoadingManager listeners cleared");
  }
}
