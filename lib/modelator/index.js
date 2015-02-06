
var textualization = require('../textualization');
var ObjectID = require('mongodb').ObjectID;
var fs = require('node-fs');

var util = require("util");
var EventEmitter = require("events").EventEmitter;

util.inherits(Schema, EventEmitter);
module.exports.Schema = Schema;
function Schema(config){
	EventEmitter.call(this);
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

	//schema.addField('Text','_id');
	//schema.addField('Time','_ctime');
	//schema.addField('Time','_mtime');
	//schema.addField('Text','_owner');
	//schema.addField('Text','_guests');
}
	Schema.prototype.getField = function getField(fieldId){
		for(var i=0,l=this.fields.length;i<l;i++){
			if(this.fields[i].id===fieldId){
				return this.fields[i];
			}
		}
		return false;
	};
	Schema.prototype.getFieldPosition = function getFieldPosition(fieldId){
		for(var i=0,l=this.fields.length;i<l;i++){
			if(this.fields[i].id===fieldId){
				return i;
			}
		}
		return false;
	};
	Schema.prototype.addField = function addField(field,position){
		if(typeof position === 'undefined'){
			this.fields.push(field);
		} else if(position==parseInt(position,10)){
			position=parseInt(position,10);
			if(position<=this.fields.length){
				this.fields.splice(position,0,field);
			} else {
				this.fields.push(field);
			}
		}
		return this;
	};
	Schema.prototype.add = function(field,position){
		return this.addField(field,position);
	};
	Schema.prototype.removeField = function removeField(fieldId){
		var position = this.getFieldPosition(fieldId);
		if(position !== false){
			this.fields.splice(position,1);
			return true;
		} else {
			return false;
		}
	};
	Schema.prototype.moveField = function moveField(fieldId,position){
		var field = this.getField(fieldId);
		if(field===false){
			return false;
		} else {
			if(typeof position === 'string'){
				position = this.getFieldPosition(position);
				if(position!==false){
					this.removeField(fieldId);
					this.fields.splice(position,0,field);
				} else {
					return false;
				}
			} else if(position==parseInt(position,10)) {
				position = parseInt(position,10);
				if(position<this.fields.length){
					this.removeField(fieldId);
					this.fields.splice(position,0,field);
				} else {
					return false;
				}
			} else {
				return false;
			}
		}
	};
	Schema.prototype.keyscheck = function keysCheck(action,keys){
		var locks = this.keys?this.keys[action]:undefined;
		if(!locks){return true;} // Unlocked action.
		if(!Array.isArray(locks)){locks = (typeof locks === 'string')?[locks]:[];}
		if(!Array.isArray(keys)){keys = (typeof keys === 'string')?[keys]:[];}

		var lock,grant;
		for(var i=0,l=locks.length;i<l;i++){ // OR...
			lock = locks[i].split(' ');
			grant = true;
			for(var i2=0,l2=lock.length;i2<l2;i2++){ // AND...
				if(keys.indexOf(lock[i2])===-1){
					grant = false;
				}
			}
			if(grant){return true;}
		}
		return false;
	};
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
			cb(null);
			return;
		}
		
		if(!Array.isArray(keys)){keys = (typeof keys === 'string')?[keys]:[];} else {keys = keys.slice();}
		var owner = (!user || !doc || doc._owner===user);
		var guest = (doc && Array.isArray(doc._guests) && doc._guests.indexOf(user)>=0);
		if(owner){keys.push('owner');}
		if(guest){keys.push('guest');}

		var result = new treeGroup();
		var errors = new treeGroup();
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
					if(field.keyscheck(action,keys)){
						chain.add(chainHandler,field);
					} else if(action !== 'get'){
						errors[field.id]=['invalidCredentials'];
					}
				}
			}
		}
		chain.add(function chainEnd(){
			if(Object.keys(errors).length>0){
				cb(null,treeParse(errors)); // ,true for marks
			} else {
				cb((action === 'remove' && unset===1)?1:result);
			}
		}).pull();
	};











