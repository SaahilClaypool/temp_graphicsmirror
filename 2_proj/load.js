/*
 * Some comments quoted from WebGL Programming Guide by Matsuda and Lea, 1st
 * edition. Started from some class sample code. 
 *
 * @author Saahil Claypool
 */


/////////////////////////////////////////// globals for ease of use
var gl;
var canvas;
var mode = "file"
var program; 
// 2d array of points (vec4) to keep track of the current drawing
var current_drawing = [[]]
// current polygon number
var current_polygon = 0
// constants for the color
var colors = {
    black: vec4(0,0,0,1),
    red: vec4(1,0,0,1),
    green: vec4(0,1,0,1),
    blue: vec4(0,0,1,1),
    white: vec4(1,1,1,1),
}

var current_color = colors.black;

var current_params = {}

var b_key_state = false

/////////////////////////////////////////// end globals

function main() {
    // Retrieve <canvas> element
    console.log("hello world");
    canvas = document.getElementById('webgl');

    // Get the rendering context for WebGL
    gl = WebGLUtils.setupWebGL(canvas);
    // canvas.onclick = handle_click
    // document.onkeydown = handle_keydown
    // document.onkeyup = handle_keyup
    // document.onkeypress = handle_keypress

    //Check that the return value is not null.
    if (!gl) {
        console.log('Failed to get the rendering context for WebGL');
        return;
    }

    // Initialize shaders
    program = initShaders(gl, "vshader", "fshader");
    gl.useProgram(program);

    gl.viewport(0, 0, canvas.width, canvas.height);

    var thisProj = ortho(-1, 1, -1, 1, -1, 1);
    var projMatrix = gl.getUniformLocation(program, 'projectionMatrix');
    gl.uniformMatrix4fv(projMatrix, false, flatten(thisProj));

    // TODO remove hard code cube
    var cube = `ply
format ascii 1.0
element vertex 8
property float32 x
property float32 y
property float32 z
element face 12
property list uint8 int32 vertex_indices
end_header
-0.5 -0.5 -0.5 
0.5 -0.5 -0.5 
0.5 0.5 -0.5 
-0.5 0.5 -0.5 
-0.5 -0.5 0.5 
0.5 -0.5 0.5 
0.5 0.5 0.5 
-0.5 0.5 0.5 
3 3 2 1
3 3 1 0
3 6 7 4
3 6 4 5
3 5 1 2
3 5 2 6
3 0 4 7
3 0 7 3
3 6 2 3
3 6 3 7
3 4 0 1
3 4 1 5
    `;
    parse_file(cube)
}

/**
 * list of polygons (each polygon is a list of vec4)
 * @param {vec4[]} listpoints 
 */
function draw_polylist(listpoints) {
    console.log("Clearing");
    gl.clear(gl.COLOR_BUFFER_BIT);

    listpoints.forEach(poly => {
        draw_poly(poly, current_color);
    });
}

/**
 *  draw a single polygon
 * @param {vec4[]} poly 
 * @param {vec4} color 
 */
/**
 * clear everything on the canvas
 */
function clear_canvas() {
    console.log("Clear");
    gl.clearColor(1,1,1,1);
    gl.clear(gl.COLOR_BUFFER_BIT);
}

/**
 * load the file uploaded from the user and draw on the screen
 */
function load_file() {
    let f = document.getElementById("file").files[0];
    // console.log(f);
    var reader = new FileReader();
    reader.readAsText(f, "UTF-8");
    reader.onload = (evt) => {
        file_contents = parse_file(evt.target.result)
    }
}

// fix the scale based on the left right top and bottom of the image to fit on the canvas
function fix_scale(params){
    var thisProj = ortho(params.left, params.right, params.bottom, params.top, -1, 1);
    var projMatrix = gl.getUniformLocation(program, 'projectionMatrix');
    gl.uniformMatrix4fv(projMatrix, false, flatten(thisProj));
}

// fix the aspect ratio if the screen is too wide or tall
function fix_aspect(params) {
    // set viewport to fit params
    let width = params.right - params.left
    let height = params.top - params.bottom
    let imageAR = height / width
    let canvasAR = canvas.height / canvas.width
    if (imageAR > canvasAR) { // too tall
        gl.viewport(0, 0, canvas.height / imageAR, canvas.height);
    }
    else {
        gl.viewport(0, 0, canvas.width, canvas.width * imageAR);
    }

    // gl.viewport( 0, 0, 400, 400);
}


////////////////////////////////////////////////// Parsing
/**
 * Split file into each line 
 * @param {string} input_str 
 */
function splitline(input_str) {
    return input_str.split(/\r?\n/);
}

/**
 * Parse points from file
 * @param {string} input_str file as a string 
 */
function parse_file(input_str) {
    // start at * 1: left, top, right, bottom of figure (ranges for points) 2:
    // number of polylines (length of data) 3+ 
    console.log("parsing : ")
    lines = splitline(input_str);
    var i = 0
    line = lines[i];
    if (lines[i] != "ply"){
        console.log("Ply not the first line")
        return;
    }
    i++; 
    // skip format ascii
    i++; 
    // read # verts
    line = lines[i]
    let verts = parseInt(line.split(" ")[2]);
    console.log(verts)
    i++; 
    // skip 3 lines
    i += 3;
    // read # of poly
    line = lines[i]
    let faces  = parseInt(line.split(" ")[2])
    i++
    console.log(faces)
    // skip line
    i++
    // end header
    i++
    // parse vertex array
    // parse vertex to poly map



    for (; i < lines.length; i++){
        // console.log(lines[i]);
    }
}

