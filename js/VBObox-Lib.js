isFrustum = false;
/**
 * WebGL Preview
 */
function VBObox0() {
    this.VERT_SRC =
        'attribute vec4 a_Position;\n' +	
        'attribute vec4 a_Color;\n' +
        'uniform mat4 u_mvpMat;\n' +
        'varying vec4 v_colr;\n' +
        
        'void main() {\n' +
        '   gl_Position = u_mvpMat * a_Position;\n' +
        '   v_colr = a_Color;\n' +
        '}\n';

    this.FRAG_SRC =
        'precision mediump float;\n' + 
        
        'varying vec4 v_colr;\n' +
        'void main() {\n' +
        '   gl_FragColor = v_colr; \n' +
        '}\n';

    this.vboContents = new Float32Array ([
        // red X axis:
        0.00, 0.00, 0.0, 1.0,	1.0, 1.0, 1.0, 1.0,	
        1.00, 0.00, 0.0, 1.0,	1.0, 0.0, 0.0, 1.0,
        // green Y axis:
        0.00, 0.00, 0.0, 1.0,  	1.0, 1.0, 1.0, 1.0,	
        0.00, 1.00, 0.0, 1.0,  	0.0, 1.0, 0.0, 1.0,	
        // blue Z axis:
        0.00, 0.00, 0.0, 1.0,  	1.0, 1.0, 1.0, 1.0,	
        0.00, 0.00, 1.0, 1.0,  	0.0, 0.0, 1.0, 1.0,	
    ]); 
    this.floatsPerVertex = 8;
    this.vboVerts = 6;

    // More shapes:
    this.bgnGrid = this.vboVerts;
    this.appendGroundGrid();
    this.bgnDisk = this.vboVerts;
    this.appendDisk(2);
    this.bgnSphere = this.vboVerts;
    this.appendWireSphere();

    this.FSIZE = this.vboContents.BYTES_PER_ELEMENT;
    this.vboBytes = this.vboContents.length * this.FSIZE;               
    this.vboStride = this.vboBytes / this.vboVerts;
    this.vboFcount_a_Position = 4;
    this.vboFcount_a_Color = 4;

    console.assert((this.vboFcount_a_Position + this.vboFcount_a_Color) * 
        this.FSIZE == this.vboStride,
        "Uh oh! VBObox0.vboStride disagrees with attribute-size values!");

    this.vboOffset_a_Position = 0;
    this.vboOffset_a_Color = this.vboFcount_a_Position * this.FSIZE;

    this.vboLoc;
    this.shaderLoc;
    this.a_PositionLoc;
    this.a_ColorLoc;

    this.mvpMat = mat4.create();
    this.u_mvpMatLoc;
}

VBObox0.prototype.init = function() {
    this.shaderLoc = createProgram(gl, this.VERT_SRC, this.FRAG_SRC);
    if (!this.shaderLoc) {
        console.log(this.constructor.name + 
            '.init() failed to create executable Shaders on the GPU. Bye!');
        return;
    }
    gl.program = this.shaderLoc;
    this.vboLoc = gl.createBuffer();	
    if (!this.vboLoc) {
        console.log(this.constructor.name + 
            '.init() failed to create VBO in GPU. Bye!'); 
      return;
    }

    gl.bindBuffer(gl.ARRAY_BUFFER, this.vboLoc);	
    gl.bufferData(gl.ARRAY_BUFFER, this.vboContents, gl.STATIC_DRAW);
    
    this.a_PositionLoc = gl.getAttribLocation(this.shaderLoc, 'a_Position');
    if(this.a_PositionLoc < 0) {
        console.log(this.constructor.name + 
            '.init() Failed to get GPU location of attribute a_Position');
        return -1;	// error exit.
    }
    this.a_ColorLoc = gl.getAttribLocation(this.shaderLoc, 'a_Color');
    if(this.a_ColorLoc < 0) {
        console.log(this.constructor.name + 
            '.init() failed to get the GPU location of attribute a_Color');
        return -1;	// error exit.
    }
    this.u_mvpMatLoc = gl.getUniformLocation(this.shaderLoc, 'u_mvpMat');
    if (!this.u_mvpMatLoc) { 
        console.log(this.constructor.name + 
            '.init() failed to get GPU location for u_mvpMat uniform');
      return;
    }
}

