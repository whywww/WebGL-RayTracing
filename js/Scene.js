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
    this.RAY_EPSILON = 1.0E-1;     // ray-tracer precision limits; treat 
                                    // any value smaller than this as zero.
                                    // (why?  JS uses 52-bit mantissa;
                                    // 2^-52 = 2.22E-16, so 10^-15 gives a
                                    // safety margin of 20:1 for small # calcs)
    
    this.imgBuf = g_myPic;          // DEFAULT output image buffer
                                    // (change it with setImgBuf() if needed)
    this.eyeRay = new CRay();	    // the ray from the camera for each pixel
    this.shadowRay1 = new CRay();
    this.shadowRay2 = new CRay();
    this.rayCam = new CCamera();    // the 3D camera that sets eyeRay values:
                                    // this is the DEFAULT camera.
                                    // (change it with setImgBuf() if needed)
    this.item = [];                 // this JavaScript array holds all the
                                    // CGeom objects of the current scene.
    this.lamp1 = new CLight();
    this.lamp2 = new CLight();
    // this.matl = new Material(MATL_PEARL);
    this.recurseDepth = 1;  // 1 larger than real
    this.pixFlag;
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
            this.lamp1.lightPos = vec4.fromValues(-1.2, -5, 1, 1);  // world coord
            this.lamp2.lightPos = gui.camEyePt;  // camera  headlight
            //---Ground Plane-----
            this.item.push(new CGeom(RT_GNDPLANE));   // Append gnd-plane to item[] array
            iNow = this.item.length -1;               // get its array index. 0
            this.item[iNow].matl = new Material(MATL_PEARL);

            // -----Disk 1------           
            this.item.push(new CGeom(RT_DISK));         // Append 2D disk to item[] &
            iNow = this.item.length -1;                 // get its array index. 1
            this.item[iNow].setIdent();                   // start in world coord axes
            this.item[iNow].rayTranslate(-3,1,1.3);        // move drawing axes 
            this.item[iNow].rayRotate(0.25*Math.PI, 1,0,0); // rot 45deg on x axis to face us
            // this.item[iNow].rayRotate(0.5*Math.PI, 0,0,1); // z-axis rotate 45deg.
            this.item[iNow].matl = new Material(MATL_PEARL);
            
            //-----Sphere 1-----
            this.item.push(new CGeom(RT_SPHERE));       // Append sphere to item[] &
            iNow = this.item.length -1;                 // get its array index.
            this.item[iNow].setIdent();                   // start in world coord axes
            this.item[iNow].rayTranslate(1, -1.0, 2.0);  // move rightwards (+x),
            this.item[iNow].rayScale(2,2,2);
            this.item[iNow].matl = new Material(MATL_TURQUOISE);

            //-----Sphere 2-----
            this.item.push(new CGeom(RT_SPHERE));       // Append sphere to item[] &
            iNow = this.item.length -1;                 // get its array index.
            this.item[iNow].setIdent();                   // start in world coord axes
            this.item[iNow].rayTranslate(2.5, -4.0, 1.2);  // move rightwards (+x),
            this.item[iNow].rayScale(1.2, 1.2, 1.2);
            this.item[iNow].matl = new Material(MATL_PEWTER);

            //-----Sphere 3-----
            this.item.push(new CGeom(RT_SPHERE));       // Append sphere to item[] &
            iNow = this.item.length -1;                 // get its array index.
            this.item[iNow].setIdent();                   // start in world coord axes
            this.item[iNow].rayTranslate(0, -4.0, 1.0);  // move rightwards (+x),
            this.item[iNow].matl = new Material(MATL_PEARL);
            break;

        case 1:
            this.lamp1.lightPos = vec4.fromValues(1.2, -3, 1, 1);
            this.lamp2.lightPos = gui.camEyePt;  // camera  headlight

            //---Ground Plane-----
            this.item.push(new CGeom(RT_GNDPLANE));   // Append gnd-plane to item[] array
            iNow = this.item.length -1;
            this.item[iNow].matl = new Material(MATL_PEARL);

            //-----Capsule-----
            this.item.push(new CGeom(RT_CAPSULE));       // Append sphere to item[] &
            iNow = this.item.length -1; 
            this.item[iNow].setIdent();                   // start in world coord axes
            this.item[iNow].rayTranslate(-0.2, -3, 2.3);  // move rightwards (+x),
            this.item[iNow].rayRotate(0.3*Math.PI, 0,0,1);
            this.item[iNow].rayRotate(0.5*Math.PI, 1,0,0);
            this.item[iNow].matl = new Material(MATL_PEARL);

            //-----Torus-----
            this.item.push(new CGeom(RT_TORUS));       // Append sphere to item[] &
            iNow = this.item.length -1; 
            this.item[iNow].setIdent();                   // start in world coord axes
            this.item[iNow].rayTranslate(0.7, -2, 2.5);
            this.item[iNow].rayRotate(0.4*Math.PI, 1,0,0);
            this.item[iNow].matl = new Material(MATL_PEARL);

            //-----Sphere 1-----
            this.item.push(new CGeom(RT_SPHERE));       // Append sphere to item[] &
            iNow = this.item.length -1;                 // get its array index.
            this.item[iNow].setIdent();                   // start in world coord axes
            this.item[iNow].rayTranslate(-1.2, -3.5, 1.0);  // move rightwards (+x),
            this.item[iNow].matl = new Material(MATL_JADE);
            break;

        case 2:
            this.lamp1.lightPos = vec4.fromValues(1.2, 0, 3, 1);
            this.lamp2.lightPos = gui.camEyePt;  // camera  headlight
            
            //---Ground Plane-----
            this.item.push(new CGeom(RT_GNDPLANE));   // Append gnd-plane to item[] array
            iNow = this.item.length -1;
            this.item[iNow].matl = new Material(MATL_PEARL);

            //-----Sphere 1-----
            this.item.push(new CGeom(RT_SPHERE));       // Append sphere to item[] &
            iNow = this.item.length -1;                 // get its array index.
            this.item[iNow].setIdent();                   // start in world coord axes
            this.item[iNow].rayTranslate(0, 0, 1.0);  // move rightwards (+x),
            this.item[iNow].matl = new Material(MATL_CHROME);

            //-----Sphere 2-----
            this.item.push(new CGeom(RT_SPHERE));       // Append sphere to item[] &
            iNow = this.item.length -1;                 // get its array index.
            this.item[iNow].setIdent();                   // start in world coord axes
            this.item[iNow].rayTranslate(-2, 0, 1.0);  // move rightwards (+x),
            this.item[iNow].matl = new Material(MATL_RED_PLASTIC);

            //-----Sphere 3-----
            this.item.push(new CGeom(RT_SPHERE));       // Append sphere to item[] &
            iNow = this.item.length -1;                 // get its array index.
            this.item[iNow].setIdent();                   // start in world coord axes
            this.item[iNow].rayTranslate(-4, 0, 1.0);  // move rightwards (+x),
            this.item[iNow].matl = new Material(MATL_OBSIDIAN);

            //-----Sphere 4-----
            this.item.push(new CGeom(RT_SPHERE));       // Append sphere to item[] &
            iNow = this.item.length -1;                 // get its array index.
            this.item[iNow].setIdent();                   // start in world coord axes
            this.item[iNow].rayTranslate(-6, 0, 1.0);  // move rightwards (+x),
            this.item[iNow].matl = new Material(MATL_BLACK_RUBBER);

            //-----Sphere 5-----
            this.item.push(new CGeom(RT_SPHERE));       // Append sphere to item[] &
            iNow = this.item.length -1;                 // get its array index.
            this.item[iNow].setIdent();                   // start in world coord axes
            this.item[iNow].rayTranslate(2, 0, 1.0);  // move rightwards (+x),
            this.item[iNow].matl = new Material(MATL_GOLD_SHINY);

            //-----Sphere 6-----
            this.item.push(new CGeom(RT_SPHERE));       // Append sphere to item[] &
            iNow = this.item.length -1;                 // get its array index.
            this.item[iNow].setIdent();                   // start in world coord axes
            this.item[iNow].rayTranslate(4, 0, 1.0);  // move rightwards (+x),
            this.item[iNow].matl = new Material(MATL_BRONZE_SHINY);

            //-----Sphere 7-----
            this.item.push(new CGeom(RT_SPHERE));       // Append sphere to item[] &
            iNow = this.item.length -1;                 // get its array index.
            this.item[iNow].setIdent();                   // start in world coord axes
            this.item[iNow].rayTranslate(6, 0, 1.0);  // move rightwards (+x),
            this.item[iNow].matl = new Material(MATL_COPPER_SHINY);

            //-----Lens 1-----
            this.item.push(new CGeom(RT_SPHERE));       // Append sphere to item[] &
            iNow = this.item.length -1;                 // get its array index.
            this.item[iNow].setIdent();                   // start in world coord axes
            this.item[iNow].rayTranslate(0, -5, 1.0);  // move rightwards (+x),
            this.item[iNow].rayScale(1.0, 0.3, 1.0);
            this.item[iNow].matl = new Material(MATL_CHROME);

            //-----Sphere 2-----
            this.item.push(new CGeom(RT_SPHERE));       // Append sphere to item[] &
            iNow = this.item.length -1;                 // get its array index.
            this.item[iNow].setIdent();                   // start in world coord axes
            this.item[iNow].rayTranslate(-2, -5, 1.0);  // move rightwards (+x),
            this.item[iNow].rayScale(1.0, 0.3, 1.0);
            this.item[iNow].matl = new Material(MATL_RED_PLASTIC);

            //-----Sphere 3-----
            this.item.push(new CGeom(RT_SPHERE));       // Append sphere to item[] &
            iNow = this.item.length -1;                 // get its array index.
            this.item[iNow].setIdent();                   // start in world coord axes
            this.item[iNow].rayTranslate(-4, -5, 1.0);  // move rightwards (+x),
            this.item[iNow].rayScale(1.0, 0.3, 1.0);
            this.item[iNow].matl = new Material(MATL_OBSIDIAN);

            //-----Sphere 4-----
            this.item.push(new CGeom(RT_SPHERE));       // Append sphere to item[] &
            iNow = this.item.length -1;                 // get its array index.
            this.item[iNow].setIdent();                   // start in world coord axes
            this.item[iNow].rayTranslate(-6, -5, 1.0);  // move rightwards (+x),
            this.item[iNow].rayScale(1.0, 0.3, 1.0);
            this.item[iNow].matl = new Material(MATL_BLACK_RUBBER);

            //-----Sphere 5-----
            this.item.push(new CGeom(RT_SPHERE));       // Append sphere to item[] &
            iNow = this.item.length -1;                 // get its array index.
            this.item[iNow].setIdent();                   // start in world coord axes
            this.item[iNow].rayTranslate(2, -5, 1.0);  // move rightwards (+x),
            this.item[iNow].rayScale(1.0, 0.3, 1.0);
            this.item[iNow].matl = new Material(MATL_GOLD_SHINY);

            //-----Sphere 6-----
            this.item.push(new CGeom(RT_SPHERE));       // Append sphere to item[] &
            iNow = this.item.length -1;                 // get its array index.
            this.item[iNow].setIdent();                   // start in world coord axes
            this.item[iNow].rayTranslate(4, -5, 1.0);  // move rightwards (+x),
            this.item[iNow].rayScale(1.0, 0.3, 1.0);
            this.item[iNow].matl = new Material(MATL_BRONZE_SHINY);

            //-----Sphere 7-----
            this.item.push(new CGeom(RT_SPHERE));       // Append sphere to item[] &
            iNow = this.item.length -1;                 // get its array index.
            this.item[iNow].setIdent();                   // start in world coord axes
            this.item[iNow].rayTranslate(6, -5, 1.0);  // move rightwards (+x),
            this.item[iNow].rayScale(1.0, 0.3, 1.0);
            this.item[iNow].matl = new Material(MATL_COPPER_SHINY);
            break;
            
        case 3:
            this.lamp1.lightPos = vec4.fromValues(1.2, 0, 3, 1);
            this.lamp2.lightPos = gui.camEyePt;  // camera  headlight
            
            //---Ground Plane-----
            this.item.push(new CGeom(RT_GNDPLANE));   // Append gnd-plane to item[] array
            iNow = this.item.length -1;
            this.item[iNow].matl = new Material(MATL_PEARL);

            //---Box----
            this.item.push(new CGeom(RT_BOX));
            iNow = this.item.length - 1;
            this.item[iNow].setIdent();                   // start in world coord axes
            this.item[iNow].rayTranslate(-1, -3, 4);
            this.item[iNow].matl = new Material(MATL_PEARL);

            //---Box----
            this.item.push(new CGeom(RT_BOX));
            iNow = this.item.length - 1;
            this.item[iNow].setIdent();                   // start in world coord axes
            this.item[iNow].rayTranslate(0, -3, 3.0);
            this.item[iNow].matl = new Material(MATL_PEARL);

            //---Box----
            this.item.push(new CGeom(RT_BOX));
            iNow = this.item.length - 1;
            this.item[iNow].setIdent();                   // start in world coord axes
            this.item[iNow].rayTranslate(1, -3, 2);
            this.item[iNow].matl = new Material(MATL_PEARL);

            //---Box----
            this.item.push(new CGeom(RT_BOX));
            iNow = this.item.length - 1;
            this.item[iNow].setIdent();                   // start in world coord axes
            this.item[iNow].rayTranslate(2, -3, 1);
            this.item[iNow].matl = new Material(MATL_PEARL);


            
            break;
        default:
            console.log("JT_tracer0-Scene file: CScene.initScene(",num,") NOT YET IMPLEMENTED.");
            this.initScene(0);   // init the default scene.
            break;
      }
}

