
var childManager = require('../childManager');
var keysCheck = require('../keysCheck');
var Tree = require('../Tree');
var ObjectID = require('mongodb').ObjectID;

var util = require("util");

module.exports.Schema = Schema;
function Schema(config){
	var schema = this;

	config = config || {};
	schema.configure = function(config){
		for(var i=0,l=config.length;i<l;i++){schema[i]=config[i];}
		return schema;
	};
	schema.configure(config);

	schema.id = config.id || config.collection || Date.now().toString(36)+Math.round(Math.random()*10).toString(36);
	schema.collection = config.collection || false;
	schema.headers = config.headers || [];
	schema.indexes = config.indexes || [];
	schema.uniques = config.uniques || [];
	schema.limit = config.limit || 10;
	schema.filter = config.filter || [];
	if(!config.keys){config.keys={};}
	schema.keys = {
		get    : config.keys.get,
		insert : config.keys.insert,
		update : config.keys.update,
		remove : config.keys.remove
	};

	schema.fields = [];
}
	Schema.prototype.getField = childManager.getChild('fields');
	Schema.prototype.getFieldPosition = childManager.getChildPosition('fields');
	Schema.prototype.addField = childManager.addChild('fields');
	Schema.prototype.add = childManager.addChild('fields');
	Schema.prototype.removeField = childManager.removeChild('fields');
	Schema.prototype.moveField = childManager.moveChild('fields');
	Schema.prototype.keysCheck = keysCheck;
	Schema.prototype.get = function schemaGet(doc,cb,user,keys){
		this.action('get',doc,undefined,undefined,cb,user,keys);
	};
	Schema.prototype.insert = function schemaInsert(set,cb,user,keys){
		this.action('insert',null,set,undefined,cb,user,keys);
	};
	Schema.prototype.update = function schemaUpdate(doc,set,cb,user,keys){
		this.action('update',doc,set,undefined,cb,user,keys);
	};
	Schema.prototype.remove = function schemaRemove(doc,unset,cb,user,keys){
		this.action('remove',doc,undefined,unset,cb,user,keys);
	};
	Schema.prototype.action = function schemaAction(action,doc,set,unset,cb,user,keys){
		var schema = this;

		if(
			(!doc && action !== 'insert') ||
			(!set && (action === 'insert' || action === 'update')) ||
			(!unset && (action === 'remove'))
		){
			cb(new Tree());
			return;
		}
		
		if(!Array.isArray(keys)){keys = (typeof keys === 'string')?[keys]:[];} else {keys = keys.slice();}
		var owner = (!user || !doc || doc._owner===user);
		var guest = (doc && Array.isArray(doc._guests) && doc._guests.indexOf(user)>=0);
		if(owner){keys.push('owner');}
		if(guest){keys.push('guest');}

		var result = new Tree();
		var errors = new Tree();
		var context = {
			schema:schema,
			action:action,
			doc:doc,
			set:set,
			unset:unset,
			user:user,
			keys:keys,
			owner:owner,
			guest:guest
		};
		var chain = new Chain();
		function chainHandler(field){
			field[action](
				{
					value:doc?doc[field.id]:undefined,
					set:set?set[field.id]:undefined,
					unset:unset?(unset===1?1:unset[field.id]):undefined,
					path:[field.id],
					context:context
				},
				function chainCallback(value,error){
					if(error){
						errors[field.id]=error;
					} else {
						result[field.id]=value;
					}
					chain.next();
				}
			);
		}
		for(var i=0,l=schema.fields.length;i<l;i++){
			var field = schema.fields[i];
			if(!(action === 'insert' || action === 'update') || set.hasOwnProperty(field.id)){
				if(action !== 'remove' || (doc.hasOwnProperty(field.id) && (unset === 1 || unset.hasOwnProperty(field.id)))){
					if(field.keysCheck(keys,action)){
						chain.add(chainHandler,field);
					} else if(action !== 'get'){
						errors[field.id]=['invalidCredentials'];
					}
				}
			}
		}
		chain.add(function chainEnd(){
			if(Object.keys(errors).length>0){
				cb(null,errors.parse()); // .parse(true) for marks
			} else {
				cb((action === 'remove' && unset===1)?1:result);
			}
		}).pull();
	};










