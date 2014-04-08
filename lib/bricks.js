
var textualization = require('./textualization')

module.exports.Fieldset = Fieldset;
function Fieldset(id,config){
	var fieldset = this;
	var config = config || {};
	fieldset.id = id;
	fieldset.title = config.title || '';
	fieldset.details = config.details || '';
	fieldset.collection = config.collection || false;
	fieldset.headers = config.headers || [];
	fieldset.template = config.template || 'fieldset';
	fieldset.fields = {};
	//fieldset.need = config.need || {};
}
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
	Fieldset.prototype.getter = function(data){
		var fieldset = this;
		var data = data || {};
		var result = {};
		for(var fieldid in fieldset.fields){
			result[fieldid] = fieldset.fields[fieldid].getter(data[fieldid]);
		}
		return result;
	};
	Fieldset.prototype.setter = function(data){
		var fieldset = this;
		var data = data || {};
		var result = {};
		for(var fieldid in fieldset.fields){
			result[fieldid] = fieldset.fields[fieldid].setter(data[fieldid]);
		}
		return result;
	};
	Fieldset.prototype.addField = function(field){
		var fieldset = this;
		field.fieldset = fieldset;
		return fieldset;
	};
	Fieldset.prototype.removeField = function(fieldid){
		var fieldset = this;
		if(fieldset.fields[fieldid]){fieldset.fields[fieldid].fieldset=false;}
		return fieldset;
	};
	Fieldset.prototype.getField = function(fieldid){
		var fieldset = this;
		if(fieldset.fields[fieldid]){return fieldset.fields[fieldid];}
		return false;
	};

	Fieldset.prototype.list = function(gw,cb){
		var fieldset = this;
		var cols = {};
		for(var header in fieldset.headers){cols[fieldset.headers[header].id]=true;}
		var db = gw.server.database.collection(fieldset.collection);
		db.find({},cols).toArray(function(error, results) {
			if(error){
				gw.msgs.push(new Fail("database.error",error));
				cb(false);
			} else {
				cb(results);
			}
		});
	};
	Fieldset.prototype.one = function(gw,cb){
		var fieldset = this;
		var db = gw.server.database.collection(fieldset.collection);
		var _id = gw.params._id || false;
		if(_id){
			db.findOne({_id:_id},function(error, result) {
				if(error){
					gw.msgs.push(new Fail("database.error",error));
					cb(false);
				} else if(!result) {
					gw.msgs.push(new Alert("database.noexist"));
					cb(false);
				} else {
					var doc = fieldset.getter(result);
					doc._id = _id;
					cb(doc);
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
		var doc = gw.params['data'] || false;
		if(_id && doc){
			doc._id = gw.params._id;
			var validation = fieldset.validate(doc);
			if(validation.length>0){
				gw.validations = parseValidations(validation);
				gw.msgs.push(new Alert("validation.errors"));
				cb(doc);
			} else {
				db.update({_id:_id},fieldset.setter(doc),function(error, result) {
					if(error){
						gw.msgs.push(new Fail("database.error",error));
						cb(doc);
					} else if(result==0) {
						gw.msgs.push(new Alert("database.noexist"));
						cb(doc);
					} else {
						gw.msgs.push(new Ok("database.updated",error));
						fieldset.one(gw,cb);
					}
				});
			}
		} else if(_id){
			fieldset.one(gw,cb);
		} else {
			gw.msgs.push(new Fail("database.badparams"));
			cb(false);
		}
	};
	Fieldset.prototype.insert = function(gw,cb){
		var fieldset = this;
		var db = gw.server.database.collection(fieldset.collection);
		var doc = gw.params['data'] || false;
		if(!doc){
			cb({});
		} else {
			var validation = fieldset.validate(doc);
			if(validation.length>0){
				gw.validations = parseValidations(validation);
				gw.msgs.push(new Alert("validation.errors"));
				cb(doc);
			} else {
				db.insert(fieldset.setter(doc),function(error, result) {
					if(error){
						gw.msgs.push(new Fail("database.error",error));
						cb(doc);
					} else if(!result[0]) {
						gw.msgs.push(new Alert("database.noinserted"));
						cb(doc);
					} else {
						gw.msgs.push(new Ok("database.inserted",error));
						cb(result[0]);
					}
				});
			}
		}
	};
	Fieldset.prototype.remove = function(gw,cb,cberror){
		var fieldset = this;
		var db = gw.server.database.collection(fieldset.collection);
		var _id = gw.params._id || false;
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

	var id = id;
	Object.defineProperty(field,"id",{
		enumerable : true,
		get : function(){return id;},
		set : function(set){
			if(fieldset){
				fieldset.removeField(id);
				id = set;
				fieldset.addField(field);
			} else {
				id = set;
			}
		}
	});

	var fieldset = false;
	Object.defineProperty(field,"fieldset",{
		enumerable : true,
		get : function(){return fieldset;},
		set : function(set){
			if(!set){
				if(fieldset && fieldset.fields[id]){delete fieldset.fields[id];}
				fieldset = false;
			} else {
				fieldset = set;
				fieldset.fields[id] = field;
			}
		}
	});

	field.label = config.label || '';
	field.details = config.details || '';
	field.template = config.template || '';
	field.validations = config.validations || [];
	field.i18n = config.i18n || false;
	//field.need = config.need || {};
}
	Field.prototype.getter = function(data){
		var field = this;
		return data;
	};
	Field.prototype.setter = function(data){
		var field = this;
		var data = data || "";
		if(field.i18n){
			var langdata = {};
			for(var l in textualization.langs){
				var lang = textualization.langs[l];
				langdata[lang]=(data[lang] || "").toString();
			}
			return langdata;
		} else {
			return data.toString();
		}
	};
	Field.prototype.validate = function(data,path){
		var field = this;
		var data = data || "";
		var result = [];
		if(field.i18n){
			for(var l in textualization.langs){
				var langresult = [];
				var lang = textualization.langs[l];
				for(var v in field.validations){
					if(!field.validations[v](data[lang])){langresult.push(v);}
				}
				if(langresult.length>0){result.push(new Validation(path.concat([lang]),langresult));}
			}
			if(result.length>0){
				result.push(new Validation(path,['Hay errores en una o mas traducciones de este campo']));
			}
		} else {
			for(var v in field.validations){
				if(!field.validations[v](data)){result.push(v);}
			}
			if(result.length>0){result = [new Validation(path,result)];}
		}
		return result;
	};











module.exports.Subset = Subset;
Subset.prototype = new Field();
function Subset(id, config){
	field = this;
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








module.exports.List = List;
List.prototype = new Field();
function List(id, config){
	field = this;
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
}
	List.prototype.validate = function(data,path){
		var fieldset = this;
		var data = data || {};
		var result = [];
		for(var d in data){
			if(d=='radio'){
				//result.radio = data[d]; // <- validate selections
			} else if(d=='check'){
				//result.check = data[d]; // <- validate selections
			} else {
				if(!data[d]){data[d]={};}
				for(var fieldid in fieldset.fields){
					result = result.concat(fieldset.fields[fieldid].validate(data[d][fieldid],path.concat([d,fieldid])));
				}
			}
		}
		return result;
	};
	List.prototype.getter = function(data){
		var fieldset = this;
		var data = data || {};
		var result = [];
		var counter = 0;
		for(var d in data){
			if(d=='radio'){
				result.radio = data[d]; // <- validate selections
			} else if(d=='check'){
				result.check = data[d]; // <- validate selections
			} else {
				if(!data[d]){data[d]={};}
				result[counter]={};
				for(var fieldid in fieldset.fields){
					result[counter][fieldid] = fieldset.fields[fieldid].getter(data[d][fieldid]);
				}
				counter++;
			}
		}
		return result;
	};
	List.prototype.setter = function(data){
		var fieldset = this;
		var data = data || {};
		var result = [];
		var counter = 0;
		for(var d in data){
			if(d=='radio'){
				result.radio = data[d]; // <- validate selections
			} else if(d=='check'){
				result.check = data[d]; // <- validate selections
			} else {
				if(!data[d]){data[d]={};}
				result[counter]={};
				for(var fieldid in fieldset.fields){
					result[counter][fieldid] = fieldset.fields[fieldid].setter(data[d][fieldid]);
				}
				counter++;
			}
		}
		return result;
	};
	List.prototype.addField = Fieldset.prototype.addField;
	List.prototype.removeField = Fieldset.prototype.removeField;
	List.prototype.getField = Fieldset.prototype.getField;









module.exports.Text = Text;
Text.prototype = new Field();
function Text(id, config){
	field = this;
	Field.call(field, id, config);
	field.template = 'text';
}

module.exports.Textarea = Textarea;
Textarea.prototype = new Field();
function Textarea(id, config){
	field = this;
	Field.call(field, id, config);
	field.template = 'textarea';
}

module.exports.Select = Select;
Select.prototype = new Field();
function Select(id, config){
	field = this;
	Field.call(field, id, config);
	field.template = 'select';
	field.values = config.values || [];
}

module.exports.Reverse = Reverse;
Reverse.prototype = new Field();
function Reverse(id, config){
	field = this;
	Field.call(field, id, config);
	field.template = 'text';
	field.validations = {
		"Debe contener al menos 5 caracteres":function(value){
			if(value && value.length>=5){return true;}
		}
	};
}
	Reverse.prototype.getter = function(data){
		var field = this;
		var data = data || "";
		return data.split("").slice().reverse().join("");
	};
	Reverse.prototype.setter = function(data){
		var field = this;
		var data = data || "";
		data = data.toString();
		return data.split("").slice().reverse().join("");
	};




function Validation(field,msgs){
	this.field = field.join('.');
	this.msgs = msgs;
}

function parseValidations(validations){
	var result = {};
	for(var v in validations){
		result[validations[v].field]=validations[v].msgs;
	}
	return result;
}

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