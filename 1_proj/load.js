/*
 * Some comments quoted from WebGL Programming Guide by Matsuda and Lea, 1st
 * edition.
 *
 * @author Joshua Cuneo
 */

var gl;
var canvas;
var mode = "file"
// should be a 2d array of points
var current_drawing = [[]]
var current_polygon = 0
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

    //Set up the viewport x, y - specify the lower-left corner of the viewport
    //rectangle (in pixels) In WebGL, x and y are specified in the <canvas>
    //coordinate system width, height - specify the width and height of the
    //viewport (in pixels) canvas is the window, and viewport is the viewing
    //area within that window canvas.width = 200; canvas.height = 200;
    gl.viewport(0, 0, canvas.width, canvas.height);

    var thisProj = ortho(-1, 1, -1, 1, -1, 1);
    var projMatrix = gl.getUniformLocation(program, 'projectionMatrix');
    gl.uniformMatrix4fv(projMatrix, false, flatten(thisProj));



    /**********************************
     * Points, Lines, and Fill
     **********************************/

    //Define the positions of our points Note how points are in a range from 0
    //to 1
    var points = [];
    points.push(vec4(-0.8, -0.5, 0.0, 1.0));
    points.push(vec4(0.5, -0.5, 0.0, 1.0));
    points.push(vec4(0.0, 0.5, 0.0, 1.0));		//RECTANGLE - comment out
    //points.push(vec4(-0.5, 0.5, 0.0, 1.0));   //RECTANGLE - vertex order
    //matters points.push(vec4(0.5, 0.5, 0.0, 1.0));    //RECTANGLE

    var pBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, pBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(points), gl.STATIC_DRAW);

    var vPosition = gl.getAttribLocation(program, "vPosition");
    gl.vertexAttribPointer(vPosition, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition);

    //Define the colors of our points
    var colors = [];
    colors.push(vec4(1.0, 0.0, 0.0, 1.0));
    colors.push(vec4(0.0, 1.0, 0.0, 1.0));
    colors.push(vec4(0.0, 0.0, 1.0, 1.0));
    //colors.push(vec4(1.0, 0.0, 1.0, 1.0));    //RECTANGLE

    var cBuffer = gl.createBuffer();			//Create the buffer object

    //Bind the buffer object to a target The target tells WebGL what type of
    //data the buffer object contains, allowing it to deal with the contents
    //correctly gl.ARRAY_BUFFER - specifies that the buffer object contains
    //vertex data
    gl.bindBuffer(gl.ARRAY_BUFFER, cBuffer);

    //Allocate storage and write data to the buffer
    gl.bufferData(gl.ARRAY_BUFFER, flatten(colors), gl.STATIC_DRAW);

    var vColor = gl.getAttribLocation(program, "vColor");
    gl.vertexAttribPointer(vColor, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vColor);

    // Set clear color

    // Clear <canvas> by clearning the color buffer
    gl.clear(gl.COLOR_BUFFER_BIT);

    // Draw a point
    gl.drawArrays(gl.POINTS, 0, points.length);
    //gl.drawArrays(gl.LINES, 0, points.length); gl.drawArrays(gl.LINE_STRIP, 0,
    //points.length); gl.drawArrays(gl.LINE_LOOP, 0, points.length);
    //gl.drawArrays(gl.TRIANGLES, 0, points.length);

    /**********************************
     * Draw a Rectangle
     **********************************/
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, points.length); //RECTANGLE
}

function draw_polylist(listpoints) {
    console.log("Clearing");
    gl.clear(gl.COLOR_BUFFER_BIT);

    listpoints.forEach(poly => {
        draw_poly(poly, current_color);
    });
}

/**
 * 
 * @param {list[vec4]} poly 
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

    var colors = poly.map((_) => {
        return color;
    });

    var cBuffer = gl.createBuffer();			//Create the buffer object
    gl.bindBuffer(gl.ARRAY_BUFFER, cBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(colors), gl.STATIC_DRAW);
    var vColor = gl.getAttribLocation(program, "vColor");
    gl.vertexAttribPointer(vColor, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vColor);

    // draw 
    if(poly.length == 1){
        gl.drawArrays(gl.POINTS, 0, poly.length);
    }
    else {
        gl.drawArrays(gl.LINE_STRIP, 0, poly.length);
    }
}

function clear_canvas() {
    console.log("Clear");
    set_clear_color("white");
    gl.clear(gl.COLOR_BUFFER_BIT);
}

function set_clear_color(color) {
    if (color == "black") {
        gl.clearColor(0.0, 0.0, 0.0, 1.0);
    }
    else {// white
        gl.clearColor(1, 1, 1, 1.0);
    }
}

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

function fix_scale(params){
    var thisProj = ortho(params.left, params.right, params.bottom, params.top, -1, 1);
    var projMatrix = gl.getUniformLocation(program, 'projectionMatrix');
    gl.uniformMatrix4fv(projMatrix, false, flatten(thisProj));
}

function fix_aspect(params) {
    // set viewport to fit params
    let canv = document.getElementById("webgl")
    let width = params.right - params.left
    let height = params.top - params.bottom
    let imageAR = height / width
    let canvasAR = canv.height / canv.width
    if (imageAR > canvasAR) { // too tall
        gl.viewport(0, 0, canvas.height / imageAR, canvas.height);
    }
    else {
        gl.viewport(0, 0, canvas.width, canvas.width * imageAR);
    }

    // gl.viewport( 0, 0, 400, 400);
}

function draw_current_drawing() {
    clear_canvas();
    let canvas = document.getElementById("webgl"); 
    let params = {
        left: 0,
        right: canvas.width,
        top: 0, 
        bottom: canvas.height
    }
    current_params = params; 
    fix_scale(params);
    draw_polylist(current_drawing)
}


// ------------------------------------------------------------ PARSING

function splitline(input_str) {
    return input_str.split(/\r?\n/);
}

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


// return a list of vec4 with the appropriate points
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

function redraw() {
    fix_aspect(current_params)
    fix_scale(current_params);
    draw_polylist(current_drawing)
}

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

// ------------------------------ input handling

/**
 * 
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

    console.log("b key ", b_key_state)

    current_drawing[current_polygon].push(vec4(x, y, 0, 1))
    console.log("e x ", event.clientX, event.clientY);
    draw_current_drawing(); 
    
}

function handle_keydown(event) {
    switch(event.key) {
        case 'b':
        // b key went down, so don't connect
        b_key_state = true
        break;
    }

}

function handle_keyup(event) {
    switch(event.key) {
        case 'b':
        b_key_state = false;
        break;
    }
}

/*
    window.onkeypress = function(event)
    {
        var key = String.fromCharCode(event.keyCode);
        switch(key)
        {
        case 'a':
            //canvas.width = 200;
            //gl.clear(gl.COLOR_BUFFER_BIT);
            //gl.drawArrays(gl.TRIANGLES, 0, points.length);
            //window.alert('Key pressed is ' + key);
            break;
        }
    }

    window.onclick = function(event)
    {
        //canvas.width = 200;
        //gl.clear(gl.COLOR_BUFFER_BIT);
    }
*/