VBObox0.prototype.switchToMe = function() {
    gl.useProgram(this.shaderLoc);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.vboLoc);

    gl.vertexAttribPointer(
		this.a_PositionLoc,
		this.vboFcount_a_Position,
		gl.FLOAT,
		false,
		this.vboStride,
		this.vboOffset_a_Position);						
    gl.vertexAttribPointer(
        this.a_ColorLoc, 
        this.vboFcount_a_Color, 
        gl.FLOAT, 
        false, 
        this.vboStride, this.vboOffset_a_Color);

    gl.enableVertexAttribArray(this.a_PositionLoc);
    gl.enableVertexAttribArray(this.a_ColorLoc);
}

VBObox0.prototype.adjust = function() {
    if(this.isReady()==false) {
        console.log('ERROR! before' + this.constructor.name + 
            '.adjust() call you needed to call this.switchToMe()!!');
    }
    
    var camProj = mat4.create();   
    if (isFrustum){
        mat4.frustum(camProj, 
                    g_myScene.rayCam.iLeft, g_myScene.rayCam.iRight, 
                    g_myScene.rayCam.iBot, g_myScene.rayCam.iTop, 
                    g_myScene.rayCam.iNear, gui.camFar);
    } else {
        mat4.perspective(camProj, glMatrix.toRadian(gui.camFovy), 
                        gui.camAspect, gui.camNear, gui.camFar);
    }
    
    var camView = mat4.create();
    mat4.lookAt(camView, gui.camEyePt, gui.camAimPt, gui.camUpVec);
    mat4.multiply(this.mvpMat, camProj, camView);
    
    // var trans = vec3.fromValues(0, 0, -5);
    // mat4.translate(this.mvpMat, this.mvpMat, trans);
    
    gl.uniformMatrix4fv(this.u_mvpMatLoc, false, this.mvpMat);
}

VBObox0.prototype.draw = function() {
    // ground plane
    var tmp = mat4.create();    
    mat4.copy(tmp, this.mvpMat);
    gl.drawArrays(gl.LINES, 0, this.bgnDisk);

    // disk
    mat4.copy(this.mvpMat, tmp);
    mat4.translate(this.mvpMat, this.mvpMat, vec3.fromValues(-3.0, 1.0, 1.3));
    mat4.rotate(this.mvpMat, this.mvpMat, 0.25*Math.PI, vec3.fromValues(1,0,0));
    // mat4.rotate(this.mvpMat, this.mvpMat, 0.25*Math.PI, vec3.fromValues(0,0,1));
 
    gl.uniformMatrix4fv(this.u_mvpMatLoc, false, this.mvpMat);
    gl.drawArrays(gl.LINES, this.bgnDisk, this.bgnSphere - this.bgnDisk);

    // sphere1
    mat4.copy(this.mvpMat, tmp);
    mat4.translate(this.mvpMat, this.mvpMat, vec3.fromValues(1, 1.0, 2.0));
    mat4.scale(this.mvpMat, this.mvpMat, vec3.fromValues(2, 2, 2));

    gl.uniformMatrix4fv(this.u_mvpMatLoc, false, this.mvpMat);
    gl.drawArrays(gl.LINE_STRIP, this.bgnSphere, this.vboVerts - this.bgnSphere);

    // sphere2
    mat4.copy(this.mvpMat, tmp);
    mat4.translate(this.mvpMat, this.mvpMat, vec3.fromValues(2.4, -2.0, 1.2));
    mat4.scale(this.mvpMat, this.mvpMat, vec3.fromValues(1.2, 1.2, 1.2));
    gl.uniformMatrix4fv(this.u_mvpMatLoc, false, this.mvpMat);
    gl.drawArrays(gl.LINE_STRIP, this.bgnSphere, this.vboVerts - this.bgnSphere);

    // sphere3
    mat4.copy(this.mvpMat, tmp);
    mat4.translate(this.mvpMat, this.mvpMat, vec3.fromValues(0, -2.0, 1.0));
    gl.uniformMatrix4fv(this.u_mvpMatLoc, false, this.mvpMat);
    gl.drawArrays(gl.LINE_STRIP, this.bgnSphere, this.vboVerts - this.bgnSphere);
}

