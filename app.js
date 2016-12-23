var express = require('express');
var http = require('http');
var app = express();
var server = http.createServer(app);
var io = require('socket.io').listen(server);

server.listen(8080);

app.get('/', function (req, res) {
	res.sendFile(__dirname + '/index.html');
});
app.get('/teamdraw.js', function (req, res) {
	res.sendFile(__dirname + '/teamdraw.js');
});
app.get('/share.js', function (req, res) {
	res.sendFile(__dirname + '/share.js');
});

var usernames = {};
var colors = {};
var usercount = 0;

io.sockets.on('connection', function (socket) {
	socket.on('sendchat', function (data) {
		io.sockets.emit('updatechat', socket.username, data);
	});

	socket.on('adduser', function(){
		username = "user" + (usercount++).toString();
		socket.username = username;
		usernames[username] = username;
		//Generate random color for new user
		colors[username] = '#'+Math.random().toString(16).substr(-6);

		socket.emit('welcome', colors[username]);
		socket.emit('updatechat', 'SERVER', 'you have connected');
		socket.broadcast.emit('updatechat', 'SERVER', username + ' has connected');
		io.sockets.emit('updateusers', usernames);
	});

	socket.on('disconnect', function(){
		delete usernames[socket.username];
		io.sockets.emit('updateusers', usernames);
		socket.broadcast.emit('updatechat', 'SERVER', socket.username + ' has disconnected');
	});
});