"use strict";
// Global variables
var canvas;
var gl;
var numVertices = 36;
var program;

// Arrays
var pointsArray = [];
var colorsArray = [];
var normalsArray = [];
var texPointsArray = [];

// List of vertices
var vertices = [
    vec4(-0.5, -0.5,  0.5, 1.0),
    vec4(-0.5,  0.5,  0.5, 1.0),
    vec4(0.5,  0.5,  0.5, 1.0),
    vec4(0.5, -0.5,  0.5, 1.0),
    vec4(-0.5, -0.5, -0.5, 1.0),
    vec4(-0.5,  0.5, -0.5, 1.0),
    vec4(0.5,  0.5, -0.5, 1.0),
    vec4(0.5, -0.5, -0.5, 1.0) ];

// List of colors
var vertexColors = [
    vec4(0.0, 0.0, 0.0, 1.0),  // black
    vec4(1.0, 0.0, 0.0, 1.0),  // red
    vec4(1.0, 1.0, 0.0, 1.0),  // yellow
    vec4(0.0, 1.0, 0.0, 1.0),  // green
    vec4(0.0, 0.0, 1.0, 1.0),  // blue
    vec4(1.0, 0.0, 1.0, 1.0),  // magenta
    vec4(0.0, 1.0, 1.0, 1.0),  // white
    vec4(0.0, 1.0, 1.0, 1.0) ];  // cyan
    
// List of texture points
var texCoord = [
    vec2(1, 1),
    vec2(1, 0),
    vec2(0, 0),
    vec2(0, 1) ];

// ModelViewMatrix variables
var modelViewMatrix;
var modelViewMatrixLoc;
const at = vec3(0.0, 0.0, 0.0);
const up = vec3(0.0, 1.0, 0.0);

// ProjectionMatrix variables
var projectionMatrix;
var projectionMatrixLoc;
var projectionType = 1; // 1: Perspective projection; 2: Orthographic projection; 3: Both projections at the same time

// Eye variables
var eye;
var radius = 3.0;
var theta = 0.0;
var phi = 0.0;

// Viewing volume variables
var near = 0.1;
var far = 8.0;

// Perspective-only variables
var fovy = 45.0; 
var aspect = 1;

// Orthographic-only variables
var left = -1.0;
var right = 1.0;
var ytop = 1.0;
var bottom = -1.0;

// Scaling variables
var scale = 1;
var scaleLoc;

// Translating variables
var translation = 0;
var translationLoc;

// Shading and lighting variables
var shadingType = 1; // 1: No shading; 2: Gouraud Model; 3: Phong Model
var shadingTypeLoc;

var lightPosition = vec4(0.5, 0.6, 2.0, 0.9);
var lightAmbient = vec4(0.2, 0.2, 0.2, 1.0);
var lightDiffuse = vec4(0.7, 0.9, 1.0, 1.0);
var lightSpecular = vec4(1.0, 1.0, 1.0, 1.0);

var materialAmbient = vec4(0.0, 0.0, 1.0, 1.0);
var materialDiffuse = vec4(0.0, 0.0, 0.7, 1.0);
var materialSpecular = vec4(1.0, 1.0, 1.0, 1.0);
var materialShininess = 15.0;

// Texture variables
var texture;
var mappingType = 0; // 0: No mapping; 1: Mapping
var mappingTypeLoc;

// Fill the arrays with all the necessary points in order to create a cube
function quad(a, b, c, d) {
     var t1 = subtract(vertices[b], vertices[a]);
     var t2 = subtract(vertices[c], vertices[b]);
     var normal = cross(t1, t2);
     var normal = vec4(normal, 0);

     pointsArray.push(vertices[a]);
     colorsArray.push(vertexColors[a]);
     normalsArray.push(normal);
     texPointsArray.push(texCoord[0]);

     pointsArray.push(vertices[b]);
     colorsArray.push(vertexColors[a]);
     normalsArray.push(normal);
     texPointsArray.push(texCoord[1]);

     pointsArray.push(vertices[c]);
     colorsArray.push(vertexColors[a]);
     normalsArray.push(normal);
     texPointsArray.push(texCoord[2]);

     pointsArray.push(vertices[a]);
     colorsArray.push(vertexColors[a]);
     normalsArray.push(normal);
     texPointsArray.push(texCoord[0]);

     pointsArray.push(vertices[c]);
     colorsArray.push(vertexColors[a]);
     normalsArray.push(normal);
     texPointsArray.push(texCoord[2]);

     pointsArray.push(vertices[d]);
     colorsArray.push(vertexColors[a]);
     normalsArray.push(normal); 
     texPointsArray.push(texCoord[3]);}

