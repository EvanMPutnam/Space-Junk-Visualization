
//http://browserify.org/ this bundles this guy into an app.  This is where my build a build script comes in.

/**
 * npm init --y
 * npm install --save-dev library       three or satellite.js
 * npm install -g browserify
 * browserify template.js -o index.js
 * 
 * 
 * 
 * 
 * TODO: we need to figure out how the heck
 */
const three = require("three")
const sat = require("satellite.js")
const $ = require("jquery")



const WIDTH = window.innerWidth
const HEIGHT = window.innerHeight

const VIEW_ANGLE = 45
const ASPECT_RATIO = WIDTH/HEIGHT
const NEAR = 0.1;
const FAR = 10000;

var xSpeed = .005;
var ySpeed = .005;

var clicked = false


var camera, renderer, scene, ambientLight
var earth
var currentlyUpdating = false

var raycaster = new three.Raycaster()
var mouse = new three.Vector2()

var satellites = null

init()


/**
 * Updates the satellite positions using satellite.js
 */
function updateStarField(){
    const currentDate = new Date()
    for(var vert in satellites.children){
        vert = satellites.children[vert]
        const positionAndVelocity = sat.propagate(vert.sat_rec, currentDate)
        const position = positionAndVelocity.position
        if(position != null){
            vert.position.x = position.x/10
            vert.position.y = position.y/10
            vert.position.z = position.z/10
        }
    }
    // for(var vert in particleSystem.geometry.vertices){
    //     vertice = particleSystem.geometry.vertices[vert]
    //     const positionAndVelocity = sat.propagate(vertice.sat_rec, currentDate)
    //     const position = positionAndVelocity.position
    //     if(position != null){
    //         vertice.x = position.x/10
    //         vertice.y = position.y/10
    //         vertice.z = position.z/10
            
    //     }

    // }

    currentlyUpdating = false
}



/**
 * Creates the initial satellite positions from 
 * tle's from the flask server.
 * @param {json object returned with tle items} star_json 
 */
function generateField(star_json){

    //Current date
    startDate = new Date()
    //This geometry is the "shape"
    var geometry = new three.Geometry()


    satellites = new three.Group()

    //Adding "vertices" as the satellite object in the shape.
    //This keeps things efficient.
    var material = new three.MeshBasicMaterial( {color: 0xffffff} );

    for(var key in star_json['satellites']){
        
        //Pull tle from json data
        const line1 = star_json['satellites'][key]["line1"]
        const line2 = star_json['satellites'][key]["line2"]
        //Get base data
        const sat_rec = sat.twoline2satrec( line1, line2 )
        const positionAndVelocity = sat.propagate(sat_rec, startDate)
        const position = positionAndVelocity.position
        //Sometimes position gen fails. Not sure the reason yet.
        if(position != null){
            //Scale things down in the view by factor of 10
            const x = position.x/10
            const y = position.y/10
            const z = position.z/10
            //Key helpful in identification
            const star_name = key
            //geometry.vertices.push(star)//Uncomment

            var geometry = new three.SphereBufferGeometry(5, 2, 2);
            
            var sphere = new three.Mesh(geometry, material);
            sphere.position.set(x, y, z)
            sphere.sat_rec = sat_rec

            satellites.add(sphere)

        }

    }

    scene.add(satellites)

    
}

