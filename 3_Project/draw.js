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

    // var va = vec4(0.0, 0.0, -1.0, 1);
    // var vb = vec4(0.0, 0.942809, 0.333333, 1);
    // var vc = vec4(-0.816497, -0.471405, 0.333333, 1);
    // var vd = vec4(0.816497, -0.471405, 0.333333, 1);
    var va = vec4(0.0, 0.0, -1.0, 1);
    var vb = vec4(0.0, 0.942809, 0.333333, 1);
    var vc = vec4(-0.816497, -0.471405, 0.333333, 1);
    var vd = vec4(0.816497, -0.471405, 0.333333, 1);

    tetrahedron(va, vb, vc, vd, 4);
    return pointsArray
}


function render() {
    pMatrix = perspective(fovy, aspect, .1, 45);
    gl.uniformMatrix4fv(projection, false, flatten(pMatrix));

    eye = vec3(0, 0, 0);
    mvMatrix = lookAt(eye, at, up);

    //--------------------------------------------------------  Shape 0 Green root
    transforms.push({
        color: vec4(0, 1, 0, 1),// green
        shape: 'cube',
        parentIndex: -1, // no parent
        offset : 0,
        rot: (index, mv) => {
            transforms[index].offset += 4; 
            return mult(
                mv, 
                rotateY(45 + transforms[index].offset),
            )
        },
        trans: (index, mv) => { 
            return mult (
                    mv,
                    translate(0, 5, -20),
            ); 
        }
    });

    //--------------------------------------------------------  Shape 1 blue second level 
    transforms.push({
        color: vec4(0, 0, 1, 1), // blue
        shape: 'sphere',
        parentIndex: 0, // no parent
        rot: (index, mv) => {
            return mv;
        },
        trans: (index, mv) => { 
            // shift up
            return mult(
                mv,
                translate(-2,-2,0), 
            ); 
        }
    });

    //--------------------------------------------------------  Shape 2 purple circle third level
    transforms.push({
        color: vec4(1, 0, 1, 1), // purple circle
        shape: 'sphere',
        parentIndex: 1, // no parent
        offset: 0, 
        rot: (index, mv) => {
            transforms[index].offset += 10; 
            return mult (
                mv,
                rotateY(-1 * (45 + transforms[index].offset)),
            );
        },
        trans: (index, mv) => { 
            // shift up
            return mult (
                    mv,
                    translate(3,-3,0),
                    // rotateY(0),
                );
        }
    });

    //--------------------------------------------------------  Shape 3 red square thirdlevel
    transforms.push({
        color: vec4(1, 0, 0, 1), // red
        shape: 'cube',
        parentIndex: 1, 
        offset: 0, 
        rot: (index, mv) => {
            transforms[index].offset += 10; 
            return mult (
                mv,
                rotateY(-1 * (45 + transforms[index].offset)),
            );
        },
        trans: (index, mv) => { 
            // shift up
            transforms[index].offset += 10; 
            return mult(
                mv,
                translate(-1, -3, 0),
            );
        }
    });

    //--------------------------------------------------------  Shape 4 red 
    transforms.push({
        color: vec4(1, 0, 0, 1), // red
        shape: 'cube',
        parentIndex: 2, // purple circle
        offset: 0, 
        rot: (index, mv) => {
            transforms[index].offset += 10; 
            return mv; 
            // return mult (
            //     mv,
            // 	rotateY(-1 * (45 + transforms[index].offset)),
            // 	rotateY(0),
            // );
        },
        trans: (index, mv) => { 
            // shift up
            return mult(
                mv,
                translate(-2, -3, 0),
                // rotateY(0),
                // rotateY(0),
            );
        }
    });

    transforms.push({
        color: vec4(1, 0, .5, 1), // red
        shape: 'cube',
        parentIndex: 4, // Thing below circle
        offset: 0, 
        rot: (index, mv) => {
            // transforms[index].offset += 1; 
            return mv; 
            // return mult (
            //     mv,
            // 	// rotateY((45 + transforms[index].offset)),
            // 	rotateY(0),
            // );
        },
        trans: (index, mv) => { 
            return mult(
                mv,
                translate(-2, -3, 0),
                // rotateY(0),
            );
        }
    });

    animate(1);
}

var animationNumber = 1000;

async function animate(x) {
    if (x > animationNumber) {
        return;
    }
    else {
        drawShapes(x); 
        await sleep(50)
        animate(x + 1);
    }
}

function drawConnection (parentTrans, currentTrans, center) { 
    // let start = mult(parentTrans, vec4(center, center, center, 1)),
    //     end = mult(currentTrans, vec4(center, center, center, 1));
    let hparent = mult(parentTrans, vec4(0, 0, 0, 1)),
        hself = mult(currentTrans, vec4(0, 0, 0, 1));
    // hparent[1] += center
    // start[1] = end[1]
    // hparent[1] = hself[1]
    hself[1] = hparent[1]


    gl.uniformMatrix4fv(modelView, false, flatten(mvMatrix));

    let cube = [hself, hparent]
    let color = vec4(0,0,0,1)

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

    gl.drawArrays(gl.LINES, 0, cube.length);

    // start = mult(parentTrans, vec4(center, center, center, 1)),
    //     end = mult(currentTrans, vec4(center, center, center, 1));
    start = mult(parentTrans, vec4(0, 0, 0, 1)),
        end = mult(currentTrans, vec4(0, 0, 0, 1));

    // start[1] += center
    start[1] = hself[1];
    // end[0] = start[0]
    start[0] = hself[0]
    start[2] = hself[2]
    end[0] = hself[0]
    end[2] = hself[2]


    cube = [end,start]
    color = vec4(0,0,0,1)

    fragColors = [];

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

    gl.drawArrays(gl.LINES, 0, cube.length);
    
 }

function drawShapes() {
    stack = []
    transStack = []
    let getMvMatrix = (index) => {
        if (index == -1) {
            return mvMatrix; 
        }
        let parentIndex = transforms[index].parentIndex;
        if (stack.length > index) {
            return stack[index];
        }
        else {
            let cur = transforms[index]
            let currentTrans = cur.trans(index, getMvMatrix(parentIndex));
            let currentRot = cur.rot(index, currentTrans);
            stack[index] = currentRot;
            transStack[index] = currentTrans; 
            return [getMvMatrix(parentIndex), currentRot];
        }
    }

    transforms.forEach((trans, index) => {
        shape = shapes[trans.shape];
        let transMats = getMvMatrix(index); 
        let mvMatrix = transMats[1],
            parentMat = transMats[0];
        gl.uniformMatrix4fv(modelView, false, flatten(mvMatrix));
        draw(shape, transforms[index].color);
        
        if(trans.parentIndex >= 0){
            var center = .3;
            if(trans.shape === 'cube'){
                center = .3;
            }
            drawConnection(parentMat, mvMatrix, center)
        }
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
