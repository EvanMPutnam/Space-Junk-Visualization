
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
var particleSystem = null
var currentlyUpdating = false

var raycaster = new three.Raycaster()
var mouse = new three.Vector2()

init()


/**
 * Updates the satellite positions using satellite.js
 */
function updateStarField(){
    const currentDate = new Date()
    for(var vert in particleSystem.geometry.vertices){
        vertice = particleSystem.geometry.vertices[vert]
        const positionAndVelocity = sat.propagate(vertice.sat_rec, currentDate)
        const position = positionAndVelocity.position
        if(position != null){
            vertice.x = position.x/10
            vertice.y = position.y/10
            vertice.z = position.z/10
            
        }

    }

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

    //Get the glowing image
    const imageLoader = new three.TextureLoader()
    const glowImage = imageLoader.load("glow")

    //Adding "vertices" as the satellite object in the shape.
    //This keeps things efficient.
    var colors = []
    count = 0
    for(var key in star_json['satellites']){
        var star = new three.Vector3()
        //Pull tle from json data
        const line1 = star_json['satellites'][key]["line1"]
        const line2 = star_json['satellites'][key]["line2"]
        //Get base data
        star.sat_rec = sat.twoline2satrec( line1, line2 )
        const positionAndVelocity = sat.propagate(star.sat_rec, startDate)
        const position = positionAndVelocity.position
        //Sometimes position gen fails. Not sure the reason yet.
        if(position != null){
            //Scale things down in the view by factor of 10
            star.x = position.x/10
            star.y = position.y/10
            star.z = position.z/10
            //Key helpful in identification
            star.star_name = key
            geometry.vertices.push(star)
            colors[count] = new three.Color(255, 255, 255)
            count += 1
        }

    }

    //Material of points
    pMaterial = new three.PointsMaterial({
        color: 0xFFFFFF,
        size: 20,
        vertexColors: three.VertexColors
    });
    

    if (particleSystem == null){
        particleSystem = new three.Points( geometry, pMaterial );

        particleSystem.geometry.colors = colors
        
        particleSystem.geometry.colorsNeedUpdate=true
        scene.add( particleSystem );
    }else{
        scene.remove( particleSystem )
        particleSystem = new three.Points( geometry, pMaterial );
        scene.add( particleSystem );
    }
    
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
        particleSystem.rotation.y += ySpeed
    } else if (keyCode == 39) {
        earth.rotation.y -= ySpeed;
        particleSystem.rotation.y -= ySpeed
    } else if (keyCode == 38) {
        earth.rotation.x -= xSpeed;
        particleSystem.rotation.x -= xSpeed
    } else if (keyCode == 40) {
        earth.rotation.x += xSpeed;
        particleSystem.rotation.x += xSpeed
        
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
    if(particleSystem != null){
        endDate = new Date()
        particleSystem.geometry.verticesNeedUpdate = true
        if ( currentlyUpdating == false ) {
            currentlyUpdating = true
            setTimeout(updateStarField(), 3000)
        }
    }

    if (clicked){

        raycaster.setFromCamera(mouse, camera)
        var intersects = raycaster.intersectObjects(scene.children)
        if (intersects.length > 0) {

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

