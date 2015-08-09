var camera, cubeCamera, scene, renderer, geometry, mesh, cubeCamera, leftSphere, rightSphere;

var runtime = new ShaderFrogRuntime();

var clock = new THREE.Clock();

// shaderfrog loading
runtime.load( 'http://andrewray.me/stuff/Reflection_Cube_Map.json', function( shaderData ) {
    var material = runtime.get( shaderData.name );
    mesh.material = material;
    material.uniforms.reflectionSampler.value = cubeCamera.renderTarget;
    material.needsUpdate = true;
});

init();
animate();

function init() {

    scene = new THREE.Scene();

    // Cameras
    camera = new THREE.PerspectiveCamera( 50, window.innerWidth / window.innerHeight, 1, 10000 );
    camera.position.z = 100;
    scene.add( camera );
    runtime.registerCamera( camera );

    cubeCamera = new THREE.CubeCamera( 0.1, 10000, 128 );
    scene.add( cubeCamera );

    // Main object
    geometry = new THREE.SphereGeometry( 20, 10, 10 );
    mesh = new THREE.Mesh( geometry );
    scene.add( mesh );

    // Decorative objects
    var other = new THREE.SphereGeometry( 10, 20, 50, 50 );
    leftSphere = new THREE.Mesh(other, new THREE.MeshBasicMaterial({
        color: 0xff0000
    }));
    leftSphere.position.x -= 45;
    scene.add(leftSphere);
    
    var cyl = new THREE.CylinderGeometry( 1, 1, 100, 5 );
    var cylMesh =  new THREE.Mesh(cyl, new THREE.MeshBasicMaterial({
        color: 0x0044ff
    }));
    cylMesh.position.x += 45;
    scene.add(cylMesh);
    
    var cyl2 = new THREE.CylinderGeometry( 1, 1, 100, 5 );
    var cylMesh2 =  new THREE.Mesh(cyl2, new THREE.MeshBasicMaterial({
        color: 0x0044ff
    }));
    cylMesh2.position.x -= 45;
    scene.add(cylMesh2);
    
    var other2 = new THREE.SphereGeometry( 10, 20, 50, 50 );
    rightSphere = new THREE.Mesh(other2, new THREE.MeshBasicMaterial({
        color: 0x00ff00
    }));
    rightSphere.position.x += 45;
    scene.add(rightSphere);

    renderer = new THREE.WebGLRenderer();
    renderer.setSize( window.innerWidth, window.innerHeight );

    document.body.appendChild( renderer.domElement );

}

function animate() {

    requestAnimationFrame( animate );
    render();

}

function render() {

    mesh.rotation.x += 0.01;
    mesh.rotation.y += 0.02;

    var time = clock.getElapsedTime();

    runtime.updateShaders( time );
    
    leftSphere.position.y = 40 * Math.sin( new Date() * 0.001 );
    rightSphere.position.y = -40 * Math.sin( new Date() * 0.001 );

    mesh.visible = false;
    cubeCamera.updateCubeMap( renderer, scene );
    mesh.visible = true;
    
    renderer.render( scene, camera );

}
