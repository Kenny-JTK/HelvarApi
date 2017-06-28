var express = require('express');
var router = express.Router();
var jsondb = require('node-json-db');
var ip = require('ip');
var db = new jsondb("./data/commands");
var dbinfo = new jsondb("./data/info");
var dbconfig = new jsondb('./helvar/HelvarConfig');
var dbworkgroup = new jsondb("./data/workgroup", true, false);

//for all views
var Dalititle = "Helvar API";
var Daliother = "Kenny"
var Daligroup = dbinfo.getData("/workgroup");
var Dalirouter = dbinfo.getData("/router");
var RestPort = dbconfig.getData("/RestPort");
var UrlIp = ip.address();

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
    var groepen = dbworkgroup.getData("/groups");
    
    var RestDLG = "HTTP://" + UrlIp + ":" + RestPort + "/DLG";
    var RestRSG = "HTTP://" + UrlIp + ":" + RestPort + "/RSG";
    res.render('groups', { title: Dalititle, name: Daliother, workgroup: Daligroup, ip: Dalirouter, groupsIN: groepen, ApiDLG: RestDLG , ApiRSG: RestRSG });
});
module.exports = router;
