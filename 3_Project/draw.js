var points;
var colors;

var NumVertices = 36;

var gl;

var fovy = 45.0;  // Field-of-view in Y direction angle (in degrees)
var aspect;       // Viewport aspect ratio
var program;

var mvMatrix, pMatrix;
var modelView, projection;
var eye;
const at = vec3(0.0, 0.0, 0.0);
const up = vec3(0.0, 1.0, 0.0);

var stack = [];

var shapes = {
    sphere: sphere(),
    cube: cube(),
}; // list of shapes to be drawn 
var transforms = [];
/**
  Transform: 
  {
      color: color to draw thing // todo might be more complex
      trans: (index, mv) => newMv
      parentIndex: of parent
  }
   --> for each shape draw with transform
 */


function main() {
    // Retrieve <canvas> element
    var canvas = document.getElementById('webgl');

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

    //Set up the viewport
    gl.viewport(0, 0, 400, 400);

    aspect = canvas.width / canvas.height;
    // Set clear color
    gl.clearColor(1.0, 1.0, 1.0, 1.0);

    // Clear <canvas> by clearing the color buffer
    gl.enable(gl.DEPTH_TEST);

    points = [];
    colors = [];

    projection = gl.getUniformLocation(program, "projectionMatrix");
    modelView = gl.getUniformLocation(program, "modelMatrix");

    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    render();
}

function cube() {
    var verts = [];
    verts = verts.concat(quad(1, 0, 3, 2));
    verts = verts.concat(quad(2, 3, 7, 6));
    verts = verts.concat(quad(3, 0, 4, 7));
    verts = verts.concat(quad(6, 5, 1, 2));
    verts = verts.concat(quad(4, 5, 6, 7));
    verts = verts.concat(quad(5, 4, 0, 1));
    return verts;
}

function sphere() {
    let pointsArray = [];
    let normalsArray = [];
    let index = 0; 
    let triangle = (a, b, c) => {
        pointsArray.push(a);
        pointsArray.push(b);
        pointsArray.push(c);

        // normals are vectors

        normalsArray.push(a[0], a[1], a[2], 0.0);
        normalsArray.push(b[0], b[1], b[2], 0.0);
        normalsArray.push(c[0], c[1], c[2], 0.0);

        index += 3;

    }
    let divideTriangle = (a, b, c, count) => {
        if (count > 0) {

            var ab = mix(a, b, 0.5);
            var ac = mix(a, c, 0.5);
            var bc = mix(b, c, 0.5);

            ab = normalize(ab, true);
            ac = normalize(ac, true);
            bc = normalize(bc, true);

            divideTriangle(a, ab, ac, count - 1);
            divideTriangle(ab, b, bc, count - 1);
            divideTriangle(bc, c, ac, count - 1);
            divideTriangle(ab, bc, ac, count - 1);
        }
        else {
            triangle(a, b, c);
        }
    }
    let tetrahedron = (a, b, c, d, n) => {
        divideTriangle(a, b, c, n);
        divideTriangle(d, c, b, n);
        divideTriangle(a, d, b, n);
        divideTriangle(a, c, d, n);
    }

    var va = vec4(0.0, 0.0, -1.0, 1);
    var vb = vec4(0.0, 0.942809, 0.333333, 1);
    var vc = vec4(-0.816497, -0.471405, 0.333333, 1);
    var vd = vec4(0.816497, -0.471405, 0.333333, 1);

    tetrahedron(va, vb, vc, vd, 4);
    return pointsArray
}


