//NPM packages
var Express = require('express');
var _ = require ("lodash");
var bodyParser = require ("body-parser");
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var session = require('express-session');
var io = require('socket.io');
var http = require('http');

//Setting up the app
var app = new Express();
var router = Express.Router();
var server = http.Server(app);
var socket = io(server);

//Setup Port
var port = process.env.PORT || 8080;
app.set('port', port);

//Setting config.
app.use(Express.static(__dirname + '/views'));
app.use(Express.static(__dirname + '/public'));

//Logger
app.use(logger('dev'));
app.use(cookieParser());
app.use(session({ secret: 'vilaSTF111', resave: true, saveUninitialized: true }));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

app.use(function(req, res, next) {
	res.header('Access-Control-Allow-Origin', '*');
	res.header('Access-Control-Allow-Header', 'Origin, X-Requested-With, Content-Type, Accept');
	next();
});

//ChangRobert
app.get('/changrobert', function(req, res) {
	res.sendFile(__dirname + '/views/changrobert.html');
});

socketCR = socket.of('/changrobert')
idListCR = [];
machineListCR = [];

socketCR.on('connection', function(socket){
  console.log('A machine has connected');
  socket.on('machineNameChosen', function(MachineInfo){
  	if (!_.includes(idListCR, MachineInfo.Uid)){
  		idListCR.push(MachineInfo.Uid);
      machineListCR.push(MachineInfo);
  		console.log('ChangRobert Process ' + MachineInfo.MachineName + ' chosen. Uid number: ' + MachineInfo.Uid + ". Hidden ID: " + idListCR.indexOf(MachineInfo.Uid));
  	}
  	var ID = idListCR.indexOf(MachineInfo.Uid)
    var confirmation = {};
    confirmation.ID = ID;
    confirmation.Uid = MachineInfo.Uid;
  	socket.emit('confirmID', confirmation);
  });
  socket.on('ElectionMessage', function(message){
    nextMessage = {};
    sender = parseInt(message.sender);
    highUid = parseInt(message.highUid);

    nextMessage.sender = machineListCR[sender].MachineName;

    if(sender == (idListCR.length - 1)){
      nextMessage.destinyID = 0;
      nextMessage.destiny = machineListCR[0].MachineName;
    }
    else{
      nextMessage.destinyID = sender + 1;
      nextMessage.destiny = machineListCR[sender + 1].MachineName;;
    }

    if(parseInt(machineListCR[sender].Uid) > highUid){
      nextMessage.highUid = machineListCR[sender].Uid;
    }
    else{
      nextMessage.highUid = highUid;
    }

    setTimeout(function() {
      socket.broadcast.emit('ElectionMessage', nextMessage);
      console.log('Waiting 3 segs');
    }, 3000);
    
  });
  socket.on('ElectedMessage', function(message){
    nextMessage = {};
    sender = parseInt(message.sender);
    elected = parseInt(message.elected);

    nextMessage.sender = machineListCR[sender].MachineName;
    nextMessage.elected = elected;

    if(sender == (idListCR.length - 1)){
      nextMessage.destinyID = 0;
      nextMessage.destiny = machineListCR[0].MachineName;  
    }
    else{
      nextMessage.destinyID = sender + 1;
      nextMessage.destiny = machineListCR[sender + 1].MachineName;;
    }
    setTimeout(function() {
      socket.broadcast.emit('ElectedMessage', nextMessage)
      console.log('Waiting 3 segs');
    }, 3000);
    
  });
});

app.get('/changrobert/:Uid', function(req,res){
  socketCR.emit('startelection', req.params.Uid);
  res.send('O programa com o Uid ' + req.params.Uid + " notou a falta de líder e iniciou a eleição.")
});

//Bully

app.get('/bully', function(req, res) {
  res.sendFile(__dirname + '/views/bully.html');
});

socketBully = socket.of('/bully')
idListBully = [];
machineListBully = [];

socketBully.on('connection', function(socket){
  console.log("Bully machine connected");
  socket.on('machineNameChosen', function(MachineInfo){
    if (!_.includes(idListBully, MachineInfo.Uid)){
      idListBully.push(MachineInfo.Uid);
      machineListCR.push(MachineInfo);
      console.log('Machine ' + MachineInfo.MachineName + ' chosen. Uid number: ' + MachineInfo.Uid + ". Hidden ID: " + idListBully.indexOf(MachineInfo.Uid));
    }
    var ID = idListBully.indexOf(MachineInfo.Uid)
    var confirmation = {};
    confirmation.ID = ID;
    confirmation.Uid = MachineInfo.Uid;
    socket.emit('confirmID', confirmation);
  });
  socket.on('ElectionMessage', function(message){
    setTimeout(function() {
    socketBully.emit('ElectionMessage', message);
    console.log('Waiting 3 segs');
    }, 3000);

  });
  socket.on('AckMessage', function(message){
    setTimeout(function() {
      socketBully.emit('AckMessage', message);
      console.log('Waiting 3 segs');
    }, 3000);

  });
  socket.on('electedLeader', function(message){
    setTimeout(function() {
      socketBully.emit('electedLeader', message);
    }, 3000);
  });
});
app.get('/bully/:Uid', function(req,res){
  socketBully.emit('startelection', req.params.Uid);
  res.send('O processo com o Uid ' + req.params.Uid + " notou a falta de líder e iniciou a eleição.")
});
// START THE app
server.listen(app.get('port'), function(){
	console.log("Server listening to port " + app.get('port'));
});