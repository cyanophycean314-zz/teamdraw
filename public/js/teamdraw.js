//Socket forms the basis of our communications
var socket = io.connect();

//Server Shenanigans
//==============================================================

// on connection to server, tell server it's ready to add a username
socket.on('connect', function(){
	socket.emit('adduser');
});

// listener, checks server connectivity with heartbeat every 30s
var lastbeat;	//ID of the timeout for the function that prints lag. Gets closed upon receiving new heartbeat.
socket.on('heartbeat', function () {
    clearTimeout(lastbeat);
    lastbeat = setTimeout(function() {
    	$('#status').html('<b>Sorry looking a bit laggy...</b>');
    	console.log("Heartbeat missed!");
    }, 31000);
    $('#status').html('Splash away on the canvas!');
});

// Error messages
socket.on('error', function (err) {
    var type = err.type;    // This is the type of error that occurred
    var message = err.message;    // This is a friendly message that should describe the error
    console.log(err.type + ": " + err.message);
});

//Chat functionality
//=======================================================

// listener, receives the user's color and id as well as any existing paints
socket.on('welcome', function (user_data, segs) {
    user_color = user_data.color;
    user_id = user_data.id;
    segments = segs;
    redraw();
});

// listener, whenever the server emits 'updatechat', this updates the chat body
socket.on('updatechat', function (username, data) {
	var convo = $('#conversation');
	convo.append('<div><b>'+username + ':</b> ' + data + '</div>');
	//autoscroll
	convo.scrollTop(convo.prop('scrollHeight'));
});

// listener, whenever the server emits 'updateusers', this updates the username list with colors
socket.on('updateusers', function(data) {
	$('#users').empty();
	$.each(data, function(idnum, user_obj) {
		coloredsquare = '<span style="color:' + user_obj.color + ';">&#x25A0;</span>';
		$('#users').append('<div>' + coloredsquare + ' ' + user_obj.username + '</div>');
	});
});

// listener, whenever server broadcasts a new segment, draw it
socket.on('newseg', function (newsegment) {
    segments.push(newsegment);
    drawseg(newsegment);
});

// listener, clears the screen upon server request
socket.on('clear', function () {
	segments = [];
	redraw();
});

//Dynamically draw on a canvas
//========================================================

canvas = document.getElementById('shared_canvas');	//Canvas object in HTML. Works in Chrome
context = canvas.getContext("2d");					//Drawing element for the canvas

var segments = [];					//Contains all segments (paths) drawn on the screen
/* segment has properties
	begpos = {x,y}, beginning of path
	endpos = {x,y}, end of path
	w = int, width of line
	c = hex color, color of line
*/
var mode = 1; 						//0 - erase, 1 - paint
var paint = false; 					//true if mouse is down and new segments are being added
var lastpoint = {x: -1, y: -1};		//the point where the mouse was one event ago

//Records the click for future use!
function addClick(pos, m, width, dragging = false) {
	var newseg = {};
	//If dragging, connect to previous point
	if (dragging) {
		newseg.begpos = lastpoint;
	} else {
		newseg.begpos = {x: pos.x - 1, y: pos.y};
	}
	newseg.endpos = pos;
	newseg.w = width;
	if (m == 1) {
		newseg.c = user_color;
	} else {
		newseg.c = '#FFFFFF';
	}
	segments.push(newseg);
	socket.emit('newseg', newseg);
	drawseg(newseg);
}

//Draws a single additional segment to the canvas
function drawseg(seg) {
	context.lineJoin = "round";
	context.lineWidth = seg.w;
	context.strokeStyle = seg.c;
	context.beginPath();
	context.moveTo(seg.begpos.x, seg.begpos.y)
	context.lineTo(seg.endpos.x, seg.endpos.y);
	context.closePath();
	context.stroke();
}

//Clears the screen and redraws all the segments
function redraw() {
	context.clearRect(0, 0, context.canvas.width, context.canvas.height);
	for (var i = 0; i < segments.length; i++) {
		drawseg(segments[i]);
	}
}

//Returns the mouse position correcting for scrolling and scaling
function getMousePos(c, e) {
	var rect = c.getBoundingClientRect();
	return {
		x: (e.clientX - rect.left) / (rect.right - rect.left) * canvas.width,
		y: (e.clientY - rect.top) / (rect.bottom - rect.top) * canvas.height
	};
}

//Mouse is clicked and the painting starts
$('#shared_canvas').mousedown(function(e) {
	paint = true;
	addClick(getMousePos(canvas, e), mode, $('#pensize').val());
});

//Mouse moves across the canvas
$('#shared_canvas').mousemove(function(e) {
	if (mode == 1) {
		canvas.style.cursor = "crosshair";	//Drawing cursor
	} else {
		canvas.style.cursor = "pointer";		//Scrubbing cursor
	}
	mousepos = getMousePos(canvas, e);
	if (paint) {
		addClick(mousepos, mode, $('#pensize').val(), true);
	}
	lastpoint = mousepos;
});

//Mouse lifts up, so stop painting
$('#shared_canvas').mouseup(function(e) {
	paint = false;
});

//Mouse is off canvas, so stop painting
$('#shared_canvas').mouseleave(function(e) {
	paint = false;
})

// On page load
// ================================================================
$(function(){
	// when the client clicks SEND
	$('#datasend').click( function() {
		var message = $('#data').val();
		$('#data').val('');
		// tell server to execute 'sendchat' and send along with message
		socket.emit('sendchat', message);
	});

	// when the client hits ENTER on their keyboard
	$('#data').keypress(function(e) {
		if(e.which == 13) {
			$(this).blur();
			$('#datasend').focus().click();
			$('#data').focus();
		}
	});

	//when the client hits the eraser, toggle modes and appearance.
	$('#eraserbut').click( function() {
		$('#eraserbut').toggleClass('button-primary');
		mode = !mode;
	});

	//when the client hits the CLEAR button for the canvas button
	$('#clearbut').click( function () {
		segments = [];
		socket.emit('clear');
		redraw();
	});
});