VBObox0.prototype.reload = function() {
    if(this.isReady()==false) {
        console.log('ERROR! before' + this.constructor.name + 
            '.reload() call you needed to call this.switchToMe()!!');
    }

    gl.bufferSubData(gl.ARRAY_BUFFER, 0, this.vboContents);
}

VBObox0.prototype.isReady = function() {
    var isOK = true;
    
    if(gl.getParameter(gl.CURRENT_PROGRAM) != this.shaderLoc)  {
        console.log(this.constructor.name + 
            '.isReady() false: shader program at this.shaderLoc not in use!');
        isOK = false;
    }
    if(gl.getParameter(gl.ARRAY_BUFFER_BINDING) != this.vboLoc) {
        console.log(this.constructor.name + 
            '.isReady() false: vbo at this.vboLoc not in use!');
        isOK = false;
    }
    return isOK;
}

VBObox0.prototype.appendGroundGrid = function() {
    //Set # of lines in grid
    this.xyMax	= 50.0;			// grid size; extends to cover +/-xyMax in x and y.
    this.xCount = 101;			// # of lines of constant-x to draw to make the grid 
    this.yCount = 101;		  // # of lines of constant-y to draw to make the grid 

    var vertsPerLine =8;
    // Set vertex contents
    this.floatsPerVertex = 8;  // x,y,z,w;  r,g,b,a values.
    
    // Create (local) vertSet[] array
    var vertCount = (this.xCount + this.yCount) * vertsPerLine;
    var vertSet = new Float32Array(vertCount * this.floatsPerVertex); 

    this.xBgnColr = vec4.fromValues(1.0, 0.0, 0.0, 1.0);	  // Red
    this.xEndColr = vec4.fromValues(0.0, 1.0, 1.0, 1.0);    // Cyan
    this.yBgnColr = vec4.fromValues(0.0, 1.0, 0.0, 1.0);	  // Green
    this.yEndColr = vec4.fromValues(1.0, 0.0, 1.0, 1.0);    // Magenta

    // Compute how much the color changes between 1 line and the next:
    var xColrStep = vec4.create();  // [0,0,0,0]
    var yColrStep = vec4.create();
    vec4.subtract(xColrStep, this.xEndColr, this.xBgnColr); // End - Bgn
    vec4.subtract(yColrStep, this.yEndColr, this.yBgnColr);
    vec4.scale(xColrStep, xColrStep, 1.0/(this.xCount -1)); // scale by # of lines
    vec4.scale(yColrStep, yColrStep, 1.0/(this.yCount -1));

    // Local vars for vertex-making loops
    var xgap = 2*this.xyMax/(this.xCount-1);		// Spacing between lines in x,y;
    var ygap = 2*this.xyMax/(this.yCount-1);		// (why 2*xyMax? grid spans +/- xyMax).
    var xNow;           // x-value of the current line we're drawing
    var yNow;           // y-value of the current line we're drawing.
    var line = 0;       // line-number (we will draw xCount or yCount lines, each
                        // made of vertsPerLine vertices),
    var v = 0;          // vertex-counter, used for the entire grid;
    var idx = 0;        // vertSet[] array index.
    var colrNow = vec4.create();   // color of the current line we're drawing.

    // 1st BIG LOOP: makes all lines of constant-x
    for(line=0; line<this.xCount; line++) {   // for every line of constant x,
    colrNow = vec4.scaleAndAdd(             // find the color of this line,
                colrNow, this.xBgnColr, xColrStep, line);	
    xNow = -this.xyMax + (line*xgap);       // find the x-value of this line,    
    for(i=0; i<vertsPerLine; i++, v++, idx += this.floatsPerVertex) {
        switch(i) { // find y coord value for each vertex in this line:
        case 0: yNow = -this.xyMax;   break;  // start of 1st line-segment;
        case 1:                               // end of 1st line-segment, and
        case 2: yNow = -this.xyMax/2; break;  // start of 2nd line-segment;
        case 3:                               // end of 2nd line-segment, and
        case 4: yNow = 0.0;           break;  // start of 3rd line-segment;
        case 5:                               // end of 3rd line-segment, and
        case 6: yNow = this.xyMax/2;  break;  // start of 4th line-segment;
        case 7: yNow = this.xyMax;    break;  // end of 4th line-segment.
        default: 
            console.log("VBObox0.appendGroundGrid() !ERROR! **X** line out-of-bounds!!\n\n");
        break;
        } // set all values for this vertex:
        vertSet[idx  ] = xNow;            // x value
        vertSet[idx+1] = yNow;            // y value
        vertSet[idx+2] = 0.0;             // z value
        vertSet[idx+3] = 1.0;             // w;
        vertSet[idx+4] = colrNow[0];  // r
        vertSet[idx+5] = colrNow[1];  // g
        vertSet[idx+6] = colrNow[2];  // b
        vertSet[idx+7] = colrNow[3];  // a;
    }
    }
    // 2nd BIG LOOP: makes all lines of constant-y
    for(line=0; line<this.yCount; line++) {   // for every line of constant y,
        colrNow = vec4.scaleAndAdd(             // find the color of this line,
                    colrNow, this.yBgnColr, yColrStep, line);	
        yNow = -this.xyMax + (line*ygap);       // find the y-value of this line,    
        for(i=0; i<vertsPerLine; i++, v++, idx += this.floatsPerVertex) {
            switch(i) { // find y coord value for each vertex in this line:
            case 0: xNow = -this.xyMax;   break;  // start of 1st line-segment;
            case 1:                               // end of 1st line-segment, and
            case 2: xNow = -this.xyMax/2; break;  // start of 2nd line-segment;
            case 3:                               // end of 2nd line-segment, and
            case 4: xNow = 0.0;           break;  // start of 3rd line-segment;
            case 5:                               // end of 3rd line-segment, and
            case 6: xNow = this.xyMax/2;  break;  // start of 4th line-segment;
            case 7: xNow = this.xyMax;    break;  // end of 4th line-segment.
            default: 
                console.log("VBObox0.appendGroundGrid() !ERROR! **Y** line out-of-bounds!!\n\n");
            break;
            } // Set all values for this vertex:
            vertSet[idx  ] = xNow;            // x value
            vertSet[idx+1] = yNow;            // y value
            vertSet[idx+2] = 0.0;             // z value
            vertSet[idx+3] = 1.0;             // w;
            vertSet[idx+4] = colrNow[0];  // r
            vertSet[idx+5] = colrNow[1];  // g
            vertSet[idx+6] = colrNow[2];  // b
            vertSet[idx+7] = colrNow[3];  // a;
        }
    }

    // Make a new array (local) big enough to hold BOTH vboContents & vertSet:
    var tmp = new Float32Array(this.vboContents.length + vertSet.length);
    tmp.set(this.vboContents, 0);     // copy old VBOcontents into tmp, and
    tmp.set(vertSet,this.vboContents.length); // copy new vertSet just after it.
    this.vboVerts += vertCount;       // find number of verts in both.
    this.vboContents = tmp;           // REPLACE old vboContents with tmp
}

