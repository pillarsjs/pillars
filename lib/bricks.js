
var bricks = new Bricks();
module.exports = bricks;
function Bricks(){

	var PF = this;

	/*
	function fieldNmr(id){
		if(!name){return "";}
		var name = name.replace('][','_');
		name = name.replace('[','_');
		name = name.replace(']','');
		return name;
	}
	*/

	function Validation(field,errors,data){
		this.field = field;
		this.errors = errors;
		this.data = data;
		this.toString = function(){
			return this.field.label+": "+this.errors.join(", ");
		}
	}

	this.Fieldset = function(setup){
		var setup = setup || {};
		this.id = setup.id || '';
		this.title = setup.title || '';
		this.details = setup.details || '';
		this.fields = setup.fields || {};
		this.template = 'fieldset';
		//this.need = setup.need || {};

		this.getId = function(){
			fieldIdr(this.id);
		}

		this.getName = function(){
			fieldIdr(this.id);
		}

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

	this.Field = function(setup){
		var setup = setup || {};
		this.id = setup.id || '';
		this.label = setup.label || '';
		this.details = setup.details || '';
		this.template = setup.template || '';
		this.i18n = setup.i18n || false;
		//this.need = setup.need || {};

		this.getId = function(){
			fieldIdr(this.id);
		}

		this.getter = function(data){
			return data;
		};
		this.setter = function(data){
			var data = data || "";
			if(this.i18n){
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
		this.validate = function(data){
			var result = [];
			return result;
		};
	}

	this.fields = {
		Subset:function(setup){
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
		},
		Text:function(setup){
			PF.Field.call(this, setup);
			this.template = 'text';
		},
		Textarea:function(setup){
			PF.Field.call(this, setup);
			this.template = 'textarea';
		},
		Reverse:function(setup){
			PF.Field.call(this, setup);
			this.template = 'text';
			this.getter = function(data){
				var data = data || "";
				return data.split("").slice().reverse().join("");
			};
			this.setter = function(data){
				var data = data || "";
				data = data.toString();
				return data.split("").slice().reverse().join("");
			};
			this.validate = function(data){
				var result = [];
				if(data.length<5){result.push("Debe ser mas largo de 5 caracteres!");}
				return result;
			};
		},
		Select:function(setup){
			PF.Field.call(this, setup);
			this.template = 'select';
			this.values = setup.values || [];
		}

	}
	for(var i in this.fields){
		this.fields[i].prototype = new PF.Field();
	}
}