var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var marked = require('marked');
var mongoose = require('mongoose');
mongoose.connect('mongodb://sys:sys@ds011228.mongolab.com:11228/chat-1');

var Message = mongoose.model('message', {
  content: String,
  date: Date
});

app.set('port', (process.env.PORT || 5000));
app.set('view engine', 'html');
app.engine('html', require('hbs').__express);

app.get('/', function(req, res, next){
  Message.find({}, function(err, message) {
    if (err) return next(err);
    res.render('index', {
      message: message
    });
  });
});

io.on('connection', function(socket){
  io.emit('user connected', 'a user has connected');
  socket.on('chat message', function(msg){
    Message.create({ content: marked(msg), date: new Date }, function(err, message) {
      if (err) return io.emit('chat message', err);
      io.emit('chat message', message.content);
    });
  });
});

http.listen(app.get('port'), function(){});
