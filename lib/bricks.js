
module.exports.Fieldset = Fieldset;
function Fieldset(id,config){
	var fieldset = this;
	var config = config || {};
	fieldset.id = id;
	fieldset.title = config.title || '';
	fieldset.details = config.details || '';
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
				result.push(new Validation(fieldset.fields[fieldid],errors,data[fieldid]));
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
		console.log(data);
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
				fieldset.addField(id);
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
				if(fieldset.fields[id]){delete fieldset.fields[id];}
				fieldset = false;
				console.log('Field out of fieldset!');
			} else {
				fieldset = set;
				fieldset.fields[id] = field;
				console.log('Field insert in fieldset!');
			}
		}
	});

	field.label = config.label || '';
	field.details = config.details || '';
	field.template = config.template || '';
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

	Reverse.prototype.validate = function(data){
		var field = this;
		var result = [];
		if(data.length<5){result.push("Debe ser mas largo de 5 caracteres!");}
		return result;
	}






function Validation(field,errors,data){
	var validation = this;
	validation.field = field;
	validation.errors = errors;
	validation.data = data;
	validation.toString = function(){
		return validation.field.label+": "+validation.errors.join(", ");
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