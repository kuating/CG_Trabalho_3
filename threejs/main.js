// Rotation around point logic
// Based on https://stackoverflow.com/questions/42812861/three-js-pivot-point/42866733#42866733

THREE.Object3D.prototype.savePosition = function() {
    return function () {
        this.__position = this.position.clone();

        return this;
    }
}();

THREE.Object3D.prototype.rotateAroundPoint = function() {
    return function (point, theta, axis, pointIsWorld = false) {
    // point: Vector3 -  center of rotation
    // theta: float - rotation angle (in radians)
    // axis: Vector 3 - axis of rotation
    // pointIsWord: bool
        if(pointIsWorld){
            this.parent.localToWorld(this.position); // compensate for world coordinate
        }

        this.position.sub(point); // remove the offset
        this.position.applyAxisAngle(axis, theta); // rotate the POSITION
        this.position.add(point); // re-add the offset

        if(pointIsWorld){
            this.parent.worldToLocal(this.position); // undo world coordinates compensation
        }

        this.rotateOnAxis(axis, theta); // rotate the OBJECT

        return this;
    }

}();


// ThreeJS variables
var camera, scene, renderer;
// OrbitControls (camera)
var controls;
// Optional (showFps)
var stats;
// Objects in Scene
var sun, earth;
// To be added
var moon;
// Light in the scene
var sunlight;

// The time (in seconds) it takes for the Earth to finish 1 translation cycle
const earth_translation_time = 10;

var earth_trans_speed;
var earth_rot_speed;
var moon_trans_speed;
var moon_rot_speed;


function init() {
    // Setting up renderer
    renderer = new THREE.WebGLRenderer({ antialias: true });
    window.addEventListener('resize', onWindowResize, false);
    renderer.setSize(window.innerWidth, window.innerHeight);

    // Setting up camera
    camera = new THREE.PerspectiveCamera( 60, window.innerWidth / window.innerHeight, 0.5, 1000 );
    camera.position.z = 3;
    camera.position.y = 20;
    camera.lookAt( 0, 0, -4);


    // Setting up scene
    scene = new THREE.Scene();

    // Moon
    moon = createSphere(0.26, 20, 'texture/moon.jpg', 'Phong');
    moon.position.z = -1;

    // Earth
    earth = createSphere(0.4, 20, 'texture/earth.jpg', 'Phong');
    earth.position.z = -12;
    earth.add(moon)

    // Sun (Sphere + Light)
    sun = createSphere(2, 20, 'texture/sun.jpg');
    sun.position.z = 0;

    sun.add(earth)

    // Complete: add light
    sunlight = new THREE.PointLight( 0xffffff, 1.5, 100 );
    sun.add( sunlight );

    scene.add(sun);

    let earth_pos = new THREE.Vector3(earth.position.x, earth.position.y, earth.position.z);
    let sun_pos = new THREE.Vector3(sun.position.x, sun.position.y, sun.position.z);
    const earth_to_sun_distance = (earth_pos.sub(sun_pos)).length();

    earth_trans_speed = 2 * Math.PI  / earth_translation_time; // angular velocity
    earth_rot_speed = earth_trans_speed * 365;
    moon_trans_speed = 0.06;
    moon_rot_speed = moon_trans_speed;

    // Adding both renderer and stats to the Web page, also adjusting OrbitControls
    stats = new Stats();
    document.body.appendChild(renderer.domElement);
    document.body.appendChild(stats.dom);
    controls = new THREE.OrbitControls( camera, renderer.domElement );
    controls.zoomSpeed = 2;

    // Adding listener for keydown
    document.addEventListener("keydown", onDocumentKeyDown, false);

    // Saving initial position (necessary for rotation solution)
    scene.traverse( function( node ) {
        if ( node instanceof THREE.Object3D ) {
            node.savePosition();
        }

    } );
}

function onWindowResize() {

    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);

}

function onDocumentKeyDown(event) {
}

const axis = new THREE.Vector3(0,1,0);

var last_time = 0;
var dt = 0;
function animate(time = 0) {
    dt = (time - last_time) / 1000;
    last_time = time;

    // var origin = new THREE.Vector3(sun.position.x, sun.position.y, sun.position.z);
    var origin = new THREE.Vector3(0, 0, 0);


	// required if controls.enableDamping or controls.autoRotate are set to true
	controls.update();

    stats.update();
    renderer.render( scene, camera );

    //Earth's translation
    var value = earth_trans_speed * dt;
    earth.rotateAroundPoint(origin, value, axis);

    //cancelling out the change in Earth's orientation that comes with the above
    // earth.rotateY(earth_rot_speed - earth_trans_speed);

    //Earth's Rotation
    // earth.rotateY(earth_rot_speed);

    // this prints the time in seconds % cycle time
    // console.log(((time/1000) % earth_translation_time).toFixed(2));
    requestAnimationFrame( animate );
}


init();
animate();


function createSphere(radius, segments, texture_path, type = 'Basic') {
    var sphGeom = new THREE.SphereGeometry(radius, segments, segments);
    const loader = new THREE.TextureLoader();
    const texture = loader.load(texture_path);
    if(type == 'Phong') {
        var sphMaterial = new THREE.MeshPhongMaterial({
            map: texture
        });
    }
    else {
        var sphMaterial = new THREE.MeshBasicMaterial({
            map: texture
        });
    }
    var sphere = new THREE.Mesh(sphGeom, sphMaterial);

    return sphere;
}
