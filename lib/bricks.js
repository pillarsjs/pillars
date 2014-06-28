
var textualization = require('./textualization')
var ObjectID = require('mongodb').ObjectID;
var fs = require('node-fs');

module.exports.Fieldset = Fieldset;
function Fieldset(id,config){
	var fieldset = this;
	var config = config || {};
	fieldset.id = id;
	fieldset.title = config.title || '';
	fieldset.details = config.details || '';
	fieldset.server = config.server || false;
	fieldset.collection = config.collection || false;
	fieldset.headers = config.headers || [];
	fieldset.limit = config.limit || 10;
	fieldset.filter = config.filter || [];
	fieldset.template = config.template || 'fieldset';
	fieldset.fields = {};

	fieldset.keys = {
		see : 'see_'+fieldset.id,
		edit : 'edit_'+fieldset.id,
		manage : 'manage_'+fieldset.id
	};
	if(config.keys){
		fieldset.keys.see = config.keys.see || fieldset.keys.see;
		fieldset.keys.edit = config.keys.edit || fieldset.keys.edit;
		fieldset.keys.manage = config.keys.manage || fieldset.keys.manage;
	}

	Object.defineProperty(fieldset,"tree",{
		enumerable : true, configurable : true,
		get : function(){return ['data'];}
	});

	Object.defineProperty(fieldset,"depth",{
		enumerable : true,
		get : function(){return 0;}
	});

	Object.defineProperty(fieldset,"NgScope",{enumerable : true, configurable : true, value : 'data'});
	Object.defineProperty(fieldset,"NgName",{enumerable : true, configurable : true, value : 'data'});
	Object.defineProperty(fieldset,"NgId",{enumerable : true, configurable : true, value : 'data'});
	Object.defineProperty(fieldset,"NgExp",{enumerable : true, configurable : true, value : 'data'});
}

	Fieldset.prototype.fieldsCan = function(action,keys,owner,guest){
		var fieldset = this;
		var fieldlist = {};
		for(var fi in fieldset.fields){
			var field = fieldset.fields[fi];
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
	Fieldset.prototype.getter = function(doc,credentials,cb){
		var fieldset = this;
		var doc = doc || {};
		var id = doc._id;
		var path = [id];
		var result = new Group();
		var errors = new Group();
		var chain = new Chain();
		for(var fi in fieldset.fields){
			if(typeof doc[fi] !== "undefined"){
				chain.add(function(fi){
					console.log('getting:',path.slice(1).concat([fi]).join('.'));
					fieldset.fields[fi]._getter(
						doc[fi],
						function(value,error){
							if(error){
								errors[fi]=error;
							} else {
								result[fi]=value;
							}
							chain.next();
						},
						path.concat([fi]),
						{
							path:path.concat([fi]),
							credentials:credentials,
							doc:doc,
							id:id
						}
					);
				},fi);
			}
		}
		chain.add(function(){
			if(Object.keys(errors).length>0){
				cb(null,fieldset.treeSet(errors,true));
			} else {
				cb(result);
			}
		}).pull();
	};
	Fieldset.prototype.setter = function(set,credentials,cb){
		var fieldset = this;
		var doc = doc || {};
		var set = set || {};
		var id = doc._id;
		var path = [id];
		var result = new Group();
		var errors = new Group();
		var chain = new Chain();
		for(var fi in fieldset.fields){
			if(typeof set[fi] !== "undefined"){
				chain.add(function(fi){
					console.log('setting:',path.slice(1).concat([fi]).join('.'));
					fieldset.fields[fi]._setter(
						//doc[fi],
						set[fi],
						function(value,error){
							if(error){
								errors[fi]=error;
							} else {
								result[fi]=value;
							}
							chain.next();
						},
						path.concat([fi]),
						{
							path:path.concat([fi]),
							credentials:credentials,
							doc:doc,
							set:set,
							id:id
						}
					);
				},fi);
			}
		}
		chain.add(function(){
			if(Object.keys(errors).length>0){
				cb(null,fieldset.treeSet(errors,true));
			} else {
				cb(result);
			}
		}).pull();
	};
	Fieldset.prototype.addField = function(field){
		var fieldset = this;
		field.parent = fieldset;
		return fieldset;
	};
	Fieldset.prototype.removeField = function(fieldid){
		var fieldset = this;
		if(fieldset.fields[fieldid]){fieldset.fields[fieldid].parent=false;}
		return fieldset;
	};
	Fieldset.prototype.getField = function(fieldid){
		var fieldset = this;
		if(fieldset.fields[fieldid]){return fieldset.fields[fieldid];}
		return false;
	};
	Fieldset.prototype.treeSet = function(obj,marks){
		var result = {};
		function treeSetWalker(path,obj,result){
			for(var i in obj){
				if(obj[i] instanceof Group){
					if(marks){result[path.concat([i]).join('.')]=true;}
					treeSetWalker(path.concat([i]),obj[i],result);
				} else {
					result[path.concat([i]).join('.')]=obj[i];
				}
			}
		}
		treeSetWalker([],obj,result);
		return result;
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

	Object.defineProperty(field,"fieldset",{
		enumerable : true,
		get : function(){
			var step = field;
			while(step.parent){step = step.parent;}
			return step;
		}
	});

	field.label = config.label || '';
	field.details = config.details || '';
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
			var result = new Group();
			var errors = new Group();
			var chain = new Chain();
			for(var ilang in textualization.langs){
				var lang = textualization.langs[ilang];
				if(typeof value[lang] !== "undefined"){
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
			field.getter(value,cb,path);
		}
	};
	Field.prototype._setter = function(value,cb,path,context){
		var field = this;
		if(field.i18n){
			var value = value || {};
			var result = new Group();
			var errors = new Group();
			var chain = new Chain();
			for(var ilang in textualization.langs){
				var lang = textualization.langs[ilang];
				if(typeof value[lang] !== "undefined"){
					chain.add(function(lang){
						console.log('setting:',path.slice(1).concat([lang]).join('.'));
						field._validate(
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
			field._validate(value,cb,path);
		}
	};
	Field.prototype._validate = function(value,cb,context){
		var field = this;
		var validation = field.validate(value);
		if(validation.length>0){
			cb(null,validation);
		} else {
			field.setter(value,cb,context);
		}
	};
	Field.prototype.getter = function(value,cb){
		var field = this;
		cb(value);
	};
	Field.prototype.setter = function(value,cb){
		var field = this;
		cb(value);
	};
	Field.prototype.validate = function(value){
		var field = this;
		var result = [];
		for(var v in field.validations){
			if(!field.validations[v](value)){
				result.push(v);
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
		var result = new Group();
		var errors = new Group();
		var chain = new Chain();
		for(var fi in field.fields){
			if(typeof value[fi] !== "undefined"){
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
	Subset.prototype.setter = function(value,cb,path,context){
		var field = this;
		var value = value || {};
		var result = new Group();
		var errors = new Group();
		var chain = new Chain();
		for(var fi in field.fields){
			if(typeof value[fi] !== "undefined"){
				chain.add(function(fi){
					console.log('setting:',path.slice(1).concat([fi]).join('.'));
					field.fields[fi]._setter(
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

	Subset.prototype.addField = Fieldset.prototype.addField;
	Subset.prototype.removeField = Fieldset.prototype.removeField;
	Subset.prototype.getField = Fieldset.prototype.getField;







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
		var errors = new Group();
		var idref = [];
		var chain = new Chain();
		for(var di in value){
			if(typeof value[di] !== "undefined"){
				for(var fi in field.fields){
					if(typeof value[di][fi] !== "undefined"){
						chain.add(function(di,fi){
							console.log('getting:',path.slice(1).concat([di,fi]).join('.'));
							field.fields[fi]._getter(
								value[di][fi],
								function(value,error){
									if(error){
										if(!errors[di]){errors[di]= new Group();}
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
	List.prototype.setter = function(value,cb,path,context){
		var field = this;
		var value = value || {};
		var result = new Group();
		var errors = new Group();
		var parsed = {};
		for(var d in value){
			if(value[d] && value[d]._id){ // and is valid list_id format
				var _id = value[d]._id;
				parsed[_id] = value[d];
				parsed[_id]._order = d;
				delete parsed[_id]._id;
				result[_id] = new Group();
				result[_id]._order = d;
			}
		}
		value = parsed;
		var chain = new Chain();
		for(var di in value){
			if(typeof value[di] !== "undefined"){
				for(var fi in field.fields){
					if(typeof value[di][fi] !== "undefined"){
						chain.add(function(di,fi){
							console.log('setting:',path.slice(1).concat([di,fi]).join('.'));
							field.fields[fi]._setter(
								value[di][fi],
								function(value,error){
									if(error){
										var _order = data[di]._order;
										if(!errors[_order]){errors[_order]= new Group();}
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
	List.prototype.addField = Fieldset.prototype.addField;
	List.prototype.removeField = Fieldset.prototype.removeField;
	List.prototype.getField = Fieldset.prototype.getField;








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
	File.prototype.getter = function(data,cb,path){
		var field = this;
		cb(data);
	};
	File.prototype.setter = function(data,cb,path){
		var field = this;
		var file = {};
		if(data && data.path && data.size && data.name && data.type){
			var fieldset = field.fieldset;
			var udir = "files/"+fieldset.collection;
			var fdir = path[0];
			var fname = path.slice(1).join('.');
			fs.mkdir(udir+"/"+fdir, 0777, true,function(error){
				if(!error){
					fs.rename(data.path, udir+"/"+fdir+"/"+fname,function(error){
						if(!error){
							data.moved = true;
							file.size = parseInt(data.size || 0);
							file.name = (data.name || '').toString();
							file.type = (data.type || '').toString();
							file.lastmod = data.lastModifiedDate || (new Date());
							file.path = "/"+fieldset.collection+"/files/"+fdir+"/"+fname;
							cb(file);
						} else {
							cb(null,['database.files.norename']);
						}
					});
				} else {
					cb(null,['database.files.nodir']);
				}
			});
		} else {
			cb(null,['database.files.badformat']);
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
	field.validations = {
		"Opción no válida":function(value){
			if(Object.keys(field.values).indexOf(value)>=0){return true;}
		}
	};
}

module.exports.Checkbox = Checkbox;
Checkbox.prototype = new Field();
function Checkbox(id, config){
	var field = this;
	Field.call(field, id, config);
	field.template = 'checkbox';
}
	Checkbox.prototype.getter = function(data,cb){
		var field = this;
		var data = data || 0;
		if(data!=0){data='true';} else {data='false';}
		cb(data);
	};
	Checkbox.prototype.setter = function(data,cb){
		var field = this;
		var data = data || 0;
		if(data!=0){data=1;} else {data=0;}
		cb(data);
	};

module.exports.Checkboxes = Checkboxes;
Checkboxes.prototype = new Field();
function Checkboxes(id, config){
	var field = this;
	Field.call(field, id, config);
	field.template = 'checkboxes';
	field.values = config.values || {};
}
	Checkboxes.prototype.getter = function(data,cb){
		var field = this;
		var data = data || [];
		var checked = {};
		for(var i in data){checked[data[i]]='true';}
		cb(checked);
	};
	Checkboxes.prototype.setter = function(data,cb){
		var field = this;
		var data = data || {};
		var checked = [];
		for(var i in data){
			if(data[i] && Object.keys(field.values).indexOf(i)>=0 && checked.indexOf(i)<0){checked.push(i);}
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
	field.validations = {
		"Opción no válida":function(value){
			if(Object.keys(field.values).indexOf(value)>=0){return true;}
		}
	};
}

module.exports.Reverse = Reverse;
Reverse.prototype = new Field();
function Reverse(id, config){
	var field = this;
	Field.call(field, id, config);
	field.template = 'text';
	field.validations = {
		"Debe contener al menos 5 caracteres":function(value){
			if(value && value.length>=5){return true;}
		}
	};
}
	Reverse.prototype.getter = function(data,cb){
		var field = this;
		data = data.split("").slice().reverse().join("");
		cb(data);
	};
	Reverse.prototype.setter = function(data,cb){
		var field = this;
		data = data.split("").slice().reverse().join("");
		cb(data);
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
	Reference.prototype.getter = function(data,cb){
		var field = this;
		var fieldset = field.fieldset;
		var db = fieldset.server.database.collection(field.collection);
		var cols = {};
		for(var header in field.headers){cols[field.headers[header].id]=true;}
		if(data.length>0){
			db.find({_id:{$in:data}},cols).toArray(function(error, items) {
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
	Reference.prototype.setter = function(data,cb){
		var field = this;
		var list = [];

		data = data.toString().split(',');
		for(var id in data){
			if(/^[a-f0-9]{24}$/i.test(data[id])){list.push(new ObjectID.createFromHexString(data[id]));}
		}
		cb(list);
	};












function Group(){}

























Fieldset.prototype.count = function(gw,params,cb){
	var fieldset = this;
	var db = fieldset.server.database.collection(fieldset.collection);
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
				error : new Fail("database.error",error)
			});
		}
	});
};

Fieldset.prototype.list = function(gw,params,cb){
	var fieldset = this;
	var q = {};
	var skip = 0;
	var filter = false;
	var query = {};
	var limit = fieldset.limit;
	var range = false;
	var order = fieldset.order || 1;
	var sort = fieldset.sort || false;
	var qsort = {};
	if(params._order=="-1"){var order = -1;}
	if(typeof params._sort === 'string'){
		for(var header in fieldset.headers){
			if(fieldset.headers[header].id == params._sort){sort = params._sort;break;}
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
		for(i in fieldset.filter){
			var sentence = {};
			sentence[fieldset.filter[i]]=new RegExp(filter,"i");
			query.$or.push(sentence);
		}
	}

	var cols = {};
	for(var header in fieldset.headers){cols[fieldset.headers[header].id]=true;}

	var db = fieldset.server.database.collection(fieldset.collection);
	db.find(query,cols).sort(qsort).skip(skip).limit(limit).toArray(function(error, results) {
		if(error){
			cb({
				error : new Fail("database.error",error)
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

Fieldset.prototype.preview = function(_id,cb){
	var fieldset = this;
	var _id = _id || false;
	if(typeof _id === "string" && /^[a-f0-9]{24}$/i.test(_id)){_id = new ObjectID.createFromHexString(_id);}
	if(_id){
		var db = fieldset.server.database.collection(fieldset.collection);
		db.findOne({_id:_id},{_owner:1,_guests:1},function(error, result) {
			if(error || !result){
				cb(null);
			} else {
				cb(result);
			}
		});
	} else {
		cb(null);
	}
}

Fieldset.prototype.one = function(gw,params,cb){
	var fieldset = this;
	var _id = params._id || false;
	if(/^[a-f0-9]{24}$/i.test(_id)){_id = new ObjectID.createFromHexString(_id);}
	if(_id){
		var db = fieldset.server.database.collection(fieldset.collection);
		db.findOne({_id:_id},function(error, result) {
			if(error){
				cb({
					error : new Fail("database.error",error)
				});
			} else if(!result) {
				cb({
					error : new Alert("database.noexist")
				});
			} else {
				console.time("getter");
				var credentials = {
					keys:gw.keys,
					owner:(result._owner==gw.user._id),
					guest:(Array.isArray(result._guests) && result._guests.indexOf(gw.user._id)>=0)
				};
				fieldset.getter(result,credentials,function(getted,errors){
					console.timeEnd("getter");
					if(errors){
						cb({
							error : new Fail("database.getterfail"),
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
			error : new Fail("database.badparams")
		});
	}
};
Fieldset.prototype.update = function(gw,params,cb){
	var fieldset = this;
	var _id = params._id || false;
	if(/^[a-f0-9]{24}$/i.test(_id)){_id = new ObjectID.createFromHexString(_id);}
	var doc = params['data'] || false;
	var unset = params['unset'] || [];
	if(_id && doc){
		fieldset.preview(_id,function(preview){
			if(preview){
				var credentials = {
					keys:gw.keys,
					owner:(preview._owner==gw.user._id),
					guest:(Array.isArray(preview._guests) && preview._guests.indexOf(gw.user._id)>=0)
				};
				doc._id = _id;
				fieldset.setter(doc,credentials,function(setted,errors){
					if(errors){
						cb({
							error : new Fail("database.setterfail"),
							ads : errors
						});
					} else {
						var update = {};
						update.$set = fieldset.treeSet(setted);
						if(Array.isArray(unset)){
							update.$unset = {};
							for(var i in unset){update.$unset[unset[i]]=1;}
						}
						
						var db = fieldset.server.database.collection(fieldset.collection);
						db.update({_id:_id},update,function(error, result) {
							if(error){
								cb({
									error : new Fail("database.error",error)
								});
							} else if(result==0) {
								cb({
									error : new Alert("database.noexist")
								});
							} else {
								fieldset.one(gw,params,cb);
							}
						});
					}
				});
			} else {
				cb({
					error : new Alert("database.noexist")
				});
			}
		});
	} else {
		cb({
			error : new Fail("database.badparams")
		});
	}
};
Fieldset.prototype.insert = function(gw,params,cb){
	var fieldset = this;
	var doc = params['data'] || false;
	if(doc){
		var _id = new ObjectID();
		var credentials = {
			keys:gw.keys,
			owner:true,
			guest:false
		};
		doc._id = _id;
		fieldset.setter(doc,credentials,function(setted,errors){
			if(errors){
				cb({
					error : new Fail("database.setterfail"),
					ads : errors
				});
			} else {
				setted._id = _id;
				var db = fieldset.server.database.collection(fieldset.collection);
				db.insert(setted,function(error, result) {
					if(error){
						cb({
							error : new Fail("database.error",error)
						});
					} else if(!result[0] || !result[0]._id) {
						cb({
							error : new Alert("database.noinserted")
						});
					} else {
						params._id = result[0]._id.toString();
						fieldset.one(gw,params,cb);
					}
				});
			}
		});
	} else {
		cb({
			error : new Fail("database.badparams")
		});
	}
};
Fieldset.prototype.remove = function(gw,params,cb){
	var fieldset = this;
	var _id = params._id || false;
	if(/^[a-f0-9]{24}$/i.test(_id)){_id = new ObjectID.createFromHexString(_id);}
	if(_id){
		var db = fieldset.server.database.collection(fieldset.collection);
		db.remove({_id:_id},function(error, result) {
			if(error){
				cb({
					error : new Fail("database.error",error)
				});
			} else if(result==0) {
				cb({
					error : new Alert("database.noremoved")
				});
			} else {
				cb({error:false});
			}
		});
	} else {
		cb({
			error : new Fail("database.badparams")
		});
	}
};


function Fail(msg,details){
	this.lvl = 'danger';
	this.msg = msg;
	this.details = details || "";
}

function Alert(msg,details){
	this.lvl = 'warning';
	this.msg = msg;
	this.details = details || "";
}

function Info(msg,details){
	this.lvl = 'info';
	this.msg = msg;
	this.details = details || "";
}

function Ok(msg,details){
	this.lvl = 'success';
	this.msg = msg;
	this.details = details || "";
}

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