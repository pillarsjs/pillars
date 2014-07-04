
var textualization = require('./textualization')
var ObjectID = require('mongodb').ObjectID;
var fs = require('node-fs');

module.exports.Schema = Schema;
function Schema(id,config){
	var schema = this;
	var config = config || {};
	schema.id = id;
	schema.server = config.server || false;
	schema.collection = config.collection || false;
	schema.headers = config.headers || [];
	schema.limit = config.limit || 10;
	schema.filter = config.filter || [];
	schema.template = config.template || 'schema';
	schema.fields = {};

	if(!config.keys){config.keys={};}
	schema.keys = {
		see : config.keys.see || 'see_'+schema.id,
		edit : config.keys.edit || 'edit_'+schema.id,
		manage : config.keys.manage || 'manage_'+schema.id
	};

	Object.defineProperty(schema,"tree",{
		enumerable : true, configurable : true,
		get : function(){return ['data'];}
	});

	Object.defineProperty(schema,"depth",{
		enumerable : true,
		get : function(){return 0;}
	});

	Object.defineProperty(schema,"NgScope",{enumerable : true, configurable : true, value : 'data'});
	Object.defineProperty(schema,"NgName",{enumerable : true, configurable : true, value : 'data'});
	Object.defineProperty(schema,"NgId",{enumerable : true, configurable : true, value : 'data'});
	Object.defineProperty(schema,"NgExp",{enumerable : true, configurable : true, value : 'data'});
}
	Schema.prototype.need = function(action,owner,guest){
		var schema = this;
		var keys = [];
		if(schema.keys['manage']){keys.push(schema.keys['manage']);}
		if((owner || guest) && schema.keys['edit']){keys.push(schema.keys['edit']);}
		if(action=="see" && schema.keys['see']){keys.push(schema.keys['see']);}
		return keys;
	}
	Schema.prototype.getter = function(doc,user,cb,params){
		var schema = this;
		if(doc){
			var user = user || {};
			var owner = (doc._owner==user._id);
			var guest = (Array.isArray(doc._guests) && doc._guests.indexOf(user._id)>=0);

			var result = new treeGroup();
			var errors = new treeGroup();
			var chain = new Chain();
			for(var fi in schema.fields){
				if(isSet(doc[fi])){
					if(user.can(schema.fields[fi].need('see',owner,guest))){
						chain.add(function(fi){
							//console.log('getting:',fi);
							schema.fields[fi]._getter(
								doc[fi],
								function(value,error){
									if(error){
										errors[fi]=error;
									} else {
										result[fi]=value;
									}
									chain.next();
								},
								[fi],
								{
									id:doc._id,
									doc:doc,
									user:user,
									owner:owner,
									guest:guest,
									params:params
								}
							);
						},fi);
					}
				}
			}
			chain.add(function(){
				if(Object.keys(errors).length>0){
					cb(null,treeParse(errors,true));
				} else {
					cb(result);
				}
			}).pull();
		} else {
			cb(null);
		}
	};
	Schema.prototype.setter = function(doc,set,user,cb,params){
		var schema = this;
		var set = set || {};
		var user = user || {};
		var owner = false;
		var guest = false;
		if(doc){	
			owner = (doc._owner==user._id);
			guest = (Array.isArray(doc._guests) && doc._guests.indexOf(user._id)>=0);
		} else {
			owner = true;
		}
		var result = new treeGroup();
		var errors = new treeGroup();
		var chain = new Chain();
		for(var fi in schema.fields){
			if(isSet(set[fi])){
				if(user.can(schema.fields[fi].need('edit',owner,guest))){
					chain.add(function(fi){
						//console.log('setting:',fi);
						schema.fields[fi]._setter(
							doc?doc[fi]:undefined,
							set[fi],
							function(value,error){
								if(error){
									errors[fi]=error;
								} else {
									result[fi]=value;
								}
								chain.next();
							},
							[fi],
							{
								id:doc?doc._id:set._id,
								doc:doc,
								set:set,
								user:user,
								owner:owner,
								guest:guest,
								params:params
							}
						);
					},fi);
				} else {
					errors[fi]=['bricks.setter.forbidden'];
				}
			}
		}
		chain.add(function(){
			if(Object.keys(errors).length>0){
				cb(null,treeParse(errors,true));
			} else {
				cb(result);
			}
		}).pull();
	};
	Schema.prototype.unsetter = function(doc,unset,user,cb,params){
		var schema = this;
		if(doc){
			var unset = unset || {};
			var user = user || {};
			var owner = (doc._owner==user._id);
			var guest = (Array.isArray(doc._guests) && doc._guests.indexOf(user._id)>=0);

			var result = new treeGroup();
			var errors = new treeGroup();
			var chain = new Chain();
			for(var fi in schema.fields){
				if(isSet(doc[fi]) && (unset===1 || isSet(unset[fi]))){
					if(user.can(schema.fields[fi].need('edit',owner,guest))){
						chain.add(function(fi){
							console.log('unsetting:',fi);
							schema.fields[fi]._unsetter(
								doc[fi],
								unset===1?1:unset[fi],
								function(value,error){
									if(error){
										errors[fi]=error;
									} else {
										result[fi]=value;
									}
									chain.next();
								},
								[fi],
								{
									id:doc._id,
									doc:doc,
									unset:unset,
									user:user,
									owner:owner,
									guest:guest,
									params:params
								}
							);
						},fi);
					} else {
						errors[fi]=['bricks.unsetter.forbidden'];
					}
				}
			}
			chain.add(function(){
				if(Object.keys(errors).length>0){
					cb(null,treeParse(errors,true));
				} else {
					cb(result);
				}
			}).pull();
		} else {
			cb(null);
		}
	};
	Schema.prototype.addField = function(field){
		var schema = this;
		field.parent = schema;
		return schema;
	};
	Schema.prototype.removeField = function(fieldid){
		var schema = this;
		if(schema.fields[fieldid]){schema.fields[fieldid].parent=false;}
		return schema;
	};
	Schema.prototype.getField = function(fieldid){
		var schema = this;
		if(schema.fields[fieldid]){return schema.fields[fieldid];}
		return false;
	};







