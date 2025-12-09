import {} from "./allTypes.js";
import { Scene } from "three";
import { AssetsTracker, DeepClone, ShallowClone, SkeletonClone, } from "./helperModules.js";
export default class AllAssets {
    static instance;
    modelsData;
    audios;
    textures;
    cubeTextures;
    hdrCubeTextures;
    hdriTextures;
    fonts;
    #assetsTracker;
    constructor() {
        this.modelsData = {};
        this.audios = {};
        this.textures = {};
        this.cubeTextures = {};
        this.hdrCubeTextures = {};
        this.hdriTextures = {};
        this.fonts = {};
        this.#assetsTracker = AssetsTracker.getInstance();
        this.modelsData = this.#assetsTracker.modelsMap;
        this.textures = this.#assetsTracker.texturesMap;
        this.audios = this.#assetsTracker.audioMap;
        this.cubeTextures = this.#assetsTracker.cubeTextureMap;
        this.hdrCubeTextures = this.#assetsTracker.hdrCubeTextureMap;
        this.hdriTextures = this.#assetsTracker.hdriTextureMap;
        this.fonts = this.#assetsTracker.fontMap;
    }
    //Get Instance of AllAssets
    static getInstance() {
        if (!AllAssets.instance) {
            AllAssets.instance = new AllAssets();
        }
        return AllAssets.instance;
    }
    fetchModel(nameOrId, 
    // isCloned?: boolean,
    cloneType, count) {
        const tracker = this.#assetsTracker;
        let name = typeof nameOrId === "number"
            ? tracker["assetsKeyToNameMap"].get(nameOrId)
            : nameOrId;
        // Auto detect clone
        const isCloned = /(DeepClone|ShallowClone|SkeletonClone)\d+$/.test(name);
        if (!isCloned && !cloneType) {
            return tracker.getModel(name, false);
        }
        const cloneMatch = name.match(/(DeepClone|ShallowClone|SkeletonClone)(\d+)$/);
        if (cloneMatch) {
            const cloneTypeRaw = cloneMatch[1];
            if (!cloneTypeRaw) {
                throw new Error("Invalid cloneMatch: missing clone type");
            }
            const type = normalizeCloneType(cloneTypeRaw);
            const baseName = name.replace(/(DeepClone|ShallowClone|SkeletonClone)\d+$/, "");
            const record = tracker.modelsMap[baseName];
            if (!record)
                throw new Error(`Base model '${baseName}' not found`);
            const clone = record.clones[type][name];
            if (!clone)
                throw new Error(`Clone '${name}' not found`);
            return clone;
        }
        if (!cloneType) {
            throw new Error("CloneType is required when cloning source model.");
        }
        const source = tracker.getModel(name, false);
        const recordBefore = tracker.modelsMap[name];
        const startIndex = recordBefore
            ? cloneType.methods === "DeepClone"
                ? recordBefore.deepCloneCount
                : cloneType.methods === "ShallowClone"
                    ? recordBefore.shallowCloneCount
                    : recordBefore.skeletonCloneCount
            : 0;
        switch (cloneType.methods) {
            case "DeepClone":
                DeepClone(source, cloneType.count ? cloneType.count : 1);
                break;
            case "ShallowClone":
                ShallowClone(source, cloneType.count ? cloneType.count : 1);
                break;
            case "SkeletonClone":
                SkeletonClone(source, cloneType.count ? cloneType.count : 1, (cloneType.deepClone = false), (cloneType.cloneGeometry = false));
                break;
        }
        const record = tracker.modelsMap[name];
        if (count && count > 1) {
            const clones = [];
            const total = count;
            for (let i = 0; i < total; i++) {
                const idx = startIndex + i;
                const createdName = `${name}${capitalize(cloneType.methods)}Clone${idx}`;
                const clone = record.clones[cloneType.methods][createdName];
                if (!clone)
                    throw new Error(`Clone '${createdName}' missing`);
                clones.push(clone);
            }
            return clones; // return ARRAY
        }
        if (record) {
            const index = cloneType.methods === "DeepClone"
                ? record.deepCloneCount - 1
                : cloneType.methods === "ShallowClone"
                    ? record.shallowCloneCount - 1
                    : record.skeletonCloneCount - 1;
            const createdName = `${name}${capitalize(cloneType.methods)}${index}`;
            const clone = record.clones[cloneType.methods][createdName];
            if (!clone) {
                throw new Error(`Clone '${createdName}' was not created properly`);
            }
            return clone;
        }
        throw new Error(`Model record '${name}' not found after cloning.`);
    }
    getSourceModels(...names) {
        const tracker = this.#assetsTracker;
        const result = [];
        for (const name of names) {
            const record = tracker.modelsMap[name];
            if (!record) {
                console.warn(`Source model '${name}' not found`);
                continue;
            }
            result.push(record.source); // ONLY source
        }
        return result;
    }
    getClones(name) {
        const tracker = this.#assetsTracker;
        const record = tracker.modelsMap[name];
        if (!record) {
            throw new Error(`Model '${name}' not found`);
        }
        return {
            [name]: {
                deep: Object.values(record.clones.DeepClone),
                shallow: Object.values(record.clones.ShallowClone),
                skeleton: Object.values(record.clones.SkeletonClone),
            },
        };
    }
    getClone(name) {
        const tracker = this.#assetsTracker;
        // Extract base name (remove DeepCloneX / ShallowCloneX / SkeletonCloneX)
        const baseName = name.replace(/(DeepClone|ShallowClone|SkeletonClone)\d+$/, "");
        const record = tracker.modelsMap[baseName];
        if (!record) {
            throw new Error(`Model '${baseName}' not found.`);
        }
        // Detect clone type
        if (record.clones.DeepClone[name]) {
            return record.clones.DeepClone[name];
        }
        if (record.clones.ShallowClone[name]) {
            return record.clones.ShallowClone[name];
        }
        if (record.clones.SkeletonClone[name]) {
            return record.clones.SkeletonClone[name];
        }
        throw new Error(`Clone '${name}' not found.`);
    }
    getAllModelsArray() {
        const tracker = this.#assetsTracker;
        const result = [];
        for (const modelName in tracker.modelsMap) {
            const record = tracker.modelsMap[modelName];
            if (!record)
                continue;
            result.push(record.source);
            result.push(...Object.values(record.clones.DeepClone));
            result.push(...Object.values(record.clones.ShallowClone));
            result.push(...Object.values(record.clones.SkeletonClone));
        }
        return result;
    }
    getModelsObject() {
        const tracker = this.#assetsTracker;
        const clean = {};
        for (const key of Object.keys(tracker.modelsMap)) {
            const record = tracker.modelsMap[key];
            if (!record)
                continue;
            clean[key] = {
                source: {
                    name: record.source.name,
                    id: record.source.id,
                    sourceModel: record.source.sourceModel, // reference only
                    animations: record.source.animations, // reference only
                },
                deepCloneCount: record.deepCloneCount,
                shallowCloneCount: record.shallowCloneCount,
                skeletonCloneCount: record.skeletonCloneCount,
                clones: {
                    DeepClone: { ...record.clones.DeepClone },
                    ShallowClone: { ...record.clones.ShallowClone },
                    SkeletonClone: { ...record.clones.SkeletonClone },
                },
            };
        }
        return clean;
    }
    fetchTexture(nameOrId, isCloned) {
        const tracker = this.#assetsTracker;
        let name = typeof nameOrId === "number"
            ? tracker["assetsKeyToNameMap"].get(nameOrId)
            : nameOrId;
        // Auto-detect clone
        if (typeof isCloned === "undefined") {
            isCloned = /Texture\d+$/.test(name);
        }
        if (isCloned) {
            return tracker.getTexture(name, true);
        }
        else {
            return tracker.getTexture(name, false);
        }
    }
    getSourceTextures(...names) {
        const tracker = this.#assetsTracker;
        const result = [];
        for (const name of names) {
            const record = tracker.texturesMap[name];
            if (!record) {
                console.warn(`Source texture '${name}' not found`);
                continue;
            }
            result.push(record.source);
        }
        return result;
    }
    getTextureClones(name) {
        const tracker = this.#assetsTracker;
        const record = tracker.texturesMap[name];
        if (!record) {
            throw new Error(`Texture '${name}' not found`);
        }
        return Object.values(record.clones);
    }
    getTextureClone(name) {
        const tracker = this.#assetsTracker;
        // remove suffix to find base name
        const baseName = name.replace(/Texture\d+$/, "");
        const record = tracker.texturesMap[baseName];
        if (!record) {
            throw new Error(`Texture '${baseName}' not found`);
        }
        const clone = record.clones[name];
        if (!clone) {
            throw new Error(`Texture clone '${name}' not found`);
        }
        return clone;
    }
    getAllTexturesArray() {
        const tracker = this.#assetsTracker;
        const result = [];
        for (const name in tracker.texturesMap) {
            const record = tracker.texturesMap[name];
            if (!record)
                continue;
            result.push(record.source);
            result.push(...Object.values(record.clones));
        }
        return result;
    }
    getTexturesObject() {
        const tracker = this.#assetsTracker;
        const clean = {};
        for (const key of Object.keys(tracker.texturesMap)) {
            const record = tracker.texturesMap[key];
            if (!record)
                continue;
            clean[key] = {
                source: {
                    name: record.source.name,
                    id: record.source.id,
                    texture: record.source.texture,
                },
                textureCount: record.textureCount,
                clones: { ...record.clones },
            };
        }
        return clean;
    }
    //CubeTextures
    fetchCubeTexture(name) {
        if (!name) {
            console.warn("Please Provide a name ");
            return null;
        }
        const cubeMap = this.#assetsTracker.getCubeMap(name);
        if (cubeMap === null) {
            console.warn(`No CubeMap Found named ${name}  `);
            return null;
        }
        return cubeMap;
    }
    fetchHdrCubeTexture(name) {
        if (!name) {
            console.warn("Please Provide a name ");
            return null;
        }
        const hdrCube = this.#assetsTracker.getHdrCubeMap(name);
        if (hdrCube === null) {
            console.warn(`No HdrCubeMap Found named ${name}  `);
            return null;
        }
        return hdrCube;
    }
    fetchHdriTexture(hdriName) {
        if (!hdriName) {
            console.warn("Please Provide a hdriName ");
            return null;
        }
        const hdriTexture = this.#assetsTracker.getHdriTexture(hdriName);
        if (hdriTexture === null) {
            console.warn(`No HdriTexture Found named ${hdriName}  `);
            return null;
        }
        return hdriTexture;
    }
    fetchFont(fontName) {
        if (!fontName) {
            console.warn("Please Provide a fontName ");
            return null;
        }
        const font = this.#assetsTracker.getFont(fontName);
        if (font === null) {
            console.warn(`No Font Found named ${font}  `);
            return null;
        }
        return font;
    }
    setCameraForPositionalAudio(camera) {
        this.#assetsTracker.setCameraForPositionalAudio(camera);
    }
    fetchAudio(audioName) {
        if (!audioName) {
            console.warn("Please Provide a AudioName ");
            return null;
        }
        const audio = this.#assetsTracker.getAudio(audioName);
        if (audio === null) {
            console.warn(`No Audio Found named ${audioName}  `);
            return null;
        }
        return audio;
    }
    disposeCubeMap(name) {
        this.#assetsTracker.disposeCubeTexture(name);
    }
    disposeHdrCubeMap(name) {
        this.#assetsTracker.disposeHdrCubeTexture(name);
    }
    disposeHdriTexture(name, scene) {
        this.#assetsTracker.disposeHdriTexture(name, scene);
    }
    disposeFont(name) {
        this.#assetsTracker.disposeFont(name);
    }
    disposeAudio(audioName) {
        this.#assetsTracker.disposeAudio(audioName);
    }
    disposeSourceModel(name) {
        this.#assetsTracker.disposeSourceModel(name);
    }
    disposeCloneModel(name) {
        this.#assetsTracker.disposeClone(name);
    }
    disposeSourceTexture(textureName) {
        this.#assetsTracker.disposeSourceTexture(textureName);
    }
    disposeCloneTexture(textureName) {
        this.#assetsTracker.disposeCloneTexture(textureName);
    }
    disposeAllTextures() {
        this.#assetsTracker.disposeAllTextures();
    }
    disposeModelsByScene(scene) {
        this.#assetsTracker.disposeModelsByScene(scene);
    }
    disposeTexturesByScene(scene) {
        this.#assetsTracker.disposeTexturesByScene(scene);
    }
    disposeEverything(scene) {
        this.#assetsTracker.disposeEvrything(scene);
    }
}
function capitalize(s) {
    return s.charAt(0).toUpperCase() + s.slice(1);
}
function normalizeCloneType(t) {
    switch (t) {
        case "DeepClone":
            return "DeepClone";
        case "ShallowClone":
            return "ShallowClone";
        case "SkeletonClone":
            return "SkeletonClone";
        default:
            throw new Error("Unknown clone type: " + t);
    }
}
//# sourceMappingURL=allAssets.js.map