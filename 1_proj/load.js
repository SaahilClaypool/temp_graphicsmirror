/*
 * Some comments quoted from WebGL Programming Guide
 * by Matsuda and Lea, 1st edition.
 * 
 * @author Joshua Cuneo
 */

var gl;
var canvas;

function main() 
{
	// Retrieve <canvas> element
	canvas = document.getElementById('webgl');

	// Get the rendering context for WebGL
	gl = WebGLUtils.setupWebGL(canvas);
	
	//Check that the return value is not null.
	if (!gl) 
	{
		console.log('Failed to get the rendering context for WebGL');
		return;
	}
	
	// Initialize shaders
	program = initShaders(gl, "vshader", "fshader");
	gl.useProgram(program);

	//Set up the viewport
	//x, y - specify the lower-left corner of the viewport rectangle (in pixels)
	//In WebGL, x and y are specified in the <canvas> coordinate system
	//width, height - specify the width and height of the viewport (in pixels)
	//canvas is the window, and viewport is the viewing area within that window
	//canvas.width = 200;
	//canvas.height = 200;
    gl.viewport( 0, 0, canvas.width, canvas.height );

	var thisProj = ortho(-1, 1, -1, 1, -1, 1);
	var projMatrix = gl.getUniformLocation(program, 'projectionMatrix');
	gl.uniformMatrix4fv(projMatrix, false, flatten(thisProj));
    

	
    /**********************************
     * Points, Lines, and Fill
     **********************************/
    
    //Define the positions of our points
    //Note how points are in a range from 0 to 1
    var points = [];
    points.push(vec4(-0.8, -0.5, 0.0, 1.0));
    points.push(vec4(0.5, -0.5, 0.0, 1.0));  
    points.push(vec4(0.0, 0.5, 0.0, 1.0));		//RECTANGLE - comment out
    //points.push(vec4(-0.5, 0.5, 0.0, 1.0));	//RECTANGLE - vertex order matters
    //points.push(vec4(0.5, 0.5, 0.0, 1.0));	//RECTANGLE
    
    var pBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, pBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(points), gl.STATIC_DRAW);
    
    var vPosition = gl.getAttribLocation(program,  "vPosition");
    gl.vertexAttribPointer(vPosition, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition);
    
    //Define the colors of our points
    var colors = [];
    colors.push(vec4(1.0, 0.0, 0.0, 1.0));
    colors.push(vec4(0.0, 1.0, 0.0, 1.0));
    colors.push(vec4(0.0, 0.0, 1.0, 1.0)); 
    //colors.push(vec4(1.0, 0.0, 1.0, 1.0)); 	//RECTANGLE
    
    var cBuffer = gl.createBuffer();			//Create the buffer object
    
    //Bind the buffer object to a target
    //The target tells WebGL what type of data the buffer object contains, 
    //allowing it to deal with the contents correctly
    //gl.ARRAY_BUFFER - specifies that the buffer object contains vertex data
    gl.bindBuffer(gl.ARRAY_BUFFER, cBuffer);
    
    //Allocate storage and write data to the buffer
    gl.bufferData(gl.ARRAY_BUFFER, flatten(colors), gl.STATIC_DRAW);
    
    var vColor = gl.getAttribLocation(program,  "vColor");
    gl.vertexAttribPointer(vColor, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vColor);
    
	// Set clear color

	// Clear <canvas> by clearning the color buffer
	gl.clear(gl.COLOR_BUFFER_BIT);
	
	// Draw a point
	gl.drawArrays(gl.POINTS, 0, points.length);
	//gl.drawArrays(gl.LINES, 0, points.length);
	//gl.drawArrays(gl.LINE_STRIP, 0, points.length);
	//gl.drawArrays(gl.LINE_LOOP, 0, points.length);
	//gl.drawArrays(gl.TRIANGLES, 0, points.length);

    /**********************************
     * Draw a Rectangle
     **********************************/
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, points.length); //RECTANGLE
}

function draw_polylist(listpoints){
    console.log("Clearing");
    gl.clear(gl.COLOR_BUFFER_BIT); 

    listpoints.forEach(poly => {
        draw_poly(poly); 
    });
}

function draw_poly(poly){

    // poly is already a list of vec4
    // bind poly to webgl buffer
    var pBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, pBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(poly), gl.STATIC_DRAW);
    
    // activate position
    var vPosition = gl.getAttribLocation(program,  "vPosition");
    gl.vertexAttribPointer(vPosition, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition);

    var colors = poly.map((_) => {
        return vec4(0,0,0,1); 
    });

    var cBuffer = gl.createBuffer();			//Create the buffer object
    gl.bindBuffer(gl.ARRAY_BUFFER, cBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(colors), gl.STATIC_DRAW);
    var vColor = gl.getAttribLocation(program,  "vColor");
    gl.vertexAttribPointer(vColor, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vColor);

    // draw 
	gl.drawArrays(gl.LINE_STRIP, 0, poly.length);
}

function clear_canvas() {
    console.log("Clear");
    set_clear_color("white"); 
    gl.clear(gl.COLOR_BUFFER_BIT);
}

function set_clear_color(color){
    if(color == "black"){
        gl.clearColor(0.0, 0.0, 0.0, 1.0);
    }
    else {// white
        gl.clearColor(1, 1, 1, 1.0);
    }
}

function load_file(){
    let f = document.getElementById("file").files[0]; 
    console.log(f); 
    var reader = new FileReader();
    reader.readAsText(f, "UTF-8");
    reader.onload = (evt) => {
        file_contents = parse_file(evt.target.result)
        let params = file_contents.params
        var thisProj = ortho(params.left, params.right, params.bottom, params.top, -1, 1);
        var projMatrix = gl.getUniformLocation(program, 'projectionMatrix');
        gl.uniformMatrix4fv(projMatrix, false, flatten(thisProj));
        draw_polylist(file_contents.polys)
    }

}

function splitline(input_str){
    return input_str.split(/\r?\n/);
}

function parse_file (input_str) {
    // start at *
    // 1: left, top, right, bottom of figure (ranges for points)
    // 2: number of polylines (length of data)
    // 3+ 
    lines = splitline(input_str);
    var i = 0; 
    while(true){
        if(lines[i][0] == '*'){
            i++;
            break; // found start
        }
        i++;
    }

    params = lines[i].split("  ").map(parseFloat)
    console.log("params", params)
    let left = params[0], top = params[1], right = params[2], bottom = params[3]
    let param_struct = {
        left: left,
        right: right, 
        bottom: bottom, 
        top: top
    }
    i++
    let polynum = parseInt(lines[i])
    i++
    // each poly is # vertices, and then the vertices
    polys = []
    for(var pi = 0; pi < polynum; pi++) {
        let points = parse_poly(lines, i)
        i += points.length + 1
        // draw poly
        polys.push(points)
    }
    return {polys: polys, params: param_struct}; 
}


// return a list of vec4 with the appropriate points
function parse_poly(lines, start){
    let points = []
    let verts = parseInt(lines[start])
    for (var i = start + 1; i < start + 1 + verts; i++){
        let vals= lines[i]
            .split("  ")
            .slice(1)
            .map((el, _) => {
            return parseFloat(el)
        });
        points.push(vec4(vals[0], vals[1], 0, 1))
    }
    return points
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