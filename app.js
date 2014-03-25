
var util = require('util');
var formwork = require('./lib/formwork');
var tiles = require('./lib/tiles');
tiles.load('./form.jade');

var myserver = formwork(function(){
	var gw = this;
	if(/^\/contenido\/?$/.test(gw.path)){

		if(!gw.session.counter){gw.session.counter=0;}
		gw.session.counter++;

		var body = tiles.render('./form.jade',{
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
El beam hace de agrupador de controladores,
basicamente es un conjunto de acciones que puede tener un modelo asociado y extensiones (submodelos)
El modelo es el que se encarga de la validación de los datos y el formateo etc
El action es el que se encarga de la logica, bdd, llamada a template
El beam coordina los puntos comunes de los actions, el modelo comun, la ruta base comun, titulo comun
credenciales comunes del modulo (integracion con el sistema general de credenciales)

La mecanica: Creamos un new pillars, este internamente gestiona su alta en el listado de pillars, le añadimos beams.
Al crear el servidor le pasamos como parametro a pillars.router, un metodo estatico del objeto que gestiona las rutas a todos
los pillars.

*

var sampleBeam = new pillars.Beam();
sampleBeam.setId('sample-beam');
sampleBeam.addAction(new pillars.Action('list',{path:'/'},GenericList));

var GenericList = function(){
	beam = this;
	beam.db.find().toArray(function(error, result) {
		if(!error && result && result.length>0){
			for(var i in result){
				var _id = result[i]._id;
				result[i] = beam.fields.getter(result[i]);
				result[i]._id = _id;
			}
		}
		if(error){res.msgs.push(new msg("pillar.database.errors.list","model",error));}
		beam.template.view('list',req,res,result);
	});
}

/* *
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
/* */

//var filepath = path.replace(/[^\\\/]*$/,'');
//var filename = path.replace(/^.*[\\\/]/,'').replace(/\..*$/,'');
//var fileext = path.replace(/^.*[\.]/,'');

/* Emitter-mod *
var EventEmitter = require('events').EventEmitter;
EventEmitter.prototype.__emit = EventEmitter.prototype.emit;
EventEmitter.prototype.__onAll = function(type){console.log('{Event}--'+this.constructor.name+'('+type+')');}
EventEmitter.prototype.emit = function(){
	this.__onAll.apply(this,arguments);
	return this.__emit.apply(this,arguments);
}
/* */

/* *

function isUndefined(arg) {
  return arg === void 0;
}

function isString(arg) {
  return typeof arg === 'string';
}
function isBuffer(arg) {
  return arg instanceof Buffer;
}
function isObject(arg) {
  return typeof arg === 'object' && arg !== null;
}

/* */
