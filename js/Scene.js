var g_t0_MAX = 1.23E16;  // 'sky' distance; approx. farthest-possible hit-point.

function CHit() {
    this.hitNum = -1;  // default: SKY color
    this.hitGeom = null;  // (reference to)the CGeom object
    this.t0 = g_t0_MAX;  // default: t set to hit very-distant-sky
    
    this.hitPt = vec4.create();  // World-space location where the ray pierced
                                 // the surface of a CGeom item.
    this.surfNorm = vec4.create(); // World-space surface-normal unit vector 
                                   // at the hit-point: perpendicular to surface.
    this.viewN = vec4.create();  // Unit-length vector from hitPt back towards
                                 // the origin of the ray we traced.  (VERY
                                 // useful for Phong lighting, etc.)
    this.isEntering=true;  // true if ray origin was OUTSIDE the hitGeom.
                           //(example; transparency rays begin INSIDE).
    this.modelHitPt = vec4.create();  // the 'hit point' in model coordinates.
    this.colr = vec4.clone(g_myScene.skyColor);
}

CHit.prototype.init = function() {
    this.hitNum = -1;
    this.hitGeom = null;
    this.t0 = g_t0_MAX;

    vec4.set(this.hitPt, this.t0, 0, 0, 1);
    vec4.set(this.surfNorm, -1, 0, 0, 0);
    vec4.set(this.viewN, -1, 0, 0, 0);
    this.isEntering = true;
    vec4.copy(this.modelHitPt, this.hitPt);
}

function CHitList() {
    this.hitlist = [];  // array of CHit objects
    this.iNearest = 0;
    this.iEnd = 0;
}

CHitList.prototype.init = function(){
    this.hitlist = [];  // array of CHit objects
    this.iNearest = 0;
    this.iEnd = 0;
}

function CScene() {
    this.RAY_EPSILON = 1.0E-6;     // ray-tracer precision limits; treat 
                                    // any value smaller than this as zero.
                                    // (why?  JS uses 52-bit mantissa;
                                    // 2^-52 = 2.22E-16, so 10^-15 gives a
                                    // safety margin of 20:1 for small # calcs)
    
    this.imgBuf = g_myPic;          // DEFAULT output image buffer
                                    // (change it with setImgBuf() if needed)
    this.eyeRay = new CRay();	    // the ray from the camera for each pixel
    this.shadowRay = new CRay();
    this.rayCam = new CCamera();    // the 3D camera that sets eyeRay values:
                                    // this is the DEFAULT camera.
                                    // (change it with setImgBuf() if needed)
    this.item = [];                 // this JavaScript array holds all the
                                    // CGeom objects of the current scene.
    this.lamp = new CLight();
    this.matl = new Material(MATL_PEARL);
    this.recurseDepth = 2;
}

CScene.prototype.setImgBuf = function(newImg) {
    this.rayCam.setSize(newImg.xSiz, newImg.ySiz);
    this.imgBuf = newImg;
}

