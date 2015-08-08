import THREE from 'three';

var ShaderRuntime = module.exports = function() {};

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

        var loader = new THREE.XHRLoader();
        loader.load( 'http://andrewray.me/stuff/Reflection_Cube_Map.json', function( json ) {
            this.add( json.name, json );
        });

    },

    _parseRawShader: function( shader ) {

        var src = shader.fragmentShader + '\n' + shader.vertexShader,
            typed = this.parseMembers( src ),
            uniforms = clone( shader.uniforms || {} ),
            attributes = clone( shader.attributes || {} ),
            camera;

        for( var key in shader.uniforms ) {

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

        var shaderData = extend({
            fragmentShader: config.fragmentShader,
            vertexShader: config.vertexShader
        }, this._parseRawShader( config ) );

        if( 'transparent' in config ) {
            shaderData.transparent = config.transparent;
        }

        shaderData.name = shaderName;
        this.shaderTypes[ shaderName ] = shaderData;

    },

    updateRuntime: function( name, data ) {

        try {
        this.shaderTypes[ name ].uniforms = data.uniforms;
        } catch( e) {
            //debugger;
        }

        var shader, x, uniformName, uniform;

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

        var x, shader;

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

        var massagedOptions = extend( {}, config, this._parseRawShader( config ) );

        extend( this.shaderTypes[ name ], massagedOptions );

        var shader, x;

        for( x = 0; shader = this.runningShaders[ x++ ]; ) {
            if( shader.name === name ) {
                extend( shader.material, massagedOptions );
                shader.material.needsUpdate = true;
            }
        }

    },

    get: function( name ) {

        var shaderType = this.shaderTypes[ name ];

        if( !shaderType.initted ) {

            this.create( name );
        }

        return shaderType.material;

    },

    create: function( name ) {

        var shaderType = this.shaderTypes[ name ];

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
        var regex = /\s*(uniform|attribute)\s+(\w+)\s+(\w+)\s*;/gm,
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

        var shader, x;

        obj = obj || {};

        for( x = 0; shader = this.runningShaders[ x++ ]; ) {

            for( var uniform in obj.uniforms ) {
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
    var length = arguments.length,
        obj = {};

    if( length < 2  ) {
        return obj;
    }

    for( var index = 1; index < length; index++ ) {
        var source = arguments[ index ],
            keys = Object.keys( source ),
            l = keys.length;
        for( var i = 0; i < l; i++ ) {
            var key = keys[i];
            if( obj[ key ] === void 0 ) obj[ key ] = source[ key ];
        }
    }

    return obj;
}

function clone( obj ) {
    return extend( {}, obj );
}

if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
    module.exports = ShaderRuntime;
}
