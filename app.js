var express = require('express');
var app = express();
var http = require('http');
var server = http.createServer(app);
var socketIO = require('socket.io');
const io = socketIO.listen(server);

var validator = require('validator');

//Set port to local or production
app.set('port', (process.env.PORT || 8080));
//give access to public files - css, images, js
app.use(express.static(__dirname + '/public'));
//give home page
app.get('/', function (req, res) {
	res.sendFile(__dirname + '/index.html');
});
//set the ports
server.listen(app.get('port'), function() {
	console.log('Node app is running on port', app.get('port'));
});

var colors = {};
var usercount = 0;
var segments = [];
var validator = require('validator');

io.sockets.on('connection', function (socket) {
	socket.on('sendchat', function (data) {

		io.sockets.emit('updatechat', socket.username, validator.escape(data));
	});

	socket.on('adduser', function(){
		this.username = "user" + (usercount++).toString();
		//Generate random color for new user
		colors[this.username] = '#'+Math.random().toString(16).substr(-6);

		socket.emit('welcome', {color:colors[this.username], id: usercount, segs: segments});
		socket.emit('updatechat', 'SERVER', 'you have connected');
		socket.broadcast.emit('updatechat', 'SERVER', this.username + ' has connected');
		io.sockets.emit('updateusers', colors);
	});

	socket.on('disconnect', function(){
		delete colors[socket.username];
		io.sockets.emit('updateusers', colors);
		socket.broadcast.emit('updatechat', 'SERVER', socket.username + ' has disconnected');
	});

	//If server gets a new segment, then give them to everyone.
	socket.on('newseg', function (newsegment) {
		//Don't gotta do nothing
		segments.push(newsegment);
		socket.broadcast.emit('newseg',newsegment);
	});

	//If server receives clear request, clear everyone's
	socket.on('clear', function () {
		socket.broadcast.emit('clear');
		segments = [];
		io.sockets.emit('updatechat', 'SERVER', socket.username + ' cleared the screen');
	})

	//Send out heartbeat
	setInterval(function() {
		socket.emit('heartbeat');
	}, 30000);
});