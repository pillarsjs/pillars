
module.exports.Fieldset = Fieldset;
function Fieldset(id,config){
	var fieldset = this;
	var config = config || {};
	fieldset.id = id;
	fieldset.title = config.title || '';
	fieldset.details = config.details || '';
	fieldset.collection = config.collection || false;
	fieldset.template = config.template || 'fieldset';
	fieldset.fields = {};
	//fieldset.need = config.need || {};
}

	Fieldset.prototype.validate = function(data){
		var fieldset = this;
		var data = data || {};
		var result = [];
		for(var fieldid in fieldset.fields){
			var errors = fieldset.fields[fieldid].validate(data[fieldid]);
			if(errors.length>0){
				result.push(new Validation(fieldset.fields[fieldid],errors));
			}
		}
		return result;
	}

	Fieldset.prototype.getter = function(data){
		var fieldset = this;
		var data = data || {};
		var result = {};
		for(var fieldid in fieldset.fields){
			result[fieldid] = fieldset.fields[fieldid].getter(data[fieldid]);
		}
		return result;
	}

	Fieldset.prototype.setter = function(data){
		var fieldset = this;
		var data = data || {};
		var result = {};
		for(var fieldid in fieldset.fields){
			result[fieldid] = fieldset.fields[fieldid].setter(data[fieldid]);
		}
		return result;
	}

	Fieldset.prototype.addField = function(field){
		var fieldset = this;
		field.fieldset = fieldset;
		return fieldset;
	}

	Fieldset.prototype.removeField = function(fieldid){
		var fieldset = this;
		if(fieldset.fields[fieldid]){fieldset.fields[fieldid].fieldset=false;}
		return fieldset;
	}

	Fieldset.prototype.getField = function(fieldid){
		var fieldset = this;
		if(fieldset.fields[fieldid]){return fieldset.fields[fieldid];}
		return false;
	}

	Fieldset.prototype.list = function(gw,cb){
		var fieldset = this;
		var db = gw.server.database.collection(fieldset.collection);
		db.find().toArray(function(error, results) {
			if(error){
				gw.msgs.push(new Fail("database.error",error));
				cb(false);
			} else {
				cb(results);
			}
		});
	}

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
	}

	Fieldset.prototype.update = function(gw,cb){
		var fieldset = this;
		var db = gw.server.database.collection(fieldset.collection);
		var _id = gw.params._id || false;
		var doc = gw.params[fieldset.id] || false;
		if(_id && doc){
			doc._id = gw.params._id;
			var validation = fieldset.validate(doc);
			if(validation.length>0){
				gw.msgs.push(validation);
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
	}

	Fieldset.prototype.insert = function(gw,cb){
		var fieldset = this;
		var db = gw.server.database.collection(fieldset.collection);
		var doc = gw.params[fieldset.id] || false;
		if(!doc){
			cb({});
		} else {
			var validation = fieldset.validate(doc);
			if(validation.length>0){
				gw.msgs.push(validation);
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
	}

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
	}





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
			for(var l in langlist){
				l = langlist[l];
				langdata[l]=(data[l] || "").toString();
			}
			return langdata;
		} else {
			return data.toString();
		}
	};

	Field.prototype.validate = function(data){
		var field = this;
		var result = [];
		for(var v in field.validations){
			if(!field.validations[v](data)){
				result.push(v);
			}
		}
		return result;
	};




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
			if(value.length>=5){return true;}
		}
	};
}

	Reverse.prototype.getter = function(data){
		var field = this;
		var data = data || "";
		return data.split("").slice().reverse().join("");
	}

	Reverse.prototype.setter = function(data){
		var field = this;
		var data = data || "";
		data = data.toString();
		return data.split("").slice().reverse().join("");
	}


function Validation(field,errors){
	var validation = this;
	validation.field = field;
	validation.errors = errors;
	validation.toString = function(){
		return validation.field.label+": "+validation.errors.join(", ");
	}
}

function Fail(msg,details){
	this.msg = msg;
	this.details = details || "";
	this.toString = function(){
		return '[Fail]'+this.msg+': '+this.details;
	}
}

function Alert(msg,details){
	this.msg = msg;
	this.details = details || "";
	this.toString = function(){
		return '[Alert]'+this.msg+': '+this.details;
	}
}

function Info(msg,details){
	this.msg = msg;
	this.details = details || "";
	this.toString = function(){
		return '[Info]'+this.msg+': '+this.details;
	}
}

function Ok(msg,details){
	this.msg = msg;
	this.details = details || "";
	this.toString = function(){
		return '[Ok]'+this.msg+': '+this.details;
	}
}




/*
function Subset(setup){
	PF.Field.call(this, setup);
	this.fields = setup.fields || {};
	this.template = 'subset';
	this.getter = function(data){
		var data = data || {};
		var result = {};
		for(var name in this.fields){
			result[name] = this.fields[name].getter(data[name]);
		}
		return result;
	};
	this.setter = function(data){
		var data = data || {};
		var result = {};
		for(var name in this.fields){
			result[name] = this.fields[name].setter(data[name]);
		}
		return result;
	};
	this.validate = function(data){
		var data = data || {};
		var result = [];
		for(var name in this.fields){
			var errors = this.fields[name].validate(data[name]);
			if(errors.length>0){
				result.push(new Validation(this.fields[name],errors,data[name]));
			}
		}
		return result;
	};
}
*/