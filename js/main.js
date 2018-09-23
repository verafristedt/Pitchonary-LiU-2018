
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
	//ASDASDASD
	//updatePitch();
	//ASDASDSAD
	

    // kick off the visual updating
    drawLoop();
}


function drawLoop( time ) {

		
    // clear the background
	canvasContext.clearRect(0,0,canvas.width,canvas.height);
	
	analyser.getFloatTimeDomainData( buf );
	var ac = autoCorrelate( buf, audioContext.sampleRate );
	
	 if (ac == -1) {
	 	pitchElem.innerText = "--";
 	} else {
	 	
	 	pitchElem.innerText = Math.round( ac ) ;
		}  
    
    // check if we're currently clipping
    if (meter.checkClipping())
        canvasContext.fillStyle = "red";
    else
        canvasContext.fillStyle = "green";

    // draw a bar based on the current volume
	canvasContext.fillRect(meter.volume*canvas.width*10, ac*canvas.height/10000, 5, 5);

    // set up the next visual callback
	if (!window.requestAnimationFrame)
		window.requestAnimationFrame = window.webkitRequestAnimationFrame;
    rafID = window.requestAnimationFrame( drawLoop );
}