module.exports.Field = Field;
function Field(config){
	var field = this;

	config = config || {};
	field.configure = function(config){
		for(var i=0,l=config.length;i<l;i++){field[i]=config[i];}
		return field;
	};
	field.configure(config);

	field.id = config.id || config.collection || Date.now().toString(36)+Math.round(Math.random()*10).toString(36);
	field.i18n = config.i18n || false;
	field.required = config.required || false; // false || true || 'get' || 'insert' || 'update' || 'remove' || 'get require' ...
	field.validations = config.validations || []; // regexp, nmin,nmax,lmin,lmax,required,date...

	if(!config.keys){config.keys={};}
	field.keys = {
		get    : config.keys.get,
		insert : config.keys.insert,
		update : config.keys.update,
		remove : config.keys.remove,
		list   : config.keys.list
	};
}
	Field.prototype.keysCheck = keysCheck;

	Field.prototype.get = function fieldGet(data,cb){
		if(this.i18n){
			this.actionI18n(data,cb);
		} else {
			this.action(data,cb);
		}
	};
	Field.prototype.insert = function fieldInsert(data,cb){
		if(this.i18n){
			this.actionI18n(data,cb);
		} else {
			this.action(data,cb);
		}
	};
	Field.prototype.update = function fieldUpdate(data,cb){
		if(this.i18n){
			this.actionI18n(data,cb);
		} else {
			this.action(data,cb);
		}
	};
	Field.prototype.remove = function fieldRemove(data,cb){
		if(this.i18n){
			this.actionI18n(data,cb);
		} else {
			this.action(data,cb);
		}
	};
	
	Field.prototype.actionI18n = function fieldActionI18n(data,cb){
		var field = this;
		var result = new Tree();
		var errors = new Tree();
		var chain = new Chain();
		function chainHandler(lang){
			field.action(
				{
					value:data.value?data.value[lang]:undefined,
					set:data.set?data.set[lang]:undefined,
					unset:data.unset?(data.unset===1?1:data.unset[lang]):undefined,
					path:data.path.concat([lang]),
					context:data.context
				},
				function chainCallback(value,error){
					if(error){
						errors[lang]=error;
					} else {
						result[lang]=value;
					}
					chain.next();
				}
			);
		}
		for(var i=0,l=textualization.langs.length;i<l;i++){
			var lang = textualization.langs[i];
			if(!(data.context.action === 'insert' || data.context.action === 'update') || data.set.hasOwnProperty(lang)){
				if(data.context.action !== 'remove' || (data.value.hasOwnProperty(lang) && (data.unset === 1 || data.unset.hasOwnProperty(lang)))){
					if(field.keysCheck(data.context.keys,data.context.action)){
						var validation = [];
						if(data.context.action === 'insert' || data.context.action === 'update'){validation = field.validate(data.set);}
						if(validation.length>0){
							errors[lang]=validation;
						} else {
							chain.add(chainHandler,lang);
						}
					} else if(data.context.action !== 'get'){
						errors[lang]=['invalidCredentials'];
					}
				}
			}
		}
		chain.add(function chainEnd(){
			if(Object.keys(errors).length>0){
				cb(null,errors);
			} else {
				cb((data.context.action === 'remove' && data.unset===1)?1:result);
			}
		}).pull();
	};
	Field.prototype.action = function fieldAction(data,cb){
		var field = this;
		var handler = 'on'+data.context.action.replace(/^./,function(m){return m.toUpperCase();});
		if(typeof field[handler] === 'function'){
			field[handler](data,cb);
		} else {
			cb(null,['noActionHandler']);
		}
	};
	Field.prototype.validate = function(value){
		var field = this;
		var result = [];
		for(var i=0,l=field.validations.length;i<l;i++){
			var validation = field.validations[i].call(field,data);
			if(validation!==true){
				result.push(validation);
			}
		}
		return result;
	};
	Field.prototype.onGet = function(data,cb){
		cb(data.value);
	};
	Field.prototype.onInsert = function(data,cb){
		cb(data.set);
	};
	Field.prototype.onUpdate = function(data,cb){
		cb(data.set);
	};
	Field.prototype.onRemove = function(data,cb){
		cb(data.unset);
	};