CScene.prototype.initScene = function(num) {
    // Initialize our ray tracer, including camera-settings, output image buffer
    // to use.  Then create a complete 3D scene (CGeom objects, materials, lights, 
    // camera, etc) for viewing in both the ray-tracer **AND** the WebGL previewer.
    // num == 0: basic ground-plane grid;
    //     == 1: ground-plane grid + round 'disc' object;
    //     == 2: ground-plane grid + sphere
    //     == 3: ground-plane grid + sphere + 3rd shape, etc.
    if(num == undefined) num = 0;
    if (isFrustum){
        this.rayCam.rayFrustum(this.rayCam.iLeft, this.rayCam.iRight, this.rayCam.iBot, this.rayCam.iTop, this.rayCam.iNear);
    } else {
        this.rayCam.rayPerspective(gui.camFovy, gui.camAspect, gui.camNear);
    }
    this.rayCam.rayLookAt(gui.camEyePt, gui.camAimPt, gui.camUpVec);
    this.setImgBuf(g_myPic);

    this.skyColor = vec4.fromValues(0.3,1.0,1.0,1.0);  // cyan/bright blue
    this.item.length = 0;  // Empty the 'item[] array
    var iNow = 0;  // index of the last CGeom object put into item[] array

    switch(num) {
        case 0:
            //---Ground Plane-----
            this.item.push(new CGeom(RT_GNDPLANE));   // Append gnd-plane to item[] array
            iNow = this.item.length -1;               // get its array index. 0
                                                        // use default colors.
                                                        // no transforms needed.
            //-----Disk 1------           
            this.item.push(new CGeom(RT_DISK));         // Append 2D disk to item[] &
            iNow = this.item.length -1;                 // get its array index. 1
            this.item[iNow].setIdent();                   // start in world coord axes
            this.item[iNow].rayTranslate(1,1,1.3);        // move drawing axes 
            this.item[iNow].rayRotate(0.25*Math.PI, 1,0,0); // rot 45deg on x axis to face us
            this.item[iNow].rayRotate(0.25*Math.PI, 0,0,1); // z-axis rotate 45deg.
            
            //-----Sphere 1-----
            this.item.push(new CGeom(RT_SPHERE));       // Append sphere to item[] &
            iNow = this.item.length -1;                 // get its array index.
            this.item[iNow].setIdent();                   // start in world coord axes
            this.item[iNow].rayTranslate(1.2, -1.0, 1.0);  // move rightwards (+x),

            // //-----Sphere 2-----
            this.item.push(new CGeom(RT_SPHERE));       // Append sphere to item[] &
            iNow = this.item.length -1;                 // get its array index.
            vec4.set(this.item[iNow].lineColor, 0.0,0.7,0.0,1.0);  // green
            this.item[iNow].setIdent();                   // start in world coord axes
            this.item[iNow].rayTranslate(2.4, -3.0, 1.0);  // move rightwards (+x),

            // //-----Sphere 3-----
            this.item.push(new CGeom(RT_SPHERE));       // Append sphere to item[] &
            iNow = this.item.length -1;                 // get its array index.
            vec4.set(this.item[iNow].lineColor, 1.0,1.0,0.0,1.0);  // yellow
            this.item[iNow].setIdent();                   // start in world coord axes
            this.item[iNow].rayTranslate(0, -3.0, 1.0);  // move rightwards (+x),
            break;
        case 1:
            // another: SCENE 1 SETUP   
            console.log("JT_tracer0-Scene file: CScene.initScene(",num,") NOT YET IMPLEMENTED.");
            this.initScene(0); // use default scene
            break;
        case 2:
            // another: SCENE 2 SETUP   
            console.log("JT_tracer0-Scene file: CScene.initScene(",num,") NOT YET IMPLEMENTED.");    //
            this.initScene(0); // use default scene
            break;
        default:
            console.log("JT_tracer0-Scene file: CScene.initScene(",num,") NOT YET IMPLEMENTED.");
            this.initScene(0);   // init the default scene.
            break;
      }
}

