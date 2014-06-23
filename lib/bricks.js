
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
	//fieldset.need = config.need || {};

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
	
	Fieldset.prototype.getter = function(path,data,cb){
		var fieldset = this;
		var data = data || {};
		var result = new Group();
		var errors = new Group();
		var handler = function(id,value,error){
			if(error){
				errors[id]=error;
			} else {
				result[id]=value;
			}
		}
		var end = function(){
			if(Object.keys(errors).length>0){
				function treeset(path,obj,result){
					for(var i in obj){
						if(obj[i] instanceof Group){
							treeset(path.concat([i]),obj[i],result);
						} else {
							result[path.concat([i]).join('.')]=obj[i];
						}
					}
				}
				var errorsparsed = {};
				treeset([],errors,errorsparsed);
				cb(null,errorsparsed);
			} else {
				cb(result);
			}
		}
		FieldWalker(path,fieldset.fields,'_getter',data,handler,end);
	};
	Fieldset.prototype.setter = function(path,data,cb){
		var fieldset = this;
		var data = data || {};
		var result = new Group();
		var errors = new Group();
		var handler = function(id,value,error){
			if(error){
				errors[id]=error;
			} else {
				if(typeof value !== "undefined"){
					result[id]=value;
				}
			}
		}
		var end = function(){
			if(Object.keys(errors).length>0){
				function treeset(path,obj,result){
					for(var i in obj){
						if(obj[i] instanceof Group){
							result[path.concat([i]).join('.')]=true;
							treeset(path.concat([i]),obj[i],result);
						} else {
							result[path.concat([i]).join('.')]=obj[i];
						}
					}
				}
				var errorsparsed = {};
				treeset([],errors,errorsparsed);
				cb(null,errorsparsed);
			} else {
				cb(result);
			}
		}
		FieldWalker(path,fieldset.fields,'_setter',data,handler,end);
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

	Fieldset.prototype.count = function(gw,cb){
		var fieldset = this;
		var db = gw.server.database.collection(fieldset.collection);
		db.count({},function(error, count) {
			if(!error){
				cb(count);
			} else {
				gw.msgs.push(new Fail("database.error",error));
				cb(false);
			}
		});
	};

	Fieldset.prototype.list = function(gw,cb){
		var fieldset = this;
		var db = gw.server.database.collection(fieldset.collection);

		var q = {};
		var skip = 0;
		var filter = false;
		var query = {};
		var limit = fieldset.limit;
		var range = false;
		var order = fieldset.order || 1;
		var sort = fieldset.sort || false;
		var qsort = {};
		if(gw.params._order=="-1"){var order = -1;}
		if(typeof gw.params._sort === 'string'){
			for(var header in fieldset.headers){
				if(fieldset.headers[header].id == gw.params._sort){sort = gw.params._sort;break;}
			}
		}
		if(typeof gw.params._skip === 'string' && parseInt(gw.params._skip)==gw.params._skip){skip = parseInt(gw.params._skip);}
		if(sort){
			qsort[sort] = order;
			if(typeof gw.params._range === 'string'){
				range = gw.params._range;
				q[sort]=order>0?{$gt:range}:{$lt:range};
			}
		}
		if(typeof gw.params._filter === 'string' && gw.params._filter!=""){
			filter = gw.params._filter;
			query.$or = [];
			for(i in fieldset.filter){
				var sentence = {};
				sentence[fieldset.filter[i]]=new RegExp(filter,"i");
				query.$or.push(sentence);
			}
		}

		var cols = {};
		for(var header in fieldset.headers){cols[fieldset.headers[header].id]=true;}

		db.find(query,cols).sort(qsort).skip(skip).limit(limit).toArray(function(error, results) {
			if(error){
				gw.msgs.push(new Fail("database.error",error));
				cb(false);
			} else {
				cb({
					list:results,
					order:order,
					sort:sort,
					range:range,
					skip:skip,
					limit:limit
				});
			}
		});
	};
	Fieldset.prototype.one = function(gw,cb){
		var fieldset = this;
		var db = gw.server.database.collection(fieldset.collection);
		var _id = gw.params._id || false;
		if(/^[a-f0-9]{24}$/i.test(_id)){_id = new ObjectID.createFromHexString(_id);}
		if(_id){
			db.findOne({_id:_id},function(error, result) {
				if(error){
					gw.msgs.push(new Fail("database.error",error));
					cb(false);
				} else if(!result) {
					gw.msgs.push(new Alert("database.noexist"));
					cb(false);
				} else {
					fieldset.getter([_id],result,function(getted,errors){
						if(errors){
							gw.validations = errors;
							gw.msgs.push(new Fail("database.getterfail"));
							cb(false);
						} else {
							getted._id = _id;
							cb(getted);
						}
					});
				}
			});
		} else {
			gw.msgs.push(new Fail("database.badparams"));
			cb(false);
		}
	};
	Fieldset.prototype.update = function(gw,cb){
		var fieldset = this;
		var db = gw.server.database.collection(fieldset.collection);
		var _id = gw.params._id || false;
		if(/^[a-f0-9]{24}$/i.test(_id)){_id = new ObjectID.createFromHexString(_id);}
		var doc = gw.params['data'] || false;
		var unset = gw.params['unset'] || false;
		if(_id && doc){
			doc._id = _id;
			fieldset.setter([_id],doc,function(setted,errors){
				if(errors){
					gw.validations = errors;
					gw.msgs.push(new Fail("database.setterfail"));
					cb(false);
				} else {
					function treeset(path,obj,result){
						for(var i in obj){
							if(obj[i] instanceof Group){
								treeset(path.concat([i]),obj[i],result);
							} else {
								result[path.concat([i]).join('.')]=obj[i];
							}
						}
					}
					var setparsed = {};
					treeset([],setted,setparsed);
					
					var unseted = {};
					for(var i in unset){
						unseted[unset[i]]=1;
					}

					db.update({_id:_id},{$set:setparsed,$unset:unseted},function(error, result) {
						if(error){
							gw.msgs.push(new Fail("database.error",error));
							cb(false);
						} else if(result==0) {
							gw.msgs.push(new Alert("database.noexist"));
							cb(false);
						} else {
							gw.msgs.push(new Ok("database.updated"));
							cb(true);
						}
					});
				}
			});
		} else {
			gw.msgs.push(new Fail("database.badparams"));
			cb(false);
		}
	};
	Fieldset.prototype.insert = function(gw,cb){
		var fieldset = this;
		var db = gw.server.database.collection(fieldset.collection);
		var doc = gw.params['data'] || false;
		if(doc){
			fieldset.setter(gw,doc,function(setted){
				if(!setted){
					gw.msgs.push(new Fail("database.setterfail"));
					cb(false);
				} else {
					db.insert(setted.tree,function(error, result) {
						if(error){
							gw.msgs.push(new Fail("database.error",error));
							cb(false);
						} else if(!result[0]) {
							gw.msgs.push(new Alert("database.noinserted"));
							cb(false);
						} else {
							gw.msgs.push(new Ok("database.inserted",error));
							cb(result[0]._id);
						}
					});
				}
			});
		} else {
			gw.msgs.push(new Fail("database.badparams"));
			cb(false);
		}
	};
	Fieldset.prototype.remove = function(gw,cb,cberror){
		var fieldset = this;
		var db = gw.server.database.collection(fieldset.collection);
		var _id = gw.params._id || false;
		if(/^[a-f0-9]{24}$/i.test(_id)){_id = new ObjectID.createFromHexString(_id);}
		if(_id){
			db.remove({_id:_id},function(error, result) {
				if(error){
					gw.msgs.push(new Fail("database.error",error));
					cb(false);
				} else if(result==0) {
					gw.msgs.push(new Alert("database.noremoved",error));
					cb(false);
				} else {
					gw.msgs.push(new Ok("database.removed",error));
					cb(true);
				}
			});
		} else {
			gw.msgs.push(new Fail("database.badparams"));
			cb(false);
		}
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

	field.empty = "";
	field.label = config.label || '';
	field.details = config.details || '';
	field.template = config.template || '';
	field.validations = config.validations || [];
	field.i18n = config.i18n || false;
	//field.need = config.need || {};
}
	Field.prototype._getter = function(path,data,cb){
		var field = this;
		//console.log("getter:"+path.join('.'),data,"\n");
		if(field.i18n){
			var errors = new Group();
			var result = {};
			var handler = function(i,value,error){
				if(error){
					errors[i]=error;
				} else {
					result[i]=value;
				}
			}
			var end = function(){
				if(Object.keys(errors).length>0){
					cb(null,errors);
				} else {
					cb(result);
				}
			}
			LangWalker(path,field,'getter',data,handler,end)
		} else {
			field.getter(path,data,cb);
		}
	};
	Field.prototype._setter = function(path,data,cb){
		var field = this;
		//console.log("setter:"+path.join('.'),data,"\n");
		if(field.i18n){
			var errors = new Group();
			var result = new Group();
			var handler = function(i,value,error){
				if(error){
					errors[i]=error;
				} else {
					if(typeof value !== "undefined"){
						result[i]=value;
					}
				}
			}
			var end = function(){
				if(Object.keys(errors).length>0){
					cb(null,errors);
				} else {
					cb(result);
				}
			}
			LangWalker(path,field,'_validate',data,handler,end)
		} else {
			field._validate(path,data,cb);
		}
	};
	Field.prototype._validate = function(path,data,cb){
		var field = this;
		var validation = field.validate(data);
		if(validation.length>0){
			cb(null,validation);
		} else {
			field.setter(path,data,cb);
		}
	};
	Field.prototype.getter = function(path,data,cb){
		var field = this;
		var data = data || field.empty;
		cb(data);
		//cb(null,'uiuiui!');
	};
	Field.prototype.setter = function(path,data,cb){
		var field = this;
		var data = data;
		cb(data);
		//cb(null,['uiuiui!']);
	};
	Field.prototype.validate = function(data){
		var field = this;
		var data = data;
		var result = [];
		for(var v in field.validations){
			if(!field.validations[v](data)){
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
	Subset.prototype.getter = function(path,data,cb){
		var field = this;
		var data = data || {};
		var result = new Group();
		var errors = new Group();
		var handler = function(id,value,error){
			if(error){
				errors[id]=error;
			} else {
				result[id]=value;
			}
		}
		var end = function(){
			if(Object.keys(errors).length>0){
				cb(null,errors);
			} else {
				cb(result);
			}
		}
		FieldWalker(path,field.fields,'_getter',data,handler,end);
	};
	Subset.prototype.setter = function(path,data,cb){
		var field = this;
		var data = data || {};
		var result = new Group();
		var errors = new Group();
		var handler = function(id,value,error){
			if(error){
				errors[id]=error;
			} else {
				if(typeof value !== "undefined"){
					result[id]=value;
				}
			}
		}
		var end = function(){
			if(Object.keys(errors).length>0){
				cb(null,errors);
			} else {
				cb(result);
			}
		}
		FieldWalker(path,field.fields,'_setter',data,handler,end);
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
	field.items = config.items || {};
	field.items.label = field.items.label || '';
	field.items.details = field.items.details || '';
	field.insert = config.insert || {};
	field.insert.label = field.insert.label || '';
	field.insert.details = field.insert.details || '';
	field.radio = field.radio || false;
	field.check = field.check || false;
	Object.defineProperty(field,"tree",{
		enumerable : true, configurable : true,
		get : function(){return field.parent?field.parent.tree.concat([id+'[]']):undefined;}
	});
}



	List.prototype.getter = function(path,data,cb){
		var field = this;
		var data = data || {};
		var result = [];
		var errors = new Group();
		var idref = [];
		var handler = function(i,id,value,error){
			if(error){
				if(!errors[i]){errors[i]= new Group();}
				errors[i][id]=error;
			} else {
				if(idref.indexOf(i)<0){idref.push(i);}
				var k = idref.indexOf(i);
				var _order = data[i]._order || 0;
				if(!result[k]){result[k]={_id:i,_order:_order};}
				result[k][id]=value;
			}
		}
		var end = function(){
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
		}
		DataWalker(path,field.fields,'_getter',data,handler,end);
	}

	List.prototype.setter = function(path,data,cb){
		var field = this;
		var data = data || {};
		var result = new Group();
		var errors = new Group();

		var parsed = {};
		for(var d in data){
			if(data[d] && data[d]._id){ // and is valid list_id format
				var _id = data[d]._id;
				parsed[_id] = data[d];
				parsed[_id]._order = d;
				delete parsed[_id]._id;
				result[_id] = new Group();
				result[_id]._order = d;
			}
		}
		data = parsed;

		var handler = function(i,id,value,error){
			if(error){
				var _order = data[i]._order;
				if(!errors[_order]){errors[_order]= new Group();}
				errors[_order][id]=error;
			} else {
				if(typeof value !== "undefined"){
					result[i][id]=value;
				}
			}
		}
		var end = function(){
			if(Object.keys(errors).length>0){
				cb(null,errors);
			} else {
				cb(result);
			}
		}
		DataWalker(path,field.fields,'_setter',data,handler,end);
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
	File.prototype.getter = function(path,data,cb){
		var field = this;
		var data = data || field.empty;
		cb(data);
	};
	File.prototype.setter = function(path,data,cb){
		var field = this;
		var data = data;
		var file = {};
		if(data && data.path){
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
							file.path = fdir+"/"+fname;
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
			cb(undefined);
		}
	};

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
	field.empty = 0;
	field.template = 'checkbox';
}
	Checkbox.prototype.getter = function(path,data,cb){
		var field = this;
		var data = data || field.empty;
		if(data!=0){data='true';} else {data='false';}
		cb(data);
	};
	Checkbox.prototype.setter = function(path,data,cb){
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
	field.empty = [];
	field.template = 'checkboxes';
	field.values = config.values || {};
}
	Checkboxes.prototype.getter = function(path,data,cb){
		var field = this;
		var data = data || field.empty;
		var checked = {};
		for(var i in data){checked[data[i]]='true';}
		cb(checked);
	};
	Checkboxes.prototype.setter = function(path,data,cb){
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
	field.empty = 0;
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
	Reverse.prototype.getter = function(path,data,cb){
		var field = this;
		var data = data || field.empty;
		data = data.split("").slice().reverse().join("");
		cb(data);
	};
	Reverse.prototype.setter = function(path,data,cb){
		var field = this;
		var data = data || field.empty;
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
	field.template = 'reference';
}
	Reference.prototype.getter = function(path,data,cb){
		var field = this;
		var data = data || field.empty;
		var fieldset = field.fieldset;
		var db = fieldset.server.database.collection(fieldset.collection);
		var cols = {};
		for(var header in fieldset.headers){cols[fieldset.headers[header].id]=true;}
		if(data){
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
	Reference.prototype.setter = function(path,data,cb){
		var field = this;
		var data = data || field.empty;
		var list = [];
		if(data){
			data = data.toString().split(',');
			for(var id in data){
				if(/^[a-f0-9]{24}$/i.test(data[id])){list.push(new ObjectID.createFromHexString(data[id]));}
			}
			cb(list);
		} else {
			cb(undefined);
		}
	};






function FieldWalker(path,fields,method,data,handler,end){
	var data = data || {};
	var worklist = Object.keys(fields);
	function nextfactory(ipath){
		var id = ipath[ipath.length-1];
		return function(value,error){
			handler(id,value,error,ipath);
			launcher();
		};
	}
	function launcher(){
		if(worklist.length>0){
			var id = worklist.shift();
			var ipath = path.concat([id]);
			fields[id][method](ipath,data[id],nextfactory(ipath));
		} else {
			end();
		}
	}
	launcher();
}

function DataWalker(path,fields,method,data,handler,end){
	var data = data || {};
	var worklist = [];
	for(var i in data){
		worklist.push({i:i,fields:Object.keys(fields)});
	}
	function nextfactory(ipath){
		var i = ipath[ipath.length-2];
		var id = ipath[ipath.length-1];
		return function(value,error){
			handler(i,id,value,error,ipath);
			launcher();
		};
	}
	function launcher(){
		if(worklist.length>0 && worklist[0].fields.length==0){worklist.shift();}
		if(worklist.length>0){
			var task = worklist[0];
			var i = task.i;
			var id = task.fields.shift();
			var ipath = path.concat([i,id]);
			if(!data[i]){data[i]={};}
			fields[id][method](ipath,data[i][id],nextfactory(ipath));
		} else {
			end();
		}
	}
	launcher();
}

function LangWalker(path,field,method,data,handler,end){
	var data = data || {};
	var worklist = textualization.langs.slice();
	function nextfactory(ipath){
		var lang = ipath[ipath.length-1];
		return function(value,error){
			handler(lang,value,error,ipath);
			launcher();
		};
	}
	function launcher(){
		if(worklist.length>0){
			var lang = worklist.shift();
			var ipath = path.concat([lang]);
			field[method](ipath,data[lang],nextfactory(ipath));
		} else {
			end();
		}
	}
	launcher();
}

function Group(){}

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