module.exports.Fieldset = Fieldset;
util.inherits(Fieldset, Field);
function Fieldset(config){
	var field = this;
	config = config || {};
	Field.call(field,config);
	field.fields = [];
}
	Fieldset.prototype.getField = Schema.prototype.getField;
	Fieldset.prototype.getFieldPosition = Schema.prototype.getFieldPosition;
	Fieldset.prototype.addField = Schema.prototype.addField;
	Fieldset.prototype.add = Schema.prototype.add;
	Fieldset.prototype.removeField = Schema.prototype.removeField;
	Fieldset.prototype.moveField = Schema.prototype.moveField;

	Fieldset.prototype.action = function(data,cb){
		var fieldset = this;
		var result = new Tree();
		var errors = new Tree();
		var chain = new Chain();
		function chainHandler(field){
			field[data.context.action](
				{
					value:data.value?data.value[field.id]:undefined,
					set:data.set?data.set[field.id]:undefined,
					unset:data.unset?(data.unset===1?1:data.unset[field.id]):undefined,
					path:data.path.concat([fieldset.id,field.id]),
					context:data.context
				},
				function chainCallback(value,error){
					if(error){
						errors[field.id]=error;
					} else {
						result[field.id]=value;
					}
					chain.next();
				}
			);
		}
		for(var i=0,l=fieldset.fields.length;i<l;i++){
			var field = fieldset.fields[i];
			if(!(data.context.action === 'insert' || data.context.action === 'update') || data.set.hasOwnProperty(field.id)){
				if(data.context.action !== 'remove' || (data.value.hasOwnProperty(field.id) && (data.unset === 1 || data.unset.hasOwnProperty(field.id)))){
					if(field.keysCheck(data.context.keys,data.context.action)){
						var validation = [];
						if(data.context.action === 'insert' || data.context.action === 'update'){validation = field.validate(data.set);}
						if(validation.length>0){
							errors[field.id]=validation;
						} else {
							chain.add(chainHandler,field);
						}
					} else if(data.context.action !== 'get'){
						errors[field.id]=['invalidCredentials'];
					}
				}
			}
		}
		chain.add(function chainEnd(){
			if(Object.keys(errors).length>0){
				cb(null,errors);
			} else {
				var handler = 'on'+data.context.action.replace(/^./,function(m){return m.toUpperCase();});
				if(typeof fieldset[handler] === 'function'){
					fieldset[handler](data,cb);
				} else {
					cb(null,['noActionHandler']);
				}
			}
		}).pull();
	};










module.exports.Text = Text;
util.inherits(Text, Field);
function Text(config){
	Field.call(this,config);
}










module.exports.Int = Int;
util.inherits(Int, Field);
function Int(config){
	Field.call(this,config);
}
	Int.prototype.onInsert = function(data,cb){
		if(parseInt(data.set,10)>=0){
			cb(data.value);
		} else {
			cb(null,["fields.int.invalid"]);
		}
	};
	Int.prototype.onUpdate = function(data,cb){
		if(parseInt(data.set,10)>=0){
			cb(data.value);
		} else {
			cb(null,["fields.int.invalid"]);
		}
	};











module.exports.Textarea = Textarea;
util.inherits(Textarea, Field);
function Textarea(config){
	Field.call(this,config);
}










module.exports.Editor = Editor;
util.inherits(Editor, Field);
function Editor(config){
	Field.call(this,config);
}










