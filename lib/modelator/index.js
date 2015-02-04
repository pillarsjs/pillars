
var textualization = require('../textualization');

var ObjectID = require('mongodb').ObjectID;
var fs = require('node-fs');

var EventEmitter = require("events").EventEmitter;

var schemas = {};
Object.defineProperty(module.exports,"schemas",{
	enumerable : true,
	get : function(){return schemas;}
});

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

	var id = config.id || config.collection || Date.now().toString(36)+Math.round(Math.random()*10).toString(36);
	Object.defineProperty(schema,"id",{
		enumerable : true,
		get : function(){return id;},
		set : function(set){
			if(schemas[id]){delete schemas[id];}
			if(set && set!==id){
				schemas[set]=this;
				id = set;
			}
		}
	});

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
	schema.prototype.getField = function(fieldId){
		var schema = this;
		for(var i=0,l=schema.fields.length;i<l;i++){
			if(schema.fields[i].id===fieldId){
				return schema.fields[i];
			}
		}
		return false;
	};
	schema.prototype.getFieldPosition = function(fieldId){
		var schema = this;
		for(var i=0,l=schema.fields.length;i<l;i++){
			if(schema.fields[i].id===fieldId){
				return i;
			}
		}
		return false;
	};
	schema.prototype.addField = function(field,position){
		var schema = this;
		if(typeof position === undefined){
			schema.fields.push(field);
		} else if(position==parseInt(position,10)){
			position=parseInt(position,10);
			if(position<=schema.fields.length){
				schema.fields.splice(position,0,field);
			} else {
				schema.fields.push(field);
			}
		}
		return schema;
	};
	schema.prototype.add = function(field,position){
		var schema = this;
		return schema.addField(field,position);
	};
	schema.prototype.removeField = function(fieldId){
		var schema = this;
		var position = schema.getFieldPosition(fieldId);
		if(position !== false){
			schema.fields.splice(position,1);
			return true;
		} else {
			return false;
		}
	};
	schema.prototype.moveField = function(fieldId,position){
		var schema = this;
		var field = schema.getField(fieldId);
		if(field===false){
			return false;
		} else {
			if(typeof position === 'string'){
				position = schema.getFieldPosition(position);
				if(position!==false){
					schema.removeField(fieldId);
					schema.fields.splice(position,0,field);
				} else {
					return false;
				}
			} else if(position==parseInt(position,10)) {
				position = parseInt(position,10);
				if(position<schema.fields.length){
					schema.removeField(fieldId);
					schema.fields.splice(position,0,field);
				} else {
					return false;
				}
			} else {
				return false;
			}
		}
	};
	Schema.prototype.keyscheck = function(action,keys){
		var schema = this;

		if(!schema.keys[action]){return true;} // Unlocked action.

		var locks = schema.keys[action];
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

	Schema.prototype.action = function(action,doc,set,unset,cb,user,keys){
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
			field.action(
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
						errors[field.id]=['action.'+action+'.forbidden'];
					}
				}
			}
		}
		chain.add(function chainEnd(){
			if(Object.keys(errors).length>0){
				cb(null,treeParse(errors,true));
			} else {
				cb(result);
			}
		}).pull();
	};

	Schema.prototype.get = function(doc,cb,user,keys){ // return (getted,errors)
		var schema = this;
		if(!doc){cb(null);}
		if(!Array.isArray(keys)){keys = (typeof keys === 'string')?[keys]:[];} else {keys = keys.slice();}
		var owner = (!user || doc._owner===user);
		var guest = (Array.isArray(doc._guests) && doc._guests.indexOf(user)>=0);
		if(owner){keys.push('owner');}
		if(guest){keys.push('guest');}

		var result = new treeGroup();
		var errors = new treeGroup();
		var context = {
			doc:doc,
			user:user,
			keys:keys,
			owner:owner,
			guest:guest
		};
		var chain = new Chain();
		function chainHandler(field){
			field._get(
				{
					value:doc[field.id],
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
			if(field.keyscheck('see',keys)){
				chain.add(chainHandler,field);
			}
		}
		chain.add(function chainEnd(){
			if(Object.keys(errors).length>0){
				cb(null,treeParse(errors,true));
			} else {
				cb(result);
			}
		}).pull();
	};
	Schema.prototype.set = function(doc,set,cb,user,keys){
		var schema = this;
		if(!set){cb(null);}
		if(!Array.isArray(keys)){keys = (typeof keys === 'string')?[keys]:[];} else {keys = keys.slice();}
		var owner = (!user || !doc || doc._owner===user);
		var guest = (doc && Array.isArray(doc._guests) && doc._guests.indexOf(user)>=0);
		if(owner){keys.push('owner');}
		if(guest){keys.push('guest');}

		var result = new treeGroup();
		var errors = new treeGroup();
		var context = {
			doc:doc,
			set:set,
			user:user,
			keys:keys,
			owner:owner,
			guest:guest
		};
		var chain = new Chain();
		function chainHandler(field){
			field._set(
				{
					value:doc?doc[field.id]:undefined,
					set:set[field.id],
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
			if(set.hasOwnProperty(field.id)){
				if(field.keyscheck('edit',keys)){
					chain.add(chainHandler,field);
				} else {
					errors[field.id]=['set.forbidden'];
				}
			}
		}
		chain.add(function chainEnd(){
			if(Object.keys(errors).length>0){
				cb(null,treeParse(errors,true));
			} else {
				cb(result);
			}
		}).pull();
	};
	Schema.prototype.unset = function(doc,unset,cb,user,keys){
		var schema = this;
		if(!doc){cb(null);}
		if(!unset){cb(null);}
		if(!Array.isArray(keys)){keys = (typeof keys === 'string')?[keys]:[];} else {keys = keys.slice();}
		var owner = (!user || doc._owner===user);
		var guest = (Array.isArray(doc._guests) && doc._guests.indexOf(user)>=0);
		if(owner){keys.push('owner');}
		if(guest){keys.push('guest');}

		var result = new treeGroup();
		var errors = new treeGroup();
		var context = {
			doc:doc,
			unset:unset,
			user:user,
			keys:keys,
			owner:owner,
			guest:guest
		};
		var chain = new Chain();
		function chainHandler(field){
			field._unset(
				{
					value:doc[field.id],
					unset:unset===1?1:unset[field.id],
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
			if(doc.hasOwnProperty(field.id) && (unset===1 || unset.hasOwnProperty(field.id))){
				if(field.keyscheck('edit',keys)){
					chain.add(chainHandler,field);
				} else {
					errors[field.id]=['unset.forbidden'];
				}
			}
		}
		chain.add(function chainEnd(){
			if(Object.keys(errors).length>0){
				cb(null,treeParse(errors,true));
			} else {
				cb(result);
			}
		}).pull();
	};






module.exports.Field = Field;
function Field(id,config){
	var field = this;
	var config = config || {};

	var id = id;
	Object.defineProperty(field,"id",{
		enumerable : true,
		get : function(){return id;},
		set : function(set){
			if(parent){
				parent.removeField(id);
				id = set;
				parent.addField(field);
			} else {
				id = set;
			}
		}
	});

	var parent = false;
	Object.defineProperty(field,"parent",{
		enumerable : true,
		get : function(){return parent;},
		set : function(set){
			if(!set){
				if(parent && parent.fields[id]){delete parent.fields[id];}
				parent = false;
			} else {
				parent = set;
				parent.fields[id] = field;
			}
		}
	});


	Object.defineProperty(field,"path",{
		enumerable : true,
		get : function(){
			var path = [];
			var step = field;
			while(step.parent){path.push(step.id);step = step.parent;}
			return path.reverse().join('.');
		}
	});

	Object.defineProperty(field,"schema",{
		enumerable : true,
		get : function(){
			var step = field;
			while(step.parent){step = step.parent;}
			return step;
		}
	});

	field.template = config.template || '';
	field.validations = config.validations || [];
	field.i18n = config.i18n || false;
	field.coedition = config.coedition || true;
	field.required = config.required || false;
	field.nmin = config.nmin || false;
	field.nmax = config.nmax || false;
	field.cmin = config.cmin || false;
	field.cmax = config.cmax || false;
	field.regexp = config.regexp || false;

	if(!config.keys){config.keys={};}
	field.keys = {
		see: config.keys.see || null,
		edit: config.keys.edit || null,
		manage: config.keys.manage || null
	};
}
	Field.prototype.need = function(action,owner,guest){
		var field = this;
		var keys = [];
		if(field.keys['manage']){keys.push(field.keys['manage']);}
		if((owner || (guest && field.coedition)) && field.keys['edit']){keys.push(field.keys['edit']);}
		if(action=="see" && field.keys['see']){keys.push(field.keys['see']);}
		return keys;
	}
	Field.prototype._getter = function(value,cb,path,context){
		var field = this;
		if(field.i18n){
			var value = value || {};
			var result = new treeGroup();
			var errors = new treeGroup();
			var chain = new Chain();
			for(var ilang in textualization.langs){
				var lang = textualization.langs[ilang];
				if(isSet(value[lang])){
					chain.add(function(lang){
						//console.log('getting:',path.concat([lang]).join('.'));
						field.getter(
							value[lang],
							function(value,error){
								if(error){
									errors[lang]=error;
								} else {
									result[lang]=value;
								}
								chain.next();
							},
							path.concat([lang]),
							context
						);
					},lang);
				}
			}
			chain.add(function(){
				if(Object.keys(errors).length>0){
					cb(null,errors);
				} else {
					cb(result);
				}
			}).pull();
		} else {
			field.getter(value,cb,path,context);
		}
	};
	Field.prototype._setter = function(current,value,cb,path,context){
		var field = this;
		if(field.i18n){
			var current = current || {};
			var value = value || {};
			var result = new treeGroup();
			var errors = new treeGroup();
			var chain = new Chain();
			for(var ilang in textualization.langs){
				var lang = textualization.langs[ilang];
				if(isSet(value[lang])){
					chain.add(function(lang){
						console.log('setting:',path.concat([lang]).join('.'));
						field._validate(
							current[lang],
							value[lang],
							function(value,error){
								if(error){
									errors[lang]=error;
								} else {
									result[lang]=value;
								}
								chain.next();
							},
							path.concat([lang]),
							context
						);
					},lang);
				}
			}
			chain.add(function(){
				if(Object.keys(errors).length>0){
					cb(null,errors);
				} else {
					cb(result);
				}
			}).pull();
		} else {
			field._validate(current,value,cb,path,context);
		}
	};
	Field.prototype._unsetter = function(current,unset,cb,path,context){
		var field = this;
		if(field.i18n){
			var current = current || {};
			var unset = unset || {};
			var result = new treeGroup();
			var errors = new treeGroup();
			var chain = new Chain();
			for(var ilang in textualization.langs){
				var lang = textualization.langs[ilang];
				if(isSet(current[lang]) && (unset===1 || isSet(unset[lang]))){
					chain.add(function(lang){
						console.log('unsetting:',path.concat([lang]).join('.'));
						field.unsetter(
							current[lang],
							unset===1?1:unset[lang],
							function(value,error){
								if(error){
									errors[lang]=error;
								} else {
									result[lang]=value;
								}
								chain.next();
							},
							path.concat([lang]),
							context
						);
					},lang);
				}
			}
			chain.add(function(){
				if(Object.keys(errors).length>0){
					cb(null,errors);
				} else {
					cb(unset===1?1:result);
				}
			}).pull();
		} else {
			field.unsetter(current,unset,cb,path,context);
		}
	};
	Field.prototype._validate = function(current,value,cb,path,context){
		var field = this;
		var validation = field.validate(value);
		if(validation.length>0){
			cb(null,validation);
		} else {
			field.setter(current,value,cb,path,context);
		}
	};
	Field.prototype.getter = function(value,cb,path,context){
		var field = this;
		cb(value);
	};
	Field.prototype.setter = function(current,value,cb,path,context){
		var field = this;
		cb(value);
	};
	Field.prototype.unsetter = function(current,unset,cb,path,context){
		var field = this;
		cb(1);
	};
	Field.prototype.validate = function(value){
		var field = this;
		var result = [];
		for(var v in field.validations){
			var validation = field.validations[v].call(field,value);
			if(validation!==true){
				result.push(validation);
			}
		}
		return result;
	};








module.exports.Subset = Subset;
Subset.prototype = new Field();
function Subset(id, config){
	var field = this;
	var config = config || {};
	config.template = config.template || 'subset';
	Field.call(field, id, config);
	field.fields = {};
}
	Subset.prototype.getter = function(value,cb,path,context){
		var field = this;
		var value = value || {};
		var result = new treeGroup();
		var errors = new treeGroup();
		var chain = new Chain();
		for(var fi in field.fields){
			if(isSet(value[fi])){
				if(context.user.can(field.fields[fi].need('see',context.owner,context.guest))){
					chain.add(function(fi){
						//console.log('getting:',path.concat([fi]).join('.'));
						field.fields[fi]._getter(
							value[fi],
							function(value,error){
								if(error){
									errors[fi]=error;
								} else {
									result[fi]=value;
								}
								chain.next();
							},
							path.concat([fi]),
							context
						);
					},fi);
				}
			}
		}
		chain.add(function(){
			if(Object.keys(errors).length>0){
				cb(null,errors);
			} else {
				cb(result);
			}
		}).pull();
	};
	Subset.prototype.setter = function(current,value,cb,path,context){
		var field = this;
		var current = current || {};
		var value = value || {};
		var result = new treeGroup();
		var errors = new treeGroup();
		var chain = new Chain();
		for(var fi in field.fields){
			if(isSet(value[fi])){
				if(context.user.can(field.fields[fi].need('edit',context.owner,context.guest))){
					chain.add(function(fi){
						console.log('setting:',path.concat([fi]).join('.'));
						field.fields[fi]._setter(
							current[fi],
							value[fi],
							function(value,error){
								if(error){
									errors[fi]=error;
								} else {
									result[fi]=value;
								}
								chain.next();
							},
							path.concat([fi]),
							context
						);
					},fi);
				} else {
					errors[fi]=['bricks.setter.forbidden'];
				}
			}
		}
		chain.add(function(){
			if(Object.keys(errors).length>0){
				cb(null,errors);
			} else {
				cb(result);
			}
		}).pull();
	};
	Subset.prototype.unsetter = function(current,unset,cb,path,context){
		var field = this;
		var current = current || {};
		var unset = unset || {};
		var result = new treeGroup();
		var errors = new treeGroup();
		var chain = new Chain();
		for(var fi in field.fields){
			if(isSet(current[fi]) && (unset===1 || isSet(unset[fi]))){
				if(context.user.can(field.fields[fi].need('edit',context.owner,context.guest))){
					chain.add(function(fi){
						console.log('unsetting:',path.concat([fi]).join('.'));
						field.fields[fi]._unsetter(
							current[fi],
							unset===1?1:unset[fi],
							function(value,error){
								if(error){
									errors[fi]=error;
								} else {
									result[fi]=value;
								}
								chain.next();
							},
							path.concat([fi]),
							context
						);
					},fi);
				} else {
					errors[fi]=['bricks.unsetter.forbidden'];
				}
			}
		}
		chain.add(function(){
			if(Object.keys(errors).length>0){
				cb(null,errors);
			} else {
				cb(unset===1?1:result);
			}
		}).pull();
	};
	Subset.prototype.addField = Schema.prototype.addField;
	Subset.prototype.removeField = Schema.prototype.removeField;
	Subset.prototype.getField = Schema.prototype.getField;







module.exports.List = List;
List.prototype = new Field();
function List(id, config){
	var field = this;
	var config = config || {};
	config.template = config.template || 'subsetlist';
	Field.call(field, id, config);
	field.fields = {};
}
	List.prototype.getter = function(value,cb,path,context){
		var field = this;
		var value = value || {};
		var result = [];
		var errors = new treeGroup();
		var idref = [];
		var chain = new Chain();
		for(var di in value){
			if(isSet(value[di])){
				for(var fi in field.fields){
					if(isSet(value[di][fi])){
						if(context.user.can(field.fields[fi].need('see',context.owner,context.guest))){
							chain.add(function(di,fi){
								//console.log('getting:',path.concat([di,fi]).join('.'));
								field.fields[fi]._getter(
									value[di][fi],
									function(value,error){
										if(error){
											if(!errors[di]){errors[di]= new treeGroup();}
											errors[di][fi]=error;
										} else {
											if(idref.indexOf(di)<0){idref.push(di);}
											var k = idref.indexOf(di);
											if(!result[k]){result[k]={_id:di,_order:k};}
											result[k][fi]=value;
										}
										chain.next();
									},
									path.concat([di,fi]),
									context
								);
							},di,fi);
						}
					}
				}
			}
		}
		chain.add(function(){
			if(Object.keys(errors).length>0){
				cb(null,errors);
			} else {
				result.sort(function(a,b){
					var a = a._order || 0;
					var b = b._order || 0;
					return a-b;
				});
				cb(result);
			}
		}).pull();
	};
	List.prototype.setter = function(current,value,cb,path,context){
		var field = this;
		var current = current || {};
		var value = value || {};
		var result = new treeGroup();
		var errors = new treeGroup();
		var parsed = {};
		for(var d in value){
			if(isSet(value[d])){ // and is valid list_id format
				var _id = value[d]._id;
				if(!_id || _id=='undefined'){
					_id = new ObjectID();
				}
				parsed[_id] = value[d];
				parsed[_id]._order = d;
				delete parsed[_id]._id;
				result[_id] = new treeGroup();
				result[_id]._order = d;
			}
		}
		value = parsed;
		var chain = new Chain();
		for(var di in value){
			if(isSet(value[di])){
				for(var fi in field.fields){
					if(isSet(value[di][fi])){
						if(context.user.can(field.fields[fi].need('edit',context.owner,context.guest))){
							chain.add(function(di,fi){
								console.log('setting:',path.concat([di,fi]).join('.'));
								if(!current[di]){current[di]={};}
								field.fields[fi]._setter(
									current[di][fi],
									value[di][fi],
									function(value,error){
										if(error){
											var _order = result[di]._order;
											if(!errors[_order]){errors[_order]= new treeGroup();}
											errors[_order][fi]=error;
										} else {
											result[di][fi]=value;
										}
										chain.next();
									},
									path.concat([di,fi]),
									context
								);
							},di,fi);
						}
					}
				}
			}
		}
		chain.add(function(){
			if(Object.keys(errors).length>0){
				cb(null,errors);
			} else {
				cb(result);
			}
		}).pull();
	};
	List.prototype.unsetter = function(current,unset,cb,path,context){
		var field = this;
		var current = current || {};
		var unset = unset || {};
		var result = new treeGroup();
		var errors = new treeGroup();
		var chain = new Chain();
		for(var di in current){
			if(isSet(current[di]) && (unset===1 || isSet(unset[di]))){
				for(var fi in field.fields){
					if(isSet(current[di][fi]) && (unset===1 || unset[di]===1 || isSet(unset[di][fi]))){
						if(context.user.can(field.fields[fi].need('edit',context.owner,context.guest))){
							chain.add(function(di,fi){
								console.log('unsetting:',path.concat([di,fi]).join('.'));
								if(!current[di]){current[di]={};}
								field.fields[fi]._unsetter(
									current[di][fi],
									(unset===1 || unset[di]===1)?1:unset[di][fi],
									function(value,error){
										if(error){
											if(!errors[di]){errors[di]= new treeGroup();}
											errors[di][fi]=error;
										} else {
											if(unset===1){
												if(result!==1){result=1;}
											} else {
												if(unset[di]===1){
													if(!isSet(result[di])){result[di]=1;}
												} else {
													if(!isSet(result[di])){result[di]=new treeGroup();}
													result[di][fi]=value;
												}
											}
										}
										chain.next();
									},
									path.concat([di,fi]),
									context
								);
							},di,fi);
						}
					}
				}
			}
		}
		chain.add(function(){
			if(Object.keys(errors).length>0){
				cb(null,errors);
			} else {
				cb(result);
			}
		}).pull();
	};
	List.prototype.addField = Schema.prototype.addField;
	List.prototype.removeField = Schema.prototype.removeField;
	List.prototype.getField = Schema.prototype.getField;








module.exports.Text = Text;
Text.prototype = new Field();
function Text(id, config){
	var field = this;
	var config = config || {};
	config.template = config.template || 'text';
	Field.call(field, id, config);
}

module.exports.Textarea = Textarea;
Textarea.prototype = new Field();
function Textarea(id, config){
	var field = this;
	var config = config || {};
	config.template = config.template || 'textarea';
	Field.call(field, id, config);
}

module.exports.Editor = Editor;
Editor.prototype = new Field();
function Editor(id, config){
	var field = this;
	var config = config || {};
	config.template = config.template || 'editor';
	Field.call(field, id, config);
}

module.exports.File = File;
File.prototype = new Field();
function File(id, config){
	var field = this;
	var config = config || {};
	config.template = config.template || 'file';
	Field.call(field, id, config);
}
	File.prototype.getter = function(value,cb,path,context){
		var field = this;
		cb(value);
	};
	File.prototype.setter = function(current,value,cb,path,context){
		var field = this;
		var file = {};
		if(value && value.path && value.size && value.name && value.type){
			var schema = field.schema;
			var udir = paths.join(PILLARS.uploadsDirectory,schema.collection);
			var id = context.id;
			var fname = path.join('.');
			fs.mkdir(paths.join(udir,id), 0777, true,function(error){
				if(!error){
					fs.rename(value.path, paths.join(udir,id,fname),function(error){
						if(!error){
							value.moved = true;
							file.size = parseInt(value.size || 0);
							file.name = (value.name || '').toString();
							file.type = (value.type || '').toString();
							file.lastmod = value.lastModifiedDate || (new Date());
							file.path = paths.join(schema.collection,"files",id,fname);
							cb(file);
						} else {
							cb(null,["bricks.file.norename"]);
						}
					});
				} else {
					cb(null,["bricks.file.nodir"]);
				}
			});
		} else {
			cb(null,["bricks.file.badformat"]);
		}
	};


module.exports.Img = Img;
Img.prototype = new File();
function Img(id, config){
	var field = this;
	var config = config || {};
	config.template = config.template || 'fileimg';
	File.call(field, id, config);
}

module.exports.Select = Select;
Select.prototype = new Field();
function Select(id, config){
	var field = this;
	var config = config || {};
	config.template = config.template || 'select';
	Field.call(field, id, config);
	field.values = config.values || {};
}

module.exports.Checkbox = Checkbox;
Checkbox.prototype = new Field();
function Checkbox(id, config){
	var field = this;
	var config = config || {};
	config.template = config.template || 'checkbox';
	Field.call(field, id, config);
}
	Checkbox.prototype.getter = function(value,cb){
		var field = this;
		var value = value || 0;
		if(value!=0){value=true;} else {value=false;}
		cb(value);
	};
	Checkbox.prototype.setter = function(current,value,cb){
		var field = this;
		var value = value || 0;
		if(value!=0){value=1;} else {value=0;}
		cb(value);
	};

module.exports.Checkboxes = Checkboxes;
Checkboxes.prototype = new Field();
function Checkboxes(id, config){
	var field = this;
	var config = config || {};
	config.template = config.template || 'checkboxes';
	Field.call(field, id, config);
	field.values = config.values || {};
}
	Checkboxes.prototype.getter = function(value,cb){
		var field = this;
		var value = value || [];
		var checked = {};
		for(var i in value){checked[value[i]]=true;}
		cb(checked);
	};
	Checkboxes.prototype.setter = function(current,value,cb){
		var field = this;
		var value = value || {};
		var checked = current || [];
		for(var i in value){
			if(field.values.indexOf(i)>=0){
				if(value[i]=='true' && checked.indexOf(i)<0){
					checked.push(i);
				} else if(value[i]=='false' && checked.indexOf(i)>=0) {
					checked.splice(checked.indexOf(i),1);
				}
			}
		}
		cb(checked);
	};

module.exports.Radios = Radios;
Radios.prototype = new Field();
function Radios(id, config){
	var field = this;
	var config = config || {};
	config.template = config.template || 'radios';
	Field.call(field, id, config);
	field.values = config.values || {};
}

module.exports.Reverse = Reverse;
Reverse.prototype = new Field();
function Reverse(id, config){
	var field = this;
	var config = config || {};
	config.template = config.template || 'text';
	Field.call(field, id, config);
	field.validations["min"] = function(value){
		var field = this;
		return (value && value.length>=5)?true:new Validation('validations.min',{min:5});
	};
}
	Reverse.prototype.getter = function(value,cb){
		var field = this;
		value = value.split("").slice().reverse().join("");
		cb(value);
	};
	Reverse.prototype.setter = function(current,value,cb){
		var field = this;
		value = value.split("").slice().reverse().join("");
		cb(value);
	};

module.exports.Time = Time;
Time.prototype = new Field();
function Time(id, config){
	var field = this;
	var config = config || {};
	config.template = config.template || 'time';
	Field.call(field, id, config);
}

module.exports.Reference = Reference;
Reference.prototype = new Field();
function Reference(id, config){
	var field = this;
	var config = config || {};
	config.template = config.template || 'reference';
	Field.call(field, id, config);
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