function init(){
    //Create renderer and camera
    renderer = new three.WebGLRenderer({antialias: true})
    camera = new three.PerspectiveCamera(
        VIEW_ANGLE,
        ASPECT_RATIO,
        NEAR,
        FAR
    )

    //Position camera reasonably away from the origin
    camera.position.z = 3000

    //Scene with black background color
    scene = new three.Scene()
    scene.background = new three.Color( 'black' );

    //Add camera to scene
    scene.add(camera)

    //Sets the width of the canvas
    renderer.setSize(WIDTH, HEIGHT)

    //Adds our renderer to the scene in the DOM
    document.body.appendChild(renderer.domElement)



    //Get the earth image
    const imageLoader = new three.TextureLoader()
    const earthImage = imageLoader.load("earth")

    //Earth material
    const sphereMaterial = new three.MeshBasicMaterial()
    sphereMaterial.map = earthImage

    //Earth mesh
    earth = new three.Mesh(
        new three.SphereGeometry(
            500,
            32,
            32
        ), sphereMaterial
    );
    earth.position.z = 0

    //Rotate so facing upright
    earth.rotateZ(Math.PI)

    //Add earth to the scene
    scene.add(earth)

    //Create ambient lighting object.
    ambientLight = new three.AmbientLight(0xffffff);

    // add to the scene
    scene.add(ambientLight);

    //Ajax call to request tle from server
    $.ajax({
        type: "GET",
        url: "/init",
        contentType: 'application/json',
        success: function(result){
            currentlyUpdating = true
            console.log("Starting Orbit Fetch")
            generateField(result)
            console.log("Finished Orbit Fetch")
            currentlyUpdating = false
        },
        error: function(jqXHR, exception){
            console.log(jqXHR)
            console.log(exception)
        }
    })

}

/**
 * Zoom in and zoom out by changing the cameras z position 
 * pointed towards the earth object
 * @param {event} e 
 */
function scrollWheelHandler(e){
    camera.position.z += 1 * e.deltaY
}

/**
 * This function acts as a way to rotate the objects in the
 * scene rather than the camera to reduce the need for complex transforms
 * on the users part.
 * @param {event} e 
 */
function onDocumentKeyDown(e){

    var keyCode = e.which;


    if (keyCode == 37) {
        earth.rotation.y += ySpeed;
        satellites.rotation.y += ySpeed
    } else if (keyCode == 39) {
        earth.rotation.y -= ySpeed;
        satellites.rotation.y -= ySpeed
    } else if (keyCode == 38) {
        earth.rotation.x -= xSpeed;
        satellites.rotation.x -= xSpeed
    } else if (keyCode == 40) {
        earth.rotation.x += xSpeed;
        satellites.rotation.x += xSpeed
        
    }
    earth.geometry.verticesNeedUpdate = true

}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize( window.innerWidth, window.innerHeight );
}




function update(){
    //Render the scene
    renderer.render(scene, camera)
    if(satellites != null){
        endDate = new Date()
        if ( currentlyUpdating == false ) {
            currentlyUpdating = true
            setTimeout(updateStarField(), 3000)
        }
    }

    if (clicked){

        raycaster.setFromCamera(mouse, camera)
        var intersects = raycaster.intersectObjects(satellites.children)
        if (intersects.length > 0) {
            console.log(intersects[0].object.sat_rec)
            const sat_info = intersects[0].object.sat_rec
            r_str = ""
            r_str += "Satnum:" + sat_info.satnum + "\n"
            r_str += "Epochyr:" + sat_info.epochyr + "\n"
            r_str += "Epochdays:" + sat_info.epochdays + "\n"
            r_str += "Jdsatepoch:" + sat_info.jdsatepoch + "\n"
            r_str += "Inclination:" + sat_info.inclo + "\n"
            r_str += "Right Ascension of Ascending Node:" + sat_info.nodeo + "\n"
            r_str += "Eccentricity:" + sat_info.ecco + "\n"
            r_str += "Argument of Perigee:" + sat_info.argpo + "\n"
            r_str += "Mean Anomoly:" + sat_info.mo + "\n"
            r_str += "Mean Motion Radians/Minute:" + sat_info.no + "\n"
            alert(r_str)
        }

    } 

    clicked = false
    //Call for another timer to kick off animate
    requestAnimationFrame(update)



}

function onMouseClick(){
    clicked = true;
}

function onDocMoveMouse(event){
    event.preventDefault()
    mouse.x = ( event.clientX / window.innerWidth ) * 2 - 1;
	mouse.y = - ( event.clientY / window.innerHeight ) * 2 + 1;
}


window.addEventListener( 'resize', onWindowResize, false );
document.addEventListener('mousewheel', scrollWheelHandler, false);
document.addEventListener("keydown", onDocumentKeyDown, false);
document.addEventListener("mousemove", onDocMoveMouse, false);
document.addEventListener("click", onMouseClick, false);
requestAnimationFrame(update);

