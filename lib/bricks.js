
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
	/*
	Fieldset.prototype.validate = function(data,path){
		if(!path){path=['data'];}
		var fieldset = this;
		var data = data || {};
		var result = [];
		for(var fieldid in fieldset.fields){
			result = result.concat(fieldset.fields[fieldid].validate(data[fieldid],path.concat([fieldid])));
		}
		return result;
	};
	*/
	Fieldset.prototype.getter = function(gw,data,cb){
		var fieldset = this;
		var data = data || {};
		var tasks = 1;
		var result = {};
		var error = false;
		function checktask(ok){
			if(!ok){error=true;}
			tasks--;if(tasks==0){cb(error?false:result);}
		}
		for(var fieldid in fieldset.fields){
			tasks++;
			fieldset.fields[fieldid].getter(gw,data,[fieldid],result,checktask);
		}
		checktask(true);
	};
	Fieldset.prototype.setter = function(gw,data,cb){
		var fieldset = this;
		var data = data || {};
		var tasks = 1;
		var result = {tree:{},set:{},unset:{}};
		var error = false;
		function checktask(ok){
			if(!ok){error=true;}
			tasks--;if(tasks==0){cb(error?false:result);}
		}
		for(var fieldid in fieldset.fields){
			if(fieldset.fields[fieldid].i18n){
				for(var l in textualization.langs){
					if(!fieldset.fields[fieldid].validate(gw,data,[fieldid,textualization.langs[l]])){
						var error = true;
					}
				}
			} else if(!fieldset.fields[fieldid].validate(gw,data,[fieldid])){
				var error = true;
			}
		}
		if(!error){
			for(var fieldid in fieldset.fields){
				if(fieldset.fields[fieldid].i18n){
					for(var l in textualization.langs){
						tasks++;
						fieldset.fields[fieldid].setter(gw,data,[fieldid,textualization.langs[l]],result,checktask);
					}
				} else {
					tasks++;
					fieldset.fields[fieldid].setter(gw,data,[fieldid],result,checktask);
				}
			}
		}
		checktask(true);
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
					fieldset.getter(gw,result,function(getted){
						if(!getted){
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
		if(_id && doc){
			doc._id = _id;
			fieldset.setter(gw,doc,function(setted){
				if(!setted){
					gw.msgs.push(new Fail("database.setterfail"));
					cb(false);
				} else {
					console.log(setted);
					db.update({_id:_id},{$set:setted.set,$unset:setted.unset},function(error, result) {
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
	Field.prototype.getter = function(gw,_data,path,result,ok){
		var field = this;
		var data = pathData(_data,path) || field.empty;
		setTimeout(function(){
			pathDataValue(result,path,data);
			ok(true);
		},100);
	};
	Field.prototype.setter = function(gw,_data,path,result,ok){
		var field = this;
		var data = pathData(_data,path) || field.empty;
		setTimeout(function(){
			pathDataValue(result.tree,path,data);
			result.set[path.join('.')]=data;
			ok(true);
		},100);
	};
	Field.prototype.validate = function(gw,_data,path){
		var field = this;
		var data = pathData(_data,path) || field.empty;
		var valid = true;
		for(var v in field.validations){
			if(!field.validations[v](data)){
				valid = false;
				if(gw.validations['data.'+path.join('.')]){
					gw.validations['data.'+path.join('.')].push([gw.t12n(msg)]);
				} else {
					gw.validations['data.'+path.join('.')]=[gw.t12n(v)];
				}
			}
		}
		return valid;
	};







/*
module.exports.Subset = Subset;
Subset.prototype = new Field();
function Subset(id, config){
	var field = this;
	Field.call(field, id, config);
	field.template = 'subset';
	field.fields = {};
}
	Subset.prototype.validate = Fieldset.prototype.validate;
	Subset.prototype.getter = Fieldset.prototype.getter;
	Subset.prototype.setter = Fieldset.prototype.setter;
	Subset.prototype.addField = Fieldset.prototype.addField;
	Subset.prototype.removeField = Fieldset.prototype.removeField;
	Subset.prototype.getField = Fieldset.prototype.getField;
*/







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
	List.prototype.getter = function(gw,_data,path,result,cb){
		var field = this;
		var data = pathData(_data,path) || {};
		var tasks = 1;
		var error = false;
		function checktask(ok){
			if(!ok){error=true;}
			tasks--;if(tasks==0){cb(!error);}
		}
		for(var d in data){
			if(data[d]){
				for(var fieldid in field.fields){
					tasks++;
					field.fields[fieldid].getter(gw,_data,path.concat([d,fieldid]),result,checktask);
				}
			}
		}
		checktask(true);
	};
	List.prototype.setter = function(gw,_data,path,result,cb){
		var field = this;
		var data = pathData(_data,path) || {};
		var tasks = 1;
		var error = false;
		function checktask(ok){
			if(!ok){error=true;}
			tasks--;if(tasks==0){cb(!error);}
		}
		for(var d in data){
			if(data[d]!=="unset"){
				for(var fieldid in field.fields){
					if(field.fields[fieldid].i18n){
						for(var l in textualization.langs){
							if(!field.fields[fieldid].validate(gw,_data,path.concat([d,fieldid,textualization.langs[l]]))){
								var error = true;
							}
						}
					} else if(!field.fields[fieldid].validate(gw,_data,path.concat([d,fieldid]))){
						var error = true;
					}
				}
			}
		}
		if(!error){
			for(var d in data){
				if(data[d]!="unset"){
					for(var fieldid in field.fields){
						if(field.fields[fieldid].i18n){
							for(var l in textualization.langs){
								tasks++;
								field.fields[fieldid].setter(gw,_data,path.concat([d,fieldid,textualization.langs[l]]),result,checktask);
							}
						} else {
							tasks++;
							field.fields[fieldid].setter(gw,_data,path.concat([d,fieldid]),result,checktask);
						}
					}
				} else {
					result.unset[path.concat([d]).join('.')]='';
				}
			}
		}
		checktask(true);
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

module.exports.File = File;
File.prototype = new Field();
function File(id, config){
	var field = this;
	Field.call(field, id, config);
	field.template = 'file';
}
	File.prototype.getter = function(gw,_data,path,result,ok){
		var field = this;
		var data = pathData(_data,path) || field.empty;
		pathDataValue(result,path,data);
		ok(true);
	};
	File.prototype.setter = function(gw,_data,path,result,ok){
		var field = this;
		var data = pathData(_data,path) || field.empty;
		var file = {};
		if(data.path){
			var fieldset = field.fieldset;
			var fdir = "uploads/"+fieldset.collection+"/"+_data._id;
			var fname = path.join('.')+'.'+data.name;
			fs.mkdir(fdir, 0777, true,function(error){
				if(!error){
					fs.rename(data.path, fdir+"/"+fname,function(error){
						if(!error){
							data.moved = true;
							file.size = parseInt(data.size || 0);
							file.name = (data.name || '').toString();
							file.type = (data.type || '').toString();
							file.lastmod = data.lastModifiedDate || (new Date());
							file.path = fdir+"/"+fname;
							gw.msgs.push(new Ok("database.files.ok"));
							pathDataValue(result.tree,path,file);
							result.set[path.join('.')]=file;
							ok(true);
						} else {
							var msg = "database.files.norename";
							if(gw.validations['data.'+path.join('.')]){
								gw.validations['data.'+path.join('.')].push([gw.t12n(msg)]);
							} else {
								gw.validations['data.'+path.join('.')]=[gw.t12n(msg)];
							}
							ok(false);
						}
					});
				} else {
					var msg = "database.files.nodir";
					if(gw.validations['data.'+path.join('.')]){
						gw.validations['data.'+path.join('.')].push([gw.t12n(msg)]);
					} else {
						gw.validations['data.'+path.join('.')]=[gw.t12n(msg)];
					}
					ok(false);
				}
			});
		} else {
			ok(true);
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
	Checkbox.prototype.getter = function(gw,_data,path,result,ok){
		var field = this;
		var data = pathData(_data,path) || field.empty;
		if(data!=0){data='true';} else {data='false';}
		pathDataValue(result,path,data);
		ok(true);
	};
	Checkbox.prototype.setter = function(gw,_data,path,result,ok){
		var field = this;
		var data = pathData(_data,path) || 0;
		if(data!=0){data=1;} else {data=0;}
		pathDataValue(result.tree,path,data);
		result.set[path.join('.')]=data;
		ok(true);
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
	Checkboxes.prototype.getter = function(gw,_data,path,result,ok){
		var field = this;
		var data = pathData(_data,path) || field.empty;
		var checked = {};
		for(var i in data){
			checked[data[i]]='true';
		}
		pathDataValue(result,path,checked);
		ok(true);
	};
	Checkboxes.prototype.setter = function(gw,_data,path,result,ok){
		var field = this;
		var data = pathData(_data,path) || {};
		var checked = [];
		for(var i in data){
			if(data[i] && Object.keys(field.values).indexOf(i)>=0 && checked.indexOf(i)<0){checked.push(i);}
		}
		pathDataValue(result.tree,path,checked);
		result.set[path.join('.')]=checked;
		ok(true);
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
	Reverse.prototype.getter = function(gw,_data,path,result,ok){
		var field = this;
		var data = pathData(_data,path) || field.empty;
		data = data.split("").slice().reverse().join("");
		pathDataValue(result,path,data);
		ok(true);
	};
	Reverse.prototype.setter = function(gw,_data,path,result,ok){
		var field = this;
		var data = pathData(_data,path) || field.empty;
		data = data.split("").slice().reverse().join("");
		pathDataValue(result.tree,path,data);
		result.set[path.join('.')]=data;
		ok(true);
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
	Reference.prototype.getter = function(gw,_data,path,result,ok){
		var field = this;
		var data = pathData(_data,path) || field.empty;
		var fieldset = field.fieldset;
		var db = gw.server.database.collection(fieldset.collection);
		var cols = {};
		for(var header in fieldset.headers){cols[fieldset.headers[header].id]=true;}
		if(data){
			console.log(data);
			db.find({_id:{$in:data}},cols).toArray(function(error, items) {
				if(error){
					gw.msgs.push(new Fail("database.error",error));
					ok(false);
				} else {
					var list = {};
					for(var item in items){
						list[items[item]._id]=items[item];
					}
					pathDataValue(result,path,list);
					ok(true);
				}
			});
		} else {
			pathDataValue(result,path,[]);
			ok(true);
		}
	};
	Reference.prototype.setter = function(gw,_data,path,result,ok){
		var field = this;
		var data = pathData(_data,path) || field.empty;
		var list = [];
		if(data){
			data = data.toString().split(',');
			for(var id in data){
				console.log(data[id]);
				if(/^[a-f0-9]{24}$/i.test(data[id])){list.push(new ObjectID.createFromHexString(data[id]));}
			}
			pathDataValue(result.tree,path,list);
			result.set[path.join('.')]=list;
			ok(true);
		} else {
			ok(true);
		}
	};







function pathData(data,path){
	var search = data;
	var path = path.slice();
	while(path.length>0){
		if(search[path[0]]){
			search = search[path[0]];
		} else {
			return undefined;
		}
		path.shift();
	}
	return search;
}

function pathDataValue(data,path,value){
	var search = data || {};
	var path = path.slice();
	var past = [];
	while(path.length>1){
		var position = path[0].toString();
		if(!search[position]){
			search[position]={};
		} else {
		}
		search = search[position];
		past.push(path.shift());
	}
	search[path[0].toString()]=value;
	return data;
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