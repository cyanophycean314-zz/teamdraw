//Dynamically draw on a canvas
//========================================================

context = document.getElementById('shared_canvas').getContext("2d");
context.fillRect(0,0,200,200);

//Three parallel arrays 
var clickX = new Array();
var clickY = new Array();
var clickDrag = new Array();
var paint = false;

function addClick(x,y, dragging = false) {
	//Records the click for future use!
	clickX.push(x);
	clickY.push(y);
	clickDrag.push(dragging);
}

function redraw() {
	context.clearRect(0, 0, context.canvas.width, context.canvas.height);

	context.strokeStyle = mycolor;
	context.lineJoin = "round";
	context.lineWidth = 5;

	for (var i = 0; i < clickX.length; i++) {
		context.beginPath();
		if (clickDrag[i] && i) {
			//Connect with previous el in list
			context.moveTo(clickX[i-1], clickY[i-1]);
		} else {
			//Start the path right next to the current point
			context.moveTo(clickX[i]-1, clickY[i]);
		}
		context.lineTo(clickX[i], clickY[i]);
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
	redraw();	//Update the screen
});

$('#shared_canvas').mousemove(function(e) {
	//Mouse moves across the canvas
	if (paint) {
		addClick(e.pageX - this.offsetLeft, e.pageY - this.offsetTop, true);
		redraw();
	}
});

$('#shared_canvas').mouseup(function(e) {
	//Mouse lifts up, so stop painting
	paint = false;
});

$('#shared_canvas').mouseleave(function(e) {
	//Mouse is off canvas, so stop painting
	paint = false;
})