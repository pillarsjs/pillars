
var ObjectID = require('mongodb').ObjectID;
var pillars = new Pillars();
module.exports = pillars;

function Pillars(){

	var P = this;

	var beams = {};

	this.Beam = function(_id){
		if(id){var id=_id.toString();} else {var id=Date.now().toString(36);}
		beams[id]=this;
		var beam = this;
		var title = "untitled";
		var path = '';
		var paths = [];
		var fieldset = null;
		var extensions = {};
		var t12n = false;
		var t12nSheet = null;
		var t12nLangs = ['en','es'];
		var t12nDefault = ['es'];
		var actions = {};
		
		this.status = function(){
			console.log('Id:',id);
			console.log('Title:',title);
			if(database){console.log('Database:',database.toString())};
			console.log('Path:',path);
			if(fieldset)console.log('Fielset:',fieldset.getId());
			console.log('Extensions:',Object.keys(extensions));
			console.log('T12n:',t12n);
			console.log('Actions:',Object.keys(actions));
			console.log('Beams:',Object.keys(beams));
		}
		this.setId = function(_id){
			var _id = _id.toString();
			delete beams[id];
			id = _id;
			beams[id]=beam;
			return beam;
		}
		this.getId = function(){
			return id;
		}
		this.setTitle = function(_title){
			var _title = _title.toString();
			title = _title;
			return beam;
		}
		this.getTitle = function(){
			return title;
		}
		this.setPath = function(_path){
			var _path = _path.toString();
			path = _path;
			return beam;
		}
		this.getPath = function(){
			return path;
		}
		this.pathsRefresh = function(){
			paths = [];
			for(var a in actions){
				paths.push(actions[a].regExp());
			}
		}
		this.setFieldset = function(_fieldset){
			// parse and check etc.
			fieldset = _fieldset;
			return beam;
		}
		this.removeFieldset = function(){
			fieldset = null;
			return beam;
		}
		this.addExtension = function(_extension){
			// parse and check etc.
			extensions[_extension.getId()] = _extension;
			return beam;
		}
		this.removeExtension = function(_id){
			var _id = _id.toString();
			if(extensions[_id]){delete extensions[_id]};
			return beam;
		}
		this.setT12n = function(_path){
			// here t12n loading etc...
			t12n = true;
			t12nSheet = _path;
			return beam;
		}
		this.unsetT12n = function(){
			t12n = false;
			t12nSheet = null;
			return beam;
		}
		this.addAction = function(_action){
			actions[_action.getId()]=_action.setBeam(beam);
			return beam;
		}
		this.removeAction = function(_id){
			var _id = _id.toString();
			if(actions[_id]){delete actions[_id];}
			return beam;
		}
	}

	this.Validation = function(field,errors,data){
		this.field = field;
		this.errors = errors;
		this.data = data;
		this.toString = function(){
			return this.field.label+": "+this.errors.join(", ");
		}
	}

	this.Msg = function(msg,type,details,params){
		this.msg = msg;
		this.type = type || "info";
		this.details = details || "";
		this.params = params || {};
		this.toString = function(){
			return '['+this.type+']'+this.msg+': '+this.details;
		}
	}

	this.Action = function(id,router){
		var action = this;
		var beam = null;
		var id = id.toString();
		var methods = [];
		var path = '';
		if(typeof router === "string"){
			methods.push('get');
			path = router;
		} else {
			path = router.pop();
			methods = router;
		}
		var midleware = [];
		for(var a in arguments){midleware.push(arguments[a]);}
		midleware.splice(0,2);
		var handler = midleware.pop();
		var allcalls = midleware.concat(handler);
		this.regExp = function(){

			//"method:path"

			var path = new RegExp("^[a-zA-Z_][a-zA-Z_0-9]*$");
			return action;// a especial format for regular exp check on routes. include method and route.
		}
		this.all = function(req,res,callback){
			var nexting = new Nexting(beam,req,res,allcalls,callback);
			nexting.ini();
		}
		this.single = function(req,res,callback){
			handler.call(beam,req,res,callback);
		}
		this.getId = function(){return id;}
		this.setBeam = function(_beam){beam = _beam;console.log('Action beamed!');return action;}
		this.status = function(){
			console.log('Id:',id);
			console.log('Methods:',methods);
			console.log('Path:',path);
			if(beam)console.log('Beam:',beam.getId());
			console.log('Handler:',handler);
			console.log('Midleware:',midleware);
		}
	}

	this.ActionIds = function(req,res,next){
		var _id = req.params._id || "";
		var checkhexid = /^[a-f0-9]{24}$/;
		if(checkhexid.test(_id)){req.params._id = new ObjectID.createFromHexString(_id);}
		next();
	}

	function Nexting(beam,req,res,midleware,callback){
		var midleware = midleware.slice();
		var callback = callback || false;
		var launch = function(){
			var next = midleware.shift();
			if(next){
				next.call(beam,req,res,launch);
			} else if(callback) {
				callback.call(beam,req,res);
			}
		}
		this.ini = launch;
	}
}