//3456789_123456789_123456789_123456789_123456789_123456789_123456789_123456789_
// (JT: why the numbers? counts columns, helps me keep 80-char-wide listings)

// Tabs set to 2

/*=====================
GUIbox-Lib.js library: 
===================== 
One 'GUIbox' object collects together everything our program needs to respond 
properly to all user inputs, including:
--Mouse click, double-click, and drag,
--Keyboard keyboard inputs,
--HTML objects for Graphical User Interface, including:
-- on-screen buttons users can 'push' (click)
-- edit-boxes where users can enter numbers or text strings;
-- spans where our program can print messages for users,
--Window objects (e.g. browser) messages such as:
--Window re-size, 
--Window 'tool tips' (appear when mouse hovers over HTML5 element)
--Window hide/reveal, etc.
USAGE:
=======================
1) Add the GUIbox-Lib.js function to your HTML file
(be sure it's BEFORE the JS file that holds 'main()', like this:)
... (earlier HTML stuff) ...
<script src="JT_GUIbox-Lib.js"></script>
<script src_"myMainFile.js"></script>
... (later HTML stuff) ...
2) Create one global GUIbox object in your JS file that holds main(), like this:
(How? put this line above your JS main() function):
var gui = new GUIbox();
3) Near the start of main(), initialize your one global GUIbox object:
gui.init();
(where? be sure to put it AFTER creating the HTML-5 'canvas' element &
and AFTER creating the WebGL drawing context, and before you begin any
animation or GUI tasks)
4) Take a moment to read the rest of this file, to examine the 'gui' object's 
methods.  Recommended:
-- Please don't modify the mouse-event handling functions, but instead use 
the xCVV, yCVV values to supply mouse-motion values in your program.
-- Please *DO* extend the keyboard-event handling functions by expanding 
their 'switch()' statements to respond to additional keys as needed.
*/


// Written for EECS 351-2,	Intermediate Computer Graphics,
//				Northwestern Univ. EECS Dept., Jack Tumblin
// 2018.05.20 Created, integrated into 'Week01' starter code for ray-tracing
// 2018.06.07 Added 'strafe_Up()' strafe_Dn() + 'orbiting' instructions.
// 2019.05.20 Updated comments & keyboard fcns; remove deprecated 'keyPress'

//==============================================================================
//=============================================================================
function GUIbox() {	
//=============================================================================
//==============================================================================
// CONSTRUCTOR for one re-usable 'GUIbox' object that holds all data and fcns 
// needed to capture and respond to all user inputs/outputs.

  this.isDrag = false;	// mouse-drag: true while user holds down mouse button

  this.xCVV=1.0;			// Results found from last call to this.MouseToCVV()
  this.yCVV=0.0;

  this.xMpos=0.0;			// last recorded mouse position (in CVV coords)
  this.yMpos=0.0;   

  this.xMdragTot=0.0; // total (accumulated) mouse-drag amounts(in CVV coords).
  this.yMdragTot=0.0;  
}

