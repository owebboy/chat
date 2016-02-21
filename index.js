var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);

var session = require('express-session');
var MongoDBStore = require('connect-mongodb-session')(session);

var store = new MongoDBStore(
  { 
    uri: 'mongodb://sys:sys@ds011228.mongolab.com:11228/chat-1',
    collection: 'mySessions'
  });

var bodyParser = require('body-parser');

var marked = require('marked');
var sanitizeHtml = require('sanitize-html');

var mongoose = require('mongoose');
mongoose.connect('mongodb://sys:sys@ds011228.mongolab.com:11228/chat-1');

var Message = mongoose.model('message', {
  content: String,
  date: Date,
  author: String,
  color: String
});

var CronJob = require('cron').CronJob;
var job = new CronJob({
  cronTime: '00 30 11 * * 0-6',
  onTick: function() {
    Message.remove({}, function(err) {
      if (err) return next(err);
    })
  },
  start: false,
  timeZone: 'America/New_York'
});
job.start();

app.use(session ({
  secret: 'This is a secret',
  cookie: {
    maxAge: 1000 * 60 * 60 * 24 * 7 // 1 week 
  },
  store: store
}));
app.use(bodyParser());

app.set('port', (process.env.PORT || 5000));
app.set('view engine', 'html');
app.engine('html', require('hbs').__express);
app.use(express.static('files'));

app.get('/', function(req, res, next){
  if (req.session.user) {
    Message.find({}, function(err, message) {
      if (err) return next(err);
      res.render('index', {
        message: message,
        user: req.session.user,
        color: req.session.color
      });
    });
  } else {
    res.render('gate', {});
  }
  
});

app.post('/enter', function(req, res, next) {
  req.session.user = req.body.nickname;
  req.session.color = req.body.randomColor;
  res.redirect('/');
});

io.on('connection', function(socket) {
  io.emit('user connected', 'user connected');
  
  socket.on('chat message', function(msg){
    var cleanHtml = sanitizeHtml(msg.content);
    
    Message.create({ content: marked(cleanHtml), date: new Date, author: msg.author, color: msg.color }, function(err, message) {
      if (err) return io.emit('chat message', err);
      io.emit('chat message', { content: message.content, author: message.author, color: message.color });
    });
  });
  
  socket.on('disconnect', function() {
    io.emit('user connected', 'user disconnected');
  });
  
});

http.listen(app.get('port'), function(){});