util.inherits(Field, EventEmitter);
module.exports.Field = Field;
function Field(config){
	EventEmitter.call(this);
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
	Field.prototype.keyscheck = Schema.prototype.keyscheck;

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
		var result = new treeGroup();
		var errors = new treeGroup();
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
					if(field.keyscheck(data.context.action,data.context.keys)){
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
Fieldset.prototype = new Field();
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
		var result = new treeGroup();
		var errors = new treeGroup();
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
					if(field.keyscheck(data.context.action,data.context.keys)){
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
Text.prototype = new Field();
function Text(config){
	Field.call(this,config);
}

module.exports.Int = Int;
Int.prototype = new Field();
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
Textarea.prototype = new Field();
function Textarea(config){
	Field.call(this,config);
}

module.exports.Editor = Editor;
Editor.prototype = new Field();
function Editor(config){
	Field.call(this,config);
}

module.exports.File = File;
File.prototype = new Field();
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
Img.prototype = new File();
function Img(config){
	File.call(this,config);
}

module.exports.Select = Select;
Select.prototype = new Field();
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
Checkbox.prototype = new Field();
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
Checkboxes.prototype = new Select();
function Checkboxes(config){
	Select.call(this,config);
}

module.exports.Radios = Radios;
Radios.prototype = new Field();
function Radios(config){
	Field.call(this,config);
	this.values = config.values || {};
}

module.exports.Time = Time;
Time.prototype = new Field();
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

























module.exports.schemaAPI = schemaAPI;
function schemaAPI(route,schema,interface){
	interface = interface || mongoInterface;
	route
		.addRoute(new Route({id:'search',path:'/api'},function(gw){
			mongoInterface.list(schema,gw.params,function(result){
				gw.json(result);
			},gw.user);
		}))
		.addRoute(new Route({id:'get',path:'/api/:_id'},function(gw){
			mongoInterface.get(schema,gw.params,function(result){
				gw.json(result);
			},gw.user);
		}))
		.addRoute(new Route({id:'update',path:'/api/:_id',method:'put',multipart:true},function(gw){
			mongoInterface.update(schema,gw.params,function(result){
				gw.json(result);
			},gw.user);
		}))
		.addRoute(new Route({id:'insert',path:'/api',method:'post',multipart:true},function(gw){
			mongoInterface.insert(schema,gw.params,function(result){
				gw.json(result);
			},gw.user);
		}))
		.addRoute(new Route({id:'remove',path:'/api/:_id',method:'delete'},function(gw){
			mongoInterface.remove(schema,gw.params,function(result){
				gw.json(result);
			},gw.user);
		}))
		.addRoute(new Route({id:'files',path:'/files/*:path',method:'get'},function(gw){
			mongoInterface.files(schema,gw.params,function(result){
				if(result.error){
					gw.error(result.error,result.details);
				} else {
					gw.file(result.data.file,result.data.name);
				}
			},gw.user);
		}))
	;
	return route;
}




var mongoInterface = module.exports.mongoInterface = {};

mongoInterface.files = function(schema,params,cb,user){
	var query = {}, cols = {};
	var keys = (user && Array.isArray(user.keys))?user.keys:[];

	var grant = false;
	if(schema.keyscheck('get',keys)){
		grant = true;
	} else if(user && schema.keyscheck('get',keys.concat(['owner']))){
		grant = true;
		query.$or = [{_author:user._id},{_guests:user._id}];
	}

	if(grant){
		var path = params.path || ''; // Warning, clean first and end '/'.
		var _id = path.split('/').slice(2,3).join();
		if(/^[a-f0-9]{24}$/i.test(_id)){
			_id = new ObjectID.createFromHexString(_id);
		} else {
			_id = false;
		}

		if(_id){
			var field = path.split('/').pop();
			query._id = _id;
			cols[field]=1;
			var db = DB.collection(schema.collection);
			db.findOne(query,cols,function(error, result) {
				if(error){
					cb({
						error : 500,
						details : error
					});
				} else if(!result) {
					cb({
						error : 404
					});
				} else {
					schema.get(result,function(getted, errors){
						if(errors){
							cb({
								error : 403,
								ads : errors
							});
						} else {
							var file = false;
							try {
								file = eval('getted.'+field);
							} catch(e) {}
							
							if(file){
								var pathfs = paths.resolve(paths.join(ENV.directories.uploads,schema.id,path));
								cb({
									error : false,
									data : {
										file: pathfs,
										name: file.name
									}
								});
							} else {
								cb({
									error : 404
								});
							}
						}
					},user,keys);
				}
			});
		} else {
			cb({
				error : 404
			});
		}
	} else {
		cb({
			error : 403
		});
	}
};

mongoInterface.count = function(schema,params,cb,user){
	var query = {};
	var keys = (user && Array.isArray(user.keys))?user.keys:[];

	var grant = false;
	if(schema.keyscheck('get',keys)){
		grant = true;
	} else if(user && schema.keyscheck('get',keys.concat(['owner']))){
		grant = true;
		query.$or = [{_author:user._id},{_guests:user._id}];
	}

	if(grant){
		var db = DB.collection(schema.collection);
		db.count(query,function(error,count) {
			if(error){
				cb({
					error : "database",
					details : error
				});
			} else {
				cb({
					error : false,
					data : {
						count : count
					}
				});
			}
		});
	} else {
		cb({
			error : "forbidden"
		});
	}
};

mongoInterface.list = function(schema,params,cb,user){
	var query = {};
	var keys = (user && Array.isArray(user.keys))?user.keys:[];

	var skip = 0;
	var filter = false;
	var limit = schema.limit;
	var range = false;
	var order = schema.order===-1?-1:1;
	var sort = schema.sort || false;
	var cols = {};

	var qsort = {},qors = [],i,l,qor;

	var grant = false;
	if(schema.keyscheck('get',keys)){
		grant = true;
	} else if(user && schema.keyscheck('get',keys.concat(['owner']))){
		grant = true;
		query.$and = [];
		query.$and.push({
			$or:[{_author:user._id},{_guests:user._id}]
		});
	}

	if(grant){
		if(parseInt(params._order,10)===-1){
			order = -1;
		}
		if(typeof params._sort === 'string' && params._sort !== ''){
			for(i=0,l=schema.headers.length;i<l;i++){
				if(schema.headers[i] === params._sort){
					sort = params._sort;
					break;
				}
			}
		}
		if(typeof params._skip === 'string' && parseInt(params._skip,10)>0){
			skip = parseInt(params._skip,10);
		}
		if(sort){
			qsort[sort] = order;
			if(typeof params._range === 'string' && params._range !== ''){
				range = params._range;
				query[sort]=order>0?{$gt:range}:{$lt:range};
			}
		}
		if(typeof params._filter === 'string' && params._filter !== ''){
			filter = params._filter;
			for(i=0,l=schema.filter.length;i<l;i++){
				qor = {};
				qor[schema.filter[i]]=new RegExp(filter,"i");
				qors.push(qor);
			}
			if(!query.$and){query.$and = [];}
			query.$and.push({$or:qors});
		}

		for(i=0,l=schema.headers.length;i<l;i++){cols[schema.headers[i]]=true;}

		var db = DB.collection(schema.collection);
		db.find(query,cols).sort(qsort).skip(skip).limit(limit).toArray(function(error, results) {
			if(error){
				cb({
					error : "database",
					details : error
				});
			} else {
				cb({
					error : false,
					data : {
						results : results,
						order : order,
						sort : sort,
						range : range,
						skip : skip,
						limit : limit,
						filter : filter,
						cols : cols
					}
				});
			}
		});
	} else {
		cb({
			error : "forbidden"
		});
	}
};

mongoInterface.get = function(schema,params,cb,user){
	var query = {};
	var keys = (user && Array.isArray(user.keys))?user.keys:[];
	var _id = /^[a-f0-9]{24}$/i.test(params._id)?new ObjectID.createFromHexString(params._id):false;

	var grant = false;
	if(schema.keyscheck('get',keys)){
		grant = true;
	} else if(user && schema.keyscheck('get',keys.concat(['owner']))){
		grant = true;
		query.$or = [{_author:user._id},{_guests:user._id}];
	}

	if(grant){
		if(_id){
			query._id = _id;
			var db = DB.collection(schema.collection);
			db.findOne(query,function(error, doc) {
				if(error){
					cb({
						error : "database",
						details : error
					});
				} else if(!doc) {
					cb({
						error : "unreachable"
					});
				} else {
					schema.get(doc,function(getted, errors){
						if(errors){
							cb({
								error : "get",
								ads : errors
							});
						} else {
							getted._id = _id;
							cb({
								error : false,
								data : getted
							});
						}
					},user,keys);
				}
			});
		} else {
			cb({
				error : "params"
			});
		}
	} else {
		cb({
			error : "forbidden"
		});
	}
};

mongoInterface.update = function(schema,params,cb,user){
	var query = {};
	var keys = (user && Array.isArray(user.keys))?user.keys:[];
	var _id = /^[a-f0-9]{24}$/i.test(params._id)?new ObjectID.createFromHexString(params._id):false;

	var set = params.set || false;
	var unset = params.unset || false;

	var grant = false;
	if(schema.keyscheck('update',keys)){
		grant = true;
	} else if(user && schema.keyscheck('update',keys.concat(['owner']))){
		grant = true;
		query = {_author:user._id};
	} else if(user && schema.keyscheck('update',keys.concat(['guest']))){
		grant = true;
		query = {_guests:user._id};
	}

	if(grant){
		if(_id && set){
			query._id = _id;
			var db = DB.collection(schema.collection);
			db.findOne(query,function(error, doc) {
				if(error){
					cb({
						error : "database",
						details : error
					});
				} else if(!doc){
					cb({
						error : "unreachable"
					});
				} else {
					var update = {};
					schema.remove(doc,unset,function(unsetted,errors){
						if(errors){
							cb({
								error : "remove",
								ads : errors
							});
						} else {
							unsetted = treeParse(unsetted);
							if(Object.keys(unsetted).length>0){
								update.$unset = unsetted;
							}
							schema.update(doc,set,function(setted,errors){
								if(errors){
									cb({
										error : "update",
										ads : errors
									});
								} else {
									setted._mtime = new Date();
									update.$set = treeParse(setted);
									db.update({_id:_id},update,function(error, result) {
										if(error){
											cb({
												error : "database",
												details : error
											});
										} else if(result === 0) {
											cb({
												error : "unreachable"
											});
										} else {
											mongoInterface.get(schema,params,cb,user);
										}
									});
								}
							},user,keys);
						}
					},user,keys);
				}
			});
		} else {
			cb({
				error : "params"
			});
		}
	} else {
		cb({
			error : "forbidden"
		});
	}
};

mongoInterface.insert = function(schema,params,cb,user){
	var keys = (user && Array.isArray(user.keys))?user.keys:[];

	var set = params.set || false;

	var grant = false;
	if(schema.keyscheck('insert',keys)){
		grant = true;
	}

	if(grant){
		if(set){
			var _id = new ObjectID();
			set._id = _id;
			schema.insert(set,function(setted, errors){
				if(errors){
					cb({
						error : "insert",
						ads : errors
					});
				} else {
					setted._id = _id;
					setted._owner = user?user._id:0;
					setted._ctime = new Date();
					setted._mtime = new Date();
					var db = DB.collection(schema.collection);
					db.insert(setted,function(error, result) {
						if(error){
							cb({
								error : "database",
								details : error
							});
						} else if(result.ok){
							cb({
								error : "unreachable"
							});
						} else {
							params._id = _id.toString();
							mongoInterface.get(schema,params,cb,user);
						}
					});
				}
			},user,keys);
		} else {
			cb({
				error : "params"
			});
		}
	} else {
		cb({
			error : "forbidden"
		});
	}
};

mongoInterface.remove = function(schema,params,cb,user){
	var query = {};
	var keys = (user && Array.isArray(user.keys))?user.keys:[];
	var _id = /^[a-f0-9]{24}$/i.test(params._id)?new ObjectID.createFromHexString(params._id):false;

	var grant = false;
	if(schema.keyscheck('remove',keys)){
		grant = true;
	} else if(user && schema.keyscheck('remove',keys.concat(['owner']))){
		grant = true;
		query = {_author:user._id};
	} else if(user && schema.keyscheck('remove',keys.concat(['guest']))){
		grant = true;
		query = {_guests:user._id};
	}

	if(grant){
		if(_id){
			query._id = _id;
			var db = DB.collection(schema.collection);
			db.findOne(query,function(error, doc) {
				if(error){
					cb({
						error : "insert",
						ads : errors
					});
				} else if(!doc){
					cb({
						error : "unreachable"
					});
				} else {
					schema.remove(doc,1,function(unsetted,errors){
						if(errors){
							cb({
								error : "remove",
								ads : errors
							});
						} else {
							db.remove(query,function(error, result) {
								if(error){
									cb({
										error : "database",
										details : error
									});
								} else if(result===0) {
									cb({
										error : "noexist"
									});
								} else {
									cb({
										error : false
									});
								}
							});
						}
					},user,keys);
				}
			});
		} else {
			cb({
				error : "params"
			});
		}
	} else {
		cb({
			error : "forbidden"
		});
	}
};





























function Validation(id,params){
	this.id = id;
	this.params = params;
}

function treeGroup(){}
function treeParse(obj,marks){
	var result = {};
	function treeParseWalker(path,obj,result){
		for(var i in obj){
			if(obj[i] instanceof treeGroup){
				if(marks){result[path.concat([i]).join('.')]=true;}
				treeParseWalker(path.concat([i]),obj[i],result);
			} else {
				result[path.concat([i]).join('.')]=obj[i];
			}
		}
	}
	treeParseWalker([],obj,result);
	return result;
}
