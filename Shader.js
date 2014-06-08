(function() {

var Shader = this.shader = function() {
    this.cache = [];
};

Shader.prototype = {

    constructor: Shader,

    load: function() {
        var me = this;

        _.each( me.shaders, function( _fn, shaderName ) {
            var container = document.getElementById('#' + shaderName),
                shader = {
                    fragment: container.querySelectorAll('script[type="x-shader/x-fragment"]').innerText,
                    vertex: container.querySelectorAll('script[type="x-shader/x-vertex"]').innerText
                };

            if( !(shader.fragment && shader.vertex) ) {
                throw 'Shader ' + shaderName + ' could not be loaded! Please make sure it is in the DOM.';
            }

            shader.src = shader.fragment + '\n' + shader.vertex;
            _.extend( shader, me.parseMembers( shader.src ) );

            me.shaders[ shaderName ] = function() {
                var args = Array.prototype.slice( arguments, 0 ),
                    material;

                shader.uniforms = THREE.UniformsUtils.clone( shader.uniforms );

                args = [ shader ].concat( args );
                material = _fn.apply( me, args );

                _.each( material.uniforms, function( uniform, key ) {
                    if( uniform.value instanceof THREE.Color ) {
                        material.uniforms[ key ].type = 'c';
                    }
                });

                me.cache.push( material );

                return material;
            };
        });
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
            mapped = $.extend( {}, this.umap[ match[ 2 ] ] );

            if( mapped.value && typeof mapped.value === 'function' ) {
                mapped.value = mapped.value();
            } else if( !( 'value' in mapped) ) {
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

    cache: {},

    shaders: {}
};

}());
