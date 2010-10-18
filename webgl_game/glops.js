
	ax=0;
	ay=0;
	az=0;
	gx = 0;
	gy = 0;
	gz = 0;
	speed=0;
	vawRate = 0;

  var gl;
  function initGL(canvas) {
    try {
      gl = canvas.getContext("experimental-webgl");
      gl.viewportWidth = canvas.width;
      gl.viewportHeight = canvas.height;
    } catch(e) {
    }
    if (!gl) {
      alert("Could not initialise WebGL, sorry :-(");
    }
  }


  function getShader(gl, id) {
    var shaderScript = document.getElementById(id);
    if (!shaderScript) {
      return null;
    }

    var str = "";
    var k = shaderScript.firstChild;
    while (k) {
      if (k.nodeType == 3) {
        str += k.textContent;
      }
      k = k.nextSibling;
    }

    var shader;
    if (shaderScript.type == "x-shader/x-fragment") {
      shader = gl.createShader(gl.FRAGMENT_SHADER);
    } else if (shaderScript.type == "x-shader/x-vertex") {
      shader = gl.createShader(gl.VERTEX_SHADER);
    } else {
      return null;
    }

    gl.shaderSource(shader, str);
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      alert(gl.getShaderInfoLog(shader));
      return null;
    }

    return shader;
  }


  var shaderProgram;
  function initShaders() {
    var fragmentShader = getShader(gl, "shader-fs");
    var vertexShader = getShader(gl, "shader-vs");

    shaderProgram = gl.createProgram();
    gl.attachShader(shaderProgram, vertexShader);
    gl.attachShader(shaderProgram, fragmentShader);
    gl.linkProgram(shaderProgram);

    if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
      alert("Could not initialise shaders");
    }

    gl.useProgram(shaderProgram);

    shaderProgram.vertexPositionAttribute = gl.getAttribLocation(shaderProgram, "aVertexPosition");
    gl.enableVertexAttribArray(shaderProgram.vertexPositionAttribute);

    shaderProgram.textureCoordAttribute = gl.getAttribLocation(shaderProgram, "aTextureCoord");
    gl.enableVertexAttribArray(shaderProgram.textureCoordAttribute);

    shaderProgram.pMatrixUniform = gl.getUniformLocation(shaderProgram, "uPMatrix");
    shaderProgram.mvMatrixUniform = gl.getUniformLocation(shaderProgram, "uMVMatrix");
    shaderProgram.samplerUniform = gl.getUniformLocation(shaderProgram, "uSampler");
  }


  function handleLoadedTexture(texture) {
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, texture.image);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);

    gl.bindTexture(gl.TEXTURE_2D, null);
  }


  var mudTexture;
  function initTexture() {
    mudTexture = gl.createTexture();
    mudTexture.image = new Image();
    mudTexture.image.onload = function() {
      handleLoadedTexture(mudTexture)
    }

    mudTexture.image.src = "grass.jpeg";
  }


  var mvMatrix;
  var mvMatrixStack = [];

  function mvPushMatrix(m) {
    if (m) {
      mvMatrixStack.push(m.dup());
      mvMatrix = m.dup();
    } else {
      mvMatrixStack.push(mvMatrix.dup());
    }
  }

  function mvPopMatrix() {
    if (mvMatrixStack.length == 0)
    {
      throw "Invalid popMatrix!";
    }
    mvMatrix = mvMatrixStack.pop();
    return mvMatrix;
  }

  function loadIdentity() {
    mvMatrix = Matrix.I(4);
  }


  function multMatrix(m) {
    mvMatrix = mvMatrix.x(m);
  }

  function mvTranslate(v) {
    var m = Matrix.Translation($V([v[0], v[1], v[2]])).ensure4x4();
    multMatrix(m);
  }

  function mvRotate(ang, v) {
    var arad = ang * Math.PI / 180.0;
    var m = Matrix.Rotation(arad, $V([v[0], v[1], v[2]])).ensure4x4();
    multMatrix(m);
  }

  var pMatrix;
  function perspective(fovy, aspect, znear, zfar) {
    pMatrix = makePerspective(fovy, aspect, znear, zfar);
  }


  function setMatrixUniforms() {
    gl.uniformMatrix4fv(shaderProgram.pMatrixUniform, false, new Float32Array(pMatrix.flatten()));
    gl.uniformMatrix4fv(shaderProgram.mvMatrixUniform, false, new Float32Array(mvMatrix.flatten()));
  }


  var currentlyPressedKeys = Object();

  function handleKeyDown(event) {
    currentlyPressedKeys[event.keyCode] = true;
  }


  function handleKeyUp(event) {
    currentlyPressedKeys[event.keyCode] = false;
  }


  pitch = 0;

  yaw = 0;

  xPos = 0;
  yPos = 1;
  zPos = 0;


  function handleKeys() {
	  /*
    if (currentlyPressedKeys[33]) {
      // Page Up
      pitchRate = 0.1;
    } else if (currentlyPressedKeys[34]) {
      // Page Down
      pitchRate = -0.1;
    } else {
      pitchRate = 0;
    }

    if (currentlyPressedKeys[37] || currentlyPressedKeys[65]) {
      // Left cursor key or A
      yawRate = 0.1;
    } else if (currentlyPressedKeys[39] || currentlyPressedKeys[68]) {
      // Right cursor key or D
      yawRate = -0.1;
    } else {
      yawRate = 0;
    }
    if (currentlyPressedKeys[38] || currentlyPressedKeys[87]) {
      // Up cursor key or W
      speed = 0.003;
    } else if (currentlyPressedKeys[40] || currentlyPressedKeys[83]) {
      // Down cursor key
      speed = -0.003;
    } else {
      speed = 0;
    } */
  }


  var worldVertexPositionBuffer = null;
  var worldVertexTextureCoordBuffer = null;
  function handleLoadedWorld(data) {
    var lines = data.split("\n");
    var vertexCount = 0;
    var vertexPositions = [];
    var vertexTextureCoords = [];
    for (var i in lines) {
      var vals = lines[i].replace(/^\s+/, "").split(/\s+/);
      if (vals.length == 5 && vals[0] != "//") {
        // It is a line describing a vertex; get X, Y and Z first
        vertexPositions.push(parseFloat(vals[0]));
        vertexPositions.push(parseFloat(vals[1]));
        vertexPositions.push(parseFloat(vals[2]));

        // And then the texture coords
        vertexTextureCoords.push(parseFloat(vals[3]));
        vertexTextureCoords.push(parseFloat(vals[4]));

        vertexCount += 1;
      }
    }

    worldVertexPositionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, worldVertexPositionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertexPositions), gl.STATIC_DRAW);
    worldVertexPositionBuffer.itemSize = 3;
    worldVertexPositionBuffer.numItems = vertexCount;

    worldVertexTextureCoordBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, worldVertexTextureCoordBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertexTextureCoords), gl.STATIC_DRAW);
    worldVertexTextureCoordBuffer.itemSize = 2;
    worldVertexTextureCoordBuffer.numItems = vertexCount;

    document.getElementById("loadingtext").textContent = "";
  }


  function loadWorld() {
    var request = new XMLHttpRequest();
    request.open("GET", "world.txt");
    request.onreadystatechange = function() {
      if (request.readyState == 4) {
        handleLoadedWorld(request.responseText);
      }
    }
    request.send();
  }


  function drawScene() {
	
    gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    if (worldVertexTextureCoordBuffer == null || worldVertexPositionBuffer == null) {
      return;
    }

    perspective(45, gl.viewportWidth / gl.viewportHeight, 0.1, 100.0);

    loadIdentity();

    mvRotate(-pitch, [1, 0, 0]);
    mvRotate(-yaw, [0, 1, 0]);
    mvTranslate([-xPos, -yPos, -zPos]);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, mudTexture);
    gl.uniform1i(shaderProgram.samplerUniform, 0);

    gl.bindBuffer(gl.ARRAY_BUFFER, worldVertexTextureCoordBuffer);
    gl.vertexAttribPointer(shaderProgram.textureCoordAttribute, worldVertexTextureCoordBuffer.itemSize, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ARRAY_BUFFER, worldVertexPositionBuffer);
    gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, worldVertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);

    setMatrixUniforms();
    gl.drawArrays(gl.TRIANGLES, 0, worldVertexPositionBuffer.numItems);
  }


  var lastTime = 0;
  var piOver180 = Math.PI / 180;
  // Used to make us "jog" up and down as we move forward.
  var joggingAngle = 0;
  
  
  function animate() {
	  
    var timeNow = new Date().getTime();
    if (lastTime != 0) {
      var elapsed = timeNow - lastTime;

      if (speed != 0) {
        xPos -= Math.sin(yaw * piOver180) * speed * elapsed;
        zPos -= Math.cos(yaw * piOver180) * speed * elapsed;

        //joggingAngle += elapsed * 0.6;  // 0.6 "fiddle factor" - makes it feel more realistic :-)
        yPos = Math.sin(joggingAngle * piOver180) / 20 + 0.4
      }

      yaw += yawRate * elapsed;
      pitch += pitchRate * elapsed;

    }
    lastTime = timeNow;
  }


  function tick() {
    handleKeys();
    drawScene();
    animate();
  }



  function webGLStart() {
    var canvas = document.getElementById("lesson10-canvas");
    initGL(canvas);
    initShaders();
    initTexture();
    loadWorld();

    gl.clearColor(0.0, 0.0, 0.0, 1.0);

    gl.clearDepth(1.0);

    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL);

    document.onkeydown = handleKeyDown;
    document.onkeyup = handleKeyUp;

    setInterval(tick, 15);
  }