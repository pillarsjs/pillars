
var util = require('util');
var formwork = require('./lib/formwork');
var Pillar = require('./lib/Pillar');
var bricks = require('./lib/bricks');
var Beam = require('./lib/Beam');
var templates = require('./lib/template');




var server = formwork().mongodb('primera');

var myPillar = new Pillar({
	id:'sample-pillar',
	title:'Configuración',
	path:'/system',
	template:'lib/crud.jade'
})
	.addBeam(new Beam('list',{session:true,template:'crud-list'},crudList))
	.addBeam(new Beam('one',{path:'/:_id',session:true,template:'crud-update'},BeamIds,crudOne))
	.addBeam(new Beam('update',{path:'/:_id',method:'post',session:true,template:'crud-update'},BeamIds,crudUpdate))
;

var mymodel = new bricks.Fieldset('system',{
	title : 'Un fieldset',
	details : 'Completa los campos'
})
	.addField(new bricks.Text('field1',{
		label : 'Field1',
		details : 'Rellena este campo...'
	}))
	.addField(new bricks.Text('field2',{
		label : 'Field2',
		details : 'Rellena este campo...'
	}))
	.addField(new bricks.Reverse('reverse',{
		label : 'Reverse',
		details : 'Este va invertido en la bdd'
	}))
	.addField(new bricks.Textarea('textarea',{
		label : 'Textarea i18n',
		details : 'Un campo internacional'
	}))
	.addField(new bricks.Text('field3',{
		label : 'Field3',
		details : 'Rellena este campo...'
	}))
;

/*
function crudList(){
	var gw = this;
	var collection = gw.server.database.collection('system');
	mymodel.list(collection,gw,function(docs){
		gw.render({
			h1:'listado',
			data:docs,
			trace:util.format(gw)
		});
	},function(error){
		gw.render({ // aqui mostar detalles del error, la operación no e puede continuar
			h1:'Error gravisimo...',
			template:'crud-error',
			trace:util.format(gw)
		});
	});
}

function crudOne(){
	var gw = this;
	var collection = gw.server.database.collection('system');
	mymodel.one(collection,gw,function(doc){
		gw.render({
			h1:'Viendo '+doc._id,
			data:doc,
			model:mymodel,
			trace:util.format(gw)
		});
	},function(error){
		gw.render({ // aqui mostar detalles del error, la operación no e puede continuar
			h1:'El elento no existe',
			template:'crud-error',
			trace:util.format(gw)
		});
	});
}

function crudUpdate(){
	var gw = this;
	var collection = gw.server.database.collection('system');
	mymodel.update(collection,gw,function(doc){
		gw.render({
			h1:'Editando '+doc._id,
			data:doc,
			model:mymodel,
			trace:util.format(gw)
		});
	},function(error){
		gw.render({ // aqui mostar detalles del error, la operación no e puede continuar
			h1:'El elento no existe',
			template:'crud-error',
			trace:util.format(gw)
		});
	});
}
*/

function crudList(){
	var gw = this;
	var db = gw.server.database.collection('system');
	db.find().toArray(function(error, result) {
		if(!error && result && result.length>0){
			/*
			for(var i in result){
				var _id = result[i]._id;
				result[i] = mymodel.getter(result[i]);
				result[i]._id = _id;
			}
			*/
		}
		if(error){gw.msgs.push(new Msg("pillar.database.errors.list","model",error));}
		gw.render({
			h1:'listado',
			data:result,
			trace:util.format(gw)
		});
	});
}


function crudOne(){
	var gw = this;
	var db = gw.server.database.collection('system');
	db.findOne({_id:gw.params._id},function(error, result) {
		if(!error && result){
			var _id = result._id;
			result = mymodel.getter(result);
			result._id = _id;
		}
		if(error){gw.msgs.push(new Msg("pillar.database.errors.one","model",error));}
		if(!result){
			gw.msgs.push(new Msg("pillar.actions.one.noexist","actions",""));
			gw.render({
				h1:'Error al mostrar el elemento'+gw.params._id,
				template:'crud-error',
				trace:util.format(gw)
			});
		} else {
			gw.render({
				h1:'Viendo '+gw.params._id,
				data:result,
				model:mymodel,
				trace:util.format(gw)
			});
		}
	});
}

function crudUpdate(){
	var gw = this;
	var db = gw.server.database.collection('system');
	var doc = gw.params[mymodel.id] || {};
	var validate = mymodel.validate(doc);
	doc._id = gw.params._id;
	if(validate.length>0){
		gw.msgs.push(validate);
		gw.render({
			h1:'Hay campos completados de forma incorrecta '+gw.params._id,
			data:doc,
			model:mymodel,
			trace:util.format(gw)
		});
	} else {
		doc = mymodel.setter(doc);
		db.update({_id:gw.params._id},doc,function(error, result) {
			if(error){gw.msgs.push(new Msg("pillar.database.errors.update","model",error));}
			if(!error && result>0){
				gw.msgs.push(new Msg("pillar.actions.update.updated","actions",""));
				crudOne.call(gw);
			} else {
				gw.msgs.push(new Msg("pillar.actions.update.fail","actions",""));
				gw.render({
					h1:'Error al modificar el elemento '+gw.params._id,
					data:doc,
					model:mymodel,
					trace:util.format(gw)
				});
			}
		});
	}
}


var ObjectID = require('mongodb').ObjectID;
function BeamIds(next){
	var gw = this;
	var _id = gw.params._id || "";
	var checkhexid = /^[a-f0-9]{24}$/;
	if(checkhexid.test(_id)){gw.params._id = new ObjectID.createFromHexString(_id);}
	next();
}

function Msg(msg,type,details,params){
	this.msg = msg;
	this.type = type || "info";
	this.details = details || "";
	this.params = params || {};
	this.toString = function(){
		return '['+this.type+']'+this.msg+': '+this.details;
	}
}

/* *
var memwatch = require('memwatch');
var hd = new memwatch.HeapDiff();
var leaks = [];
var stats = [];
memwatch.on('stats', function(_stats) {
	_stats.diff = hd.end();
	stats.push(_stats);
	hd = new memwatch.HeapDiff();
});
memwatch.on('leak', function(info) {
	leaks.push(info);
});
.addBeam(new Beam('stats',{path:'/stats'},function(){
	var gw = this;
	gw.send(stats);
}))
.addBeam(new Beam('leaks',{path:'/leaks'},function(){
	var gw = this;
	gw.send(leaks);
}))
/* */

/*

.addBeam(new Beam('download',{path:'/file',session:true},function(){
	var gw = this;
	gw.file('./uploads/exquisite0002.png','prueba.txt',false);
}))
.addBeam(new Beam('form',{path:'/form',method:'(get|post)',session:true,upload:true},function(){
	var gw = this;
	if(!gw.session.counter){gw.session.counter=0;}
	gw.session.counter++;

	var body = templates.render('./form.jade',{
		trace: util.format(gw),
		title:'Method test',
		h1:'Method testing:'
	});
	gw.send(body);	
}))

*/

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

/*

 else {
			gw.setHeader('Allow',gw.beam.getConfig().methods.join(', ').toUpperCase());
			gw.error(405,'Method not allowed');
		}

*/
		/*
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
		*/
