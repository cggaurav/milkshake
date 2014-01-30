var milk = (function() {


  // req.open("GET", "/milkshake/Class.js", false); req.send(); eval(req.responseText);
  // req.open("GET", "/milkshake/Shaker.js", false); req.send(); eval(req.responseText);
  // req.open("GET", "/milkshake/Music.js", false); req.send(); eval(req.responseText);
  // req.open("GET", "/milkshake/HTML5Audio.js", false); req.send(); eval(req.responseText);
  // req.open("GET", "/milkshake/SoundCloudAudio.js", false); req.send(); eval(req.responseText);
  // req.open("GET", "/milkshake/Renderer.js", false); req.send(); eval(req.responseText);
  // req.open("GET", "/milkshake/Renderable.js", false); req.send(); eval(req.responseText);
  // req.open("GET", "/milkshake/RenderItemMatcher.js", false); req.send(); eval(req.responseText);
  // req.open("GET", "/milkshake/RenderItemMergeFunction.js", false); req.send(); eval(req.responseText);
  // req.open("GET", "/milkshake/Variables.js", false); req.send(); eval(req.responseText);
  // req.open("GET", "/milkshake/MilkDropPreset.js", false); req.send(); eval(req.responseText);
  // req.open("GET", "/milkshake/PerPixelMesh.js", false); req.send(); eval(req.responseText);
  // req.open("GET", "/milkshake/PipelineContext.js", false); req.send(); eval(req.responseText);
  // req.open("GET", "/milkshake/TimeKeeper.js", false); req.send(); eval(req.responseText);
  // req.open("GET", "/milkshake/Presets.js", false); req.send(); eval(req.responseText);

  /*
   * Core Animation Interface
   */

  var shaker;
  var canvas;
  var audio;

  function shake() {
    // canvas = document.getElementById(elementId);
    // canvas.width = window.innerWidth;
    // canvas.height = window.innerHeight;
    try {
      initGL(function() {
        shaker = new Shaker();
        audio = new SoundCloudAudio();
        animationLoop();
        setInterval(function() {
          shaker.selectNext(true);
        }, 10000);
      });
    } catch (e) {
      console.log(e.message);
      // canvas.outerHTML = "<div style='padding:20px;'>" + canvas.innerHTML + "</div>";
    }

  }

  var requestAnimFrame = window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame ||
      function(callback, element) {
        window.setTimeout(callback, 1000 / 60);
    };

  function animationLoop() {
    shaker.renderFrame.call(shaker);
    requestAnimFrame(animationLoop, canvas);
  }


  /*
   * Global WebGL, Programmable Shader, and Linear Algebra Routines
   */

  var gl;

  var U_PROJECTION = 0;
  var U_MODELVIEW = 1;
  var U_TEXTURE = 2;

  var U_VERTEX_ARRAY = 0;
  var U_TEXTURE_COORD_ARRAY = 1;
  var U_COLOR_ARRAY = 2;

  var mvMatrix = new Float32Array([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]);
  var prMatrix = new Float32Array([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]);
  var mvpMatrix = new Float32Array([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]);
  var txMatrix = new Float32Array([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]);
  var activeMatrix = prMatrix;

  var mvStack = [];
  var prStack = [];
  var txStack = [];
  var activeStack = prStack;
  var enablestex = false;
  var enablevco = false;
  var upointsize = 1.0;
  var ucolr = 1.0;
  var ucolg = 1.0;
  var ucolb = 1.0;
  var ucola = 1.0;

  var vertexPos;
  var colorPos;
  var texCoordPos;

  var ucolorloc;
  var stextureloc;
  var upointsizeloc;
  var mvpmatrixloc;
  var txmatrixloc;
  var enablestexloc;
  var enablevcoloc;

  var textures = {};
  var texture_list = ["title.png"];
  var texloads = 0;

  function initGL(callback) {


    // app currently breaks here because g1 is null
    var vertexShader = loadShader(gl.VERTEX_SHADER,
      "precision mediump float; \
        attribute vec4 a_position; \
        attribute vec4 a_texCoord; \
        varying vec4 v_texCoord; \
        attribute vec4 a_color; \
        uniform vec4 u_color; \
        varying vec4 v_color; \
        uniform bool enable_v_color; \
        uniform float u_pointsize; \
        uniform mat4 mvp_matrix; \
        uniform mat4 tx_matrix; \
        void main() { \
        gl_Position = mvp_matrix * a_position; \
        v_texCoord = tx_matrix * a_texCoord; \
        if (enable_v_color) \
        v_color = a_color; \
        else \
        v_color = u_color; \
        gl_PointSize = u_pointsize; \
        }");

    var fragmentShader = loadShader(gl.FRAGMENT_SHADER,
      "precision mediump float; \
          varying vec4 v_texCoord; \
          uniform sampler2D s_texture; \
          varying vec4 v_color; \
          uniform bool enable_s_texture; \
          void main() { \
          if (enable_s_texture) \
          gl_FragColor = v_color * texture2D(s_texture, v_texCoord.st); \
          else \
          gl_FragColor = v_color; \
          }");

    var shaderProgram = gl.createProgram();
    gl.attachShader(shaderProgram, vertexShader);
    gl.attachShader(shaderProgram, fragmentShader);
    gl.linkProgram(shaderProgram);
    if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
      throw Error("Unable to initialize the shader program.");
    }
    gl.useProgram(shaderProgram);

    vertexPos = gl.getAttribLocation(shaderProgram, "a_position");
    colorPos = gl.getAttribLocation(shaderProgram, "a_color");
    texCoordPos = gl.getAttribLocation(shaderProgram, "a_texCoord");
    ucolorloc = gl.getUniformLocation(shaderProgram, "u_color");
    stextureloc = gl.getUniformLocation(shaderProgram, "s_texture");
    upointsizeloc = gl.getUniformLocation(shaderProgram, "u_pointsize");
    mvpmatrixloc = gl.getUniformLocation(shaderProgram, "mvp_matrix");
    txmatrixloc = gl.getUniformLocation(shaderProgram, "tx_matrix");
    enablestexloc = gl.getUniformLocation(shaderProgram, "enable_s_texture");
    enablevcoloc = gl.getUniformLocation(shaderProgram, "enable_v_color");

    for (var i = 0; i < texture_list.length; i++) {
      var img = new Image();
      img.tex = gl.createTexture();
      img.onload = function() {
        gl.bindTexture(gl.TEXTURE_2D, this.tex);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, this);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.bindTexture(gl.TEXTURE_2D, null);
        textures[this.src.split("/").pop()] = this.tex;
        texloads += 1;
        if (texloads == texture_list.length)
          callback();
      };
      img.src = texture_list[i];
    }

  }

  function loadShader(type, source) {
    var shader;
    shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS))
      throw Error("An error occurred compiling the shaders: " + gl.getShaderInfoLog(shader));
    return shader;
  }

  function uMatrixMode(mode) {
    if (mode == U_PROJECTION) {
      activeMatrix = prMatrix;
      activeStack = prStack;
    } else if (mode == U_MODELVIEW) {
      activeMatrix = mvMatrix;
      activeStack = mvStack;
    } else if (mode == U_TEXTURE) {
      activeMatrix = txMatrix;
      activeStack = txStack;
    }
  }

  function uLoadIdentity() {
    activeMatrix[0] = 1;
    activeMatrix[1] = 0;
    activeMatrix[2] = 0;
    activeMatrix[3] = 0;
    activeMatrix[4] = 0;
    activeMatrix[5] = 1;
    activeMatrix[6] = 0;
    activeMatrix[7] = 0;
    activeMatrix[8] = 0;
    activeMatrix[9] = 0;
    activeMatrix[10] = 1;
    activeMatrix[11] = 0;
    activeMatrix[12] = 0;
    activeMatrix[13] = 0;
    activeMatrix[14] = 0;
    activeMatrix[15] = 1;
  }

  function multiply(result, srcA, srcB) {

    var tmp = new Float32Array([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);

    for (var i = 0; i < 4; i++) {
      var a = 4 * i;
      var b = a + 1;
      var c = a + 2;
      var d = a + 3;
      tmp[a] = srcA[a] * srcB[0] +
        srcA[b] * srcB[4] +
        srcA[c] * srcB[8] +
        srcA[d] * srcB[12];
      tmp[b] = srcA[a] * srcB[1] +
        srcA[b] * srcB[5] +
        srcA[c] * srcB[9] +
        srcA[d] * srcB[13];
      tmp[c] = srcA[a] * srcB[2] +
        srcA[b] * srcB[6] +
        srcA[c] * srcB[10] +
        srcA[d] * srcB[14];
      tmp[d] = srcA[a] * srcB[3] +
        srcA[b] * srcB[7] +
        srcA[c] * srcB[11] +
        srcA[d] * srcB[15];
    }
    for (var i = 0; i < 16; i++)
      result[i] = tmp[i];
  }

  function uMultMatrix(mat) {
    multiply(activeMatrix, mat, activeMatrix);
  }

  function uTranslatef(x, y, z) {
    var m = activeMatrix;
    m[12] += m[0] * x + m[4] * y + m[8] * z;
    m[13] += m[1] * x + m[5] * y + m[9] * z;
    m[14] += m[2] * x + m[6] * y + m[10] * z;
    m[15] += m[3] * x + m[7] * y + m[11] * z;
  }

  function uRotatef(angle, x, y, z) {
    angle = -angle;
    var c = Math.cos(angle * Math.PI / 180.0);
    var s = Math.sin(angle * Math.PI / 180.0);
    var omc = 1.0 - c;
    var mag = Math.sqrt(x * x + y * y + z * z);
    if (mag != 0.0 && mag != 1.0) {
      x = x / mag;
      y = y / mag;
      z = z / mag;
    }

    var xy = x * y;
    var yz = y * z;
    var zx = z * x;
    var ys = y * s;
    var xs = x * s;
    var zs = z * s;

    var rot = new Float32Array([omc * x * x + c, omc * xy - zs, omc * zx + ys, 0.0,
      omc * xy + zs, omc * y * y + c, omc * yz - xs, 0.0,
      omc * zx - ys, omc * yz + xs, omc * z * z + c, 0.0,
      0.0, 0.0, 0.0, 1.0
    ]);
    uMultMatrix(rot);
  }

  function uScalef(x, y, z) {
    activeMatrix[0] *= x;
    activeMatrix[1] *= x;
    activeMatrix[2] *= x;
    activeMatrix[3] *= x;

    activeMatrix[4] *= y;
    activeMatrix[5] *= y;
    activeMatrix[6] *= y;
    activeMatrix[7] *= y;

    activeMatrix[8] *= z;
    activeMatrix[9] *= z;
    activeMatrix[10] *= z;
    activeMatrix[11] *= z;
  }

  function uOrthof(left, right, bottom, top, near, far) {
    var dX = right - left;
    var dY = top - bottom;
    var dZ = far - near;
    var orth = new Float32Array([2 / dX, 0, 0, 0,
      0, 2 / dY, 0, 0,
      0, 0, -2 / dZ, 0, -(right + left) / dX, -(top + bottom) / dY, -(near + far) / dZ, 1.0
    ]);
    uMultMatrix(orth);
  }

  function uPushMatrix() {
    var store = new Float32Array(16);
    for (var i = 0; i < 16; i++)
      store[i] = activeMatrix[i];
    activeStack.push(store);
  }

  function uPopMatrix() {
    var restore = activeStack.pop();
    for (var i = 0; i < 16; i++)
      activeMatrix[i] = restore[i];
  }

  function uColor4f(r, g, b, a) {
    ucolr = r;
    ucolg = g;
    ucolb = b;
    ucola = a;
  }

  function uPointSize(size) {
    upointsize = size;
  }

  function uVertexPointer(size, type, stride, buf) {
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.vertexAttribPointer(vertexPos, size, type, false, size * 4, 0);
    gl.enableVertexAttribArray(vertexPos);
  }


  function uColorPointer(size, type, stride, buf) {
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.vertexAttribPointer(colorPos, size, type, false, size * 4, 0);
    gl.enableVertexAttribArray(colorPos);
  }

  function uTexCoordPointer(size, type, stride, buf) {
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.vertexAttribPointer(texCoordPos, size, type, false, size * 4, 0);
    gl.enableVertexAttribArray(texCoordPos);
  }


  function uEnableClientState(state) {
    if (state == U_TEXTURE_COORD_ARRAY)
      enablestex = true;
    else if (state == U_COLOR_ARRAY)
      enablevco = true;
  }

  function uDisableClientState(state) {
    if (state == U_TEXTURE_COORD_ARRAY)
      enablestex = false;
    else if (state == U_COLOR_ARRAY)
      enablevco = false;
  }

  function uDrawArrays(mode, first, count) {
    gl.uniform1i(enablestexloc, enablestex);
    gl.uniform1i(enablevcoloc, enablevco);
    gl.uniform1f(upointsizeloc, upointsize);
    gl.uniform4f(ucolorloc, ucolr, ucolg, ucolb, ucola);
    gl.activeTexture(gl.TEXTURE0);
    gl.uniform1i(stextureloc, 0);
    multiply(mvpMatrix, mvMatrix, prMatrix);
    gl.uniformMatrix4fv(mvpmatrixloc, false, mvpMatrix);
    gl.uniformMatrix4fv(txmatrixloc, false, txMatrix);
    if (!enablestex)
      gl.disableVertexAttribArray(texCoordPos);
    if (!enablevco)
      gl.disableVertexAttribArray(colorPos);
    gl.drawArrays(mode, first, count);
  }

  function checkError(source) {
    var error = gl.getError();
    if (error == gl.NO_ERROR)
      return;
    throw Error("OpenGL Error from " + source + ": " + error);
  }


  return {
    shake: shake
  };

})();