VBObox0.prototype.appendDisk = function(rad) {
    if(rad == undefined) rad = 3; 
    this.xyMax	= rad;
    this.xCount = 11;
    this.yCount = 11;
    var vertsPerLine =2;
    this.floatsPerVertex = 8;
    
    var vertCount = (this.xCount + this.yCount) * vertsPerLine;
    var vertSet = new Float32Array(vertCount * this.floatsPerVertex); 

    var xColr = vec4.fromValues(1.0, 1.0, 0.3, 1.0);
    var yColr = vec4.fromValues(0.3, 1.0, 1.0, 1.0);

    var xgap = 2*this.xyMax/(this.xCount-1);
    var ygap = 2*this.xyMax/(this.yCount-1);
    var xNow;
    var yNow;
    var diff;
    var line = 0;

    var v = 0; 
    var idx = 0;

    // 1st BIG LOOP: makes all lines of constant-x
    for(line=0; line<this.xCount; line++) { 
        xNow = -this.xyMax + (line*xgap);   
        diff = Math.sqrt(1.1*rad*rad - xNow*xNow);
        for(i=0; i<vertsPerLine; i++, v++, idx += this.floatsPerVertex) {
            if(i==0) yNow = -diff;
            else yNow = diff;
            
            vertSet[idx  ] = xNow;
            vertSet[idx+1] = yNow;
            vertSet[idx+2] = 0.0;
            vertSet[idx+3] = 1.0;
            vertSet[idx+4] = xColr[0];
            vertSet[idx+5] = xColr[1];
            vertSet[idx+6] = xColr[2];
            vertSet[idx+7] = xColr[3];
        }
    }

    // 2nd BIG LOOP: makes all lines of constant-y
    for(line=0; line<this.yCount; line++) {   // for every line of constant y,
        yNow = -this.xyMax + (line*ygap);       // find the y-value of this line,  
        diff = Math.sqrt(1.1*rad*rad - yNow*yNow);  // find +/- y-value of this line,  
        for(i=0; i<vertsPerLine; i++, v++, idx += this.floatsPerVertex) {
            if(i==0) xNow = -diff;
            else xNow = diff;
        
            vertSet[idx  ] = xNow;
            vertSet[idx+1] = yNow;
            vertSet[idx+2] = 0.0;
            vertSet[idx+3] = 1.0;
            vertSet[idx+4] = yColr[0];
            vertSet[idx+5] = yColr[1];
            vertSet[idx+6] = yColr[2];
            vertSet[idx+7] = yColr[3];
        }
    }
    
    var tmp = new Float32Array(this.vboContents.length + vertSet.length);
    tmp.set(this.vboContents, 0);     // copy old VBOcontents into tmp, and
    tmp.set(vertSet,this.vboContents.length); // copy new vertSet just after it.
    this.vboVerts += vertCount;       // find number of verts in both.
    this.vboContents = tmp;           // REPLACE old vboContents with tmp
}

