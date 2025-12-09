import { type AssetsTrackerAudioType, type AssetsTrackerCubeMapType, type AssetsTrackerFontType, type AssetsTrackerHdrCubeMapType, type AssetsTrackerHdriTextureType, type AssetsTrackerModelMapType, type AssetsTrackerTextureMapType, type FontType, type HdrCubeMapType, type HdriTextureType, type SourceCubeMapDataType, type SourceRecordType, type SourceTextureData, type TextureCloneType, type TrackedModelDataType } from "./allTypes.js";
import { Scene, type Camera } from "three";
import type { CloneRequestTypeForModel } from "./assetsEntryType.js";
export interface CloneListByType {
    deep: TrackedModelDataType[];
    shallow: TrackedModelDataType[];
    skeleton: TrackedModelDataType[];
}
export interface GetCloneReturnType {
    [modelName: string]: CloneListByType;
}
export default class AllAssets {
    #private;
    static instance: AllAssets;
    modelsData: AssetsTrackerModelMapType;
    audios: AssetsTrackerAudioType;
    textures: AssetsTrackerTextureMapType;
    cubeTextures: AssetsTrackerCubeMapType;
    hdrCubeTextures: AssetsTrackerHdrCubeMapType;
    hdriTextures: AssetsTrackerHdriTextureType;
    fonts: AssetsTrackerFontType;
    constructor();
    static getInstance(): AllAssets;
    fetchModel(nameOrId: string | number): SourceRecordType | TrackedModelDataType;
    fetchModel(name: string, cloneType: CloneRequestTypeForModel, count: number): TrackedModelDataType;
    getSourceModels(...names: string[]): SourceRecordType[];
    getClones(name: string): GetCloneReturnType;
    getClone(name: string): TrackedModelDataType;
    getAllModelsArray(): (SourceRecordType | TrackedModelDataType)[];
    getModelsObject(): AssetsTrackerModelMapType;
    fetchTexture(nameOrId: string | number): SourceTextureData | TextureCloneType;
    fetchTexture(nameOrId: string | number, isCloned: boolean): SourceTextureData | TextureCloneType;
    getSourceTextures(...names: string[]): SourceTextureData[];
    getTextureClones(name: string): TextureCloneType[];
    getTextureClone(name: string): TextureCloneType;
    getAllTexturesArray(): (SourceTextureData | TextureCloneType)[];
    getTexturesObject(): any;
    fetchCubeTexture(name: string): SourceCubeMapDataType | null;
    fetchHdrCubeTexture(name: string): HdrCubeMapType | null;
    fetchHdriTexture(hdriName: string): HdriTextureType | null;
    fetchFont(fontName: string): FontType | null;
    setCameraForPositionalAudio(camera: Camera): void;
    fetchAudio(audioName: string): import("./allTypes.js").AudioType | null;
    disposeCubeMap(name: string): void;
    disposeHdrCubeMap(name: string): void;
    disposeHdriTexture(name: string, scene: Scene): void;
    disposeFont(name: string): void;
    disposeAudio(audioName: string): void;
    disposeSourceModel(name: string): void;
    disposeCloneModel(name: string): void;
    disposeSourceTexture(textureName: string): void;
    disposeCloneTexture(textureName: string): void;
    disposeAllTextures(): void;
    disposeModelsByScene(scene: Scene): void;
    disposeTexturesByScene(scene: Scene): void;
    disposeEverything(scene: Scene): void;
}
//# sourceMappingURL=allAssets.d.ts.map