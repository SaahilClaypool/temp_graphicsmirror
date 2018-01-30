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
    canvas = document.getElementById('webgl');

    // Get the rendering context for WebGL
    gl = WebGLUtils.setupWebGL(canvas);
    canvas.onclick = handle_click
    document.onkeydown = handle_keydown
    document.onkeyup = handle_keyup
    document.onkeypress = handle_keypress

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
function draw_poly(poly, color) {

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
        return color;
    });

    var cBuffer = gl.createBuffer(); //Create the buffer object
    gl.bindBuffer(gl.ARRAY_BUFFER, cBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(colors), gl.STATIC_DRAW);
    var vColor = gl.getAttribLocation(program, "vColor");
    gl.vertexAttribPointer(vColor, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vColor);

    // draw single point of only one point is given
    if(poly.length == 1){
        gl.drawArrays(gl.POINTS, 0, poly.length);
    }
    else { // else draw line strip
        gl.drawArrays(gl.LINE_STRIP, 0, poly.length);
    }
}

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
    console.log(f);
    var reader = new FileReader();
    reader.readAsText(f, "UTF-8");
    reader.onload = (evt) => {
        file_contents = parse_file(evt.target.result)
        let params = file_contents.params
        current_params = params; 
        current_drawing = file_contents.polys
        fix_aspect(params)
        fix_scale(params);
        draw_polylist(file_contents.polys)
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

/**
 * Draw whatever is in the current drawing variable
 */
function draw_current_drawing() {
    clear_canvas();
    let params = {
        left: 0,
        right: canvas.width,
        top: 0, 
        bottom: canvas.height
    }
    console.log("params: " + params.right + "y: " + params.bottom)
    current_params = params; 
    // go back to original dimmensions
    gl.viewport(0, 0, canvas.width, canvas.height);
    fix_aspect(params);
    fix_scale(params);
    draw_polylist(current_drawing)
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
    lines = splitline(input_str);
    var i = 0;
    let has_params = true;
    while (true) {
        if (lines[i] == null) {
            has_params = false;
            i = 0
            break;
        }
        if (lines[i].length == 0) {
            i++;
            continue;
        }
        if (lines[i][0] == '*') {
            i++;
            break; // found start
        }
        i++;
    }
    if (lines[i].length == 0) {
        i++;
    }
    var left, right, top, bottom;
    if (has_params) {
        params = lines[i].split(" ")
            .filter((line, _) => line.length != 0)
            .map(parseFloat)
        console.log("params", params)
        left = params[0], top = params[1], right = params[2], bottom = params[3];
        i++
    }
    else {
        left = 0; right = 640; bottom = 0; top = 480;
        console.log("Using Default")
        i = 0;
    }
    let param_struct = {
        left: left,
        right: right,
        bottom: bottom,
        top: top
    }
    if (lines[i].length == 0) {
        i++
    }
    console.log("param struct", param_struct)
    let polynum = parseInt(lines[i])
    i++
    if (lines[i].length == 0) {
        i++
    }
    // each poly is # vertices, and then the vertices
    polys = []
    for (var pi = 0; pi < polynum; pi++) {
        let points_ = parse_poly(lines, i)
        i = points_.line
        console.log(lines[i])
        if (lines[i].length == 0) {
            i++
        }
        // draw poly
        polys.push(points_.points)
    }
    return { polys: polys, params: param_struct };
}


/**
 * parse an individual polygon. Returns the number of lines used to parse the polygon
 * so the next polygon can be parsed from the given location
 * @param {string[]} lines 
 * @param {*} start 
 * @return {points, line}
 */
function parse_poly(lines, start) {
    let points = []
    if (lines[start.length] == 0) {
        start++;
    }
    let verts = parseInt(lines[start])
    for (var i = start + 1; points.length < verts; i++) {
        if (lines[i].length == 0) {
            start += 1 // because there was a blank line
            continue;
        }
        let vals = lines[i]
            .split(" ")
            .filter((el, _) => {
                return el.length != 0
            })
            .map((el, _) => {
                return parseFloat(el)
            });
        points.push(vec4(vals[0], vals[1], 0, 1))
    }
    console.log("Points", points)
    return { points: points, line: i }
}

/**
 * change state based on the key pressed
 * @param {any} event 
 */
function handle_keypress(event){
    switch (event.key){
        case "d":
        console.log("d: draw mode")
        if(mode == "draw"){
            return; 
        }
        else {
            mode = "draw"
            document.getElementById("mode").innerHTML = "DRAW"
            document.getElementById("upload").disabled = true
            current_drawing = [[]]
            current_polygon = 0
            clear_canvas()
        }
        break; 
        case "f":
        console.log("f: file mode")
        if(mode == "file"){
            return; 
        }
        else {
            mode = "file";
            document.getElementById("mode").innerHTML = "FILE"
            document.getElementById("upload").disabled = false
            clear_canvas()
        }
        break; 
        case "c":
        change_color(); 
        console.log("c: change color")
        redraw(); 
        // black --> red --> green --> blue
        break; 
    }
}

/**
 * redraw current drawing
 */
function redraw() {
    fix_aspect(current_params)
    fix_scale(current_params);
    draw_polylist(current_drawing)
}

/**
 * Cycle colors
 */
function change_color() {
    if(current_color == colors.black){
        current_color = colors.red; 
    }
    else if (current_color == colors.red){
        current_color = colors.green; 
    }
    else if (current_color == colors.green){
        current_color = colors.blue;
    }
    else if (current_color == colors.blue){
        current_color = colors.black
    }
}

/**
 * Add a point to the current drawing at the mouse coordinates, and then redraw
 * @param {MouseEvent} event 
 */
function handle_click(e) {
    if(mode == "file"){
        return; 
    }
    // https://stackoverflow.com/questions/55677/how-do-i-get-the-coordinates-of-a-mouse-click-on-a-canvas-element
    var x;
    var y;
    if (e.pageX || e.pageY) {
        x = e.pageX;
        y = e.pageY;
    }
    else {
        x = e.clientX + document.body.scrollLeft + document.documentElement.scrollLeft;
        y = e.clientY + document.body.scrollTop + document.documentElement.scrollTop;
    }
    x -= canvas.offsetLeft;
    y -= canvas.offsetTop;

    if(b_key_state){
        current_polygon++
        current_drawing.push([])
    }


    current_drawing[current_polygon].push(vec4(x, y, 0, 1))
    console.log("e x ", event.clientX, event.clientY);
    draw_current_drawing(); 
    
}

/**
 * toggle state while b is held down
 * @param {event} event 
 */
function handle_keydown(event) {
    switch(event.key) {
        case 'b':
        // b key went down, so don't connect
        b_key_state = true
        break;
    }

}

/**
 * toggle state while b is released
 * @param {event} event 
 */
function handle_keyup(event) {
    switch(event.key) {
        case 'b':
        b_key_state = false;
        break;
    }
}