module.exports.Field = Field;
function Field(id,config){
	var field = this;
	var config = config || {};

	Object.defineProperty(field,"tree",{
		enumerable : true, configurable : true,
		get : function(){return parent?parent.tree.concat([id]):undefined;}
	});

	Object.defineProperty(field,"depth",{
		enumerable : true,
		get : function(){return this.tree?this.tree.length-1:0;}
	});
	Object.defineProperty(field,"NgScope",{
		enumerable : true, configurable : true,
		get : function(){
			if(!this.tree){return "";}
			var path = this.tree;
			path[path.length-1]=path[path.length-1].replace(/\[\]$/i,'');
			for(var i in path){
				path[i] = path[i].replace(/\[\]$/i,"[$lk"+i+"]");
			}
			return path.join('.');
		}
	});
	Object.defineProperty(field,"NgName",{
		enumerable : true, configurable : true,
		get : function(){
			if(!this.tree){return "";}
			var path = this.tree;
			path[path.length-1]=path[path.length-1].replace(/\[\]$/i,'');
			for(var i in path){
				path[i] = path[i].replace(/\[\]$/i,'][{{$lk'+i+'}}');
			}
			return path.slice(0,1)+'['+path.slice(1).join('][')+']';
		}
	});
	Object.defineProperty(field,"NgId",{
		enumerable : true, configurable : true,
		get : function(){
			if(!this.tree){return "";}
			var path = this.tree;
			path[path.length-1]=path[path.length-1].replace(/\[\]$/i,'');
			for(var i in path){
				path[i] = path[i].replace(/\[\]$/i,'{{$lk'+i+'}}');
			}
			return path.join('_');
		}
	});
	Object.defineProperty(field,"NgExp",{
		enumerable : true, configurable : true,
		get : function(){
			if(!this.tree){return "";}
			var path = this.tree;
			path[path.length-1]=path[path.length-1].replace(/\[\]$/i,'');
			for(var i in path){
				path[i] = path[i].replace(/\[\]$/i,".'+$lk"+i+"+'");
			}
			return path.join('.');
		}
	});

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

	var id = id;
	Object.defineProperty(field,"path",{
		enumerable : true,
		get : function(){
			var path = [];
			var step = field;
			while(step.parent){path.push(step.id);step = step.parent;}
			return path.reverse().join('.');
		},
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
	Field.call(field, id, config);
	field.template = 'subset';
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







module.exports.Tree = Tree;
Tree.prototype = new Field();
function Tree(id, config){
	var field = this;
	Field.call(field, id, config);
	field.template = 'subset';
	field.fields = {};
}
	Tree.prototype.getter = function(value,cb,path,context){
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
	Tree.prototype.setter = function(current,value,cb,path,context){
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
	Tree.prototype.unsetter = function(current,unset,cb,path,context){
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
	Tree.prototype.addField = Schema.prototype.addField;
	Tree.prototype.removeField = Schema.prototype.removeField;
	Tree.prototype.getField = Schema.prototype.getField;







module.exports.List = List;
List.prototype = new Field();
function List(id, config){
	var field = this;
	Field.call(field, id, config);
	field.template = 'list';
	field.fields = {};
	Object.defineProperty(field,"tree",{
		enumerable : true, configurable : true,
		get : function(){return field.parent?field.parent.tree.concat([id+'[]']):undefined;}
	});
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
											var _order = value._order || 0;
											if(!result[k]){result[k]={_id:di,_order:_order};}
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
			if(isSet(value[d]) && isSet(value[d]._id)){ // and is valid list_id format
				var _id = value[d]._id;
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
	Field.call(field, id, config);
	field.template = 'text';
}

module.exports.Textarea = Textarea;
Textarea.prototype = new Field();
function Textarea(id, config){
	var field = this;
	Field.call(field, id, config);
	field.template = 'textarea';
}

module.exports.Editor = Editor;
Editor.prototype = new Field();
function Editor(id, config){
	var field = this;
	Field.call(field, id, config);
	field.template = 'editor';
}

module.exports.File = File;
File.prototype = new Field();
function File(id, config){
	var field = this;
	Field.call(field, id, config);
	field.template = 'file';
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
			var udir = "files/"+schema.collection;
			var id = context.id;
			var fname = path.join('.');
			fs.mkdir(udir+"/"+id, 0777, true,function(error){
				if(!error){
					fs.rename(value.path, udir+"/"+id+"/"+fname,function(error){
						if(!error){
							value.moved = true;
							file.size = parseInt(value.size || 0);
							file.name = (value.name || '').toString();
							file.type = (value.type || '').toString();
							file.lastmod = value.lastModifiedDate || (new Date());
							file.path = "/"+schema.collection+"/files/"+id+"/"+fname;
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
	File.call(field, id, config);
	field.template = 'fileimg';
}

module.exports.Select = Select;
Select.prototype = new Field();
function Select(id, config){
	var field = this;
	Field.call(field, id, config);
	field.template = 'select';
	field.values = config.values || {};
	field.validations["invalid-option"] = function(value){
		var field = this;
		return (Object.keys(field.values).indexOf(value)>=0)?true:new Validation('validations.invalid-option');
	};
}

module.exports.Checkbox = Checkbox;
Checkbox.prototype = new Field();
function Checkbox(id, config){
	var field = this;
	Field.call(field, id, config);
	field.template = 'checkbox';
}
	Checkbox.prototype.getter = function(value,cb){
		var field = this;
		var value = value || 0;
		if(value!=0){value='true';} else {value='false';}
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
	Field.call(field, id, config);
	field.template = 'checkboxes';
	field.values = config.values || {};
}
	Checkboxes.prototype.getter = function(value,cb){
		var field = this;
		var value = value || [];
		var checked = {};
		for(var i in value){checked[value[i]]='true';}
		cb(checked);
	};
	Checkboxes.prototype.setter = function(current,value,cb){
		var field = this;
		var value = value || {};
		var checked = [];
		for(var i in value){
			if(value[i] && Object.keys(field.values).indexOf(i)>=0 && checked.indexOf(i)<0){checked.push(i);}
		}
		cb(checked);
	};

module.exports.Radios = Radios;
Radios.prototype = new Field();
function Radios(id, config){
	var field = this;
	Field.call(field, id, config);
	field.template = 'radios';
	field.values = config.values || {};
	field.validations["invalid-option"] = function(value){
		var field = this;
		return (Object.keys(field.values).indexOf(value)>=0)?true:new Validation('validations.invalid-option');
	};
}

module.exports.Reverse = Reverse;
Reverse.prototype = new Field();
function Reverse(id, config){
	var field = this;
	Field.call(field, id, config);
	field.template = 'text';
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
	Field.call(field, id, config);
	field.template = 'time';
}

module.exports.Reference = Reference;
Reference.prototype = new Field();
function Reference(id, config){
	var field = this;
	Field.call(field, id, config);
	field.collection = config.collection || false;
	field.headers = config.headers || false;
	field.template = 'reference';
}
	Reference.prototype.getter = function(value,cb){
		var field = this;
		var schema = field.schema;
		var db = schema.server.database.collection(field.collection);
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





































Schema.prototype.count = function(gw,params,cb){
	var schema = this;
	var query = {};

	var grant = false;
	if(gw.user.can(schema.keys.manage) || gw.user.can(schema.keys.see)){
		grant = true;
	} else if(gw.user.can(schema.keys.edit)){
		grant = true;
		query.$or = [{_author:gw.user._id},{_guests:gw.user._id}];
	}
	if(grant){
		var db = schema.server.database.collection(schema.collection);
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
Schema.prototype.list = function(gw,params,cb){
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
	if(gw.user.can(schema.keys.manage) || gw.user.can(schema.keys.see)){
		grant = true;
	} else if(gw.user.can(schema.keys.edit)){
		grant = true;
		query.$and = [];
		query.$and.push({
			$or:[{_author:gw.user._id},{_guests:gw.user._id}]
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

		var db = schema.server.database.collection(schema.collection);
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
Schema.prototype.one = function(gw,params,cb){
	var schema = this;
	var query = {};
	var _id = params._id || false;

	var grant = false;
	if(gw.user.can(schema.keys.manage) || gw.user.can(schema.keys.see)){
		grant = true;
	} else if(gw.user.can(schema.keys.edit)){
		grant = true;
		query.$or = [{_author:gw.user._id},{_guests:gw.user._id}];
	}
	if(grant){
		if(_id){
			if(/^[a-f0-9]{24}$/i.test(_id)){_id = new ObjectID.createFromHexString(_id);}
			query._id = _id;
			var db = schema.server.database.collection(schema.collection);
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
					schema.getter(result,gw.user,function(getted,errors){
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
Schema.prototype.update = function(gw,params,cb){
	var schema = this;
	var query = {};
	var _id = params._id || false;
	var set = params['data'] || false;
	var unset = params['unset'] || false;

	var grant = false;
	if(gw.user.can(schema.keys.manage)){
		grant = true;
	} else if(gw.user.can(schema.keys.edit)){
		grant = true;
		query.$or = [{_author:gw.user._id},{_guests:gw.user._id}];
	}
	if(grant){
		if(_id && set){
			if(/^[a-f0-9]{24}$/i.test(_id)){_id = new ObjectID.createFromHexString(_id);}
			query._id = _id;
			var db = schema.server.database.collection(schema.collection);
			db.findOne(query,function(error, result) {
				if(!error && result){
					var update = {};
					schema.unsetter(result,unset,gw.user,function(unsetted,errors){
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
							schema.setter(result,set,gw.user,function(setted,errors){
								if(errors){
									cb({
										error : "setter",
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
Schema.prototype.insert = function(gw,params,cb){
	var schema = this;
	var set = params['data'] || false;

	var grant = false;
	if(gw.user.can(schema.keys.manage) || gw.user.can(schema.keys.edit)){
		grant = true;
	}
	if(grant){
		if(set){
			var _id = new ObjectID();
			set._id = _id;
			schema.setter(null,set,gw.user,function(setted,errors){
				if(errors){
					cb({
						error : "setter",
						ads : errors
					});
				} else {
					setted._id = _id;
					setted._owner = gw.user._id;
					setted._ctime = new Date();
					setted._mtime = new Date();
					var db = schema.server.database.collection(schema.collection);
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
Schema.prototype.remove = function(gw,params,cb){
	var schema = this;
	var query = {};
	var _id = params._id || false;


	var grant = false;
	if(gw.user.can(schema.keys.manage)){
		grant = true;
	} else if(gw.user.can(schema.keys.edit)){
		grant = true;
		query.$or = [{_author:gw.user._id},{_guests:gw.user._id}];
	}

	if(grant){
		if(_id){
			if(/^[a-f0-9]{24}$/i.test(_id)){_id = new ObjectID.createFromHexString(_id);}
			query._id = _id;
			var db = schema.server.database.collection(schema.collection);
			db.findOne(query,function(error, result) {
				if(!error && result){
					schema.unsetter(result,1,gw.user,function(unsetted,errors){
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

function Chain(){
	var chain = this;
	var chainlinks = [];
	var failhandler = false;
	chain.data = {};
	chain.add = function(func){
		var args = Array.prototype.slice.call(arguments).slice(1);
		//var args = Array.slice(arguments,1);
		chainlinks.push({func:func,args:args});
		return chain;
	}
	chain.onfail = function(_failhandler){
		failhandler = _failhandler;
		return chain;
	}
	chain.pull = function(){
		if(chainlinks.length>0){
			chainlinks[0].func.apply(chain,chainlinks[0].args);
		}
	}
	chain.next = function(){
		chainlinks.shift();
		chain.pull();
	}
	chain.fail = function(error){
		if(failhandler){
			failhandler(error,chain);
		}
	}
}