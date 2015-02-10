var childManager = require('./childManager');
var Chain = require('./Chain');

var LoggerRules = [];
var LoggerStores = [{
	id:'default',
	handler: function(groups,lvl,msg,meta,next){
		console.log((lvl.toUpperCase()+'.'+groups.join('.')+': ').grey,msg,'\n',meta,'\n');
		next();
	}
}];

module.exports = new Logger();
function Logger(parent,id){
	var logger = this;
	logger.id = id;
	logger.parent = parent;
	logger.stores = LoggerStores;
	logger.rules = LoggerRules;
}
	Logger.prototype.getRule = childManager.getChild('rules');
	Logger.prototype.getRulePosition = childManager.getChildPosition('rules');
	Logger.prototype.addRule = childManager.addChild('rules');
	Logger.prototype.removeRule = childManager.removeChild('rules');
	Logger.prototype.moveRule = childManager.moveChild('rules');

	Logger.prototype.getStore = childManager.getChild('stores');
	Logger.prototype.getStorePosition = childManager.getChildPosition('stores');
	Logger.prototype.addStore = childManager.addChild('stores');
	Logger.prototype.removeStore = childManager.removeChild('stores');
	Logger.prototype.moveStore = childManager.moveChild('stores');

	Logger.prototype.addLvl = function(lvl){
		Logger.prototype[lvl] = function loggerLvl(msg,meta,callback){
			this.msg([],lvl,msg,meta,callback);
			return this;
		};
		return this;
	};
	Logger.prototype.getLvls = function(){
		var lvls = [];
		for(var i=0,k=Object.keys(Logger.prototype),l=k.length;i<l;i++){
			if(Logger.prototype[k[i]].name === 'loggerLvl'){
				lvls.push(k[i]);
			}
		}
		return lvls;
	};
	Logger.prototype.addGroup = function(id){
		this[id] = new Logger(this,id);
		return this[id];
	};
	Logger.prototype.getGroups = function(){
		var groups = [];
		for(var i=0,k=Object.keys(this),l=k.length;i<l;i++){
			if(this[k[i]] instanceof Logger){
				groups.push(k[i]);
			}
		}
		return groups;
	};
	Logger.prototype.msg = function(location,lvl,msg,meta,callback){
		if(this.parent){
			location = location || [];
			location.push(this.id);
			this.parent.msg(location,lvl,msg,meta,callback);
		} else {
			location = location || [];
			location = location.reverse();
			msg = msg || '';
			meta = meta || {};
			if(meta.error){meta.error=meta.error.stack;}

			var sendTo = [];
			for(var i=0,l=LoggerRules.length;i<l;i++){
				LoggerRules[i].rule(sendTo,location,lvl,msg,meta);
			}
			if(sendTo.length===0){sendTo=['default'];}

			var chain = new Chain();
			for(i=0,l=sendTo.length;i<l;i++){
				var store = this.getStore(sendTo[i]);
				if(store){
					chain.add(store.handler,location,lvl,msg,meta,chain.next);
				}
			}
			if(callback){
				chain.add(callback);
			}
			chain.pull();
		}
	};