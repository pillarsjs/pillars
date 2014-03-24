
var util = require('util');
var pillars = require('./pillars');
var template = pillars.template;

var server = pillars.formwork(function(){
	var gw = this;
	if(/^\/contenido\/?$/.test(gw.path)){

		if(!gw.session.counter){gw.session.counter=0;}
		gw.session.counter++;

		var body = template.view('form',{
			//trace: util.format(gw),
			title:'Method test',
			h1:'Method testing:'
		});
		gw.send(body);	

	} else if(/^\/yalotengo\/?$/.test(gw.path)){
		if(!gw.cacheck(new Date(false))){
			gw.send('Este contenido es fijo y se cachea');
		}
	} else if(/^\/espera\/?$/.test(gw.path)){
		// Force timeout!
	} else if(/^\/redirecciona\/?$/.test(gw.path)){
		gw.redirect('http://localhost:3000/yalotengo');
	} else if(/^\/auth\/?$/.test(gw.path)){
		gw.authenticate();
	} else if(/^\/malapeticion\/?$/.test(gw.path)){
		gw.error(400,'Bad Request');// 405 Method not allowed 	Allow: GET, HEAD
	} else if(/^\/archivo\/?$/.test(gw.path)){
		gw.file('./uploads/exquisite0002.png','prueba.txt',false);
	} else if(/^\/error\/?$/.test(gw.path)){
		throw new Error("Crashhh!");
	} else {
		return false;
	}
	return true;
}).mongodb('primera');


/*
var memwatch = require('memwatch');
var hd = new memwatch.HeapDiff();
memwatch.on('stats', function(stats) {
	stats.diff = hd.end();
	console.log(util.inspect(stats, { depth: 7, colors: true }));
	hd = new memwatch.HeapDiff();
});
memwatch.on('leak', function(info) {
	console.log(util.inspect(info, { depth: 7, colors: true }));
});
*/

