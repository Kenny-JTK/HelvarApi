var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

// custom modules
var net = require('net'); // module voor tcp communicatie
var udp = require('dgram'); //module voor udp communicatie
var request = require('request');//module voor JSON GET/POST naar externe partijen
var HelvarComm = require("./helvar/HelvarCommands.json"); //import alle commands
var HelvarConfig = require("./helvar/HelvarConfig.json"); //import configuratie gegevens
var jsondb= require('node-json-db');
var dbcomm = new jsondb("./data/commands",true,false);
var dbinfo = new jsondb("./data/info",true,false);
//var nano = require('nano');
//var nanodb = new nano('http://localhost:5984');
//var dbgroup = nanodb.db.use('groups');
//var dbinfo = nanodb.db.use('info');
//console.log("test" + HelvarConfig.Ibasx);

//variables
var debug = HelvarConfig.debug
var HelvarHost = HelvarConfig.HelvarHost;
var HelvarPortTCP = HelvarConfig.HelvarPortTCP;
var HelvarPortUDP = HelvarConfig.HelvarPortUDP;
var RestPort = HelvarConfig.RestPort;
var WorkGroup = HelvarConfig.WorkGroup;
var MSGuit = ">V:1,C:11,L:0,G:1,B:1,S:15,F:0#";
var MSGaan = ">V:1,C:11,L:0,G:1,B:1,S:1,F:0#";
var DiscoveredIp = [];

//start
var app = express();
var routes= require('./routes/index');
var users = require('./routes/users');

//Debug info
function print(msg){
	if (debug=="true"){
		console.log(msg);
		};
};
	
//HELVARNET 

//Start : Workgroup Discover
function WorkGroupDiscover(){
	
	/*
	 * Maak een lijst met alle gevonden ipadressen die reageren op multicast
	*/
	
	var clientDiscover = new udp.createSocket("udp4");
	print("Helvar : UDP Discover Started");
	clientDiscover.on('message',function(message,info){
		
		if (HelvarHost == ""||HelvarHost== null){
			print("Helvar : UDP Discover : Found router @ " +info.address);
			HelvarHost = info.address.toString("utf8");
		}else{
			clientDiscover.close();
			print("Helvar : UDP Discover Closed");
			WorkGroupName()
			};
		});
	clientDiscover.bind(4250,"255.255.255.255");
};	
	
//Get WorkgroupName
function WorkGroupName(){	

		var clientUDP = new udp.createSocket("udp4");

		clientUDP.on('listening', function(){
			var listening= clientUDP.address();
			WorkgroupRequest();
			print("Helvar : UDP Listening on " + listening.address + " : " + listening.port);
			});
			
		clientUDP.on('message', function(msg,rinfo) {
			print("Helvar : UDP recieved from: " + rinfo.address );
			print("Helvar : UDP recieved from: " + rinfo.port);
			print("Helvar : UDP recieved from: " + msg);
			var msg1 = msg.toString("utf8");		// msg comes in as a buffer
			WorkGroup = msg1.slice((msg1.indexOf('=') + 1 ),(msg1.length - 1));
			print("Helvar : WorkGroup set : " + WorkGroup);
			HelvarTcpConn();
			clientUDP.close();
			print("Helvar : UDP Connection Closed");
			dbinfo.push('/workgroup',WorkGroup);
			dbinfo.push('/router',HelvarHost);
			   }); 	

		clientUDP.bind(HelvarPortUDP);
};

//send Workgroup Name request
function WorkgroupRequest(){
	var cmd=">V:1,C:107#";
	var WorkGroupCmd = new Buffer(">V:1,C:107#","ascii");

	var UDPsocket = new udp.createSocket("udp4");
	
	UDPsocket.send(WorkGroupCmd, 0, WorkGroupCmd.length,HelvarPortUDP,HelvarHost,function (err,bytes){
		//if (err) throw {print(err)};
		print("Helvar : UDP Name Command Send");
		});
	
	                                                                                                 
}; 

WorkGroupDiscover();
	
//End : Workgroup Discover


//db fill static elements
dbcomm.push('/commands',HelvarComm);



// open tcpssocket to Helvar Router
function HelvarTcpConn(){
	
	var jsonObj; //variabele met json string van listen

	var client = new net.Socket(); // open een nieuwe socket

	client.setEncoding('utf8'); // set communicatie taal 
	
	client.connect(HelvarPortTCP,HelvarHost,function(err){
		if (err){
			print("tcp error" + err);
		}else {
		print('Helvar : Connected to Router : '+ HelvarHost);
		//DO Query Groups
		client.write(">V:2,C:165#");
		};
	});
	
	client.on('data', function(data){
		handlerTCP(data);
	});

	client.on('close',function(){
		print('connection closed');
	});
};

//handle all incommming tcp data
function handlerTCP(data){
	// create json string met alle correcte tekens
		data = data.replace('>','{');
		data = data.replace('?','{');
		data = data.replace('V','"V');
		data = data.replace(/:/g,'":"'); // /x/g staat voor alle voorkomende keren
		data = data.replace(/,/g,'","');
		data = data.replace('#','"}');
		if (data.indexOf('=')>-1) {
			data = data.replace('=','","response":["');
			data = data.replace('}',']}');
			return data
			};
		jsonObj=(JSON.parse(data));
		print("Helvar : MSG recv. :" + jsonObj);
		//query groups
		if (jsonObj.C==165){
			dbinfo.push('/groups',{"groups":jsonObj.response});
			};
		
		if (HelvarConfig.Ibasx.indexOf(jsonObj.G) >= 0 && jsonObj.C == 11){
			print("is IBASX");
			}else{
			print("no IBASX");	
			}
	};
//end handle

//Webinterface
var HVN = express(); // HVN = HelvarNet webinterface socket

var server= HVN.listen(RestPort,function(){print("Helvar : Rest-API Listening on port " + RestPort)});

HVN.get('/uit', function(req,res){
	client.write(MSGuit);
	setTimeout(function(){
	res.end(JSON.stringify(jsonObj))},1000);
	print("klaar uit");
});

HVN.get('/aan', function(req,res){
	client.write(MSGaan);
	setTimeout(function(){
	res.end(JSON.stringify(jsonObj))},1000);
	print("klaar aan");
});

//end Helvarnet

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));


app.use('/', routes);
app.use('/users', users);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
