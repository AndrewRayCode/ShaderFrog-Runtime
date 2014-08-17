(function() {

var Shader = this.Shader = {
    
    add: function( shaderName, config ) {

        var me = this;

        me.shaders[ shaderName ] = function() {

            // Pull out any hard coded strings if we have them
            //for( var uType in config.uniforms ) {
                //if( config.uniforms[ uType ] === 'mirror' ) {
                    //config.uniforms[ uType ] = me.mirror.renderTarget;
                //}
            //}

            //var baseUniforms = THREE.UniformsUtils.clone( config.uniforms ),
                //baseAttributes = THREE.UniformsUtils.clone( config.attributes ),
            var src = config.fragment + '\n' + config.vertex,
                typed = me.parseMembers( src ),
                uniforms = _.clone( config.uniforms || {} ),
                attributes = _.clone( config.attributes || {} );

            for( var key in config.uniforms ) {

                if( uniforms[ key ] === 'mirror' ) {

                    uniforms[ key ] = {
                        type: 't',
                        value: me.mirror.renderTarget
                    };

                } else {

                    uniforms[ key ] = {
                        value: config.uniforms[ key ],
                        type: typed.uniforms[ key ].type
                    };

                    if( uniforms[ key ].value instanceof THREE.Color ) {
                        uniforms[ key ].type = 'c';
                    }

                }
            }

            uniforms.viewVector = {
                type: 'v3',
                value: new THREE.Vector3(0,0,0)
            };

            var shaderData = {
                uniforms: uniforms,
                attributes: attributes,
                fragmentShader: config.fragment,
                vertexShader: config.vertex
            };

            if( 'transparent' in config ) {
                shaderData.transparent = config.transparent;
            }

            var material = new THREE.ShaderMaterial( shaderData );
            material.name = shaderName;
            me.cache.push( material );

            if( config.init ) {
                config.init( material );
                material.needsUpdate = true;
            }

            return material;

        };

    },

    registerMirror: function( mirror ) {
        this.mirror = mirror;
    },

    umap: {
        float: { type: 'f', value: 0 },
        int: { type: 'i', value: 0 },
        vec2: { type: 'v2', value: function() { return new THREE.Vector2(); } },
        vec3: { type: 'v3', value: function() { return new THREE.Vector3(); } },
        vec4: { type: 'v4', value: function() { return new THREE.Vector4(); } },
        samplerCube: { type: 't' },
        sampler2D: { type: 't' }
    },

    parseMembers: function( src ) {
        var regex = /^\s*(uniform|attribute)\s+(\w+)\s+(\w+)\s*;$/gm,
            members = {
                uniforms: {},
                attributes: {}
            },
            match, mapped;

        while ( (match = regex.exec( src )) !== null ) {
            mapped = _.extend( {}, this.umap[ match[ 2 ] ] );

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
            type:'v2'
        };

        members.uniforms.opacity = {
            type: 'f',
            value: 1
        };

        return members;
    },

    // Update global shader uniform values
    updateShaders: function( obj ) {

        _.each( Shader.cache, function( shader, name ) {
            if( obj.uniforms ) {
                for( var uniform in obj.uniforms ) {
                    if( uniform in shader.uniforms ) {
                        shader.uniforms[ uniform ].value = obj.uniforms[ uniform ];
                    }
                }
            }
        });

    },

    cache: [],

    shaders: {}
};

}());