// Try recursive version
CScene.prototype.makeRayTracedImage = function() {
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

                    // Diagnostic
                    if(i==Math.round(this.imgBuf.xSiz*0.766) && j==Math.round(this.imgBuf.ySiz*0.57)) { 
                        this.pixFlag = 1;                     // pixFlag==1 for JUST ONE pixel
                        console.log("CScene.makeRayTracedImage() is at pixel [",i,", ",j,"].");
                    } else {
                        this.pixFlag = 0;
                    }

                    var colr = this.rayTrace(this.eyeRay, myHitList, this.recurseDepth);  // return final color for nearest hitpt in myHitList. 
                    
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

CScene.prototype.findShade = function(hit, depth){
    var shadowHitList = new CHitList();
    var hitFlag1 = false;
    var hitFlag2 = false;
    var phong = vec4.fromValues(0.0, 0.0, 0.0, 1);

    // Calculate lighting
    if (this.lamp1.on){
        this.lamp1.setShadowRay(this.shadowRay1, hit.hitPt);

         // create shadow ray from nearest hit point to lamp
        for(var k = 0; k < this.item.length; k++) {
            if (this.item[k] == hit.hitGeom){continue;}
            hitFlag1 = this.item[k].traceMe(this.shadowRay1, shadowHitList);
            if (hitFlag1){
                // hit something, disable light
                break;
            }
        }

        if (depth == this.recurseDepth){
            phong[0] = hit.hitGeom.matl.K_emit[0] + (this.lamp1.Ia[0]) * hit.hitGeom.matl.K_ambi[0];
            phong[1] = hit.hitGeom.matl.K_emit[1] + (this.lamp1.Ia[1]) * hit.hitGeom.matl.K_ambi[1];
            phong[2] = hit.hitGeom.matl.K_emit[2] + (this.lamp1.Ia[2]) * hit.hitGeom.matl.K_ambi[2];
            phong[3] = 1.0;
        }
    
        if (!hitFlag1){
            var L1 = this.shadowRay1.dir;
            var N = hit.surfNorm;
            var V = hit.viewN;

            var C1 = vec4.create();
            vec4.scale(C1, N, vec4.dot(L1,N));
            var R1 = vec4.create();
            vec4.scale(C1, C1, 2);
            vec4.subtract(R1, C1, L1);

            var L1N = vec4.dot(L1,N);
            var R1V = vec4.dot(R1,V);
            
            phong[0] += this.lamp1.Id[0] * hit.hitGeom.matl.K_diff[0] * Math.max(0, L1N)
                        + this.lamp1.Is[0] * hit.hitGeom.matl.K_spec[0] * Math.pow(Math.max(0, R1V), hit.hitGeom.matl.K_shiny);
            phong[1] += this.lamp1.Id[1] * hit.hitGeom.matl.K_diff[1] * Math.max(0, L1N)
                        + this.lamp1.Is[1] * hit.hitGeom.matl.K_spec[1] * Math.pow(Math.max(0, R1V), hit.hitGeom.matl.K_shiny);
            phong[2] += this.lamp1.Id[2] * hit.hitGeom.matl.K_diff[2] * Math.max(0, L1N)
                        + this.lamp1.Is[2] * hit.hitGeom.matl.K_spec[2] * Math.pow(Math.max(0, R1V), hit.hitGeom.matl.K_shiny);
        }
    }
    if (this.lamp2.on){
        this.lamp2.setShadowRay(this.shadowRay2, hit.hitPt); 

        // create shadow ray from nearest hit point to lamp
        for(var k = 0; k < this.item.length; k++) {
            if (this.item[k] == hit.hitGeom){continue;}
            hitFlag2 = this.item[k].traceMe(this.shadowRay2, shadowHitList); 
            if (hitFlag2){
                // hit something, disable light
                break;
            }
        }

        // Ambient Light
        if (depth == this.recurseDepth){
            phong[0] += hit.hitGeom.matl.K_emit[0] + this.lamp2.Ia[0] * hit.hitGeom.matl.K_ambi[0];
            phong[1] += hit.hitGeom.matl.K_emit[1] + this.lamp2.Ia[1] * hit.hitGeom.matl.K_ambi[1];
            phong[2] += hit.hitGeom.matl.K_emit[2] + this.lamp2.Ia[2] * hit.hitGeom.matl.K_ambi[2];
            phong[3] = 1.0; 
        }

        if (!hitFlag2){
            var L2 = this.shadowRay2.dir;
            var N = hit.surfNorm;
            var V = hit.viewN;

            var C2 = vec4.create();
            vec4.scale(C2, N, vec4.dot(L2,N));
            var R2 = vec4.create();
            vec4.scale(C2, C2, 2);
            vec4.subtract(R2, C2, L2);

            var L2N = vec4.dot(L2,N);
            var R2V = vec4.dot(R2,V);
    
            phong[0] += this.lamp2.Id[0] * hit.hitGeom.matl.K_diff[0] * Math.max(0, L2N)
                        + this.lamp2.Is[0] * hit.hitGeom.matl.K_spec[0] * Math.pow(Math.max(0, R2V), hit.hitGeom.matl.K_shiny);
            phong[1] += this.lamp2.Id[1] * hit.hitGeom.matl.K_diff[1] * Math.max(0, L2N)
                        + this.lamp2.Is[1] * hit.hitGeom.matl.K_spec[1] * Math.pow(Math.max(0, R2V), hit.hitGeom.matl.K_shiny);
            phong[2] += this.lamp2.Id[2] * hit.hitGeom.matl.K_diff[2] * Math.max(0, L2N)
                        + this.lamp2.Is[2] * hit.hitGeom.matl.K_spec[2] * Math.pow(Math.max(0, R2V), hit.hitGeom.matl.K_shiny);
        }
    }
    else if (!this.lamp1.on && !this.lamp2.on){
        phong = vec4.fromValues(.3,.3,.3,1.0);  // give some gray bg color to no light condition
    }

    if(hit.hitNum == 0) {
        vec4.multiply(phong, phong, hit.hitGeom.gapColor);
    } else {
        vec4.multiply(phong, phong, hit.hitGeom.lineColor);
    }

    return phong;
}


CScene.prototype.rayTrace = function(ray, myHitList, depth){

    if (depth == 0){
        return vec4.create();
    }

    var colr = vec4.create();	// floating-point RGBA color value
    myHitList.init();  // hitlist for each ray should be different
    
    if(this.pixFlag == 1) { // print values during just one selected pixel
    }
    
    for(var k = 0; k < this.item.length; k++) {
        this.item[k].traceMe(ray, myHitList); 
    }

    if (myHitList.hitlist.length == 0){  // hits nothing
        vec4.copy(colr, this.skyColor);
    } else {
        var newHit = myHitList.hitlist[myHitList.iNearest];
        if(newHit.hitNum == 0 || newHit.hitNum == 1) {
            var phong = this.findShade(newHit, depth);
            var rRay = this.findReflectRay(newHit);
            var reflectHitList = new CHitList();
            reflectHitList.init();
            var nextColr = this.rayTrace(rRay, reflectHitList, depth - 1);
            vec4.multiply(nextColr, nextColr, newHit.hitGeom.matl.K_spec);
            vec4.add(phong, phong, nextColr);
            vec4.copy(colr, phong);
        } else { 
            vec4.copy(colr, this.skyColor);
        }
    }

    return colr;
}

CScene.prototype.findReflectRay = function(hit){
    var rRay = new CRay();
    var L = hit.viewN;  // from hitpt to eye, unit
    var N = hit.surfNorm;  // unit surface normal

    var C = vec4.create();
    vec4.scale(C, N, vec4.dot(L,N));
    var R = vec4.create();  // reflected L, not unit
    vec4.scale(C, C, 2);
    vec4.subtract(R, C, L);

    vec4.copy(rRay.orig, hit.hitPt);
    vec4.copy(rRay.dir, R);
    return rRay;
}