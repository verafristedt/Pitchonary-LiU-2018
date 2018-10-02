var dummyX = 0;


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
        navigator.getUserMedia = 
        	navigator.getUserMedia ||
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
    
	
	document.addEventListener('keypress', function(event) {
        ac = autoCorrelate( buf, audioContext.sampleRate );
        var xVal = (meter.volume*canvas.width)*2;
        
        if (dummyX != xVal && ac != -1){
            storeDrawing.push({x: xVal, y: Math.round(ac/5)});
            dummyX = xVal;
        }
        
	}, false);
	
	 if (ac == -1) {
	 	pitchElem.innerText = "--";
 	} else {
	 	
	 	pitchElem.innerText = Math.round( ac );
		}  

    // check if we're currently clipping
    /*if (meter.checkClipping())
        canvasContext.fillStyle = "red";
    else*/
        canvasContext.fillStyle = "green";

    // draw a "crosshair" based on the current volume
	canvasContext.fillRect(meter.volume*canvas.width*2, ac/5, 5, 5);
	
	if(storeDrawing.length != 0 || storeDrawing.length != undefined){
        canvasContext.strokeStyle = "#DF4B26";
        canvasContext.lineJoin = "round";
        canvasContext.lineWidth = 5;

		for(var i=0; i < storeDrawing.length; i++){
            //canvasContext.fillRect(storeDrawing[i].x,storeDrawing[i].y,5,5);
            canvasContext.beginPath();
            if(i > 0) canvasContext.moveTo(storeDrawing[i-1].x, storeDrawing[i-1].y);
                
            else canvasContext.moveTo(storeDrawing[i].x+1, storeDrawing[i].y);

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