/**
 * @namespace
 * @type {Object} Visualization object
 */
var vz = {
  name: 'MilkShake',
  type: 'visualization',
  tags: ['canvas', '2d'],
  screen: null,
  canvas: null,
  ctx: null,
  width: 0,
  height: 0,
  bands: [],
  band_count: 0,
  initialized: false,
  options: {
    wave_color_left: 'blue',
    wave_color_right: 'green'
  },
  audio: {
    audio: function(event) {
      vz.redraw(event.audio);
      return true;
    },
    pause: function(event) {
      return true;
    },
    reset: function(event) {
      return true;
    }
  }
};

/**
 * Redraw Visualization
 * @param audio
 */
vz.redraw = function(audio) {
  //   if (!vz.initialized) return;

  //   var x, y, i, l,
  //     min = 100,
  //     max = -100;

  //   vz.ctx.clearRect(0, 0, vz.width, vz.height);
  //   vz.ctx.beginPath();
  //   vz.ctx.moveTo(0, vz.height / 2);

  //   vz.ctx.strokeStyle = vz.options.wave_color_left;

  // //  console.log('audio', audio);

  //   for (i = 0, l = audio.wave.left.length; i < l; i++) {
  //     x = vz.width / l * i;
  //     y = (1 - audio.wave.left[i]) / 2 * vz.height;
  //     vz.ctx.lineTo(x, y);
  //   }

  //   vz.ctx.stroke();
  //   vz.ctx.beginPath();
  //   vz.ctx.strokeStyle = vz.options.wave_color_right;

  //   for (i = 0, l = audio.wave.right.length; i < l; i++) {
  //     x = vz.width / l * i;
  //     y = (1 + audio.wave.right[i]) / 2 * vz.height;
  //     vz.ctx.lineTo(x, y);
  //   }

  //   vz.ctx.stroke();
};

