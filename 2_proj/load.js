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
var fovy = 90.0;  // Field-of-view in Y direction angle (in degrees)
var aspect;       // Viewport aspect ratio
var program;

var mvMatrix, pMatrix;
var modelView, projection;
var eye;
const at = vec3(0.0, 0.0, 0.0);
const up = vec3(0.0, 1.0, 0.0);
// 2d array of points (vec4) to keep track of the current drawing
var current_drawing = {}
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

    // var thisProj = ortho(-1, 1, -1, 1, -1, 1);
    // var projMatrix = gl.getUniformLocation(program, 'projectionMatrix');
    projection = gl.getUniformLocation(program, "projectionMatrix");
    modelView = gl.getUniformLocation(program, "modelMatrix");
    gl.uniformMatrix4fv(projection, false, flatten(projection));


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

// // fix the scale based on the left right top and bottom of the image to fit on the canvas
// function fix_scale(params){
//     var thisProj = ortho(params.left, params.right, params.bottom, params.top, -1, 1);
//     var projMatrix = gl.getUniformLocation(program, 'projectionMatrix');
//     gl.uniformMatrix4fv(projMatrix, false, flatten(thisProj));
// }

// // fix the aspect ratio if the screen is too wide or tall
// function fix_aspect(params) {
//     // set viewport to fit params
//     let width = params.right - params.left
//     let height = params.top - params.bottom
//     let imageAR = height / width
//     let canvasAR = canvas.height / canvas.width
//     if (imageAR > canvasAR) { // too tall
//         gl.viewport(0, 0, canvas.height / imageAR, canvas.height);
//     }
//     else {
//         gl.viewport(0, 0, canvas.width, canvas.width * imageAR);
//     }

//     // gl.viewport( 0, 0, 400, 400);
// }


//////////////////////////////////////// Drawing
function drawCurrent() {
    clear_canvas();
    let params = {
        left: -1,
        right: 1,
        top: 1, 
        bottom:-1 
    }
    console.log(params)
    gl.viewport(0, 0, canvas.width, canvas.height);
    aspect = canvas.width / canvas.height; 
    // fix_aspect(params);
    // fix_scale(params);

    // render stuff
    // perspective
    pMatrix = perspective(fovy, aspect, .1, 10);
    gl.uniformMatrix4fv(projection, false, flatten(pMatrix)); 

    // look at
    eye = vec3(0, 2, 4);
    mvMatrix = lookAt(eye, at, up)

    console.log("mvMatrix")
    console.log(mvMatrix)

    // draw each face
    current_drawing.triangles.forEach(element => {
        gl.uniformMatrix4fv(modelView, false, flatten(mvMatrix));
        drawFace(element)
    });
}

/**
 * @argument poly is {list[points]}
 */
function drawFace(poly) {
    console.log("Drawing: ")
    console.log(poly)
    // poly is already a list of vec4 bind poly to webgl buffer
    var pBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, pBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(poly), gl.STATIC_DRAW);

    // activate position
    var vPosition = gl.getAttribLocation(program, "vPosition");
    gl.vertexAttribPointer(vPosition, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition);

    // get a list of the same size of the current color
    var colors = poly.map((_) => {
        return current_color;
    });

    var cBuffer = gl.createBuffer(); //Create the buffer object
    gl.bindBuffer(gl.ARRAY_BUFFER, cBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(colors), gl.STATIC_DRAW);
    var vColor = gl.getAttribLocation(program, "vColor");
    gl.vertexAttribPointer(vColor, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vColor);

    // draw single point of only one point is given
    if (poly.length == 1) {
        gl.drawArrays(gl.POINTS, 0, poly.length);
    }
    else { // else draw line strip
        gl.drawArrays(gl.TRIANGLES, 0, poly.length);
    }
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
    if (lines[i] != "ply") {
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
    let faces = parseInt(line.split(" ")[2])
    i++
    console.log(faces)
    // skip line
    i++;
    // end header
    i++;
    // parse vertex array
    var vertlist = []
    for (var j = 0; j < verts; j++ , i++) {
        line = lines[i]
        temp = line.split(' ').map(parseFloat).slice(0, 3)
        vertlist.push(vec4(temp[0], temp[1], temp[2], 1))
    }
    console.log(vertlist)
    // parse vertex to poly map
    var facelist = []
    for (var j = 0; j < faces; j++ , i++) {
        line = lines[i]
        facelist.push(line.split(' ').map(parseFloat).slice(1))
    }
    console.log(facelist)

    triangles = []
    facelist.forEach((v, i ) => {
        triangles.push([
            vertlist[v[0]], vertlist[v[1]], vertlist[v[2]]
        ])
    })

   console.log("triangles")
   console.log(triangles)

    current_drawing = {}
    current_drawing.verts = vertlist;
    current_drawing.faces = facelist;
    current_drawing.triangles = triangles

    drawCurrent()

}