VBObox0.prototype.appendWireSphere = function(NScount) {
    if(NScount == undefined) NScount =  13;    // default value.
    if(NScount < 3) NScount = 3;              // enforce minimums
    var EWcount = 2*(NScount);

    var vertCount = 2 * EWcount * NScount;
    var vertSet = new Float32Array(vertCount * this.floatsPerVertex); 

    this.EWbgnColr = vec4.fromValues(1.0, 0.5, 0.0, 1.0);  // Orange
    this.EWendColr = vec4.fromValues(0.0, 0.5, 1.0, 1.0);  // Cyan
    this.NSbgnColr = vec4.fromValues(1.0, 1.0, 1.0, 1.0);  // White
    this.NSendColr = vec4.fromValues(0.0, 1.0, 0.5, 1.0);  // White

    var EWcolrStep = vec4.create();
    var NScolrStep = vec4.create();
    vec4.subtract(EWcolrStep, this.EWendColr, this.EWbgnColr);
    vec4.subtract(NScolrStep, this.NSendColr, this.NSbgnColr);
    vec4.scale(EWcolrStep, EWcolrStep, 2.0/(EWcount -1));
    vec4.scale(NScolrStep, NScolrStep, 1.0/(NScount -1));

    var EWgap = 1.0/(EWcount-1);
    var NSgap = 1.0/(NScount-1);
    var EWint=0;
    var NSint=0;
    var v = 0;  
    var idx = 0;
    var pos = vec4.create();
    var colrNow = vec4.create();

    for(NSint=0; NSint<NScount; NSint++) { 
        colrNow = vec4.scaleAndAdd(colrNow, this.NSbgnColr, NScolrStep, NSint);	  
        for(EWint=0; EWint<EWcount; EWint++, v++, idx += this.floatsPerVertex) {
            this.polar2xyz(pos, EWint * EWgap, NSint * NSgap);
            vertSet[idx  ] = pos[0];
            vertSet[idx+1] = pos[1];
            vertSet[idx+2] = pos[2];
            vertSet[idx+3] = 1.0;   
            vertSet[idx+4] = colrNow[0];
            vertSet[idx+5] = colrNow[1];
            vertSet[idx+6] = colrNow[2];
            vertSet[idx+7] = colrNow[3];
        }
    }

    for(EWint=0; EWint<EWcount; EWint++) { 
        if(EWint < EWcount/2) {
            colrNow = vec4.scaleAndAdd(colrNow, this.EWbgnColr, EWcolrStep, EWint);
        } else {
            colrNow = vec4.scaleAndAdd(colrNow, this.EWbgnColr, EWcolrStep, EWcount - EWint);
        }  	  
        for(NSint=0; NSint<NScount; NSint++, v++, idx += this.floatsPerVertex) {
            this.polar2xyz(pos, EWint * EWgap, NSint * NSgap);
            vertSet[idx  ] = pos[0]; 
            vertSet[idx+1] = pos[1]; 
            vertSet[idx+2] = pos[2]; 
            vertSet[idx+3] = 1.0;    
            vertSet[idx+4] = colrNow[0];
            vertSet[idx+5] = colrNow[1];
            vertSet[idx+6] = colrNow[2];
            vertSet[idx+7] = colrNow[3];
        }
    }

    var tmp = new Float32Array(this.vboContents.length + vertSet.length);
    tmp.set(this.vboContents, 0);
    tmp.set(vertSet,this.vboContents.length);
    this.vboVerts += vertCount;  
    this.vboContents = tmp;
}

