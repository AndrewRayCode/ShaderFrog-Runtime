# Problem

THREE.js does not have a defined shader format for sharing raw GLSL shader code to load into a [`RawShaderMaterial`](http://threejs.org/docs/#Reference/Materials/RawShaderMaterial). This format is also what is currently used by the [ShaderFrog](http://shaderfrog.com) runtime, found in this repository. [ShaderFrog](http://shaderfrog.com) requires a format to make shaders portable to the end user. This document suggests such a format.

This proposed format has some main pragmatic goals:
 - Provide a way to identify a shader when used in the end user's application;
 - Document the uniforms and their types used in the shader. This prevents the end user needing to duplicate uniform types in their implementation of the shader. For example, a user having to type `material.uniforms.color = { type: 'c' }` is redundant, since [ShaderFrog](http://shaderfrog.com) already knows that the `color` uniform is a [`THREE.Color`](http://threejs.org/docs/#Reference/Math/Color).

# Proposed Format

An incomplete example can be found at [Reflection_Cube_Map.json](https://github.com/AndrewRayCode/ShaderFrog-Runtime/blob/master/example/Reflection_Cube_Map.json). The format is described with comments below.

The suggested format is a valid JSON file. It contains no executable Javascript as is not loaded via JSONP. Example data is included with each key as well as if the key is required or not.

#### Identifier

    (optional int)     "id":   84,
    (required string)  "name": "Reflection Cube Map",

At runtime, [ShaderFrog](http://shaderfrog.com) needs a way to identifier shaders. The `id` is provided for convenience in case the user has to load different shaders that have the same name (unlikely).

#### Raw GLSL code

    (required string)  "fragment": "precision highp float;\n...",
    (required string)  "vertex": "precision highp float;\n...",

Three.js [`RawShaderMaterial`](http://threejs.org/docs/#Reference/Materials/RawShaderMaterial) does not have a default fragment nor vertex program, so both programs are required.

#### Uniforms

Uniforms are stored as a dictionary with the uniform name as the key.

    "uniforms": { ... }

An example uniform:

    "cameraPosition": {
        (required string)  "type":        "v3",
        (required any)     "value":       serialized default value,
        (optional string)  "glslType":    "vec3",
        (optional string)  "name":        "cameraPosition",
        (optional string)  "description": "A description"
    },

Both the `type` and the `glslType` are known to [ShaderFrog](http://shaderfrog.com) when editing the shader. Three.js requires passing `glslType` in the [`RawShaderMaterial`](http://threejs.org/docs/#Reference/Materials/RawShaderMaterial) uniform, as in `material.uniforms.num = { type: 'f', value: 0 };`

The `type` is provided as a convenience, and is specific to Three.js. For example, in a shader, a `vec3` is always a `vec3`. In Three.js you can pass in either a [Three.Color](http://threejs.org/docs/#Reference/Math/Color) or a [Three.Vector3](http://threejs.org/docs/#Reference/Math/Vector3). In the user's application, this matters because if you need to manipulate the uniform at runtime, colors and vector3s have different convenience methods for manipulation.

#### Uniform Value

Shaders should ship with default values to minimize the amount of code the user has to write. Coming from [ShaderFrog](http://shaderfrog.com), default values exist for every uniform. **This requires serialization of Three.js types**. Below is an incomplete list of mappings to Three.js types.

**vec3 (THREE.Color)**

    "value": {
        "r": 1,
        "g": 1,
        "b": 1
    },

**vec2 (THREE.Vector2)**

    "value": {
        "x": 0,
        "y": 0
    },

**vec3 (THREE.Vector3)**

    "value": {
        "x": 0,
        "y": 0,
        "z": 0
    },

**vec4 (THREE.Vector4)**

    "value": {
        "x": 0,
        "y": 0,
        "z": 0,
        "w": 0
    },

**samplerCube (Three.TextureCube)** often used for reflection shaders (incomplete)

    "value": {
        "image": "nissi_beach.jpg",
        "name": "Nissi Beach",
        "description": "Nissi Beach",
        "isSamplerCube": true
    },

**samplerCube (Three.CubeCamera)** for real-time reflections

    "value": {
        "isCubeCamera": true
    },

**sampler2D (Three.Texture)**

    "value": {
        "image": "http://full-path-to-img.extension",
    },

**mat3, mat4**

    TODO

The following use literals in JSON to represent their values:

 - float (Number)
 - int (Number)