GUIbox.prototype.init = function() {
//==============================================================================
// Set the browser window to use GUIbox member functions as 'callbacks' for all
// user-interface events.
// Call this function in main(), after you set up your HTML-5 canvas object and
// your WebGL drawing context.
//BACKGROUND-------------------------------
// (SEE:  https://www.w3schools.com/jsref/met_document_addeventlistener.asp)
// When users move, click or drag the mouse and when they press a key on the 
// keyboard the operating system create a simple text-based 'event' message.
// Your Javascript program can respond to 'events' if you:
// a) tell JavaScript to 'listen' for each event that should trigger an
//   action within your program: call the 'addEventListener()' function, and 
// b) write your own 'event-handler' function for each of the user-triggered 
//    actions; Javascript's 'event-listener' will call your 'event-handler'
//		function each time it 'hears' the triggering event from users.
//
// Create 'event listeners' for a few vital mouse events 
// (others events are available too... google it!).  

// --------!!! SURPRISE !!!-------------------------
// Our earlier, naive way of setting mouse callback functions made calls to
// isolated functions that were NOT members of an object or a prototype: 
//      (e.g.     window.addEventListener("mousedown", myMouseDown);  )
// That's the old, simple, obvious way that works.
// But if we assemble all our callback functions into a nice neat GUIbox object, 
// and if the GUIbox init() function sets them as event-listeners like this:
//                window.addEventListener("mousedown", this.mouseDown);
// ----- .SOMETHING WEIRD HAPPENS. -----
// Mouse-down events *DO* call our GUIbox's mouseDown() member function, but
// inside mouseDown() we can't use 'this' to access any other GUIbox members;
//      console.log('this.isDown', this.isDown); //  prints 'undefined'
//      console.log('this:', this); // prints object that CALLED our callback!
// WHY THIS HAPPENS:
// --Callback functions are 'closures'; when executing them, 'this' refers to
//  the object that was given the closure, and not the object that contains the
//  function.
// HOW TO FIX IT:
//  Read down thru the code just above 'Legacy Internet Explorer..." here:
//   https://developer.mozilla.org/en-US/docs/Web/API/EventTarget/addEventListener
// The simplest solution is to use closures more cleverly:
//  a) Within our 'init()' function, create a local object 'that'. 
//     The 'that' variable is just a simple reference to our GUIbox object.
//  b) Create an anonymous (e.g. no-name) function to use as our callback; 
//  c) within the 'anonymous' function, use the 'that' object to call the 
//      desired (named) method we want to use as our callback.  Inside the named
//      callback function (e.g. that.mouseDown() ), you will find that 'this'
//      refers to the GUIbox object specified by 'that', and we now can access
//      other GUIbox members we may need such as xCVV, etc.
//-----------------------------------MORE ON THIS TOPIC:
// https://stackoverflow.com/questions/20279484/how-to-access-the-correct-this-inside-a-callback
// TUTORIAL: http://javascriptissexy.com/understand-javascript-callback-functions-and-use-them/
// TUTORIAL: https://www.w3schools.com/js/js_function_closures.asp
//------------------------------------------------------------------------------

  var that = this;    // (local) reference to the current GUIbox object;
  // used in anonymous functions to restore simple
  // expected behavior of 'this' inside GUIbox functions. 
  // MOUSE:--------------------------------------------------
  window.addEventListener("mousedown", 
  function(mev) {return that.mouseDown(mev);     } ); 
  // (After each 'mousedown' event, browser calls this anonymous method that
  //    does nothing but return the 'that' object's mouseDown() method.
  //    WHY? to ensure proper operation of 'this' within the mouseDown() fcn.)
  window.addEventListener("mousemove", 
  function(mev) {return that.mouseMove(mev);     } ); 
  window.addEventListener("mouseup",   
  function(mev) {return that.mouseUp(mev);       } );	
  window.addEventListener("keydown", 
  function(kev) {return that.keyDown(kev);  }, false);
  // After each 'keydown' event, call the 'GUIbox.keyDown()' function; 'false'
  // (default) means event handler executed in  'bubbling', not 'capture')
  // ( https://www.w3schools.com/jsref/met_document_addeventlistener.asp )
  window.addEventListener("keyup", 
  function(kev) {return that.keyUp(kev);    }, false);
  // END Mouse & Keyboard Event-Handlers----------------------------------------


  // Camera-Navigation:----------------------------------
  this.camYaw = Math.PI/2.0;              // (initially I aim in +y direction)
  this.camYawInit = this.camYaw;  // save initial value for use in mouseMove().
  this.camPitch = 0.0;        // Initially aim at horizon; level with xy plane 
  this.camPitchInit = this.camPitch;  // save initial value for mouseMove().
  this.camEyePt = vec4.fromValues(0,-8,2,1);  // initial camera position
  this.camAimPt = vec4.fromValues(       // point on yaw-pitch sphere around eye:
  this.camEyePt[0] + Math.cos(this.camYaw)*Math.cos(this.camPitch), // x
  this.camEyePt[1] + Math.sin(this.camYaw)*Math.cos(this.camPitch), // y
  this.camEyePt[2] + Math.sin(this.camPitch), 1.0); // w. 
  this.camUpVec = vec4.fromValues(   // +90deg == Math.PI/2
  Math.cos(this.camYaw)*Math.cos(this.camPitch + Math.PI/2),  // x 
  Math.sin(this.camYaw)*Math.cos(this.camPitch + Math.PI/2),  // y
  Math.sin(this.camPitch + Math.PI/2), 0.0);   // w=0 for vectors, =1 for points.
  this.camSpeed = 0.5;	      // world-space distance moved per keystroke

  // Set initial Camera Lens (intrinsics)-----------------------  
  // These values should match those used in our ray-tracer, set in the file
  // JT_tracer0-Scene.js, in the function CScene.prototype.initScene().

  this.camFovy  = 90.0;   // vertical field-of-view in degrees, measured from
  // bottom to top of camera image.
  this.camAspect = 1.0;   // camera-image width/height (sets horizontal FOV)
  this.camNear = 1.0;     // distance from Center of Projection to viewing plane
  // (where we define left,bot,top values from Fovy & aspect)
  this.camFar = 10000;    // distance to frustum's outermost clipping plane
}