var fs = require('node-fs');
module.exports.File = File;
util.inherits(File, Field);
function File(config){
	Field.call(this,config);
}
	File.prototype.onInsert = function(data,cb){
		this.saveFile(data,cb);
	};
	File.prototype.onUpdate = function(data,cb){
		this.saveFile(data,cb);
	};
	File.prototype.saveFile = function saveFile(data,cb){
		var field = this;
		var set = data.set;
		if(set && set.path && set.size && set.name && set.type){
			var schemaId = data.context.schema.id;
			var entityId = data.context.action==='insert'?data.context.set._id:data.context.doc._id;
			var entityTime = new Date(parseInt(entityId.toString().slice(0,8),16)*1000);
			
			var filePath = paths.join(entityTime.getUTCFullYear(),entityTime.getUTCMonth(),entityId);
			var fileAbsolutePath = paths.join(ENV.directories.uploads,schemaId,filePath);
			var fileUID = data.path.join('.');

			fs.mkdir(fileAbsolutePath, 0777, true, function(error){
				if(!error){
					fs.rename(set.path, paths.join(fileAbsolutePath,fileUID), function(error){
						if(!error){
							set.moved = true;
							cb({
								size: parseInt(set.size,10) || 0,
								name: set.name,
								type: set.type,
								lastmod: set.lastModifiedDate || new Date()
							});
						} else {
							cb(null,["fields.file.move"]);
						}
					});
				} else {
					cb(null,["fields.file.directory"]);
				}
			});
		} else {
			cb(null,['fields.file.invalid']);
		}
	};










module.exports.Img = Img;
util.inherits(Img, File);
function Img(config){
	File.call(this,config);
}










module.exports.Select = Select;
util.inherits(Select, Field);
function Select(config){
	Field.call(this,config);
	this.values = config?config.values:[];
}
	Select.prototype.onGet = function(data,cb){
		var value = data.value || [];
		var result = {};
		for(var i=0,l=this.values.length;i<l;i++){
			if(value.indexOf(this.values[i])>=0){
				result[this.values[i]]=true;
			} else {
				result[this.values[i]]=false;
			}
		}
		cb(result);
	};
	Select.prototype.onInsert = function(data,cb){
		this.onSet(data,cb);
	};
	Select.prototype.onUpdate = function(data,cb){
		this.onSet(data,cb);
	};
	Select.prototype.onSet = function(data,cb){
		var value = data.set || [];
		var result = [];
		for(var i=0,l=this.values.length;i<l;i++){
			if(value.indexOf(this.values[i])>=0 && result.indexOf(this.values[i])<0){
				result.push(this.values[i]);
			}
		}
		cb(result);
	};










module.exports.Checkbox = Checkbox;
util.inherits(Checkbox, Field);
function Checkbox(config){
	Field.call(this,config);
}
	Checkbox.prototype.onGet = function(data,cb){
		cb(data.value?true:false);
	};
	Checkbox.prototype.onUpdate = function(data,cb){
		cb(data.value?true:false);
	};
	Checkbox.prototype.onInsert = function(data,cb){
		cb(data.value?true:false);
	};










module.exports.Checkboxes = Checkboxes;
util.inherits(Checkboxes, Select);
function Checkboxes(config){
	Select.call(this,config);
}










module.exports.Radios = Radios;
util.inherits(Radios, Field);
function Radios(config){
	Field.call(this,config);
	this.values = config.values || {};
}










module.exports.Time = Time;
util.inherits(Time, Field);
function Time(config){
	Field.call(this,config);
}










/*
module.exports.Reference = Reference;
Reference.prototype = new Field();
function Reference(config){
	Field.call(this,config);
	field.collection = config.collection || false;
	field.headers = config.headers || false;
}
	Reference.prototype.getter = function(value,cb){
		var field = this;
		var schema = field.schema;
		var db = DB.collection(field.collection);
		var cols = {};
		for(var header in field.headers){cols[field.headers[header]]=true;}
		if(value.length>0){
			db.find({_id:{$in:value}},cols).toArray(function(error, items) {
				if(error){
					cb(null,[error]);
				} else {
					cb(items);
				}
			});
		} else {
			cb([]);
		}
	};
	Reference.prototype.setter = function(current,value,cb){
		var field = this;
		var list = [];
		value = value.toString().split(',');
		for(var rid in value){
			if(/^[a-f0-9]{24}$/i.test(value[rid])){list.push(new ObjectID.createFromHexString(value[rid]));}
		}
		cb(list);
	};
*/