function render() {
    //--------------------------------------------------------  Shape 1
    pMatrix = perspective(fovy, aspect, .1, 10);
    gl.uniformMatrix4fv(projection, false, flatten(pMatrix));

    eye = vec3(0, 0, 4);
    mvMatrix = lookAt(eye, at, up);
    // would store the transform as well here
    stack.push(mvMatrix); // stack[0] = first
    transforms.push({
        radius: 0,
        theta: 0,
        beta: 0,
        color: vec4(0, 1, 0, 1),
        shape: 'cube',
        parentIndex: 0,
        trans: () => { return 0; }
    });

    //--------------------------------------------------------  Shape 2

    transforms.push({
        color: vec4(1, 0, 0, 1),
        parentIndex: 0,
        shape: 'cube',
        offset: 0,
        trans: (index, mv) => {
            transforms[index].offset += 4; 
            return mult(rotateZ(45 + transforms[index].offset), mv);
        }
    });


    transforms.push({
        color: vec4(0, 0, 1, 1),
        parentIndex: 1,
        shape: 'cube',
        trans: (index, mv) => {
            return mult(rotateZ(10), mv);
        }
    });

    transforms.push({
        color: vec4(0, 0, 1, 1),
        parentIndex: 2,
        shape: 'cube',
        offset: 0, 
        trans: (index, mv) => {
    // mvMatrix = mult(mvMatrix, translate(-1, -1, -1));
            transforms[index].offset += 10; 
            let offset = transforms[index].offset
            return mult(
                mv,
                mult(translate(-1,-1,-1), rotateZ(45+offset))
            );
        }
    });

    // mvMatrix = mult(rotateZ(45), mvMatrix);

    // gl.uniformMatrix4fv( modelView, false, flatten(mvMatrix) );
    // draw(redCube, vec4(1.0, 0.0, 0.0, 1.0));

    // //--------------------------------------------------------  Shape 3

    // mvMatrix = mult(mvMatrix, translate(-1, -1, -1));
    // gl.uniformMatrix4fv( modelView, false, flatten(mvMatrix) );
    // draw(magentaCube, vec4(1.0, 0.0, 1.0, 1.0));

    // //--------------------------------------------------------  Shape 4

    // mvMatrix = stack.pop();
    // stack.push(mvMatrix);
    // mvMatrix = mult(mvMatrix, translate(1, 1, 1));
    // gl.uniformMatrix4fv( modelView, false, flatten(mvMatrix) );
    // draw(blueCube, vec4(0.0, 0.0, 1.0, 1.0));

    // mvMatrix = stack.pop();
    // mvMatrix = mult(mvMatrix, translate(-1, -1, -1));
    // gl.uniformMatrix4fv( modelView, false, flatten(mvMatrix) );
    // draw(greenCube, vec4(0.0, 1.0, 0.0, 1.0));
    animate(1);
}

async function animate(x) {
    if (x > 1000) {
        return;
    }
    else {
        drawShapes(x); 
        await sleep(50)
        animate(x + 1);
    }
}

function drawShapes() {
    stack = [stack[0]]
    let getMvMatrix = (index) => {
        let parentIndex = transforms[index].parentIndex;
        if (stack.length > index) {
            return stack[index];
        }
        else {
            let cur = transforms[index]
            let currentTrans = cur.trans(index, getMvMatrix(parentIndex));
            stack[index] = currentTrans;
            return currentTrans;
        }
    }


    transforms.forEach((trans, index) => {
        shape = shapes[trans.shape];
        let mvMatrix = getMvMatrix(index);
        gl.uniformMatrix4fv(modelView, false, flatten(mvMatrix));
        draw(shape, transforms[index].color);
    });
}

function draw(cube, color) {
    var fragColors = [];

    for (var i = 0; i < cube.length; i++) {
        fragColors.push(color);
    }

    var pBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, pBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(cube), gl.STATIC_DRAW);

    var vPosition = gl.getAttribLocation(program, "vPosition");
    gl.vertexAttribPointer(vPosition, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition);

    var cBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, cBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(fragColors), gl.STATIC_DRAW);

    var vColor = gl.getAttribLocation(program, "vColor");
    gl.vertexAttribPointer(vColor, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vColor);

    gl.drawArrays(gl.TRIANGLES, 0, cube.length);

}


function quad(a, b, c, d) {
    var verts = [];

    var vertices = [
        vec4(-0.5, -0.5, 0.5, 1.0),
        vec4(-0.5, 0.5, 0.5, 1.0),
        vec4(0.5, 0.5, 0.5, 1.0),
        vec4(0.5, -0.5, 0.5, 1.0),
        vec4(-0.5, -0.5, -0.5, 1.0),
        vec4(-0.5, 0.5, -0.5, 1.0),
        vec4(0.5, 0.5, -0.5, 1.0),
        vec4(0.5, -0.5, -0.5, 1.0)
    ];

    var indices = [a, b, c, a, c, d];

    for (var i = 0; i < indices.length; ++i) {
        verts.push(vertices[indices[i]]);
    }

    return verts;
}

/**
 * Helper function to slow down event loop
 * based on a stack overflow entry / MSDN documentation
 */
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