VBObox0.prototype.polar2xyz = function(out4, fracEW, fracNS) {
    var sEW = Math.sin(2.0*Math.PI*fracEW);
    var cEW = Math.cos(2.0*Math.PI*fracEW);
    var sNS = Math.sin(Math.PI*fracNS);
    var cNS = Math.cos(Math.PI*fracNS);
    vec4.set(out4, cEW * sNS, sEW * sNS, cNS, 1.0);
}

/**
 * Ray Tracing View
 */
function VBObox1() {
    this.VERT_SRC =
        'attribute vec4 a_Position;\n' +	
        'attribute vec2 a_TexCoord;\n' +
        'varying vec2 v_TexCoord;\n' +

        'void main() {\n' +
        '   gl_Position = a_Position;\n' +
        '   v_TexCoord = a_TexCoord;\n' +
        '}\n';

    this.FRAG_SRC =
        'precision mediump float;\n' + 
        
        'uniform sampler2D u_Sampler;\n' +
        'varying vec2 v_TexCoord;\n' +

        'void main() {\n' +
        '	gl_FragColor = texture2D(u_Sampler, v_TexCoord); \n' +
        '}\n';

    this.vboContents = new Float32Array ([
        // CVV,         Tex coord
        -1.00, 1.00,    0.0, 1.0,  // upper left corner  (borderless)
        -1.00, -1.00,   0.0, 0.0,  // lower left corner,
        1.00, 1.00,     1.0, 1.0,  // upper right corner,
        1.00, -1.00,    1.0, 0.0,  // lower left corner.
    ]); 
    this.vboVerts = 4;

    this.FSIZE = this.vboContents.BYTES_PER_ELEMENT;
    this.vboBytes = this.vboContents.length * this.FSIZE;               
    this.vboStride = this.vboBytes / this.vboVerts;
    this.vboFcount_a_Position = 2;
    this.vboFcount_a_TexCoord = 2;

    console.assert((this.vboFcount_a_Position + this.vboFcount_a_TexCoord) * 
        this.FSIZE == this.vboStride,
        "Uh oh! VBObox0.vboStride disagrees with attribute-size values!");

    this.vboOffset_a_Position = 0;
    this.vboOffset_a_TexCoord = this.vboFcount_a_Position * this.FSIZE;

    this.vboLoc;
    this.shaderLoc;
    this.a_PositionLoc;
    this.a_TexCoordLoc;

    this.u_TextureLoc;
    this.u_SamplerLoc;
}

