//Dynamically draw on a canvas
//========================================================

context = document.getElementById('shared_canvas').getContext("2d");

//Three parallel arrays
var segments = [];
var paint = false;
var lastpoint = {x: -1, y: -1};
var doneloading = true;

function addClick(x,y, dragging = false) {
	//Records the click for future use!
	var newseg = {};
	if (dragging) {
		newseg.x1 = lastpoint.x;
		newseg.y1 = lastpoint.y;
	} else {
		newseg.x1 = x -1;
		newseg.x2 = y;
	}
	newseg.x2 = x;
	newseg.y2 = y;
	newseg.c = user_color;
	segments.push(newseg);
	socket.emit('newseg', segments);
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

$('#shared_canvas').mousedown(function(e) {
	//Mouse comes down for the first time
	var mouseX = e.pageX - this.offsetLeft;
	var mouseY = e.pageY - this.offsetTop;

	paint = true;
	addClick(mouseX, mouseY);
});

$('#shared_canvas').mousemove(function(e) {
	//Mouse moves across the canvas
	if (paint) {
		addClick(e.pageX - this.offsetLeft, e.pageY - this.offsetTop, true);
	}
	lastpoint.x = e.pageX - this.offsetLeft;
	lastpoint.y = e.pageY - this.offsetTop;
});

$('#shared_canvas').mouseup(function(e) {
	//Mouse lifts up, so stop painting
	paint = false;
});

$('#shared_canvas').mouseleave(function(e) {
	//Mouse is off canvas, so stop painting
	paint = false;
})