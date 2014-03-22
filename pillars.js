
var jade = require('jade');
var util = require('util');
var fs = require('fs');

module.exports.PillarsFields = new PillarsFields();
module.exports.Pillars = new Pillars();
module.exports.Template = Template;
module.exports.Render = Render;

function PillarsFields(){

	var PF = this;

	/*
	function fieldNmr(id){
		if(!name){return "";}
		var name = name.replace('][','_');
		name = name.replace('[','_');
		name = name.replace(']','');
		return name;
	}
	*/

	function fieldIdr(id){
		if(!name){return "";}
		var name = name.replace('][','_');
		name = name.replace('[','_');
		name = name.replace(']','');
		return name;
	}

	this.Fieldset = function(setup){
		var setup = setup || {};
		this.id = setup.id || '';
		this.title = setup.title || '';
		this.details = setup.details || '';
		this.fields = setup.fields || {};
		this.template = 'fieldset';
		//this.need = setup.need || {};

		this.getId = function(){
			fieldIdr(this.id);
		}

		this.getName = function(){
			fieldIdr(this.id);
		}

		this.getter = function(data){
			var data = data || {};
			var result = {};
			for(var name in this.fields){
				result[name] = this.fields[name].getter(data[name]);
			}
			return result;
		};
		this.setter = function(data){
			var data = data || {};
			var result = {};
			for(var name in this.fields){
				result[name] = this.fields[name].setter(data[name]);
			}
			return result;
		};
		this.validate = function(data){
			var data = data || {};
			var result = [];
			for(var name in this.fields){
				var errors = this.fields[name].validate(data[name]);
				if(errors.length>0){
					result.push(new validation(this.fields[name],errors,data[name]));
				}
			}
			return result;
		};
	}

	this.Field = function(setup){
		var setup = setup || {};
		this.id = setup.id || '';
		this.label = setup.label || '';
		this.details = setup.details || '';
		this.template = setup.template || '';
		this.i18n = setup.i18n || false;
		//this.need = setup.need || {};

		this.getId = function(){
			fieldIdr(this.id);
		}

		this.getter = function(data){
			return data;
		};
		this.setter = function(data){
			var data = data || "";
			if(this.i18n){
				var langdata = {};
				for(var l in langlist){
					l = langlist[l];
					langdata[l]=(data[l] || "").toString();
				}
				return langdata;
			} else {
				return data.toString();
			}
		};
		this.validate = function(data){
			var result = [];
			return result;
		};
	}

	this.Fields = {
		Subset:function(setup){
			PF.Field.call(this, setup);
			this.fields = setup.fields || {};
			this.template = 'subset';
			this.getter = function(data){
				var data = data || {};
				var result = {};
				for(var name in this.fields){
					result[name] = this.fields[name].getter(data[name]);
				}
				return result;
			};
			this.setter = function(data){
				var data = data || {};
				var result = {};
				for(var name in this.fields){
					result[name] = this.fields[name].setter(data[name]);
				}
				return result;
			};
			this.validate = function(data){
				var data = data || {};
				var result = [];
				for(var name in this.fields){
					var errors = this.fields[name].validate(data[name]);
					if(errors.length>0){
						result.push(new validation(this.fields[name],errors,data[name]));
					}
				}
				return result;
			};
		},
		Text:function(setup){
			PF.Field.call(this, setup);
			this.template = 'text';
		},
		Textarea:function(setup){
			PF.Field.call(this, setup);
			this.template = 'textarea';
		},
		Reverse:function(setup){
			PF.Field.call(this, setup);
			this.template = 'text';
			this.getter = function(data){
				var data = data || "";
				return data.split("").slice().reverse().join("");
			};
			this.setter = function(data){
				var data = data || "";
				data = data.toString();
				return data.split("").slice().reverse().join("");
			};
			this.validate = function(data){
				var result = [];
				if(data.length<5){result.push("Debe ser mas largo de 5 caracteres!");}
				return result;
			};
		},
		Select:function(setup){
			PF.Field.call(this, setup);
			this.template = 'select';
			this.values = setup.values || [];
		}

	}
	for(var i in this.Fields){
		this.Fields[i].prototype = new PF.Field();
	}
}

function Pillars(){

	var P = this;

	var beams = {};

	this.Beam = function(_id){
		if(id){var id=_id.toString();} else {var id=(+new Date()).toString(36);}
		beams[id]=this;
		var beam = this;
		var title = "untitled";
		var database = null;
		var path = '';
		var paths = [];
		var fieldset = null;
		var extensions = {};
		var template = null;
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
			if(template){
				console.log('Template blocks:',template.blockList());
				console.log('Template cache:',template.cacheList());
			}
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
		this.setDatabase = function(_database){
			database = _database;
			return beam;
		}
		this.unsetDatabase = function(){
			database = null;
			return beam;
		}
		this.db = function(){
			return database;
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
		this.setTemplate = function(_path){
			template = new Template(_path);
			template.view = function(block,req,res,locals){
				var body = render(block,{
					data:locals || {},
					msgs:res.msgs,
					// manejador de rutas
					fieldidr:fieldIdr,
					beam:beam,
					util:util,
					langlist:langlist,
					defaultlang:defaultlang,
					trace:'',//util.format(GLOBAL)
					req:req,
					res:res
				});
				res.send(body);
			}
			return beam;
		}
		this.view = function(_block,_req,_res,_locals){
			if(template.view){return template.view(_block,_req,_res,_locals);}
			return "";
		}
		this.refreshTemplate = function(){
			if(template.refresh){template.refresh();}
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

function Template(_path){
	var _path = _path || "";
	var cache = {};
	var blocks = {};

	function load(){
		try {
			var templatefile = fs.readFileSync(_path,'utf8');
			templatefile = templatefile.trim().split("//-//");
			for(var b in templatefile){
				var block = templatefile[b];
				if(block.trim()!=""){
					var head = block.indexOf("\n");
					var name = block.slice(0,head).trim();
					var body = block.slice(head).trim();
					blocks[name] = body;
					console.log('TemplateBlocks['+name+'] from:'+_path);
				}
			}
			caching();
			delete templatefile;
		} catch(error){
			console.log('Can not read template blocks from:'+_path,error);
		}
	}

	this.view = render;
	function render(block,locals,cacheid){
		return Render(cache,blocks,block,locals,cacheid);
	}

	this.blockList = function(){
		return Object.keys(blocks);
	}
	this.cacheList = function(){
		return Object.keys(cache);
	}

	this.refresh = function(){
		cache = {};
		blocks = {};
		load();
	}
	var caching = this.caching = function(){
		for(var b in Object.keys(blocks)){render(Object.keys(blocks)[b]);}
	}

	load();
}

function Render(cache,blocks,block,locals,cacheid){
	var cacheid = cacheid || block;
	if(!locals || !cache[cacheid]){
		if(!blocks[block]){console.log("TemplateBlock["+cacheid+"] no exist");return "";}
		var timetag = 'TemplateCache['+cacheid+']';
		console.time(timetag);
		//return (blocks['includes'] || "")+"\n"+(blocks[block] || "");
		cache[cacheid]=jade.compile((blocks['includes'] || "")+"\n"+(blocks[block] || ""));
		console.timeEnd(timetag);
	}
	if(locals){return cache[cacheid](locals);}
}