var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var marked = require('marked');

app.set('port', (process.env.PORT || 5000));

app.get('/', function(req, res){
  res.sendFile(__dirname + '/index.html');
});

io.on('connection', function(socket){
  socket.on('chat message', function(msg){
    io.emit('chat message', marked(msg));
  });
});

http.listen(app.get('port'), function(){
  console.log('listening on *:5000');
});