GUIbox.prototype.mouseDown = function(mev) {
  this.mouseToCVV(mev);									// convert to CVV coordinates:
                                                  // (result in  this.xCVV, this.yCVV)
  this.xMpos = this.xCVV;             // save current position, and...
  this.yMpos = this.yCVV;
  this.isDrag = true;						  		// set our mouse-dragging flag
  this.xMpos.toFixed(5) + ', ' + this.yMpos.toFixed(5);
  console.log('GUIbox.mouseDown(): xMpos,yMpos== ' + 
  this.xMpos.toFixed(5) + ', ' + this.yMpos.toFixed(5));
}

GUIbox.prototype.mouseMove = function(mev) {	
  if(this.isDrag==false) return;		// IGNORE all mouse-moves except 'dragging'
  this.mouseToCVV(mev);							// convert to CVV coordinates:
  this.xMdragTot += (this.xCVV - this.xMpos); // Accumulate change-in-mouse-position,&
  this.yMdragTot += (this.yCVV - this.yMpos);
  this.xMpos = this.xCVV;	                    // Make next drag-measurement from here.
  this.yMpos = this.yCVV;

  // Camera navigation:
  // Use mouse-drag amounts (in CVV units) to update camera aiming angles:
  this.camAim(this.xMdragTot, -this.yMdragTot); // why negative y drag? feels  
  drawAll();		// we MOVED the camera -- re-draw everything!
}

GUIbox.prototype.mouseUp = function(mev) {
  this.mouseToCVV(mev);               // CONVERT event to CVV coord system 
  this.isDrag = false;								// CLEAR our mouse-dragging flag, and
  // accumulate any final portion of mouse-dragging we did:
  this.xMdragTot += (this.xCVV - this.xMpos);
  this.yMdragTot += (this.yCVV - this.yMpos);
  this.xMpos = this.xCVV;             // RECORD this latest mouse-position.
  this.yMpos = this.yCVV;

  // display it on our webpage, too...
  document.getElementById('MouseResult0').innerHTML = 
  'GUIbox.mouseUp(       ) at CVV coords x,y = ' + 
  this.xMpos.toFixed(5) + ', ' + 
  this.yMpos.toFixed(5);
}

GUIbox.prototype.mouseToCVV = function(mev) {
  var rect = g_canvasID.getBoundingClientRect(); // get canvas corners in pixels
  var xp = mev.clientX - rect.left;						   // x==0 at canvas left edge
  var yp = g_canvasID.height -(mev.clientY -rect.top); 

  // Then convert to Canonical View Volume (CVV) coordinates:
  this.xCVV = (xp - g_canvasID.width/2) / (g_canvasID.width/2);	  // normalize canvas to -1 <= x < +1,
  this.yCVV = (yp - g_canvasID.height/2) / (g_canvasID.height/2);
}

GUIbox.prototype.keyDown = function(kev) {    
  switch(kev.code) {
    case "Digit0":	
      g_myScene.initScene(0);
      reload();
    break;
    case "Digit1":		
      g_myScene.initScene(1);
      reload();
    break;
    //------------------Ray Tracing---------------------- 
    case "KeyC":                // Clear the ray-traced image   
      g_myPic.setTestPattern(1);      // solid orange.
      g_sceneNum = 1;       // (re-set onScene() button-handler, too)
      rayView.switchToMe(); // be sure OUR VBO & shaders are in use, then
      rayView.reload();     // re-transfer VBO contents and texture-map contents
      drawAll();
    break;
    case "KeyT": 
      g_myScene.makeRayTracedImage(); // (near end of traceSupplement.js)			
      rayView.switchToMe(); // be sure OUR VBO & shaders are in use, then
      rayView.reload();     // re-transfer VBO contents and texture-map contents
      drawAll();			// redraw BOTH viewports onscreen.
    break;
    case "KeyA":
      this.camStrafe_L();
    break;
    case "KeyD":
      this.camStrafe_R();
    break;
    case "KeyS":
      this.camRev();
    break;
    case "KeyW":
      this.camFwd();
    break;		
    case "KeyQ":
      this.camStrafe_Dn();
    break;
    case "KeyE":
      this.camStrafe_Up();
    break;
    case "ArrowLeft": 	
    break;
    case "ArrowRight":
    break;
    case "ArrowUp":		
    break;
    case "ArrowDown":
    break;	
    case "KeyJ":
      g_myScene.lamp.lightPos[0] -= 0.5;
      reload();
    break;
    case "KeyL":
      g_myScene.lamp.lightPos[0] += 0.5;
      reload();
    break;
    case "KeyI":
      g_myScene.lamp.lightPos[1] += 0.5;
      reload();
    break;
    case "KeyK":
      g_myScene.lamp.lightPos[1] -= 0.5;
      reload();
    break;
    case "KeyO":
      g_myScene.lamp.lightPos[2] += 0.5;
      reload();
    break;
    case "KeyU":
      g_myScene.lamp.lightPos[2] -= 0.5;
      reload();
    break;
    default:
    break;
  }

}

