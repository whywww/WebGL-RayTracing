//-----For WebGL usage:-------------------------
var gl;
var g_canvasID;

//-----Mouse,keyboard, GUI variables-----------
var gui = new GUIbox(); 

//-----For the VBOs & Shaders:-----------------
preView = new VBObox0();  // For WebGLpreview
rayView = new VBObox1();  // For displaying the ray-tracing results.

//-----------Ray Tracer Objects:---------------
var g_myPic = new CImgBuf(512,512);  // CAUTION! WebGL 1.0 texture maps require power-of-two sizes (256, 512,1024,2048,etc).
var g_myScene = new CScene();

var g_SceneNum = 0;	 // scene-selector number; 0,1,2,... G_SCENE_MAX-1
var G_SCENE_MAX = 3;  // Number of scenes defined.

var g_AAcode = 1;  // Antialiasing setting: 1 == NO antialiasing at all. 
                   // 2,3,4... == supersamples: 2x2, 3x3, 4x4, ...
var G_AA_MAX = 4;  // highest super-sampling number allowed. 
var g_isJitter = 0;  // ==1 for jitter, ==0 for no jitter.

function main() {
    g_canvasID = document.getElementById('webgl');
    gl = g_canvasID.getContext("webgl", { preserveDrawingBuffer: true});
    if (!gl) {
        console.log('Failed to get the rendering context for WebGL');
        return;
    }
    
    gl.clearColor(0.2, 0.2, 0.2, 1);  // set RGBA color for clearing <canvas>
    gl.enable(gl.DEPTH_TEST);  // CAREFUL! don't do depth tests for 2D!

    gui.init();
    g_myScene.initScene(1);  // initialize our ray-tracer (to default scene)
    
    preView.init(gl);
    rayView.init(gl);

    onResize();
    drawAll();

    //---------OPTIONAL: do all the things done by 't' key; make our initial
    // ray-traced image automatically:
    g_myScene.makeRayTracedImage(); // run the ray-tracer		
    rayView.switchToMe(); // be sure OUR VBO & shaders are in use, then
    rayView.reload();     // re-transfer VBO contents and texture-map contents
    drawAll();
}

function drawAll() {
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.viewport(0, 0, gl.drawingBufferWidth/2, gl.drawingBufferHeight);
    preView.switchToMe();
    preView.adjust();
    preView.draw();	

    gl.viewport(gl.drawingBufferWidth/2, 0, gl.drawingBufferWidth/2, gl.drawingBufferHeight);
    rayView.switchToMe();  // Set WebGL to render from this VBObox.
    rayView.adjust();  // Send new values for uniforms to the GPU, and
    rayView.draw();	
}

function onResize() {
    //Make a square canvas/CVV fill the SMALLER of the width/2 or height:
    if(innerWidth > 2*innerHeight) {  // fit to brower-window height
        g_canvasID.width = 2*innerHeight - 20;  // (with 20-pixel margin)
        g_canvasID.height = innerHeight - 20;   // (with 20-pixel margin_
        }
    else {	// fit canvas to browser-window width
        g_canvasID.width = innerWidth - 20;       // (with 20-pixel margin)
        g_canvasID.height = 0.5*innerWidth - 20;  // (with 20-pixel margin)
        }	 		
    drawAll();
}

function onSuperSampleButton() {
    g_AAcode += 1;
    if(g_AAcode > G_AA_MAX) g_AAcode = 1; 
    if (g_isJitter)
        document.getElementById('AAreport').innerHTML = g_AAcode + " sample/pixel, but jittered.";
    else 
        document.getElementById('AAreport').innerHTML = g_AAcode + " sample/pixel. No jitter."; 
}

function onJitterButton() {
    if(g_isJitter ==0) g_isJitter = 1;
    else g_isJitter = 0;
    if (g_isJitter)
        document.getElementById('AAreport').innerHTML = g_AAcode + " sample/pixel, but jittered.";
    else 
        document.getElementById('AAreport').innerHTML = g_AAcode + " sample/pixel. No jitter."; 
}