function CImgBuf(wide, tall) {
    this.xSiz = wide;  // image width in pixels
	this.ySiz =	tall;  // image height in pixels
	this.pixSiz = 4;  // pixel size (3 for RGB, 4 for RGBA, etc)
	this.iBuf = new Uint8Array(this.xSiz * this.ySiz * this.pixSiz);	
	this.fBuf = new Float32Array(this.xSiz * this.ySiz * this.pixSiz);
}

CImgBuf.prototype.setTestPattern = function(pattNum) {
    //=============================================================================
    // Replace current 8-bit RGB contents of 'imgBuf' with a colorful pattern
    // 2D color image:  8-bit unsigned integers in a 256*256*3 array
    // to store r,g,b,r,g,b integers (8-bit)
    // In WebGL texture map sizes MUST be a power-of-two (2,4,8,16,32,64,...4096)
    // with origin at lower-left corner
    // (NOTE: this 'power-of-two' limit will probably vanish in a few years of
    // WebGL advances, just as it did for OpenGL)

    var PATT_MAX = 4;       // number of patterns we can draw:
    if(pattNum < 0 || pattNum >= PATT_MAX) 
    pattNum %= PATT_MAX; // prevent out-of-range inputs.

    // use local vars to set the array's contents.
    for(var j=0; j< this.ySiz; j++) {						// for the j-th row of pixels
        for(var i=0; i< this.xSiz; i++) {					//  & the i-th pixel on that row,
            var idx = (j*this.xSiz + i)*this.pixSiz;// Array index at pixel (i,j) 
            switch(pattNum) {
                case 0:	//================(Colorful L-shape)===========================
                    if(i < this.xSiz/4 || j < this.ySiz/4) {
                        this.iBuf[idx   ] = i;								// 0 <= red <= 255
                        this.iBuf[idx +1] = j;								// 0 <= grn <= 255
                    }
                    else {
                        this.iBuf[idx   ] = 0;
                        this.iBuf[idx +1] = 0;
                        }
                    this.iBuf[idx +2] = 255 -i -j;								// 0 <= blu <= 255
                    break;
                case 1: //================(bright orange)==============================
                    this.iBuf[idx   ] = 255;	// bright orange
                    this.iBuf[idx +1] = 128;
                    this.iBuf[idx +2] =   0;
                    break;
                case 2: //=================(Vertical Blue/yellow)=======================
                if(i > 5 * this.xSiz/7 && j > 4*this.ySiz/5) {
                    this.iBuf[idx   ] = 200;                // 0 <= red <= 255
                    this.iBuf[idx +1] = 200;								// 0 <= grn <= 255
                this.iBuf[idx +2] = 200;								// 0 <= blu <= 255
                }
                else {
                    this.iBuf[idx   ] = 255-j;                // 0 <= red <= 255
                    this.iBuf[idx +1] = 255-j;	 							  // 0 <= grn <= 255
                this.iBuf[idx +2] = j;								// 0 <= blu <= 255
                }
                break;
                case 3: 
                //================(Diagonal YRed/Cyan)================================
                    this.iBuf[idx   ] = 255 - (i+j)/2;	// bright orange
                    this.iBuf[idx +1] = 255 - j;
                    this.iBuf[idx +2] = 255 - j;
                    break;
                    default:
                        console.log("CImgBuf.setTestPattern() says: WHUT!?");
                    break;
                }
            this.iBuf[idx +3] = 255;
        }
    }
    this.int2float();		// fill the floating-point buffer with same test pattern.
}

CImgBuf.prototype.int2float = function() {
    //=============================================================================
    // Convert the integer RGB image in iBuf into floating-point RGB image in fBuf
    for(var j=0; j< this.ySiz; j++) {		// for each scanline
        for(var i=0; i< this.xSiz; i++) {		// for each pixel on that scanline
            var idx = (j*this.xSiz + i)*this.pixSiz;// Find array index @ pixel (i,j)
            // convert integer 0 <= RGB <= 255 to floating point 0.0 <= R,G,B <= 1.0
            this.fBuf[idx   ] = this.iBuf[idx   ] / 255.0;	// red
            this.fBuf[idx +1] = this.iBuf[idx +1] / 255.0;	// grn
            this.fBuf[idx +2] = this.iBuf[idx +2] / 255.0;	// blu  
            this.fBuf[idx +3] =	1.0;	
        }
    }
}
    
CImgBuf.prototype.float2int = function() {
//=============================================================================
// Convert the floating-point RGB image in fBuf into integer RGB image in iBuf
    for(var j=0; j< this.ySiz; j++) {		// for each scanline,
        for(var i=0; i< this.xSiz; i++) {	 // for each pixel on that scanline,
            var idx = (j*this.xSiz + i)*this.pixSiz; //Find array index @ pixel(i,j):
            // find 'clamped' color values that stay >=0.0 and <=1.0:
            var rval = Math.min(1.0, Math.max(0.0, this.fBuf[idx   ]));
            var gval = Math.min(1.0, Math.max(0.0, this.fBuf[idx +1]));
            var bval = Math.min(1.0, Math.max(0.0, this.fBuf[idx +2]));
            // Divide [0,1] span into 256 equal-sized parts:  Math.floor(rval*256)
            // In the rare case when rval==1.0 you get unwanted '256' result that 
            // won't fit into the 8-bit RGB values.  Fix it with Math.min():
            this.iBuf[idx   ] = Math.min(255,Math.floor(rval*256.0));	// red
            this.iBuf[idx +1] = Math.min(255,Math.floor(gval*256.0));	// grn
            this.iBuf[idx +2] = Math.min(255,Math.floor(bval*256.0));	// blu
            this.iBuf[idx +3] = 255;
        }
    }
}