GUIbox.prototype.keyUp = function(kev) {
}

GUIbox.prototype.camAim = function(xRad, yRad) {
  //==============================================================================
  // Change camera aiming direction by pitching 'xRad' radians above horizon (the
  // initial pitch amount), and yawing 'yRad' radians away from initial yaw amount.
  // (measured in counter-clockwise (CCW) radians in xy plane from +x axis)
  // NOTE this function gets called by 'GUIbox.mouseDrag()' and by keyDown().

  this.camYaw = this.camYawInit + xRad;     // Horiz drag in radians
  this.camPitch = this.camPitchInit + yRad; // Vert drag in radians
  if(this.camYaw < -Math.PI) {  // keep yaw angle values between +/- PI
    this.camYaw += 2*Math.PI;   
  }
  else if(this.camYaw > Math.PI) {
    this.camYaw -= 2*Math.PI;
  }
  if(this.camPitch < -Math.PI/2) {    // ALSO, don't let pitch go below -90deg 
    this.camPitch = -Math.PI/2;       // (-Z aiming direction)
    // We want y-axis mouse-dragging to set camera pitch. When pitch reaches its
    // lowermost limit of -PI/2, what's the mouse-drag value yMdragTot?
    // camPitch = camPitchInit - yMdragTot == -PI/2; add yMdragTot to both sides:
    //            camPitchInit == yMdragTot -PI/2;  then add PI/2 to both sides:
    //            (camPitchInit + PI/2) == yMdragTot;  
    // THUS ANY mouse-drag totals > than this amount will get ignored!
    this.yMdragTot = this.camPitchInit + Math.PI/2; // upper limit on yMdragTot.
  }
  else if(this.camPitch > Math.PI/2) {  // AND never let pitch go above +90deg:
    this.camPitch = Math.PI/2;          // (+Z aiming direction)
    this.yMdragTot = this.camPitchInit -Math.PI/2; // lower limit on yMdragTot.
  }
  // update camera aim point using spherical coords:
  this.camAimPt[0] = this.camEyePt[0] + Math.cos(this.camYaw)*Math.cos(this.camPitch);  // x
  this.camAimPt[1] = this.camEyePt[1] + Math.sin(this.camYaw)*Math.cos(this.camPitch);  // y
  this.camAimPt[2] = this.camEyePt[2] + Math.sin(this.camPitch); // z
  // update the 'up' vector too (pitch up by an additional +90 degrees)
  this.camUpVec[0] = Math.cos(this.camYaw)*Math.cos(this.camPitch + Math.PI/2); 
  this.camUpVec[1] = Math.sin(this.camYaw)*Math.cos(this.camPitch + Math.PI/2);
  this.camUpVec[2] = Math.sin(this.camPitch + Math.PI/2); 

}

GUIbox.prototype.camFwd = function() {
  var fwd = vec4.create();
  vec4.sub(fwd, this.camAimPt, this.camEyePt);  // Eye-to-Aim point vector (w=0)
  vec4.normalize(fwd, fwd);                     // make vector unit-length
                      // (careful! normalize includes w)
  vec4.scale(fwd, fwd, this.camSpeed);          // scale length to set velocity
  vec4.add(this.camAimPt, this.camAimPt, fwd);  // add to BOTH points.
  vec4.add(this.camEyePt, this.camEyePt, fwd);
  drawAll();          // show new result on-screen.
}

GUIbox.prototype.camRev = function() {
  //==============================================================================
  // Move the camera BACKWARDS, in the reverse aiming direction (don't change aim)
  var rev = vec4.create();
  vec4.sub(rev,this.camEyePt, this.camAimPt);   // Aim-to-Eye point vector (w=0)
  vec4.normalize(rev,rev);                      // make it unit-length
                      // (careful! normalize includes w)
  vec4.scale(rev, rev, this.camSpeed);          // scale length to set velocity
  vec4.add(this.camAimPt, this.camAimPt, rev);  // add to BOTH points.
  vec4.add(this.camEyePt, this.camEyePt, rev);
  drawAll();          // show new result on-screen.
}