/**
 * Start visualization
 * @param options
 */
vz.start = function(options) {
  vz.bands = options.bands;
  vz.band_count = vz.bands.length;
  vz.screen = options.screen;
  vz.canvas = document.createElement('canvas');
  vz.canvas.width = vz.width = options.width;
  vz.canvas.height = vz.height = options.height;
  vz.screen.appendChild(vz.canvas);

  vz.ctx = vz.canvas.getContext('2d');
  vz.ctx.globalCompositeOperation = 'destination-over';
  vz.ctx.globalAlpha = 1;

  vz.initialized = true;

  milk.shake(vz.canvas);
};

/**
 * Stop visualization
 */
vz.stop = function() {
  if (!vz.initialized) return;
  vz.screen.removeChild(vz.canvas);
  vz.canvas = null;
  vz.ctx = null;
  vz.initialized = false;
};

/**
 * Start visualization fading in
 * @param options
 */
vz.fadeIn = function(options, step) {
  vz.start(options);
  vz.ctx.globalAlpha = 0.0;

  step = step || 0.03;

  function incrementalpha() {
    if (1 - vz.ctx.globalAlpha <= step || vz.ctx.globalAlpha >= 1.0) {
      vz.ctx.globalAlpha = 1;
    } else {
      vz.ctx.globalAlpha += step;
      window.setTimeout(incrementalpha, 100);
    }
  }

  incrementalpha();
};

/**
 * Stop visualization fading out
 */
vz.fadeOut = function(step) {
  if (!vz.initialized) return;

  step = step || 0.03;

  function decrementalpha() {
    if (vz.ctx.globalAlpha <= step || vz.ctx.globalAlpha >= 0) {
      vz.ctx.globalAlpha = 0;
      vz.stop();
    } else {
      vz.ctx.globalAlpha -= step;
      window.setTimeout(decrementalpha, 100);
    }
  }

  decrementalpha();
};

/**
 * Resize the visualization
 * @param width
 * @param height
 */
vz.resize = function(width, height) {
  if (!vz.initialized) return;
  vz.canvas.width = vz.width = width;
  vz.canvas.height = vz.height = height;
};

// Export API
exports.name = vz.name;
exports.type = vz.type;
exports.tags = vz.tags;
exports.start = vz.start;
exports.stop = vz.stop;
exports.fadeIn = vz.fadeIn;
exports.fadeOut = vz.fadeOut;
exports.resize = vz.resize;
exports.audio = vz.audio;