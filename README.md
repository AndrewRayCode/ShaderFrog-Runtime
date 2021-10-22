![ShaderFrog logo](https://s3-us-west-1.amazonaws.com/shader-frog/shader-frog-matte-black.png)

**Please file [ShaderFrog.com](http://shaderfrog.com) bugs here!**

# Deprecation Notice: State of ShaderFrog

The current ShaderFrog site and engine is in maintenence mode only. The core
engine and compiler are buggy and I haven't actively developed on the current
version of ShaderFrog in several years now. Due to buggy and fundamentally
flawed core nature of ShaderFrog, I'm no longer actively working on it. I
apologize for any frustration the bugs or lack of support have caused to your
development process.

Instead, I'm working on a new version of the algorithm, Shaderfrog 2.0, starting with a
ground up build of a [GLSL compiler](https://www.npmjs.com/package/@shaderfrog/glsl-parser). I post updates when I have them [as @andrewray on Twitter](https://twitter.com/andrewray)
if you want to follow along. There is no ETA on a new launch date. As of October
2021, I've made significant progress on ShaderFrog 2.0, and I hope to keep
posting regular updates and share demos as soon as I have them.

# ShaderFrog Runtime Library

This is a utility library to load and update [ShaderFrog.com](http://shaderfrog.com) shaders into your THREE.js scene or application.

## Demo

[**Online Demo**](http://shaderfrog.com/runtime/index.html)

Demo source found in the [example/](https://github.com/AndrewRayCode/ShaderFrog-Runtime/tree/master/example) folder.

## Usage

### npm

    npm install --save shaderfrog-runtime

    var ShaderFrogRuntime = require( 'shaderfrog-runtime' ):

### Vanilla JavaScript

Download the [built Javascript file](http://shaderfrog.com/runtime/shaderfrog-runtime.min.js) and include it in your project *after* THREE.js:

    <script src="shaderfrog-runtime.min.js"></script>

### Instantiation

Instantiate a new runtime:

    var runtime = new ShaderFrogRuntime();

Instantiate a new clock:

    var clock = new THREE.Clock();

Load your desired shader, and assign it to a material:

    runtime.load( 'Your_Shader.json', function( shaderData ) {

        // Get the Three.js material you can assign to your objects
        var material = runtime.get( shaderData.name );

        // Assign it to your objects
        mesh.material = material;
    });

In your initialization code, register the main camera, which is the one that you call `renderer.render( scene, camera )` with:

    runtime.registerCamera( camera );

This tells the ShaderFrog runtime how to update the `cameraPosition` uniform, which some shaders use to calculate things based on the camera, like reflection.

In your animation loop, update the running shaders that the ShaderFrog runtime knows about:

    runtime.updateShaders( clock.getElapsedTime() );

A full example can be found in the [example/](https://github.com/AndrewRayCode/ShaderFrog-Runtime/tree/master/example) folder.

## API

**Warning:** This API is volatile and subject to change in future versions.

#### `runtime.registerCamera( THREE.Camera camera )`

Tells the runtime to use this camera's position for the default `cameraPosition` uniform. This uniform is normally passed by  default in THREE.js to shader materials, but ShaderFrog shaders use the RawSahderMaterial class.

#### `runtime.updateShaders( Float time )`

Update uniform values for shaders, specifically `float time`, `vec3 cameraPosition`, and `mat4 viewMatrix`. The only uniform the runtime cannot define is `time` which should be provided by the elapsed time in milliseconds. [THREE.Clock.getElapsedTime()](http://threejs.org/docs/#Reference/Core/Clock) provies this value.

#### `runtime.load( [ String source | Array sources ], Function callback )`

Call this function with either:

    runtime.load( 'material.json', function( material ) ) {
        var shader = runtime.get( material.name ); ...
    }

...for one material, or...

    runtime.load( [  'material1.json', 'material2.json' ], function( materials ) ) {
        var shader = runtime.get( materials[ 0 ].name ); ...
    }

Load the specified URLs and parse them into materials. If you pass in an array of URLs, the callback receives an array of materials in the same order you specified.

#### `runtime.add( String name, Object shader )`

If your shader data is already loaded in JSON form by some other means, you can add it to the runtime's repository of known shaders with this method.

#### `runtime.get( String name )`

The ShaderFrog runtime stores materials by name. This function returns a **new instance** of the material you have loaded. You can assign this new material to your object, update uniforms on it, etc.

## Proposed Shader Format

[ShaderFrog](http://shaderfrog.com) requires a shader file format to transfer all neccessary shader data from the editor to the end user. A proposed JSON format is discussed in [THREE_SHADER_FORMAT.md](https://github.com/AndrewRayCode/ShaderFrog-Runtime/blob/master/THREE_SHADER_FORMAT.md).

## Development

To install the dependencies:

    git clone https://github.com/AndrewRayCode/ShaderFrog-Runtime
    npm install

To build the distributable Javascript file:

    npm run build