// HOW TO 'ORBIT' AROUND a 3D object as you watch it:
// Try this;  
// 1) aim the camera at an interesting 3D object scene feature to center it in 
//    your on-screen displays.
// 2) 'strafe' left a little; the 3D object will slide rightwards on-screen.
// 3) Re-aim the camera (yaw rightwards) to re-center the 3D object on-screen.
// 4) repeat this strafe-left/aim-right combination over and over, and you will
// find that your camera 'orbits' the object -- it moves in a horizontal circle 
// around the the 3D object as you watch it, allowing you to examine it from all 
// sides without any need to 'look away' to change viewpoints. The opposite
// combination (strafe-right/aim-left) orbits in the opposite direction.
//      You can make your camera move in a vertical-orbit as well by repeating
// the strafe-up/pitch-down combination; the opposite combination (strafe-down/
// pitch-up) orbits vertically in the opposite direction.
//      I find 'orbiting' moves extremely helpful as I explore 3D scenes: try it!


GUIbox.prototype.camStrafe_L = function() {
  var rtSide = vec4.fromValues(  Math.sin(this.camYaw), // x
    -Math.cos(this.camYaw), // y
    0.0, 0.0); // z, w (==0; vector, not point!)
  // rtSide is already unit length; no need to normalize.
  vec4.scale(rtSide, rtSide, -this.camSpeed);  // scale length to set velocity,
  vec4.add(this.camAimPt, this.camAimPt, rtSide);  // add to BOTH points.
  vec4.add(this.camEyePt, this.camEyePt, rtSide);
  drawAll();
}

GUIbox.prototype.camStrafe_R = function() {
  //==============================================================================
  // Move horizontally left-wards, perpendicular to aiming direction, without
  // changing aiming direction or height above ground.
  // 'rtSide' vector points rightwards, perpendicular to aiming direction.
  var rtSide = vec4.fromValues(  Math.sin(this.camYaw), // x
      -Math.cos(this.camYaw), // y
      0,0); // z,w  (vector, not point; w=0)
  // rtSide is already unit length; no need to normalize.
  vec4.scale(rtSide, rtSide, this.camSpeed);  // scale length to set velocity,
  vec4.add(this.camAimPt, this.camAimPt, rtSide);  // add to BOTH points.
  vec4.add(this.camEyePt, this.camEyePt, rtSide);
  drawAll();
}

GUIbox.prototype.camStrafe_Up = function() {
  //==============================================================================
  // Move upwards, perpendicular to aiming direction, without changing
  // aiming direction or pitch angle. CAREFUL! this is *NOT* just changing camera
  // altitude (Z value in world space), but instead moving in the 'up-vector'
  // direction calculated in mouseMove() above.
  var upSide = vec4.clone(this.camUpVec);   // make a local copy of this VECTOR
  upSide[3] = 0.0;                        // set w=0 to its a vec4 VECTOR.

  vec4.scale(upSide, upSide, this.camSpeed);    // scale length to set velocity;
  // console.log('upSide:', upSide);
  // console.log('BEFORE\n camAimPt:', this.camAimPt, '\ncamEyePt:', this.camEyePt);

  vec4.add(this.camAimPt, this.camAimPt, upSide);    // add to BOTH points.
  vec4.add(this.camEyePt, this.camEyePt, upSide);
  //console.log('AFTER\n camAimPt:', this.camAimPt, '\ncamEyePt:', this.camEyePt);

  drawAll();
}

GUIbox.prototype.camStrafe_Dn = function() {
  //==============================================================================
  // Move downwards, perpendicular to aiming direction, without changing
  // aiming direction or pitch angle.  CAREFUL! this is *NOT* just changing camera
  // altitude (Z value in world-space), but instead moving in the 'up-vector;
  // direction constructed in mouseMove() above.
  var upSide = vec4.clone(this.camUpVec);   // make a local copy of this VECTOR
  upSide[3] = 0.0;                        // set w=0 to its a vec4 VECTOR.

  vec4.scale(upSide, upSide, -this.camSpeed);    // scale length to set -velocity;
  vec4.add(this.camAimPt, this.camAimPt, upSide);    // add to BOTH points.
  vec4.add(this.camEyePt, this.camEyePt, upSide);
  drawAll();
}
