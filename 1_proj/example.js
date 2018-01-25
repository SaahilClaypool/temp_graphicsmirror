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
    //Write the data specified by the second parameter into the buffer object
    //bound to the first parameter
    //We use flatten because the data must be a single array of ints, uints, or floats (float32 or float64)
    //This is a typed array, and we can't use push() or pop() with it
    //
    //Last parameter specifies a hint about how the program is going to use the data
    //stored in the buffer object. This hint helps WebGL optimize performance but will not stop your
    //program from working if you get it wrong.
    //STATIC_DRAW - buffer object data will be specified once and used many times to draw shapes
    //DYNAMIC_DRAW - buffer object data will be specified repeatedly and used many times to draw shapes
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
        parse_file(evt.target.result)
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
    let left = params[0], top = params[1], right = params[2], bottom = params[3]
    let polynum = parseInt(lines[++i])
    // each poly is # vertices, and then the vertices

}