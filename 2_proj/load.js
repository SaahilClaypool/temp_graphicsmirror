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
// do pulseFactor 
var pulseFactor = - Math.PI / 2; 
var pulseStages = 100; 
var pulse = false; 

var change = true; 

var mvMatrix, pMatrix;
var modelView, projection;
var eye;
at = vec3(0.0, 0.0, 0.0);
const up = vec3(0.0, 1.0, 0.0);


// state stuff
var state = {
    trans : [0, 0, 0], 
    rotate: [0, 0, 0]
}


// 2d array of points (vec4) to keep track of the current drawing
var current_drawing = {
    left: -1, 
    right: 1, 
    bottom: -1, 
    top: 1,
    near: -1,
    far: 1
}
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

var current_color = colors.white;

var params = {
   left : -.5,
   right : .5,
   top : .5,
   bottom : -.5,
}

var b_key_state = false

/////////////////////////////////////////// end globals

function main() {
    document.onkeypress = handle_keypress
    // Retrieve <canvas> element
    console.log("hello world");
    canvas = document.getElementById('webgl');

    // Get the rendering context for WebGL
    gl = WebGLUtils.setupWebGL(canvas);

    //Check that the return value is not null.
    if (!gl) {
        console.log('Failed to get the rendering context for WebGL');
        return;
    }

    // Initialize shaders
    program = initShaders(gl, "vshader", "fshader");
    gl.useProgram(program);

    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.enable(gl.CULL_FACE);
    gl.cullFace(gl.BACK);
    gl.enable(gl.DEPTH_TEST);

    // var thisProj = ortho(-1, 1, -1, 1, -1, 1);
    // var projMatrix = gl.getUniformLocation(program, 'projectionMatrix');
    projection = gl.getUniformLocation(program, "projectionMatrix");
    modelView = gl.getUniformLocation(program, "modelMatrix");
    // gl.uniformMatrix4fv(projection, false, flatten());


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

    tick(); 
}

function handle_keypress(event) {
    console.log("key press"); 
    change = true; 
    let diff = .1
    switch (event.key){
        case "x":
        state.trans[0] += diff; 
        break; 
        case "c":
        state.trans[0] -= diff; 
        break;
        case "u":
        state.trans[1] -= diff; 
        break;
        case "y":
        state.trans[1] += diff; 
        break;
        case "z":
        state.trans[2] += diff; 
        break;
        case "a":
        state.trans[2] -= diff; 
        break;

        case "r":
        // rotate
        state.rotate[0] += 10 * diff;  // check direction
        break; 
        case "b":
        pulse = !pulse; 
        if(!pulse) {
            pulseFactor = - Math.PI / 2; 
        }
        break;
    }
    setupCurrent();
}

async function tick() {
    while(true){
        if(change){
            console.log("animation"); 
            requestAnimationFrame(drawPostSetup); 
            change = false; 
        }
        await sleep(50); 
    }
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
    gl.clearColor(0,0,0,1);
    gl.clear(gl.COLOR_BUFFER_BIT);
}

/**
 * load the file uploaded from the user and draw on the screen
 */
function load_file() {
    change = true; 
    pulseFactor = - Math.PI / 2;
    pulse = false; 
    // reset state
    state = {
        trans: [0, 0, 0],
        rotate: [0, 0, 0]
    }

    let f = document.getElementById("file").files[0];
    var reader = new FileReader();
    reader.readAsText(f, "UTF-8");
    reader.onload = (evt) => {
        file_contents = parse_file(evt.target.result)
    }
}

function calculatePulse(triangle) {
    // draw each face
    let a = subtract(triangle[0], triangle[1])
    let b = subtract(triangle[0], triangle[2])
    var n = normalize(cross(a, b));       // perpendicular vector

    n = scale((Math.sin(pulseFactor) + 1) / 5, n); 
    

    let pulseData = translate(n, 0, 0); 

    var pulseMatrix = gl.getUniformLocation(program, 'pulseMatrix');
    gl.uniformMatrix4fv(pulseMatrix, false, flatten(pulseData)); 

}

