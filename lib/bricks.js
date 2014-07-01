
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

	schema.keys = {
		see : 'see_'+schema.id,
		edit : 'edit_'+schema.id,
		manage : 'manage_'+schema.id
	};
	if(config.keys){
		schema.keys.see = config.keys.see || schema.keys.see;
		schema.keys.edit = config.keys.edit || schema.keys.edit;
		schema.keys.manage = config.keys.manage || schema.keys.manage;
	}

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

	Schema.prototype.fieldsCan = function(action,keys,owner,guest){
		var schema = this;
		var fieldlist = {};
		for(var fi in schema.fields){
			var field = schema.fields[fi];
			var needs = [];
			needs.push(field.keys['manage']);
			if(owner || (guest && field.coedition)){needs.push(field.keys['edit']);}
			if(action=="see"){needs.push(field.keys['see']);}
			
			//console.log(fi,needs);

			for(var ni in needs){
				var key = needs[ni];
				if(keys.indexOf(key)>=0){fieldlist[fi] = field;break;}
			}

		}
		//console.log(Object.keys(fieldlist));
		return fieldlist;
	}
	Schema.prototype.getter = function(doc,user,cb,params){
		var schema = this;
		var doc = doc || {};
		var user = user || {};
		var owner = (doc._owner==user._id);
		var guest = (Array.isArray(doc._guests) && doc._guests.indexOf(user._id)>=0);

		var result = new treeGroup();
		var errors = new treeGroup();
		var chain = new Chain();
		for(var fi in schema.fields){
			if(doc[fi]){
				chain.add(function(fi){
					console.log('getting:',[fi]);
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
		chain.add(function(){
			if(Object.keys(errors).length>0){
				cb(null,treeParse(errors,true));
			} else {
				cb(result);
			}
		}).pull();
	};
	Schema.prototype.setter = function(doc,set,user,cb,params){
		var schema = this;
		var doc = doc || {_owner:true,_guests:[]};
		var set = set || {};
		var user = user || {};
		var owner = (doc._owner==user._id);
		var guest = (Array.isArray(doc._guests) && doc._guests.indexOf(user._id)>=0);
		var result = new treeGroup();
		var errors = new treeGroup();
		var chain = new Chain();
		for(var fi in schema.fields){
			if(set[fi]){
				chain.add(function(fi){
					console.log('setting:',[fi]);
					schema.fields[fi]._setter(
						doc[fi],
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
							doc:doc,
							set:set,
							user:user,
							owner:owner,
							guest:guest,
							params:params
						}
					);
				},fi);
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

	var keys = {};
	field.keys = {};

	if(config.keys){
		keys.see = config.keys.see || null;
		keys.edit = config.keys.edit || null;
		keys.manage = config.keys.manage || null;
	}

	Object.defineProperty(field.keys,"see",{
		enumerable : true,
		get : function(){
			if(!keys.see){return field.parent.keys.see;} 
			else {return keys.see;}
		},
		set : function(set){keys.see = set;}
	});
	Object.defineProperty(field.keys,"edit",{
		enumerable : true,
		get : function(){
			if(!keys.edit){return field.parent.keys.edit;} 
			else {return keys.edit;}
		},
		set : function(set){keys.edit = set;}
	});
	Object.defineProperty(field.keys,"manage",{
		enumerable : true,
		get : function(){
			if(!keys.manage){return field.parent.keys.manage;} 
			else {return keys.manage;}
		},
		set : function(set){keys.manage = set;}
	});

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
				if(value[lang]){
					chain.add(function(lang){
						console.log('getting:',path.slice(1).concat([lang]).join('.'));
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
				if(value[lang]){
					chain.add(function(lang){
						console.log('setting:',path.slice(1).concat([lang]).join('.'));
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
			if(value[fi]){
				chain.add(function(fi){
					console.log('getting:',path.slice(1).concat([fi]).join('.'));
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
			if(value[fi]){
				chain.add(function(fi){
					console.log('setting:',path.slice(1).concat([fi]).join('.'));
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

	Subset.prototype.addField = Schema.prototype.addField;
	Subset.prototype.removeField = Schema.prototype.removeField;
	Subset.prototype.getField = Schema.prototype.getField;







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
			if(value[di]){
				for(var fi in field.fields){
					if(value[di][fi]){
						chain.add(function(di,fi){
							console.log('getting:',path.slice(1).concat([di,fi]).join('.'));
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
			if(value[d] && value[d]._id){ // and is valid list_id format
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
			if(value[di]){
				for(var fi in field.fields){
					if(value[di][fi]){
						chain.add(function(di,fi){
							console.log('setting:',path.slice(1).concat([di,fi]).join('.'));
							if(!current[di]){current[di]={};}
							field.fields[fi]._setter(
								current[di][fi],
								value[di][fi],
								function(value,error){
									if(error){
										var _order = data[di]._order;
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
			var id = context.set.id;
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
							cb(null,["schema.files.norename"]);
						}
					});
				} else {
					cb(null,["schema.files.nodir"]);
				}
			});
		} else {
			cb(null,["schema.files.badformat"]);
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
	var db = schema.server.database.collection(schema.collection);
	db.count({},function(error, count) {
		if(!error){
			cb({
				error : false,
				data : {
					count : count
				}
			});
		} else {
			cb({
				error : "schema.error",
				details : error
			});
		}
	});
};
Schema.prototype.list = function(gw,params,cb){
	var schema = this;
	var q = {};
	var skip = 0;
	var filter = false;
	var query = {};
	var limit = schema.limit;
	var range = false;
	var order = schema.order || 1;
	var sort = schema.sort || false;
	var qsort = {};
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
			q[sort]=order>0?{$gt:range}:{$lt:range};
		}
	}
	if(typeof params._filter === 'string' && params._filter!=""){
		filter = params._filter;
		query.$or = [];
		for(i in schema.filter){
			var sentence = {};
			sentence[schema.filter[i]]=new RegExp(filter,"i");
			query.$or.push(sentence);
		}
	}

	var cols = {};
	for(var header in schema.headers){cols[schema.headers[header]]=true;}

	var db = schema.server.database.collection(schema.collection);
	db.find(query,cols).sort(qsort).skip(skip).limit(limit).toArray(function(error, results) {
		if(error){
			cb({
				error : "schema.error",
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
};
Schema.prototype.one = function(gw,params,cb){
	var schema = this;
	var _id = params._id || false;
	if(/^[a-f0-9]{24}$/i.test(_id)){_id = new ObjectID.createFromHexString(_id);}
	if(_id){
		var db = schema.server.database.collection(schema.collection);
		db.findOne({_id:_id},function(error, result) {
			if(error){
				cb({
					error : "schema.error",
					details : error
				});
			} else if(!result) {
				cb({
					error : "schema.noexist"
				});
			} else {
				console.time("getter");
				schema.getter(result,gw.user,function(getted,errors){
					console.timeEnd("getter");
					if(errors){
						cb({
							error : "schema.getterfail",
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
			error : "schema.badparams"
		});
	}
};
Schema.prototype.update = function(gw,params,cb){
	var schema = this;
	var _id = params._id || false;
	if(/^[a-f0-9]{24}$/i.test(_id)){_id = new ObjectID.createFromHexString(_id);}
	var set = params['data'] || false;
	var unset = params['unset'] || [];
	if(_id && set){
		var db = schema.server.database.collection(schema.collection);
		db.findOne({_id:_id},function(error, result) {
			if(!error && result){
				set._id = _id;
				schema.setter(result,set,gw.user,function(setted,errors){
					if(errors){
						cb({
							error : "schema.setterfail",
							ads : errors
						});
					} else {
						var update = {};
						update.$set = treeParse(setted);
						if(Array.isArray(unset)){
							update.$unset = {};
							for(var i in unset){update.$unset[unset[i]]=1;}
						}
						db.update({_id:_id},update,function(error, result) {
							if(error){
								cb({
									error : "schema.error",
									details : error
								});
							} else if(result==0) {
								cb({
									error : "schema.noexist"
								});
							} else {
								schema.one(gw,params,cb);
							}
						});
					}
				});
			} else {
				cb({
					error : "schema.noexist"
				});
			}
		});
	} else {
		cb({
			error : "schema.badparams"
		});
	}
};
Schema.prototype.insert = function(gw,params,cb){
	var schema = this;
	var doc = params['data'] || false;
	if(doc){
		var _id = new ObjectID();
		doc._id = _id;
		schema.setter(null,doc,gw.user,function(setted,errors){
			if(errors){
				cb({
					error : "schema.setterfail",
					ads : errors
				});
			} else {
				setted._id = _id;
				var db = schema.server.database.collection(schema.collection);
				db.insert(setted,function(error, result) {
					if(error){
						cb({
							error : "schema.error",
							details : error
						});
					} else if(!result[0] || !result[0]._id) {
						cb({
							error : "schema.noinserted"
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
			error : "schema.badparams"
		});
	}
};
Schema.prototype.remove = function(gw,params,cb){
	var schema = this;
	var _id = params._id || false;
	if(/^[a-f0-9]{24}$/i.test(_id)){_id = new ObjectID.createFromHexString(_id);}
	if(_id){
		var db = schema.server.database.collection(schema.collection);
		db.remove({_id:_id},function(error, result) {
			if(error){
				cb({
					error : "schema.error",
					details : error
				});
			} else if(result==0) {
				cb({
					error : "schema.noremoved"
				});
			} else {
				cb({error:false});
			}
		});
	} else {
		cb({
			error : "schema.badparams"
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