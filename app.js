// Team Draw's Server Code

var express = require('express');
var app = express();
var http = require('http');
var server = http.createServer(app);
var socketIO = require('socket.io');
var io = socketIO.listen(server);

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

var users = {};		//List of users
var usercount = 0;	//Number of users who have joined, modded by 100
var segments = [];	//List of segments that is sent to all new users
var validator = require('validator');	//Helps prevent basic attacks through chat

io.sockets.on('connection', function (socket) {

	//A socket has sent a chat message
	socket.on('sendchat', function (data) {
		if (data.length > 6 && data.slice(0,6) == "-nick "){
			//Change their nickname, max 16 character length, all lowercase
			oldname = socket.username;
			new_name = validator.escape(data.slice(6)).toLowerCase();
			if (new_name.length > 16) {
				new_name = new_name.slice(0,16);
			}
			if (new_name.length > 0) {
				users[socket.id].username = new_name;
				this.username = users[socket.id].username;

				io.sockets.emit('updateusers', users);
				io.sockets.emit('updatechat', 'SERVER', oldname + ' is now ' + socket.username);
			}
		} else if (data.length > 0) {
			//Send a message
			io.sockets.emit('updatechat', socket.username, validator.escape(data));
		}
	});

	//A new user has joined!
	socket.on('adduser', function(){
		//Give default username, unique id, and random color
		usercount = (usercount + 1) % 100;
		this.id = usercount;
		users[this.id] = {};
		users[this.id].id = this.id;
		users[this.id].username = "user" + (this.id).toString();
		this.username = users[socket.id].username;
		users[this.id].color = '#'+Math.random().toString(16).substr(-6);

		socket.emit('welcome', users[this.id], segments);
		socket.emit('updatechat', 'SERVER', 'you have connected');
		socket.broadcast.emit('updatechat', 'SERVER', this.username + ' has connected');
		io.sockets.emit('updateusers', users);
		socket.emit('heartbeat');
	});

	//User disconnected
	socket.on('disconnect', function(){
		delete users[socket.id];
		io.sockets.emit('updateusers', users);
		socket.broadcast.emit('updatechat', 'SERVER', socket.username + ' has disconnected');
	});

	//If server gets a new segment, then give them to everyone
	socket.on('newseg', function (newsegment) {
		segments.push(newsegment);
		socket.broadcast.emit('newseg',newsegment);
	});

	//If server receives clear request, clear everyone's screen
	socket.on('clear', function () {
		socket.broadcast.emit('clear');
		segments = [];
		io.sockets.emit('updatechat', 'SERVER', socket.username + ' cleared the screen');
	})

	//Send out heartbeat every 30s to maintain server connection
	setInterval(function() {
		socket.emit('heartbeat');
	}, 30000);
});