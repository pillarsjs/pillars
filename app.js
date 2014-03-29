
var util = require('util');
var formwork = require('./lib/formwork');
var Pillar = require('./lib/Pillar');
var bricks = require('./lib/bricks');
var Beam = require('./lib/Beam');



var server = formwork().mongodb('primera');

var myPillar = new Pillar({
	id:'sample-pillar',
	title:'Configuración',
	path:'/system',
	template:'lib/crud.jade'
});
myPillar
.addBeam(new Beam('list',{session:true,template:'crud-list'},crudList))
.addBeam(new Beam('one',{path:'/:_id',session:true,template:'crud-update'},BeamIds,crudOne))
.addBeam(new Beam('update',{path:'/:_id',method:'post',session:true,template:'crud-update'},BeamIds,crudUpdate))
;

var mymodel = new bricks.Fieldset({
	title : 'Un fieldset',
	details : 'Completa los campos',
	fields : {
		field1 : new bricks.fields.Text({
			label : 'Field1',
			details : 'Rellena este campo...'
		}),
		field2 : new bricks.fields.Text({
			label : 'Field2',
			details : 'Rellena este campo...'
		})
	}
});

function crudList(){
	var gw = this;
	var db = gw.server.database.collection('system');
	db.find().toArray(function(error, result) {
		if(!error && result && result.length>0){
			for(var i in result){
				var _id = result[i]._id;
				result[i] = mymodel.getter(result[i]);
				result[i]._id = _id;
			}
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

	var doc = gw.params['uname'];
	var validate = mymodel.validate(doc);
	doc._id = gw.params._id;
	if(validate.length>0){
		gw.msgs.push(validate);
		gw.render({
			h1:'Modificar '+gw.params._id,
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



/*

function(){
		var gw = this;
		if(!gw.session.counter){gw.session.counter=0;}
		gw.session.counter++;

		var body = template.render('./form.jade',{
			trace: util.format(gw),
			title:'Method test',
			h1:'Method testing:'
		});
		gw.send(gw.beam.status());	
	}

*/

//myPillar.status();



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