function colorCube() {
    quad(1, 0, 3, 2);
    quad(2, 3, 7, 6);
    quad(3, 0, 4, 7);
    quad(6, 5, 1, 2);
    quad(4, 5, 6, 7);
    quad(5, 4, 0, 1); }

// Create a texture    
function configureTexture(image, i) {
    texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    if (i == 0) {
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, texSize, texSize, 0, gl.RGBA, gl.UNSIGNED_BYTE, image); }
    else {
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image); }
    gl.generateMipmap(gl.TEXTURE_2D);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST_MIPMAP_LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.uniform1i(gl.getUniformLocation(program, "texture"), 0); }

// Create checkerboard texture
var texSize = 64;

var image1 = new Array();
for (var i = 0; i < texSize; i++) {
    image1[i] = new Array(); }
for (var i = 0; i < texSize; i++) {
    for ( var j = 0; j < texSize; j++) {
        image1[i][j] = new Float32Array(4); } }
for (var i = 0; i < texSize; i++) {
    for (var j = 0; j < texSize; j++) {
        var c = (((i & 0x8) == 0) ^ ((j & 0x8) == 0));
        image1[i][j] = [c, c, c, 1]; } }

var image2 = new Uint8Array(4*texSize*texSize);
for ( var i = 0; i < texSize; i++ ) {
    for ( var j = 0; j < texSize; j++ ) {
        for(var k = 0; k < 4; k++) {
            image2[4*texSize*i+4*j+k] = 255*image1[i][j][k]; } } }

// Main
window.onload = function init() {
    // INITIALIZE CANVAS
    canvas = document.getElementById("gl-canvas");
    gl = WebGLUtils.setupWebGL(canvas);
    if (!gl) { 
        alert("WebGL isn't available"); }
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(1.0, 1.0, 1.0, 1.0);
    gl.enable(gl.DEPTH_TEST);

    // LOAD SHADERS
    program = initShaders(gl, "vertex-shader", "fragment-shader");
    gl.useProgram(program);

    // INITIALIZE CUBE
    colorCube();

    // INITIALIZE BUFFERS
    var cBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, cBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(colorsArray), gl.STATIC_DRAW);

    var vColor = gl.getAttribLocation(program, "vColor");
    gl.vertexAttribPointer(vColor, 4, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray(vColor);

    var vBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(pointsArray), gl.STATIC_DRAW);

    var vPosition = gl.getAttribLocation(program, "vPosition");
    gl.vertexAttribPointer(vPosition, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition);
    
    var nBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, nBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(normalsArray), gl.STATIC_DRAW);

    var vNormal = gl.getAttribLocation(program, "vNormal");
    gl.vertexAttribPointer(vNormal, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vNormal);
    
    var tBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, tBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(texPointsArray), gl.STATIC_DRAW);

    var vTexPoints = gl.getAttribLocation(program, "vTexPoints");
    gl.vertexAttribPointer(vTexPoints, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vTexPoints);
    
    // SHADING OPERATIONS
    var ambientProduct = mult(lightAmbient, materialAmbient);
    var diffuseProduct = mult(lightDiffuse, materialDiffuse);
    var specularProduct = mult(lightSpecular, materialSpecular);
    
    // LINK UNIFORM VARIABLES
    scaleLoc = gl.getUniformLocation(program, "scale");
    translationLoc = gl.getUniformLocation(program, "translation");
    modelViewMatrixLoc = gl.getUniformLocation(program, "modelViewMatrix");
    projectionMatrixLoc = gl.getUniformLocation(program, "projectionMatrix");
    shadingTypeLoc = gl.getUniformLocation(program, "shadingType");
    mappingTypeLoc = gl.getUniformLocation(program, "mappingType");
    
    // REFRESH UNIFORM VARIABLES ON HTML file
    gl.uniform4fv(gl.getUniformLocation(program, "ambientProduct"), flatten(ambientProduct));
    gl.uniform4fv(gl.getUniformLocation(program, "diffuseProduct"), flatten(diffuseProduct));
    gl.uniform4fv(gl.getUniformLocation(program, "specularProduct"), flatten(specularProduct));
    gl.uniform4fv(gl.getUniformLocation(program, "lightPosition"), flatten(lightPosition));
    gl.uniform1f(gl.getUniformLocation(program, "shininess"), materialShininess);
    
    // GET ATTRIBUTES FROM SLIDERS
    document.getElementById("Far Plane").onchange = function(event) {
        far = event.target.value; };

    document.getElementById("Near Plane").onchange = function(event) {
        near = event.target.value; };

    document.getElementById("Radius").onchange = function(event) {
        radius = event.target.value; };

    document.getElementById("Theta").onchange = function(event) {
        theta = event.target.value* Math.PI/180.0; };

    document.getElementById("Phi").onchange = function(event) {
        phi = event.target.value* Math.PI/180.0; };

    document.getElementById("Scaling").onchange = function(event) {
        scale = event.target.value; };

    document.getElementById("Translating").onchange = function(event) {
        translation = event.target.value; };

    // GET ATTRIBUTES FROM BUTTONS
    document.getElementById("Perspective").onclick = function() {
        projectionType = 1; 
        this.disabled = true;
        document.getElementById("Orthographic").disabled = false;
        document.getElementById("Both").disabled = false; };

    document.getElementById("Orthographic").onclick = function() {
        projectionType = 2;
        this.disabled = true;
        document.getElementById("Perspective").disabled = false;
        document.getElementById("Both").disabled = false; };

    document.getElementById("Both").onclick = function() {
        projectionType = 3;
        this.disabled = true;
        document.getElementById("Perspective").disabled = false;
        document.getElementById("Orthographic").disabled = false; };
        
    document.getElementById("ShadingOff").onclick = function() {
        shadingType = 1;
        this.disabled = true;
        document.getElementById("Gouraud").disabled = false;
        document.getElementById("Phong").disabled = false; };
        
    document.getElementById("Gouraud").onclick = function() {
        shadingType = 2;
        this.disabled = true;
        document.getElementById("ShadingOff").disabled = false;
        document.getElementById("Phong").disabled = false; };
        
    document.getElementById("Phong").onclick = function() {
        shadingType = 3;
        this.disabled = true;
        document.getElementById("ShadingOff").disabled = false;
        document.getElementById("Gouraud").disabled = false; };
        
    document.getElementById("TexturingOff").onclick = function() {
        mappingType = 0;
        this.disabled = true;
        document.getElementById("Procedural").disabled = false;
        document.getElementById("External").disabled = false; };
    
    document.getElementById("Procedural").onclick = function() {
        mappingType = 1;
        this.disabled = true;
        configureTexture(image2, 0);
        document.getElementById("TexturingOff").disabled = false;
        document.getElementById("External").disabled = false; };
        
     document.getElementById("External").onclick = function() {
        mappingType = 1;
        this.disabled = true;
        var image3 = document.getElementById("texImage");
        configureTexture(image3, 1);
        document.getElementById("TexturingOff").disabled = false;
        document.getElementById("Procedural").disabled = false; };

    // RENDER
    render(); }

