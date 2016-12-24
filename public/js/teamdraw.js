var socket = io.connect();

// on connection to server, ask for user's name with an anonymous callback
socket.on('connect', function(){
	// call the server-side function 'adduser' and send one parameter (value of prompt)
	socket.emit('adduser');
});

//listener, receives the user's color and id
socket.on('welcome', function (data) {
    // Connection is established, start using the socket
    user_color = data.color;
    user_id = data.id;
    segments = data.segs;
    redraw();
});

// listener, whenever the server emits 'updatechat', this updates the chat body
socket.on('updatechat', function (username, data) {
	$('#conversation').append('<div><b>'+username + ':</b> ' + data + '</div>');
	$('#conversation').scrollTop(document.getElementById('conversation').scrollHeight);
});

// listener, whenever the server emits 'updateusers', this updates the username list
socket.on('updateusers', function(data) {
	$('#users').empty();
	$.each(data, function(key, value) {
		coloredsquare = '<span style="color:' + value + ';">&#x25A0;</span>';
		$('#users').append('<div>' + coloredsquare + ' ' + key + '</div>');
	});
});

// on load of page
$(function(){
	// when the client clicks SEND
	$('#datasend').click( function() {
		var message = $('#data').val();
		$('#data').val('');
		// tell server to execute 'sendchat' and send along one parameter
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

	//when the client hits the CLEAR button for the canvas button
	$('#clearbut').click( function () {
		segments = [];
		socket.emit('clear');
		redraw();
	});

	//Toggle the eraser button when clicked
	$('#eraserbut').click( function() {
		$('#eraserbut').toggleClass('button-primary');
		if ($('#eraserbut').hasClass('button-primary')) {
			mode = 2;
		} else {
			mode = 1;
		}
	});
});

socket.on('newseg', function (newsegment) {
    // The 'message' event is emitted whenever another client sends a message
    // Messages are automatically broadcasted to everyone in the room
    segments.push(newsegment);
    redraw();
});

socket.on('clear', function () {
	segments = [];
	redraw();
});

var lastbeat;
socket.on('heartbeat', function () {
    // You can listen on this event to make sure your connection is receiving events correctly
    // The server will emit a heartbeat every 30 seconds to all connected clients
    clearTimeout(lastbeat);
    lastbeat = setTimeout(function() {
    	$('#status').empty();
    	$('#status').append('Sorry looking a bit laggy...');
    }, 31000);	//31 second lag time
    $('#status').empty();
    $('#status').append('Splash away on the canvas!');
    //console.log('badump');
});

socket.on('error', function (err) {
    // Sometimes things go wrong!
    var type = err.type;    // This is the type of error that occurred
    var message = err.message;    // This is a friendly message that should describe the error
});

//Dynamically draw on a canvas
//========================================================

canvas = document.getElementById('shared_canvas');
context = canvas.getContext("2d");

//Three parallel arrays
var segments = [];
var mode = 1; //0 - none, 1 - paint, 2 - erase
var paint = false; //true if mouse is down and new segments are being added
var lastpoint = {x: -1, y: -1};
var doneloading = true;

function addClick(x, y, m, dragging = false) {
	//Records the click for future use!
	var newseg = {};
	if (dragging) {
		newseg.x1 = lastpoint.x;
		newseg.y1 = lastpoint.y;
	} else {
		newseg.x1 = x - 1;
		newseg.x2 = y;
	}
	newseg.x2 = x;
	newseg.y2 = y;
	if (m == 1) {
		newseg.c = user_color;
	} else {
		newseg.c = '#FFFFFF';
	}
	segments.push(newseg);
	socket.emit('newseg', newseg);
	redraw();
}

function redraw() {
	context.clearRect(0, 0, context.canvas.width, context.canvas.height);

	context.lineJoin = "round";
	context.lineWidth = 5;

	for (var i = 0; i < segments.length; i++) {
		var seg = segments[i];
		context.strokeStyle = seg.c;
		context.beginPath();
		context.moveTo(seg.x1,seg.y1)
		context.lineTo(seg.x2,seg.y2);
		context.closePath();
		context.stroke();
	}
}

function getMousePos(c, e) {
	var rect = c.getBoundingClientRect();
	return {
		x: (e.clientX - rect.left) / (rect.right - rect.left) * canvas.width,
		y: (e.clientY - rect.top) / (rect.bottom - rect.top) * canvas.height
	};
}

$('#shared_canvas').mousedown(function(e) {
	//Mouse comes down for the first time
	mousepos = getMousePos(canvas, e);
	paint = true;
	addClick(mousepos.x, mousepos.y, mode);
});

$('#shared_canvas').mousemove(function(e) {
	//Mouse moves across the canvas
	if (mode == 1) {
		canvas.style.cursor = "cell";
	} else if (mode == 2) {
		canvas.style.cursor = "move";
	}
	mousepos = getMousePos(canvas, e);
	if (paint) {
		addClick(mousepos.x, mousepos.y, mode, true);
	}
	lastpoint = mousepos;
});

$('#shared_canvas').mouseup(function(e) {
	//Mouse lifts up, so stop painting
	paint = false;
});

$('#shared_canvas').mouseleave(function(e) {
	//Mouse is off canvas, so stop painting
	paint = false;
})