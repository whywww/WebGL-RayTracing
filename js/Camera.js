function CCamera() {
    this.eyePt = vec4.fromValues(0,0,0,1);

    this.uAxis = vec4.fromValues(1,0,0,0);	// camera U axis == world x axis			
    this.vAxis = vec4.fromValues(0,1,0,0);	// camera V axis == world y axis
    this.nAxis = vec4.fromValues(0,0,1,0);	// camera N axis == world z axis.

    // Camera 'intrinsic' parameters
    this.iNear =  1.0;
	this.iLeft = -1.0;		
	this.iRight = 1.0;
	this.iBot =  -1.0;
    this.iTop =   1.0;
    
    // Image resolution
    this.xmax = g_myPic.xSiz;
    this.ymax = g_myPic.ySiz;
    
    this.xSampMax = 4;
    this.ySampMax = 4;
    
    this.ufrac = (this.iRight - this.iLeft) / this.xmax;
	this.vfrac = (this.iTop - this.iBot ) / this.ymax;
}

CCamera.prototype.rayFrustum = function(left, right, bot, top, near) {
    this.iLeft = left;
	this.iRight = right;
	this.iBot = bot;
	this.iTop = top;
	this.iNear = near;
}

CCamera.prototype.rayPerspective = function(fovy, aspect, zNear) {
    this.iNear = zNear;
    this.iTop = zNear * Math.tan(0.5*fovy*(Math.PI/180.0)); // tan(radians)
    this.iBot = -this.iTop;
    this.iRight = this.iTop*aspect;
    this.iLeft = -this.iRight;
}
    
CCamera.prototype.rayLookAt = function(eyePt, aimPt, upVec) {
    this.eyePt = eyePt;
    vec3.subtract(this.nAxis, this.eyePt, aimPt);  // aim-eye == MINUS N-axis direction
    vec3.normalize(this.nAxis, this.nAxis);   // N-axis must have unit length.
    vec3.cross(this.uAxis, upVec, this.nAxis);  // U-axis == upVec cross N-axis
    vec3.normalize(this.uAxis, this.uAxis);   // make it unit-length.
    vec3.cross(this.vAxis, this.nAxis, this.uAxis); // V-axis == N-axis cross U-axis
}

CCamera.prototype.setEyeRay = function(myeRay, xpos, ypos) {
    // Convert image-plane location (xpos,ypos) in the camera's U,V,N coords
    var posU = this.iLeft + xpos*this.ufrac;
    var posV = this.iBot  + ypos*this.vfrac;

    xyzPos = vec4.create();    // make vector 0,0,0,0.	
	vec4.scaleAndAdd(xyzPos, xyzPos, this.uAxis, posU); // xyzPos += Uaxis*posU;
	vec4.scaleAndAdd(xyzPos, xyzPos, this.vAxis, posV); // xyzPos += Vaxis*posU;
    vec4.scaleAndAdd(xyzPos, xyzPos, this.nAxis, -this.iNear);

    vec4.copy(myeRay.orig, this.eyePt);	
	vec4.copy(myeRay.dir, xyzPos);
}

CCamera.prototype.setSize = function(newXmax, newYmax) {
    // Re-adjust the camera for a different output-image size
    this.xmax = newXmax;
    this.ymax = newYmax;
    // Divide the image plane into rectangular tiles, one for each pixel:
    this.ufrac = (this.iRight - this.iLeft) / this.xmax;
    this.vfrac = (this.iTop - this.iBot ) / this.ymax;
}

function CRay() {
    this.orig = vec4.fromValues(0,0,0,1);  // Ray starting point (x,y,z,w)                                                                                // (default: at origin
    this.dir = 	vec4.fromValues(0,0,-1,0);  // direction vector
    this.isShadowRay = false;
    this.lampPos;
}

CRay.prototype.printMe = function(name) {
    //=============================================================================
    // print ray's values in the console window:
    if(name == undefined) name = '[CRay]';
    var res = 3;  // # of digits to display
    console.log(name + '.orig:' + 
    this.orig[0].toFixed(res) + ',\t'+ this.orig[1].toFixed(res) + ',\t' + 
    this.orig[2].toFixed(res) + ',\t'+ this.orig[3].toFixed(res) +  '\n' + 
                name + '.dir :' + 
        this.dir[0].toFixed(res) + ',\t '+ this.dir[1].toFixed(res) + ',\t ' +  
        this.dir[2].toFixed(res) + ',\t '+ this.dir[3].toFixed(res) +
        '\n------------------------');
}

function CLight(){
    this.lightPos = vec4.fromValues(-1.2, -5, 1, 1);  // world coord
    this.Ia = vec3.fromValues(1.0, 1.0, 1.0);
    this.Id = vec3.fromValues(1.0, 1.0, 1.0);
    this.Is = vec3.fromValues(1.0, 1.0, 1.0);
    this.on = true;  // switch on/off lamp
}

CLight.prototype.setShadowRay = function(wRay, hitpt) {
    dir = vec4.create();
    vec4.subtract(dir, this.lightPos, hitpt);  // from hitpt to lamp
    vec4.normalize(dir, dir);

    vec4.copy(wRay.orig, hitpt);	
    vec4.copy(wRay.dir, dir);  // not normalized.
    wRay.isShadowRay = true;
    wRay.lampPos = this.lightPos;
}
