
var textualization = require('../textualization');
var ObjectID = require('mongodb').ObjectID;
var fs = require('node-fs');
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

	field.id = config.id || config.collection || Date.now().toString(36)+Math.round(Math.random()*10).toString(36);
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
		remove : config.keys.remove,
		list   : config.keys.list
	};

	schema.fields = [];

	//schema.addField('Text','_id');
	//schema.addField('Time','_ctime');
	//schema.addField('Time','_mtime');
	//schema.addField('Text','_owner');
	//schema.addField('Text','_guests');
}
	schema.prototype.getField = function getField(fieldId){
		for(var i=0,l=this.fields.length;i<l;i++){
			if(this.fields[i].id===fieldId){
				return this.fields[i];
			}
		}
		return false;
	};
	schema.prototype.getFieldPosition = function getFieldPosition(fieldId){
		for(var i=0,l=this.fields.length;i<l;i++){
			if(this.fields[i].id===fieldId){
				return i;
			}
		}
		return false;
	};
	schema.prototype.addField = function addField(field,position){
		if(typeof position === undefined){
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
	schema.prototype.add = function(field,position){
		return this.addField(field,position);
	};
	schema.prototype.removeField = function removeField(fieldId){
		var position = this.getFieldPosition(fieldId);
		if(position !== false){
			this.fields.splice(position,1);
			return true;
		} else {
			return false;
		}
	};
	schema.prototype.moveField = function moveField(fieldId,position){
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

		var lock,ok;
		for(var i=0,l=locks.length;i<l;i++){ // OR...
			lock = locks[i].split(' ');
			ok = true;
			for(var i2=0,l2=lock.length;i2<l2;i2++){ // AND...
				if(keys.indexOf(lock[i2])===-1){
					ok = false;
				}
			}
			if(ok){return true;}
		}
		return false;
	};
	Schema.prototype.get = function schemaGet(doc,cb,user,keys){
		this.action('get',doc,undefined,undefined,cb,user,keys);
	};
	Schema.prototype.insert = function schemaInsert(doc,set,cb,user,keys){
		this.action('insert',doc,set,undefined,cb,user,keys);
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
				cb(null,treeParse(errors,true));
			} else {
				cb((action === 'remove' && data.unset===1)?1:result);
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

	Schema.prototype.get = function fieldGet(data,cb){
		if(this.i18n){
			this.actionI18n(data,cb);
		} else {
			this.action(data,cb);
		}
	};
	Schema.prototype.insert = function fieldInsert(data,cb){
		if(this.i18n){
			this.actionI18n(data,cb);
		} else {
			this.action(data,cb);
		}
	};
	Schema.prototype.update = function fieldUpdate(data,cb){
		if(this.i18n){
			this.actionI18n(data,cb);
		} else {
			this.action(data,cb);
		}
	};
	Schema.prototype.remove = function fieldRemove(data,cb){
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
				cb(null,treeParse(errors,true));
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





















module.exports.Subset = Subset;
Subset.prototype = new Field();
function Subset(config){
	var field = this;
	config = config || {};
	Field.call(field,config);
	field.fields = [];
}
	Subset.prototype.getField = Schema.prototype.getField;
	Subset.prototype.getFieldPosition = Schema.prototype.getFieldPosition;
	Subset.prototype.addField = Schema.prototype.addField;
	Subset.prototype.add = Schema.prototype.add;
	Subset.prototype.removeField = Schema.prototype.removeField;
	Subset.prototype.moveField = Schema.prototype.moveField;

	Subset.prototype.action = function(data,cb){
		var subset = this;
		var result = new treeGroup();
		var errors = new treeGroup();
		var chain = new Chain();
		function chainHandler(field){
			field[data.context.action](
				{
					value:data.value?data.value[field.id]:undefined,
					set:data.set?data.set[field.id]:undefined,
					unset:data.unset?(data.unset===1?1:data.unset[field.id]):undefined,
					path:data.path.concat([field.id]),
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
		for(var i=0,l=subset.fields.length;i<l;i++){
			var field = subset.fields[i];
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
				cb(null,treeParse(errors,true));
			} else {
				var handler = 'on'+data.context.action.replace(/^./,function(m){return m.toUpperCase();});
				if(typeof field[handler] === 'function'){
					field[handler](data,cb);
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
	Field.prototype.onInsert = function(data,cb){
		this.saveFile(data,cb);
	};
	Field.prototype.onUpdate = function(data,cb){
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
	this.values = config.values || [];
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

























module.exports.CRUD = CRUD;
function CRUD(route,schema){
	route.account = true;
	route
		.addRoute(new Route({id:'template'},function(gw){
			gw.render(paths.resolve(__dirname,'../templates/crud.jade'),{schema:schema});
		}))
		.addRoute(new Route({id:'search',path:'/api'},function(gw){
			schema.list(gw.user,gw.params,function(result){
				gw.send(result);
			});
		}))
		.addRoute(new Route({id:'get',path:'/api/:_id'},function(gw){
			schema.one(gw.user,gw.params,function(result){
				gw.send(result);
			});
		}))
		.addRoute(new Route({id:'update',path:'/api/:_id',method:'put',multipart:true},function(gw){
			schema.update(gw.user,gw.params,function(result){
				gw.send(result);
			});
		}))
		.addRoute(new Route({id:'insert',path:'/api',method:'post',multipart:true},function(gw){
			schema.insert(gw.user,gw.params,function(result){
				gw.send(result);
			});
		}))
		.addRoute(new Route({id:'remove',path:'/api/:_id',method:'delete'},function(gw){
			schema.remove(gw.user,gw.params,function(result){
				gw.send(result);
			});
		}))
		.addRoute(new Route({id:'files',path:'/files/*:path',method:'get'},function apiFiles(gw){
			var path = gw.params.path || '';
			var pathfs = paths.resolve(paths.join(ENV.directories.uploads,schema.id,path));
			var _id = path.split('/').shift();
			if(/^[a-f0-9]{24}$/i.test(_id)){_id = new ObjectID.createFromHexString(_id);}
			var field = path.split('/').pop();
			var cols = {};
			cols[field]=1;
			var db = DB.collection(schema.id);
			db.findOne({_id:_id},cols,function(error, result) {
				if(error){
					gw.error(500,error);
				} else if(!result) {
					gw.error(404);
				} else {
					var search = result;
					var dots = field.split('.');
					var last = dots.pop();
					while(dots.length>0){
						var i = dots.shift();
						if(search[i]){
							search = search[i];
						} else {
							search = false;
							break;
						}
					}
					if(search[last]){
						var file = search[last];
						gw.file(pathfs,file.name);
					} else {
						gw.error(404);
					}
				}
			});
		}))
	;
	return route;
}









Schema.prototype.count = function(user,params,cb){
	var schema = this;
	var query = {};

	var grant = false;
	if(user.can(schema.keys.manage) || user.can(schema.keys.see)){
		grant = true;
	} else if(user.can(schema.keys.edit)){
		grant = true;
		query.$or = [{_author:user._id},{_guests:user._id}];
	}
	if(grant){
		var db = DB.collection(schema.collection);
		db.count(query,function(error, count) {
			if(!error){
				cb({
					error : false,
					data : {
						count : count
					}
				});
			} else {
				cb({
					error : "database",
					details : error
				});
			}
		});
	} else {
		cb({
			error : "forbidden"
		});
	}
};

Schema.prototype.list = function(user,params,cb){
	var schema = this;
	var query = {};

	var skip = 0;
	var filter = false;
	var limit = schema.limit;
	var range = false;
	var order = schema.order || 1;
	var sort = schema.sort || false;
	var qsort = {};

	var grant = false;
	if(schema.keys.see)
	if(user.can(schema.keys.manage) || user.can(schema.keys.see)){
		grant = true;
	} else if(user.can(schema.keys.edit)){
		grant = true;
		query.$and = [];
		query.$and.push({
			$or:[{_author:user._id},{_guests:user._id}]
		});
	}
	if(grant){
		if(params._order=="-1"){var order = -1;}
		if(typeof params._sort === 'string'){
			for(var header in schema.headers){
				if(schema.headers[header] == params._sort){sort = params._sort;break;}
			}
		}
		if(typeof params._skip === 'string' && parseInt(params._skip)==params._skip){skip = parseInt(params._skip);}
		if(sort){
			qsort[sort] = order;
			if(typeof params._range === 'string'){
				range = params._range;
				query[sort]=order>0?{$gt:range}:{$lt:range};
			}
		}
		if(typeof params._filter === 'string' && params._filter!=""){
			filter = params._filter;
			var ors = [];
			for(i in schema.filter){
				var or = {};
				or[schema.filter[i]]=new RegExp(filter,"i");
				ors.push(or);
			}
			if(!query.$and){query.$and = [];}
			query.$and.push({$or:ors});
		}

		var cols = {};
		for(var header in schema.headers){cols[schema.headers[header]]=true;}

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
						list : results,
						order : order,
						sort : sort,
						range : range,
						skip : skip,
						limit : limit
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

Schema.prototype.one = function(user,params,cb){
	var schema = this;
	var query = {};
	var _id = params._id || false;

	var grant = false;
	if(user.can(schema.keys.manage) || user.can(schema.keys.see)){
		grant = true;
	} else if(user.can(schema.keys.edit)){
		grant = true;
		query.$or = [{_author:user._id},{_guests:user._id}];
	}
	if(grant){
		if(_id){
			if(/^[a-f0-9]{24}$/i.test(_id)){_id = new ObjectID.createFromHexString(_id);}
			query._id = _id;
			var db = DB.collection(schema.collection);
			db.findOne(query,function(error, result) {
				if(error){
					cb({
						error : "database",
						details : error
					});
				} else if(!result) {
					cb({
						error : "noexist"
					});
				} else {
					schema.getter(result,user,function(getted,errors){
						if(errors){
							cb({
								error : "getter",
								ads : errors
							});
						} else {
							getted._id = _id;
							cb({
								error : false,
								data : getted
							});
						}
					});
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

Schema.prototype.update = function(user,params,cb){
	var schema = this;
	var query = {};
	var _id = params._id || false;
	var set = params['set'] || false;
	var unset = params['unset'] || false;

	var grant = false;
	if(user.can(schema.keys.manage)){
		grant = true;
	} else if(user.can(schema.keys.edit)){
		grant = true;
		query.$or = [{_author:user._id},{_guests:user._id}];
	}
	if(grant){
		if(_id && set){
			if(/^[a-f0-9]{24}$/i.test(_id)){_id = new ObjectID.createFromHexString(_id);}
			query._id = _id;
			var db = DB.collection(schema.collection);
			db.findOne(query,function(error, result) {
				if(!error && result){
					var update = {};
					schema.unsetter(result,unset,user,function(unsetted,errors){
						if(errors){
								cb({
									error : "unsetter",
									ads : errors
								});
						} else {
							unsetted = treeParse(unsetted);
							if(Object.keys(unsetted).length>0){
								update.$unset = unsetted;
								for(var ui in unsetted){
									unsetted[ui]=1;
									try {
										eval("delete set."+ui+";");
									} catch(error) {}
								}
							}
							console.log(set);
							schema.setter(result,set,user,function(setted,errors){
								if(errors){
									cb({
										error : "setter",
										ads : errors
									});
								} else {
									console.log(setted);
									setted._mtime = new Date();
									update.$set = treeParse(setted);
									db.update({_id:_id},update,function(error, result) {
										if(error){
											cb({
												error : "database",
												details : error
											});
										} else if(result==0) {
											cb({
												error : "noexist"
											});
										} else {
											schema.one(gw,params,cb);
										}
									});
								}
							});
						}
					});
				} else {
					cb({
						error : "noexist"
					});
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

Schema.prototype.insert = function(user,params,cb){
	var schema = this;
	var set = params['set'] || false;

	var grant = false;
	if(user.can(schema.keys.manage) || user.can(schema.keys.edit)){
		grant = true;
	}
	if(grant){
		if(set){
			var _id = new ObjectID();
			set._id = _id;
			schema.setter(null,set,user,function(setted,errors){
				if(errors){
					cb({
						error : "setter",
						ads : errors
					});
				} else {
					setted._id = _id;
					setted._owner = user._id;
					setted._ctime = new Date();
					setted._mtime = new Date();
					var db = DB.collection(schema.collection);
					db.insert(setted,function(error, result) {
						if(error || !result[0] || !result[0]._id){
							cb({
								error : "database",
								details : error
							});
						} else {
							params._id = result[0]._id.toString();
							schema.one(gw,params,cb);
						}
					});
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

Schema.prototype.remove = function(user,params,cb){
	var schema = this;
	var query = {};
	var _id = params._id || false;


	var grant = false;
	if(user.can(schema.keys.manage)){
		grant = true;
	} else if(user.can(schema.keys.edit)){
		grant = true;
		query.$or = [{_author:user._id},{_guests:user._id}];
	}

	if(grant){
		if(_id){
			if(/^[a-f0-9]{24}$/i.test(_id)){_id = new ObjectID.createFromHexString(_id);}
			query._id = _id;
			var db = DB.collection(schema.collection);
			db.findOne(query,function(error, result) {
				if(!error && result){
					schema.unsetter(result,1,user,function(unsetted,errors){
						if(errors){
								cb({
									error : "unsetter",
									ads : errors
								});
						} else {
							db.remove(query,function(error, result) {
								if(error){
									cb({
										error : "database",
										details : error
									});
								} else if(result==0) {
									cb({
										error : "noexist"
									});
								} else {
									cb({error:false});
								}
							});
						}
					});
				} else {
					cb({
						error : "noexist"
					});
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


























function isString(arg) {
	return typeof arg === 'string';
}

function isSet(value){
	return (typeof value !=="undefined" && value!==null);
}

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
};