VBObox1.prototype.init = function() {
    this.shaderLoc = createProgram(gl, this.VERT_SRC, this.FRAG_SRC);
    if (!this.shaderLoc) {
        console.log(this.constructor.name + 
            '.init() failed to create executable Shaders on the GPU. Bye!');
        return;
    }
    gl.program = this.shaderLoc;
    this.vboLoc = gl.createBuffer();	
    if (!this.vboLoc) {
        console.log(this.constructor.name + 
            '.init() failed to create VBO in GPU. Bye!'); 
      return;
    }

    gl.bindBuffer(gl.ARRAY_BUFFER, this.vboLoc);	
    gl.bufferData(gl.ARRAY_BUFFER, this.vboContents, gl.STATIC_DRAW);
    
    this.a_PositionLoc = gl.getAttribLocation(this.shaderLoc, 'a_Position');
    if(this.a_PositionLoc < 0) {
        console.log(this.constructor.name + 
            '.init() Failed to get GPU location of attribute a_Position');
        return -1;	// error exit.
    }
    this.a_TexCoordLoc = gl.getAttribLocation(this.shaderLoc, 'a_TexCoord');
    if(this.a_TexCoordLoc < 0) {
        console.log(this.constructor.name + 
            '.init() failed to get the GPU location of attribute a_TexCoord');
        return -1;	// error exit.
    }

    this.u_TextureLoc = gl.createTexture();
    if (!this.u_TextureLoc) {
        console.log(this.constructor.name + 
            '.init() Failed to create the texture object on the GPU');
        return -1;	// error exit.
    }
    var u_SamplerLoc = gl.getUniformLocation(this.shaderLoc, 'u_Sampler');
    if (!u_SamplerLoc) {
        console.log(this.constructor.name + 
            '.init() Failed to find GPU location for texture u_Sampler');
        return -1;	// error exit.
    }
    
    // Fill our global floating-point image object 'g_myPic' with a test-pattern.
    g_myPic.setTestPattern(0);
    // Enable texture unit0 for our use
    gl.activeTexture(gl.TEXTURE0);
    // Bind the texture object we made in initTextures() to the target
    gl.bindTexture(gl.TEXTURE_2D, this.u_TextureLoc);
    // allocate memory and load the texture image into the GPU
    gl.texImage2D(gl.TEXTURE_2D,
        0,                  //  MIP-map level (default: 0)
        gl.RGBA,            // GPU's data format (RGB? RGBA? etc)
        g_myPic.xSiz,       // texture image width in pixels
        g_myPic.ySiz,       // texture image height in pixels.
        0,                  // byte offset to start of data
        gl.RGBA,            // source/input data format (RGB? RGBA?)
        gl.UNSIGNED_BYTE,           // data type for each color channel				
        g_myPic.iBuf);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.uniform1i(this.u_SamplerLoc, 0);
}

VBObox1.prototype.switchToMe = function() {
    gl.useProgram(this.shaderLoc);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.vboLoc);

    gl.vertexAttribPointer(
		this.a_PositionLoc,
		this.vboFcount_a_Position,
		gl.FLOAT,
		false,
		this.vboStride,
		this.vboOffset_a_Position);						
    gl.vertexAttribPointer(
        this.a_TexCoordLoc, 
        this.vboFcount_a_TexCoord, 
        gl.FLOAT, 
        false, 
        this.vboStride, this.vboOffset_a_TexCoord);

    gl.enableVertexAttribArray(this.a_PositionLoc);
    gl.enableVertexAttribArray(this.a_TexCoordLoc);
}

VBObox1.prototype.adjust = function() {
    if(this.isReady()==false) {
        console.log('ERROR! before' + this.constructor.name + 
            '.adjust() call you needed to call this.switchToMe()!!');
    }
}

VBObox1.prototype.draw = function() {
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, this.vboVerts);
}

VBObox1.prototype.reload = function() {
    if(this.isReady()==false) {
        console.log('ERROR! before' + this.constructor.name + 
            '.reload() call you needed to call this.switchToMe()!!');
    }

    gl.texSubImage2D(gl.TEXTURE_2D, 	//  'target'--the use of this texture
        0, 					//  MIP-map level (default: 0)
        0, 0,				// xoffset, yoffset (shifts the image)
        g_myPic.xSiz,		// image width in pixels,
        g_myPic.ySiz,		// image height in pixels,
        gl.RGBA, 			// source/input data format (RGB? RGBA?)
        gl.UNSIGNED_BYTE,   // data type for each color channel				
        g_myPic.iBuf);	    // texture-image data source.
}

VBObox1.prototype.isReady = function() {
    var isOK = true;
    
    if(gl.getParameter(gl.CURRENT_PROGRAM) != this.shaderLoc)  {
        console.log(this.constructor.name + 
            '.isReady() false: shader program at this.shaderLoc not in use!');
        isOK = false;
    }
    if(gl.getParameter(gl.ARRAY_BUFFER_BINDING) != this.vboLoc) {
        console.log(this.constructor.name + 
            '.isReady() false: vbo at this.vboLoc not in use!');
        isOK = false;
    }
    return isOK;
}
