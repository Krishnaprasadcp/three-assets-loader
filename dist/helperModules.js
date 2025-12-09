import { AnimationAction, AnimationClip, AnimationMixer, AudioListener, Camera, Material, MathUtils, Object3D, PositionalAudio, Scene, Texture, } from "three";
import { clone as skeletonClone } from "three/examples/jsm/utils/SkeletonUtils.js";
export class AssetsTracker {
    static instance;
    audioListener;
    modelsMap = {};
    texturesMap = {};
    cubeTextureMap = {};
    hdrCubeTextureMap = {};
    hdriTextureMap = {};
    fontMap = {};
    audioMap = {};
    assetsKeyToNameMap;
    assetsNameToKeyMap;
    constructor() {
        this.assetsKeyToNameMap = new Map();
        this.assetsNameToKeyMap = new Map();
    }
    static getInstance() {
        if (!AssetsTracker.instance) {
            AssetsTracker.instance = new AssetsTracker();
        }
        return AssetsTracker.instance;
    }
    getModel(modelIdOrName, isCloned = false) {
        let modelName;
        if (typeof modelIdOrName === "number") {
            const name = this.assetsKeyToNameMap.get(modelIdOrName);
            if (!name)
                throw new Error(`Model ID ${modelIdOrName} not found`);
            modelName = name;
        }
        else {
            modelName = modelIdOrName;
        }
        // Extract base name (everything before DeepClone/ShallowClone/SkeletonClone)
        const baseName = modelName.replace(/(DeepClone|ShallowClone|SkeletonClone)\d+$/, "");
        const modelRecord = this.modelsMap[baseName];
        if (!modelRecord)
            throw new Error(`Base model '${baseName}' not found`);
        if (!isCloned) {
            return modelRecord.source;
        }
        if (modelRecord.clones.DeepClone[modelName]) {
            return modelRecord.clones.DeepClone[modelName];
        }
        // Check shallow clones
        if (modelRecord.clones.ShallowClone[modelName]) {
            return modelRecord.clones.ShallowClone[modelName];
        }
        // Check skeleton clones
        if (modelRecord.clones.SkeletonClone[modelName]) {
            return modelRecord.clones.SkeletonClone[modelName];
        }
        throw new Error(`Clone '${modelName}' not found`);
    }
    getTexture(textureIdOrName, isCloned = false) {
        let textureName;
        // ----- Case 1: ID → Name -----
        if (typeof textureIdOrName === "number") {
            const name = this.assetsKeyToNameMap.get(textureIdOrName);
            if (!name)
                throw new Error(`Texture ID ${textureIdOrName} not found`);
            textureName = name;
        }
        // ----- Case 2: Name -----
        else {
            textureName = textureIdOrName;
        }
        // Extract base name (remove CloneX suffix)
        const baseName = textureName.replace(/Clone\d+$/, "");
        const record = this.texturesMap[baseName];
        if (!record)
            throw new Error(`Texture '${baseName}' not found.`);
        // ----- Source texture -----
        if (!isCloned) {
            return record.source;
        }
        // ----- Cloned texture -----
        const clone = record.clones[textureName];
        if (!clone)
            throw new Error(`Cloned texture '${textureName}' not found.`);
        return clone;
    }
    getCubeMap(name) {
        if (!name) {
            console.warn("Please Provide a name ");
            return null;
        }
        if (!this.cubeTextureMap[name]) {
            console.warn(`No CubeMap Found named ${name}  `);
            return null;
        }
        return this.cubeTextureMap[name];
    }
    getHdrCubeMap(name) {
        if (!name) {
            console.warn("Please Provide a name ");
            return null;
        }
        if (!this.hdrCubeTextureMap[name]) {
            console.warn(`No HdrCubeTexture Found named ${name}  `);
            return null;
        }
        return this.hdrCubeTextureMap[name];
    }
    getHdriTexture(name) {
        if (!name) {
            console.warn("Please Provide a name ");
            return null;
        }
        if (!this.hdriTextureMap[name]) {
            console.warn(`No HdriTexture Found named ${name}  `);
            return null;
        }
        return this.hdriTextureMap[name];
    }
    getFont(fontName) {
        if (!fontName) {
            console.warn("Please Provide a name ");
            return null;
        }
        if (!this.fontMap[fontName]) {
            console.warn(`No Font Found named ${name}  `);
            return null;
        }
        return this.fontMap[fontName];
    }
    getAudio(name) {
        if (!name) {
            console.warn("Please Provide a name ");
            return null;
        }
        if (!this.audioMap[name]) {
            console.warn(`No Audio Found named ${name}  `);
            return null;
        }
        return this.audioMap[name];
    }
    setSourceTexture(data) {
        this.texturesMap[data.name] = {
            textureCount: 0,
            source: {
                id: data.id,
                name: data.name,
                texture: data.texture,
            },
            clones: {},
        };
        this.assetsKeyToNameMap.set(data.id, data.name);
        this.assetsNameToKeyMap.set(data.name, data.id);
    }
    setCloneTexture(data) {
        const record = this.texturesMap[data.name];
        if (!record)
            throw new Error(`Texture source '${data.name}' not found.`);
        // Increase count (starts at 0, but clone names start at 1)
        record.textureCount++;
        const cloneIndex = record.textureCount; // 1-based indexing
        const cloneName = `${data.name}Texture${cloneIndex}`;
        record.clones[cloneName] = {
            id: data.id,
            name: cloneName,
            texture: data.texture,
        };
        this.assetsKeyToNameMap.set(data.id, cloneName);
        this.assetsNameToKeyMap.set(cloneName, data.id);
        return cloneName;
    }
    setModelSource(data) {
        let mixer = null;
        let actions = null;
        // 🔥 If the source has animations, prepare mixer + actions
        if (data.animations && data.animations.length > 0) {
            mixer = new AnimationMixer(data.sourceModel);
            actions = {};
            data.animations.forEach((clip) => {
                actions[clip.name] = mixer.clipAction(clip);
            });
        }
        this.modelsMap[data.name] = {
            source: {
                ...data,
                mixerRef: mixer,
                actionsRef: actions,
            },
            deepCloneCount: 0,
            shallowCloneCount: 0,
            skeletonCloneCount: 0,
            clones: {
                DeepClone: {},
                ShallowClone: {},
                SkeletonClone: {},
            },
        };
        this.assetsKeyToNameMap.set(data.id, data.name);
        this.assetsNameToKeyMap.set(data.name, data.id);
    }
    setCloneModel(modelData, cloneType) {
        // Always use parentName — never use assetsKeyToNameMap here
        const parentRecord = this.modelsMap[modelData.parentName];
        if (!parentRecord) {
            throw new Error(`Parent record not found for '${modelData.parentName}'`);
        }
        this.assetsKeyToNameMap.set(modelData.modelId, modelData.modelRef.name);
        this.assetsNameToKeyMap.set(modelData.modelRef.name, modelData.modelId);
        // Attach the clone
        parentRecord.clones[cloneType][modelData.modelRef.name] = modelData;
    }
    setCubeMap(data) {
        this.cubeTextureMap[data.name] = {
            cubeMap: data.cubeMap,
            id: data.id,
            name: data.name,
        };
        this.assetsKeyToNameMap.set(data.id, data.name);
        this.assetsNameToKeyMap.set(data.name, data.id);
    }
    setHdrCubeMap(data) {
        this.hdrCubeTextureMap[data.name] = {
            cubeMap: data.cubeMap,
            id: data.id,
            name: data.name,
        };
        this.assetsKeyToNameMap.set(data.id, data.name);
        this.assetsNameToKeyMap.set(data.name, data.id);
    }
    setHdriTexture(data) {
        this.hdriTextureMap[data.name] = {
            hdri: data.hdri,
            original: data.original,
            id: data.id,
            name: data.name,
        };
        this.assetsKeyToNameMap.set(data.id, data.name);
        this.assetsNameToKeyMap.set(data.name, data.id);
    }
    //Font
    setFont(data) {
        this.fontMap[data.name] = {
            font: data.font,
            name: data.name,
            id: data.id,
        };
        this.assetsKeyToNameMap.set(data.id, data.name);
        this.assetsNameToKeyMap.set(data.name, data.id);
    }
    setAudio(data) {
        this.audioMap[data.name] = {
            audio: data.audio,
            name: data.name,
            id: data.id,
        };
        this.assetsKeyToNameMap.set(data.id, data.name);
        this.assetsNameToKeyMap.set(data.name, data.id);
    }
    setCameraForPositionalAudio(camera) {
        // Ensure listener exists only once
        if (!this.audioListener) {
            this.audioListener = new AudioListener();
        }
        // Remove listener from old parent if needed
        if (this.audioListener.parent) {
            this.audioListener.parent.remove(this.audioListener);
        }
        // Attach listener to the new camera
        camera.add(this.audioListener);
        // Fix positional audios to use the correct listener reference
        Object.values(this.audioMap).forEach(({ audio }) => {
            if (audio instanceof PositionalAudio) {
                // Update the listener reference
                // @ts-ignore: internal Three.js audio listener link
                audio.listener = this.audioListener;
            }
        });
    }
    // -------------------------------------------------------
    // ONE SINGLE DISPOSER FOR ALL OBJECTS
    // -------------------------------------------------------
    _disposeObject(obj) {
        obj.traverse((child) => {
            for (const key in child.userData) {
                delete child.userData[key];
            }
            // ---- GEOMETRY ----
            if (child.geometry) {
                child.geometry.dispose();
            }
            // ---- SKINNED MESH / SKELETON ----
            if (child.isSkinnedMesh && child.skeleton) {
                child.skeleton.boneInverses = []; // ← THIS LINE IS CRITICAL
                child.skeleton.dispose(); // required for SkeletonUtils.clone()
            }
            // ---- MATERIALS ----
            if (child.material) {
                const materials = Array.isArray(child.material)
                    ? child.material
                    : [child.material];
                materials.forEach((mat) => {
                    if (!mat)
                        return;
                    // Dispose textures if not used anywhere else
                    const textureKeys = [
                        "map",
                        "normalMap",
                        "specularMap",
                        "emissiveMap",
                        "lightMap",
                        "aoMap",
                        "displacementMap",
                        "roughnessMap",
                        "metalnessMap",
                        "alphaMap",
                        "envMap",
                    ];
                    textureKeys.forEach((key) => {
                        const tex = mat[key];
                        if (tex && tex.isTexture) {
                            // 🔥 check whether the texture is used by any other model
                            if (!this._isTextureStillUsed(tex)) {
                                tex.dispose();
                            }
                        }
                    });
                    mat.dispose();
                });
            }
        });
    }
    // ShallowClone stays exactly as you wrote it:
    // BUT fix _isTextureStillUsed() to include shallow clones:
    _isTextureStillUsed(tex) {
        for (const modelName in this.modelsMap) {
            const record = this.modelsMap[modelName];
            if (!record)
                continue;
            // Source
            if (this._modelUsesTexture(record.source.sourceModel, tex))
                return true;
            // Deep clones
            for (const clone of Object.values(record.clones.DeepClone)) {
                if (this._modelUsesTexture(clone.modelRef, tex))
                    return true;
            }
            // Shallow clones ← YOU WERE MISSING THIS
            for (const clone of Object.values(record.clones.ShallowClone)) {
                if (this._modelUsesTexture(clone.modelRef, tex))
                    return true;
            }
            // Skeleton clones
            for (const clone of Object.values(record.clones.SkeletonClone)) {
                if (this._modelUsesTexture(clone.modelRef, tex))
                    return true;
            }
        }
        return false;
    }
    _modelUsesTexture(obj, tex) {
        let found = false;
        obj.traverse((child) => {
            if (found)
                return;
            if (child.material) {
                const materials = Array.isArray(child.material)
                    ? child.material
                    : [child.material];
                materials.forEach((mat) => {
                    for (const key in mat) {
                        if (mat[key] === tex) {
                            found = true;
                        }
                    }
                });
            }
        });
        return found;
    }
    // -------------------------------------------------------
    // SINGLE ANIMATION DISPOSER
    // -------------------------------------------------------
    _disposeAnimation(mixer, obj, actions) {
        if (!mixer)
            return;
        // Stop everything
        mixer.stopAllAction();
        // Uncache the object root
        mixer.uncacheRoot(obj);
        // Uncache each clip that was used by the mixer
        if (actions) {
            for (const key in actions) {
                const action = actions[key];
                if (action && action.getClip()) {
                    mixer.uncacheClip(action.getClip());
                }
            }
        }
    }
    _isInsideScene(obj, scene) {
        let parent = obj.parent;
        while (parent) {
            if (parent === scene)
                return true;
            parent = parent.parent;
        }
        return false;
    }
    disposeSourceModel(modelName) {
        const record = this.modelsMap[modelName];
        if (!record)
            return;
        const disposeCloneGroup = (group) => {
            for (const cloneName in group) {
                const clone = group[cloneName];
                if (!clone)
                    continue;
                if (clone.modelRef.parent) {
                    clone.modelRef.parent.remove(clone.modelRef);
                }
                this._disposeAnimation(null, record.source.sourceModel, null);
                this._disposeObject(clone.modelRef);
                this.assetsKeyToNameMap.delete(clone.modelId);
                this.assetsNameToKeyMap.delete(cloneName);
            }
        };
        disposeCloneGroup(record.clones.DeepClone);
        disposeCloneGroup(record.clones.ShallowClone);
        disposeCloneGroup(record.clones.SkeletonClone);
        // Clear clone data
        record.clones.DeepClone = {};
        record.clones.ShallowClone = {};
        record.clones.SkeletonClone = {};
        // Remove source model from scene
        const src = record.source.sourceModel;
        if (src.parent) {
            src.parent.remove(src);
        }
        // Dispose source
        this._disposeObject(src);
        record.source.animations.length = 0;
        this.assetsKeyToNameMap.delete(record.source.id);
        this.assetsNameToKeyMap.delete(record.source.name);
        delete this.modelsMap[modelName];
        console.log(`Disposed source '${modelName}'.`);
    }
    disposeClone(cloneName) {
        const baseName = cloneName.replace(/(DeepClone|ShallowClone|SkeletonClone)\d+$/, "");
        const record = this.modelsMap[baseName];
        if (!record)
            return;
        let cloneType = null;
        let clone;
        if (record.clones.DeepClone[cloneName]) {
            cloneType = "DeepClone";
            clone = record.clones.DeepClone[cloneName];
        }
        else if (record.clones.ShallowClone[cloneName]) {
            cloneType = "ShallowClone";
            clone = record.clones.ShallowClone[cloneName];
        }
        else if (record.clones.SkeletonClone[cloneName]) {
            cloneType = "SkeletonClone";
            clone = record.clones.SkeletonClone[cloneName];
        }
        if (!clone || !cloneType)
            return;
        // REMOVE FROM SCENE
        if (clone.modelRef.parent) {
            clone.modelRef.parent.remove(clone.modelRef);
        }
        // FULL ANIMATION CLEANUP
        if (clone.mixerRef) {
            clone.mixerRef.stopAllAction();
            clone.mixerRef.uncacheRoot(clone.modelRef);
            // Uncache all clips used by this mixer
            if (clone.actionsRef) {
                Object.values(clone.actionsRef).forEach((action) => {
                    const clip = action.getClip();
                    if (clip)
                        clone.mixerRef.uncacheClip(clip);
                });
            }
        }
        // Dispose object (geometry, materials, textures safely)
        this._disposeObject(clone.modelRef);
        // CRITICAL: Break references to prevent leaks
        clone.mixerRef = null;
        clone.actionsRef = null;
        // Clean up tracking maps
        this.assetsKeyToNameMap.delete(clone.modelId);
        this.assetsNameToKeyMap.delete(cloneName);
        delete record.clones[cloneType][cloneName];
        console.log(`Disposed clone '${cloneName}'.`);
    }
    // -------------------------------------------------------
    // TEXTURE DISPOSAL
    // -------------------------------------------------------
    // Dispose a source texture + all its clones
    disposeSourceTexture(name) {
        const record = this.texturesMap[name];
        if (!record)
            return;
        // Remove and dispose all clones
        for (const cloneName in record.clones) {
            const clone = record.clones[cloneName];
            if (!clone)
                return;
            clone.texture.dispose();
            // remove id maps
            this.assetsKeyToNameMap.delete(clone.id);
            this.assetsNameToKeyMap.delete(cloneName);
            delete record.clones[cloneName];
        }
        // Dispose source texture
        record.source.texture.dispose();
        // Remove id maps
        this.assetsKeyToNameMap.delete(record.source.id);
        this.assetsNameToKeyMap.delete(record.source.name);
        // Remove from texture map
        delete this.texturesMap[name];
        console.log(`Disposed source texture '${name}' and all clones.`);
    }
    // -------------------------------------------------------
    // Check if ANY object inside the scene uses this texture
    // -------------------------------------------------------
    _sceneUsesTexture(scene, tex) {
        let found = false;
        scene.traverse((obj) => {
            if (found)
                return;
            if (obj.material) {
                const mats = Array.isArray(obj.material)
                    ? obj.material
                    : [obj.material];
                for (const mat of mats) {
                    for (const key in mat) {
                        if (mat[key] === tex) {
                            found = true;
                            break;
                        }
                    }
                    if (found)
                        break;
                }
            }
        });
        return found;
    }
    //Dispose CubeMaps
    disposeCubeTexture(name) {
        const cube = this.cubeTextureMap[name];
        if (!cube) {
            console.warn(`No CubeMaps named ${name} Found`);
            return;
        }
        cube.cubeMap.dispose();
        this.assetsKeyToNameMap.delete(cube.id);
        this.assetsNameToKeyMap.delete(cube.name);
        delete this.cubeTextureMap[name];
    }
    disposeHdrCubeTexture(name) {
        const cube = this.hdrCubeTextureMap[name];
        if (!cube) {
            console.warn(`No HDRCubeMaps named ${name} Found`);
            return;
        }
        cube.cubeMap.dispose(); // frees GPU memory
        this.assetsKeyToNameMap.delete(cube.id);
        this.assetsNameToKeyMap.delete(cube.name);
        delete this.hdrCubeTextureMap[name];
    }
    disposeHdriTexture(name, scene) {
        const tex = this.hdriTextureMap[name];
        if (!tex) {
            console.warn(`No HDRI Texture named ${name} Found`);
            return;
        }
        // Remove from scene
        if (scene.environment === tex.hdri)
            scene.environment = null;
        if (scene.background === tex.original)
            scene.background = null;
        // Dispose PMREM env map
        if (tex.hdri && tex.hdri.dispose) {
            tex.hdri.dispose();
        }
        // Dispose original HDR texture (skybox)
        if (tex.original && tex.original.dispose) {
            tex.original.dispose();
        }
        // Cleanup internal references
        this.assetsKeyToNameMap.delete(tex.id);
        this.assetsNameToKeyMap.delete(tex.name);
        delete this.hdriTextureMap[name];
        console.log(`HDRI '${name}' disposed successfully.`);
    }
    disposeFont(name) {
        const record = this.fontMap[name];
        if (!record) {
            console.warn(`No font named '${name}' found.`);
            return;
        }
        this.assetsKeyToNameMap.delete(record.id);
        this.assetsNameToKeyMap.delete(record.name);
        delete this.fontMap[name];
    }
    disposeAudio(audioName) {
        if (!audioName)
            return;
        const audioItem = this.audioMap[audioName];
        if (!audioItem) {
            console.warn(`No audio found: ${audioName}`);
            return;
        }
        const audio = audioItem.audio;
        try {
            // Stop playback
            if (audio.isPlaying) {
                audio.stop();
            }
            // Detach from scene / parent
            if (audio.parent) {
                audio.parent.remove(audio);
            }
            // Clear buffer
            audio.setBuffer(null);
            // Disconnect source node if exists
            if (audio.source) {
                try {
                    audio.source.disconnect?.();
                }
                catch (_) { }
                audio.source = null;
            }
            // Disconnect positional audio nodes safely
            if (audio.panner?.disconnect) {
                try {
                    audio.panner.disconnect();
                }
                catch (_) { }
            }
            // Disconnect gain node
            if (audio.gain?.disconnect) {
                try {
                    audio.gain.disconnect();
                }
                catch (_) { }
            }
            // Final generic disconnect (safe-checked)
            try {
                audio.disconnect?.();
            }
            catch (_) { }
        }
        catch (e) {
            console.error(`Error disposing audio: ${audioName}`, e);
        }
        // Remove tracking references
        this.assetsKeyToNameMap.delete(audioItem.id);
        this.assetsNameToKeyMap.delete(audioName);
        delete this.audioMap[audioName];
        console.log(`🎧 Audio disposed: ${audioName}`);
    }
    // -------------------------------------------------------
    // FULLY FIXED disposeTexturesByScene()
    // -------------------------------------------------------
    disposeTexturesByScene(scene) {
        for (const texName in this.texturesMap) {
            const record = this.texturesMap[texName];
            if (!record)
                continue;
            const sourceTex = record.source.texture;
            // === SOURCE TEXTURE CHECK ===
            let sourceIsUsed = false;
            // 1) Check tracked models (source + clones)
            for (const modelName in this.modelsMap) {
                const modelRecord = this.modelsMap[modelName];
                if (!modelRecord)
                    continue;
                const root = modelRecord.source.sourceModel;
                if (this._isInsideScene(root, scene)) {
                    if (this._modelUsesTexture(root, sourceTex)) {
                        sourceIsUsed = true;
                        break;
                    }
                }
            }
            // 2) Check non-asset objects inside the scene (YOUR CUBE)
            if (!sourceIsUsed && this._sceneUsesTexture(scene, sourceTex)) {
                sourceIsUsed = true;
            }
            // === CLONES TEXTURE CHECK ===
            const clonesToDispose = new Set();
            for (const cloneName in record.clones) {
                const cloneTexRecord = record.clones[cloneName];
                if (!cloneTexRecord)
                    continue;
                const tex = cloneTexRecord.texture;
                let cloneIsUsed = false;
                // 1) Check tracked model clones
                for (const modelName in this.modelsMap) {
                    const modelRecord = this.modelsMap[modelName];
                    if (!modelRecord)
                        continue;
                    const allClones = [
                        ...Object.values(modelRecord.clones.DeepClone),
                        ...Object.values(modelRecord.clones.ShallowClone),
                        ...Object.values(modelRecord.clones.SkeletonClone),
                    ];
                    for (const clone of allClones) {
                        if (this._isInsideScene(clone.modelRef, scene)) {
                            if (this._modelUsesTexture(clone.modelRef, tex)) {
                                cloneIsUsed = true;
                                break;
                            }
                        }
                    }
                    if (cloneIsUsed)
                        break;
                }
                // 2) Check non-tracked scene objects (cube, spheres, planes…)
                if (!cloneIsUsed && this._sceneUsesTexture(scene, tex)) {
                    cloneIsUsed = true;
                }
                if (cloneIsUsed) {
                    clonesToDispose.add(cloneName);
                }
            }
            // === DISPOSE CLONE TEXTURES ===
            for (const cloneName of clonesToDispose) {
                this.disposeCloneTexture(cloneName);
            }
            // === DISPOSE SOURCE TEXTURE ===
            if (sourceIsUsed) {
                this.disposeSourceTexture(texName);
            }
        }
    }
    // Dispose a single clone texture
    disposeCloneTexture(cloneName) {
        // Extract base name: wallTexture2 → wall
        const baseName = cloneName.replace(/Texture\d+$/, "");
        const record = this.texturesMap[baseName];
        if (!record)
            return;
        const clone = record.clones[cloneName];
        if (!clone)
            return;
        // Dispose GPU resource
        clone.texture.dispose();
        // Remove ID maps
        this.assetsKeyToNameMap.delete(clone.id);
        this.assetsNameToKeyMap.delete(cloneName);
        delete record.clones[cloneName];
        console.log(`Disposed cloned texture '${cloneName}'.`);
    }
    // Dispose ALL textures (sources + clones)
    disposeAllTextures() {
        for (const name in this.texturesMap) {
            this.disposeSourceTexture(name);
        }
        console.log("Disposed ALL textures.");
    }
    disposeEvrything(scene) {
        console.log("Disposing ALL models, textures, sources, clones...");
        // Dispose all models
        const allModels = Object.keys(this.modelsMap);
        for (const modelName of allModels) {
            this.disposeSourceModel(modelName);
        }
        // Dispose all textures
        const allTextures = Object.keys(this.texturesMap);
        for (const texName of allTextures) {
            this.disposeSourceTexture(texName);
        }
        //Dispose all audios
        const allAudios = Object.keys(this.audioMap);
        for (const audioName of allAudios) {
            this.disposeAudio(audioName);
        }
        //Dispose All cubeMaps
        const allCubeMaps = Object.keys(this.cubeTextureMap);
        for (const cubeMapName of allCubeMaps) {
            this.disposeCubeTexture(cubeMapName);
        }
        //Dispose All HdrCubeMap
        const allHdrCubeMaps = Object.keys(this.hdrCubeTextureMap);
        for (const hdrCubeMapName of allHdrCubeMaps) {
            this.disposeHdrCubeTexture(hdrCubeMapName);
        }
        //Dispose All HdriTextures
        const allHdriTextures = Object.keys(this.hdriTextureMap);
        for (const hdriName of allHdriTextures) {
            this.disposeHdriTexture(hdriName, scene);
        }
        //Dispose All Fonts
        const allFont = Object.keys(this.fontMap);
        for (const fontName of allFont) {
            this.disposeFont(fontName);
        }
        console.log("✅ disposeEvrything completed. All assets cleared.");
    }
    disposeModelsByScene(scene) {
        console.log(`🧨 Disposing assets inside scene '${scene.name}'...`);
        for (const modelName of Object.keys(this.modelsMap)) {
            const record = this.modelsMap[modelName];
            if (!record)
                continue;
            // ---- SOURCE MODEL ----
            if (this._isInsideScene(record.source.sourceModel, scene)) {
                this.disposeSourceModel(modelName);
                continue; // deleting entire record, skip clones
            }
            // ---- DEEP CLONES ----
            for (const cloneName in record.clones.DeepClone) {
                const clone = record.clones.DeepClone[cloneName];
                if (!clone)
                    continue;
                if (this._isInsideScene(clone.modelRef, scene)) {
                    this.disposeClone(cloneName);
                }
            }
            // ---- SHALLOW CLONES ----
            for (const cloneName in record.clones.ShallowClone) {
                const clone = record.clones.ShallowClone[cloneName];
                if (!clone)
                    continue;
                if (this._isInsideScene(clone.modelRef, scene)) {
                    this.disposeClone(cloneName);
                }
            }
            // ---- SKELETON CLONES ----
            for (const cloneName in record.clones.SkeletonClone) {
                const clone = record.clones.SkeletonClone[cloneName];
                if (!clone)
                    continue;
                if (this._isInsideScene(clone.modelRef, scene)) {
                    this.disposeClone(cloneName);
                }
            }
        }
        this.disposeTexturesByScene(scene);
        console.log(`✅ disposeByScene('${scene.name}') finished.`);
    }
}
export function CloneTexture(cloneRequest, id) {
    const assetsTracker = AssetsTracker.getInstance();
    const record = assetsTracker.texturesMap[assetsTracker["assetsKeyToNameMap"].get(id)];
    if (!record)
        throw new Error(`Texture with ID ${id} not found.`);
    const sourceTex = record.source.texture;
    for (let i = 0; i < cloneRequest.count; i++) {
        const tex = sourceTex.clone();
        tex.needsUpdate = true;
        const cloneId = generateUniqueId();
        assetsTracker.setCloneTexture({
            texture: tex,
            id: cloneId,
            name: record.source.name,
        });
    }
}
export function DeepClone(modelData, count) {
    const assetsTracker = AssetsTracker.getInstance();
    const gltf = modelData.sourceModel;
    for (let i = 0; i < count; i++) {
        const clone = gltf.clone(true);
        const parentRecord = assetsTracker.modelsMap[modelData.name];
        const cloneIndex = parentRecord.deepCloneCount++;
        const cloneName = `${modelData.name}DeepClone${cloneIndex}`;
        clone.name = cloneName;
        // Deep clone materials
        clone.traverse((child) => {
            if (child.isMesh) {
                child.material = Array.isArray(child.material)
                    ? child.material.map((m) => m.clone())
                    : child.material.clone();
            }
        });
        const id = generateUniqueId();
        const trackedData = {
            parentId: modelData.id,
            parentName: modelData.name,
            modelId: id,
            modelRef: clone,
        };
        assetsTracker.setCloneModel(trackedData, "DeepClone");
    }
}
export function ShallowClone(modelData, count) {
    const assetsTracker = AssetsTracker.getInstance();
    const gltf = modelData.sourceModel;
    for (let i = 0; i < count; i++) {
        const clone = gltf.clone(true);
        const parentRecord = assetsTracker.modelsMap[modelData.name];
        const cloneIndex = parentRecord.shallowCloneCount++;
        const cloneName = `${modelData.name}ShallowClone${cloneIndex}`;
        clone.name = cloneName;
        const id = generateUniqueId();
        const trackedData = {
            parentId: modelData.id,
            parentName: modelData.name,
            modelId: id,
            modelRef: clone,
        };
        assetsTracker.setCloneModel(trackedData, "ShallowClone");
    }
}
export function SkeletonClone(modelData, count, deepClone = false, cloneGeometry = false) {
    const assetsTracker = AssetsTracker.getInstance();
    const gltf = modelData.sourceModel;
    for (let i = 0; i < count; i++) {
        // 🦴 Step 1: Clone model with skeleton properly
        const clone = skeletonClone(gltf);
        // 🎭 Step 2: If deepClone === true, also clone materials, textures, etc.
        if (deepClone) {
            clone.traverse((node) => {
                if (node.isMesh) {
                    // OPTIONAL independent geometry cloning
                    if (cloneGeometry) {
                        const newGeo = node.geometry.clone();
                        newGeo.uuid = MathUtils.generateUUID();
                        node.geometry = newGeo;
                    }
                    // Deep clone materials ONLY if requested
                    if (deepClone) {
                        node.material = Array.isArray(node.material)
                            ? node.material.map((mat) => mat.clone())
                            : node.material.clone();
                        // Clone textures if they support clone()
                        if (node.material.map?.clone)
                            node.material.map = node.material.map.clone();
                        if (node.material.normalMap?.clone)
                            node.material.normalMap = node.material.normalMap.clone();
                    }
                }
            });
        }
        // 🔠 Naming + tracking
        const parentRecord = assetsTracker.modelsMap[modelData.name];
        const cloneIndex = parentRecord.skeletonCloneCount++;
        const cloneName = `${modelData.name}SkeletonClone${cloneIndex}`;
        clone.name = cloneName;
        // 🎬 Clone animation mixer/actions for this instance
        const animData = loadCloneAnimations(modelData.animations, clone);
        const id = generateUniqueId();
        const trackedData = {
            parentId: modelData.id,
            parentName: modelData.name,
            modelId: id,
            modelRef: clone,
            mixerRef: animData?.mixer ?? null,
            actionsRef: animData?.actions ?? null,
        };
        // 🧾 Store cloned model
        assetsTracker.setCloneModel(trackedData, "SkeletonClone");
    }
}
export function CloneModels(cloneRequest, id) {
    const assetsTracker = AssetsTracker.getInstance();
    const modelData = assetsTracker.getModel(id, false);
    switch (cloneRequest.methods) {
        case "DeepClone": {
            DeepClone(modelData, cloneRequest.count);
            break;
        }
        case "ShallowClone": {
            ShallowClone(modelData, cloneRequest.count);
            break;
        }
        case "SkeletonClone": {
            SkeletonClone(modelData, cloneRequest.count);
            break;
        }
    }
}
export function generateUniqueId() {
    const timePart = Date.now();
    const randomPart = Math.floor(Math.random() * 10000);
    return Number(`${timePart}${randomPart.toString().padStart(4, "0")}`);
}
function loadCloneAnimations(sourceAnimations, clone) {
    if (!sourceAnimations || sourceAnimations.length === 0)
        return null;
    const mixer = new AnimationMixer(clone);
    const actions = {};
    for (const clip of sourceAnimations) {
        actions[clip.name] = mixer.clipAction(clip);
    }
    return { mixer, actions };
}
//# sourceMappingURL=helperModules.js.map