function calculateViewDistance() {
    // so, sin (1/2 fov) * z diff = xmin / xmax
    let rads = fovy / 2 * Math.PI / 180;
    let dX = ((params.right - params.left) / 2) * 1.4; 
    let zX = Math.tan(rads) * dX;
    let dY = ((params.top - params.bottom) / 2) * 1.4 ;
    let zY = Math.tan(rads) * dY;
    // zdiff = x
    return Math.max(zX, zY);
}

//////////////////////////////////////// Drawing
function setupCurrent() {
    gl.viewport(0, 0, canvas.width, canvas.height);
    aspect = canvas.width / canvas.height;

    pMatrix = perspective(fovy, aspect, params.near - .4, params.far);
    // pMatrix = perspective(fovy, aspect, params.near , params.far );


    // var perspMatrix = perspective(fovy, aspect, .1, 10);
    gl.uniformMatrix4fv(projection, false, flatten(pMatrix));

    // look at
    let avgy = (params.top + params.bottom) / 2,
        avgx = (params.left + params.right) / 2
    avgz = (params.far + params.near) / 2;
    let newZ = calculateViewDistance();
    eye = vec3(avgx, avgy, params.near + newZ );
    at = vec3(avgx,
        avgy,
        avgz);
    // could also make sure to move out eye far enough that it can see whole shape.
    // so, sin / cos --> fov to get inside
    let cameraMat = lookAt(eye, at, up)
    let rotateMat = rotate(state.rotate[0], [1, 0, 0]);
    let transMat = translate(state.trans[0], state.trans[1], state.trans[2]); 

    mvMatrix = mult(transMat, rotateMat)
    mvMatrix = mult(cameraMat, mvMatrix)

    var scale;

    let imageAsp = (params.top - params.bottom) / (params.right - params.left);
    // mvMatrix = mult(scale, mvMatrix)

    gl.uniformMatrix4fv(modelView, false, flatten(mvMatrix));
}

async function drawPostSetup() {
    clear_canvas();
    current_drawing.triangles.forEach(element => {
        drawFace(element)
    });
    if(pulse) {
        pulseFactor += .1
        change = true; 
        // await sleep(700); 
        // drawPostSetup();
        // requestAnimationFrame(drawPostSetup)
    }

}

/**
 * @argument poly is {list[points]}
 */
function drawFace(poly) {
    calculatePulse(poly)
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

    // color
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
        gl.drawArrays(gl.LINE_LOOP, 0, poly.length);
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
    // console.log("parsing : ")
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
    // console.log(verts)
    i++;
    // skip 3 lines
    i += 3;
    // read # of poly
    line = lines[i]
    let faces = parseInt(line.split(" ")[2])
    i++
    // console.log(faces)
    // skip line
    i++;
    // end header
    i++;
    // parse vertex array
    var vertlist = []
    min_x = 0;
    min_y = 0;
    min_z = 0;

    max_x = 0;
    max_y = 0;
    max_z = 0;

    for (var j = 0; j < verts; j++ , i++) {
        line = lines[i]
        temp = line.split(' ').map(parseFloat).slice(0, 3)
        vertlist.push(vec4(temp[0], temp[1], temp[2], 1))
        if (temp[0] > max_x) {
            max_x = temp[0];
        }
        if (temp[1] > max_y) {
            max_y = temp[1];
        }
        if (temp[2] > max_z) {
            max_z = temp[2];
        }
        if (temp[0] < min_x) {
            min_x = temp[0];
        }
        if (temp[1] < min_y) {
            min_y = temp[1];
        }
        if (temp[2] < min_z) {
            min_z = temp[2];
        }
    }

    params = {
        left: min_x,
        right: max_x,
        bottom: min_y,
        top: max_y,
        near: max_z,
        far: min_z,
    }

    // console.log(vertlist)
    // parse vertex to poly map
    var facelist = []
    for (var j = 0; j < faces; j++ , i++) {
        line = lines[i]
        facelist.push(line.split(' ').map(parseFloat).slice(1))
    }
    // console.log(facelist)

    triangles = []
    facelist.forEach((v, i) => {
        triangles.push([
            vertlist[v[0]], vertlist[v[1]], vertlist[v[2]]
        ])
    })

    //    console.log("triangles")
    //    console.log(triangles)

    current_drawing = {}
    current_drawing.verts = vertlist;
    current_drawing.faces = facelist;
    current_drawing.triangles = triangles

    setupCurrent()

}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
  