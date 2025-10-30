import { LoadingManager as ThreeLoadingManager } from "three";
export default class LoadingManager {
    static _instance = null;
    loadingManager;
    loadingProgress = null;
    listeners = [];
    constructor() {
        this.loadingManager = new ThreeLoadingManager();
        this.loadingManager.onStart = (url, itemsLoaded, itemsTotal) => {
            console.log(`Started loading: ${url} (${itemsLoaded}/${itemsTotal})`);
        };
        this.loadingManager.onLoad = () => {
            this.loadingProgress.percent = 100;
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
            this.listeners.forEach((cb) => cb(this.loadingProgress));
            console.log(`Loaded ${itemsLoaded} of ${itemsTotal}: ${url}`);
        };
        this.loadingManager.onError = (url) => {
            console.error(`Error loading: ${url}`);
        };
    }
    static getInstance() {
        if (!LoadingManager._instance) {
            LoadingManager._instance = new LoadingManager();
        }
        return LoadingManager._instance;
    }
    getManager() {
        return this.loadingManager;
    }
    getProgress() {
        return this.loadingProgress;
    }
    onProgress(callback) {
        this.listeners.push(callback);
    }
    dispose() {
        this.listeners = [];
        this.loadingProgress = null;
        console.log("LoadingManager listeners cleared");
    }
}
//# sourceMappingURL=LoadingManager.js.map