var render = function() {
    // CLEAR BUFFER
    gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // REFRESH GLOBAL VARIABLES
    gl.uniform1f(scaleLoc, scale);
    gl.uniform1f(translationLoc, translation);
    gl.uniform1i(shadingTypeLoc, shadingType);
    gl.uniform1i(mappingTypeLoc, mappingType);

    // SET MODELVIEWMATRIX
    eye = vec3(radius*Math.sin(theta)*Math.cos(phi), radius*Math.sin(theta)*Math.sin(phi), radius*Math.cos(theta));
    modelViewMatrix = lookAt(eye, at, up);
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(modelViewMatrix));
    
    // SINGLE VIEW SETUP
    if (projectionType != 3) {
    
        // INITIALIZE FULL CANVAS
        gl.viewport(0, 0, canvas.width, canvas.height);
        
        // SET PROJECTIONMATRIX
        if (projectionType == 1) {
            projectionMatrix = perspective(fovy, aspect, near, far); }
        else {
            projectionMatrix = ortho(left, right, bottom, ytop, near, far); }
        gl.uniformMatrix4fv(projectionMatrixLoc, false, flatten(projectionMatrix));
        
        // DRAW
        gl.drawArrays(gl.TRIANGLES, 0, numVertices); }
    
    // DOUBLE VIEW SETUP
    else {
    
        // INITIALIZE PERSPECTIVE PROJECTIONMATRIX ON UPPER LEFT CANVAS
        gl.viewport(0, canvas.height*0.5, canvas.width*0.5, canvas.height*0.5);
        projectionMatrix = perspective(fovy, aspect, near, far);
        gl.uniformMatrix4fv(projectionMatrixLoc, false, flatten(projectionMatrix));
        
        // DRAW ON FIRST CANVAS
        gl.drawArrays(gl.TRIANGLES, 0, numVertices);
        
        // INITIALIZE ORTHOGONAL PROJECTIONMATRIX ON LOWER RIGHT CANVAS
        gl.viewport(canvas.width*0.5, 0, canvas.width*0.5, canvas.height*0.5);
        projectionMatrix = ortho(left, right, bottom, ytop, near, far);
        gl.uniformMatrix4fv(projectionMatrixLoc, false, flatten(projectionMatrix));
        
        // DRAW ON SECOND CANVAS
        gl.drawArrays(gl.TRIANGLES, 0, numVertices); }
    
    // REFRESH CANVAS
    requestAnimFrame(render); }