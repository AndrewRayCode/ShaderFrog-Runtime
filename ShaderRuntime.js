import THREE from 'three';

let ShaderRuntime = module.exports = function() {};

let defaultThreeUniforms = [
    'normalMatrix', 'viewMatrix', 'projectionMatrix', 'position', 'normal',
    'modelViewMatrix', 'uv', 'uv2', 'modelMatrix'
];

ShaderRuntime.prototype = {

    mainCamera: null,
    cubeCameras: {},

    reserved: { time: null, cameraPosition: null },

    umap: {
        float: { type: 'f', value: 0 },
        int: { type: 'i', value: 0 },
        vec2: { type: 'v2', value: function() { return new THREE.Vector2(); } },
        vec3: { type: 'v3', value: function() { return new THREE.Vector3(); } },
        vec4: { type: 'v4', value: function() { return new THREE.Vector4(); } },
        samplerCube: { type: 't' },
        sampler2D: { type: 't' }
    },

    load: function( source, callback ) {

        let loader = new THREE.XHRLoader();
        loader.load( 'http://andrewray.me/stuff/Reflection_Cube_Map.json', ( json ) => {
            let parsed;
            try {
                parsed = JSON.parse( json );
                delete parsed.id; // Errors if passed to rawshadermaterial :(
            } catch( e ) {
                throw new Error( 'Could not parse this shader! Please verify the URL is correct.' );
            }
            this.add( parsed.name, parsed );
            callback( parsed );
        });

    },

    _parseRawShader: function( shader ) {

        let src = shader.fragmentShader + '\n' + shader.vertexShader,
            typed = this.parseMembers( src ),
            uniforms = clone( shader.uniforms || {} ),
            attributes = clone( shader.attributes || {} ),
            camera;

        for( let key in shader.uniforms ) {

            if( typeof uniforms[ key ] === 'string' ) {

                if( !( camera = ( this.cubeCameras[ key ] || this.mainCamera ) ) ) {
                    throw new Error( 'Camera not found: ' + uniforms[ key ] );
                }

                uniforms[ key ] = {
                    type: 't',
                    value: camera.renderTarget
                };

            } else {

                if( !typed.uniforms[ key ] ) {
                    console.warn( 'Tried to parse a shader but did not find key: ',key,' in ',typed.uniforms,shader );
                }

                uniforms[ key ] = shader.uniforms[ key ];
                //{
                //    value: shader.uniforms[ key ],
                //    type: typed.uniforms[ key ].type
                //};

                if( uniforms[ key ].value instanceof THREE.Color ) {
                    uniforms[ key ].type = 'c';
                }

            }
        }

        uniforms.cameraPosition = {
            type: 'v3',
            value: new THREE.Vector3( 0, 0, 0 )
        };

        // Copy the entire shader for things like side in the config
        return extend( clone( shader ), {
            uniforms: uniforms,
            attributes: attributes
        } );

    },
    
    add: function( shaderName, config ) {

        let newData = clone( config );
        newData.fragmentShader = config.fragment;
        newData.vertexShader = config.vertex;
        delete newData.fragment;
        delete newData.vertex;
        this.shaderTypes[ config.name ] = newData;

    },

    updateRuntime: function( name, data ) {

        this.shaderTypes[ name ].uniforms = data.uniforms;

        let shader, x, uniformName, uniform;

        // This loop does not appear to be a slowdown culprit
        for( x = 0; shader = this.runningShaders[ x++ ]; ) {
            if( shader.name === name ) {
                for( uniformName in data.uniforms ) {

                    if( uniformName in this.reserved ) {
                        continue;
                    }

                    if( uniformName in shader.material.uniforms ) {

                        uniform = data.uniforms[ uniformName ];

                        // this is nasty, since the shader serializes
                        // CubeCamera model to string. Maybe not update it at
                        // all?
                        if( uniform.type === 't' && typeof uniform.value === 'string' ) {
                            uniform.value = this.cubeCameras[ uniform.value ].renderTarget;
                        }

                        shader.material.uniforms[ uniformName ].value = data.uniforms[ uniformName ].value;
                    }
                }
            }
        }

    },

    renameShader: function( oldName, newName ) {

        let x, shader;

        if( !( oldName in this.shaderTypes ) ) {
            throw new Error("Could not rename shader that doesn't exist.");
        }

        this.shaderTypes[ newName ] = this.shaderTypes[ oldName ];
        delete this.shaderTypes[ oldName ];

        for( x = 0; shader = this.runningShaders[ x++ ]; ) {
            if( shader.name === oldName ) {
                shader.name = newName;
            }
        }

    },

    updateSource: function( name, config ) {

        if( !this.shaderTypes[ name ] ) {
            throw new Error( 'Runtime Error: Cannot update shader ' + name + ' because it has not been added.');
        }

        let massagedOptions = extend( {}, config, this._parseRawShader( config ) );

        extend( this.shaderTypes[ name ], massagedOptions );

        let shader, x;

        for( x = 0; shader = this.runningShaders[ x++ ]; ) {
            if( shader.name === name ) {
                extend( shader.material, massagedOptions );
                shader.material.needsUpdate = true;
            }
        }

    },

    get: function( name ) {

        let shaderType = this.shaderTypes[ name ];

        if( !shaderType.initted ) {

            this.create( name );
        }

        return shaderType.material;

    },

    create: function( name ) {

        let shaderType = this.shaderTypes[ name ];

        shaderType.material = new THREE.RawShaderMaterial( shaderType );

        this.runningShaders.push( shaderType );

        shaderType.init && shaderType.init( shaderType.material );
        shaderType.material.needsUpdate = true;

        shaderType.initted = true;

        return shaderType.material;

    },

    registerCamera: function( camera ) {

        if( !( camera instanceof THREE.Camera ) ) {
            throw new Error( 'Cannot register a non-camera as a camera!' );
        }

        this.mainCamera = camera;

    },

    registerCubeCamera: function( name, camera ) {

        if( !camera.renderTarget ) {
            throw new Error( 'Cannot register a non-camera as a camera!' );
        }

        this.cubeCameras[ name ] = camera;

    },

    unregisterCamera: function( name ) {

        if( name in this.cubeCameras ) {

            delete this.cubeCameras[ name ];
            
        } else if( name === this.mainCamera ) {

            delete this.mainCamera;

        } else {

            throw new Error( 'You never registered camera ' + name );

        }

    },

    parseMembers: function( src ) {
        let regex = /\s*(uniform|attribute)\s+(\w+)\s+(\w+)\s*;/gm,
            expandedSrc = src.replace(/;g/, ';\n' ),
            members = {
                uniforms: {},
                attributes: {}
            },
            match, mapped;

        while ( (match = regex.exec( expandedSrc )) !== null ) {
            mapped = extend( {}, this.umap[ match[ 2 ] ] );

            if( mapped.value && typeof mapped.value === 'function' ) {
                mapped.value = mapped.value();
            } else if( !( 'value' in mapped ) ) {
                mapped.value = null;
            }

            members[ match[ 1 ] + 's' ][ match[ 3 ] ] = mapped;
        }

        // Defaults
        members.uniforms.mouse = {
            value: new THREE.Vector2( 10, 10 ),
            type: 'v2'
        };

        members.uniforms.opacity = {
            type: 'f',
            value: 1
        };

        return members;
    },

    // Update global shader uniform values
    updateShaders: function( time, obj ) {

        let shader, x;

        obj = obj || {};

        for( x = 0; shader = this.runningShaders[ x++ ]; ) {

            for( let uniform in obj.uniforms ) {
                if( uniform in shader.material.uniforms ) {
                    shader.material.uniforms[ uniform ].value = obj.uniforms[ uniform ];
                }
            }

            if( 'cameraPosition' in shader.material.uniforms && this.mainCamera ) {

                shader.material.uniforms.cameraPosition.value = this.mainCamera.position.clone();

            }

            if( 'viewMatrix' in shader.material.uniforms && this.mainCamera ) {

                shader.material.uniforms.viewMatrix.value = this.mainCamera.matrixWorldInverse;

            }

            if( 'time' in shader.material.uniforms ) {

                shader.material.uniforms.time.value = time;

            }

        }

    },

    shaderTypes: {},

    runningShaders: []

};

function extend() {
    let length = arguments.length,
        obj = arguments[ 0 ];

    if( length < 2 ) {
        return obj;
    }

    for( let index = 1; index < length; index++ ) {
        let source = arguments[ index ],
            keys = Object.keys( source || {} ),
            l = keys.length;
        for( let i = 0; i < l; i++ ) {
            let key = keys[i];
            if( obj[ key ] === void 0 ) obj[ key ] = source[ key ];
        }
    }

    return obj;
}

function clone( obj ) {
    return extend( {}, obj );
}

export default ShaderRuntime;
