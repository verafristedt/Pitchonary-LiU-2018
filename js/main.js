var dummyX = 0;
var dummyBool = true;

var audioContext = null;
var meter = null;
var canvasContext = null;
var WIDTH=500;
var HEIGHT=5;
var rafID = null;
var analyser = null;
var pitchElem;
var buflen = 1024;
var buf = new Float32Array( buflen );

window.onload = function() {
	
    // grab our canvas
	canvas = document.getElementById("meter");
	canvasContext = document.getElementById( "meter" ).getContext("2d");
	pitchElem = document.getElementById( "pitch" );
	
    // monkeypatch Web Audio
    window.AudioContext = window.AudioContext || window.webkitAudioContext;
	
    // grab an audio context
    audioContext = new AudioContext();
	MAX_SIZE = Math.max(4,Math.floor(audioContext.sampleRate/5000));	// corresponds to a 5kHz signal

    // Attempt to get audio input
    try {
        // monkeypatch getUserMedia
        navigator.mediaDevices.getUserMedia = 
        	navigator.mediaDevices.getUserMedia ||
        	navigator.webkitGetUserMedia ||
        	navigator.mozGetUserMedia;

        // ask for an audio input
        navigator.getUserMedia(
        {
            "audio": {
                "mandatory": {
                    "googEchoCancellation": "false",
                    "googAutoGainControl": "false",
                    "googNoiseSuppression": "false",
                    "googHighpassFilter": "false"
                },
                "optional": []
            },
        }, gotStream, didntGetStream);
    } catch (e) {
        alert('getUserMedia threw exception :' + e);
    }
}

function didntGetStream() {
    alert('Stream generation failed.');
}

var mediaStreamSource = null;

function gotStream(stream) {
    // Create an AudioNode from the stream.
    mediaStreamSource = audioContext.createMediaStreamSource(stream);

    // Create a new volume meter and connect it.
    meter = createAudioMeter(audioContext);
    mediaStreamSource.connect(meter);
	
	//ASDASDASD
	analyser = audioContext.createAnalyser();
	analyser.fftSize = 2048;
	mediaStreamSource.connect(analyser);

    // kick off the visual updating
    drawLoop();
}

var storeDrawing = new Array();

function drawLoop( time ) {	
    // clear the background
	canvasContext.clearRect(0,0,canvas.width,canvas.height);
	
	analyser.getFloatTimeDomainData( buf );
    var ac = autoCorrelate( buf, audioContext.sampleRate );
    var xVal2 = (meter.volume*canvas.width)*2;
    
	
	document.addEventListener('keydown', function(event) {
        ac = autoCorrelate( buf, audioContext.sampleRate );
        var xVal = (meter.volume*canvas.width)*2;
        
        if (dummyX != xVal && ac != -1 && event.keyCode == 32){
            if(xVal > canvas.width && ac/5 > canvas.height) storeDrawing.push({x: canvas.width-2.5, y: canvas.height-2.5, draw: true});
            else if(xVal > canvas.width) storeDrawing.push({x: canvas.width-2.5, y: Math.round(ac/5), draw: true});
            else if(ac/5 > canvas.height) storeDrawing.push({x: xVal, y: canvas.height-2.5, draw: true});
            else storeDrawing.push({x: xVal, y: Math.round(ac/5), draw: true});

            dummyX = xVal;
            dummyBool = true;
        }
        else if (event.keyCode == 8 && dummyBool){
            storeDrawing.pop();
            dummyBool = false;
        }
        else if (event.keyCode == 27){
            storeDrawing = [];
        }
        else if (event.keyCode == 13){
            if(xVal > canvas.width && ac/5 > canvas.height) storeDrawing.push({x: canvas.width-2.5, y: canvas.height-2.5, draw: false});
            else if(xVal > canvas.width) storeDrawing.push({x: canvas.width-2.5, y: Math.round(ac/5), draw: false});
            else if(ac/5 > canvas.height) storeDrawing.push({x: xVal, y: canvas.height-2.5, draw: false});
            else storeDrawing.push({x: xVal, y: Math.round(ac/5), draw: false});
        }
        
	}, false);
	
	 if (ac == -1) {
	 	pitchElem.innerText = "--";
 	} else {
	 	pitchElem.innerText = Math.round( ac );
	}  
       
    canvasContext.fillStyle = "red";

    // draw a "crosshair" based on the current volume
    if(xVal2 > canvas.width && ac/5 > canvas.height) canvasContext.fillRect(canvas.width-5, canvas.height-5, 5, 5);
    else if(xVal2 > canvas.width) canvasContext.fillRect(canvas.width-5, ac/5, 5, 5);
    else if(ac/5 > canvas.height) canvasContext.fillRect(meter.volume*canvas.width*2, canvas.height-5, 5, 5);
    else canvasContext.fillRect(meter.volume*canvas.width*2, ac/5, 5, 5);
	
	if(storeDrawing.length != 0 || storeDrawing.length != undefined){
        canvasContext.strokeStyle = "#DF4B26";
        canvasContext.lineJoin = "round";
        canvasContext.lineWidth = 5;

		for(var i=0; i < storeDrawing.length; i++){
            //canvasContext.fillRect(storeDrawing[i].x,storeDrawing[i].y,5,5);
            canvasContext.beginPath();
            if(i > 0 && storeDrawing[i].draw) canvasContext.moveTo(storeDrawing[i-1].x, storeDrawing[i-1].y);

            else if(!storeDrawing[i].draw) {
                canvasContext.moveTo(storeDrawing[i].x, storeDrawing[i].y);
                canvasContext.fillRect(storeDrawing[i].x, storeDrawing[i].y, 5, 5);
            }

            else canvasContext.moveTo(storeDrawing[i].x-1, storeDrawing[i].y);

            canvasContext.lineTo(storeDrawing[i].x, storeDrawing[i].y);

            canvasContext.closePath();
            canvasContext.stroke();
		}
	}
		
	// set up the next visual callback
	if (!window.requestAnimationFrame)
		window.requestAnimationFrame = window.webkitRequestAnimationFrame;
	rafID = window.requestAnimationFrame( drawLoop );
	
}