CScene.prototype.makeRayTracedImage = function() {
    var colr = vec4.create();	// floating-point RGBA color value
	var idx = 0;  // CImgBuf array index(i,j) == (j*this.xSiz + i)*this.pixSiz
    var myHitList = new CHitList();

    if (isFrustum){
        this.rayCam.rayFrustum(-1.0, 1.0, -1.0, 1.0, 1.0);
    } else {
        this.rayCam.rayPerspective(gui.camFovy, gui.camAspect, gui.camNear);
    }
    this.rayCam.rayLookAt(gui.camEyePt, gui.camAimPt, gui.camUpVec);
    this.rayCam.xSampMax = g_AAcode;
    this.rayCam.ySampMax = g_AAcode;
    this.setImgBuf(this.imgBuf);

    for(var j = 0; j < this.imgBuf.ySiz; j++) {        // for the j-th row of pixels.
        for(var i = 0; i < this.imgBuf.xSiz; i++) {
            idx = (j * this.imgBuf.xSiz + i) * this.imgBuf.pixSiz;	// Array index at pixel (i,j) 
            this.imgBuf.fBuf[idx   ] = 0;	
			this.imgBuf.fBuf[idx +1] = 0;
			this.imgBuf.fBuf[idx +2] = 0;
            this.imgBuf.fBuf[idx +3] = 1;
            // superSampling
            for (var sj = 0; sj < this.rayCam.ySampMax; sj++){ 
                for (var si = 0; si < this.rayCam.xSampMax; si++){

                    if (!g_isJitter){
                        this.rayCam.setEyeRay(this.eyeRay, i + si/this.rayCam.xSampMax + 0.5, j + sj/this.rayCam.ySampMax + 0.5);
                    } else {
                        this.rayCam.setEyeRay(this.eyeRay, i + si/this.rayCam.xSampMax + Math.random(), j + sj/this.rayCam.ySampMax + Math.random());
                    }

                    myHitList.init();  // hitlist for each ray should be different
                    
                    for(var k = 0; k < this.item.length; k++) {
                        this.item[k].traceMe(this.eyeRay, myHitList); 
                    }
                    if (myHitList.hitlist.length == 0){  // hits nothing
                        vec4.copy(colr, this.skyColor);
                    } else {
                        newHit = myHitList.hitlist[myHitList.iNearest];
                        if(newHit.hitNum == 0 || newHit.hitNum == 1) {
                            var phong = this.findShade(newHit);
                            var mix = vec4.create();
                            if (newHit.hitNum == 0)
                                vec4.multiply(mix, phong, newHit.hitGeom.gapColor);
                            else 
                                vec4.multiply(mix, phong, newHit.hitGeom.lineColor);
                            vec4.copy(colr, mix);
                        } else {
                            vec4.copy(colr, this.skyColor);
                        }
                    }
                    this.imgBuf.fBuf[idx   ] += colr[0];	
					this.imgBuf.fBuf[idx +1] += colr[1];
					this.imgBuf.fBuf[idx +2] += colr[2];
                }
            }
            // Average color as pixel color
            this.imgBuf.fBuf[idx   ] /= this.rayCam.xSampMax * this.rayCam.ySampMax;	
			this.imgBuf.fBuf[idx +1] /= this.rayCam.xSampMax * this.rayCam.ySampMax;
			this.imgBuf.fBuf[idx +2] /= this.rayCam.xSampMax * this.rayCam.ySampMax;
        }
    }
    this.imgBuf.float2int();
}

CScene.prototype.findShade = function(hit){
    var shadowHitList = new CHitList();
    hitFlag = false;
    var phong = vec4.create();

     // create shadow ray from lamp to nearest hit point
    this.lamp.setShadowRay(this.shadowRay, hit.hitPt); 
    for(var k = 0; k < this.item.length; k++) {
        hitFlag = this.item[k].traceMe(this.shadowRay, shadowHitList); 
        if (hitFlag){
            // hit something, disable light
            this.lamp.enable = false;
        }
    }
    // Calculate lighting
    var L = this.shadowRay.dir;
    var N = hit.surfNorm;
    var V = hit.viewN;

    var C = vec4.scale(N, N, vec4.dot(L,N));
    var R = vec4.create();
    vec4.scale(C, C, 2);
    vec4.subtract(R, C, L);

    phong[0] = this.matl.K_emit[0] + this.lamp.Ia[0] * this.matl.K_ambi[0];
    phong[1] = this.matl.K_emit[1] + this.lamp.Ia[1] * this.matl.K_ambi[1];
    phong[2] = this.matl.K_emit[2] + this.lamp.Ia[2] * this.matl.K_ambi[2];
    phong[3] = 1.0;

    if (this.lamp.enable){
        var LN = vec4.dot(L,N);
        var RV = vec4.dot(R,V);
        phong[0] += this.lamp.Id[0] * this.matl.K_diff[0] * Math.max(0, LN)
                    + this.lamp.Is[0] * this.matl.K_spec[0] * Math.pow(Math.max(0, RV), this.matl.K_shiny);
        phong[1] += this.lamp.Id[1] * this.matl.K_diff[1] * Math.max(0, LN)
                    + this.lamp.Is[1] * this.matl.K_spec[1] * Math.pow(Math.max(0, RV), this.matl.K_shiny);
        phong[2] += this.lamp.Id[2] * this.matl.K_diff[2] * Math.max(0, LN)
                    + this.lamp.Is[2] * this.matl.K_spec[2] * Math.pow(Math.max(0, RV), this.matl.K_shiny);
    }
    this.lamp.enable = true;
    return phong;
}

CScene.prototype.findReflectedRay = function(hit){
    rRay = new CRay();
    // var L
}