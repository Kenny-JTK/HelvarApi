var express = require('express');
var router = express.Router();
var jsondb = require('node-json-db');
var db = new jsondb("./data/commands");
var dbinfo = new jsondb("./data/info");

//for all views
var Dalititle = "Helvar API";
var Daliother = "Kenny"
var Daligroup = dbinfo.getData("/workgroup");
var Dalirouter = dbinfo.getData("/router");
// GET Home Page
router.get('/', function(req, res, next) {
	
	res.render('index', {title: Dalititle, name: Daliother, workgroup:Daligroup, ip:Dalirouter});		
	});
// GET Commands Page
router.get('/commands', function(req,res){
	var input=db.getData("/commands/input");
	var output=db.getData("/commands/Output");
	res.render('commands',{title: Dalititle, name: Daliother, workgroup:Daligroup, ip:Dalirouter,jsonInput : input,jsonOutput : output});
});
// GET Groups Page
router.get('/groups', function(req,res){
	var groepen=dbinfo.getData("/groups");	
	res.render('groups',{title: Dalititle, name: Daliother, workgroup:Daligroup, ip:Dalirouter, groupsIN : groepen});
});
module.exports = router;
