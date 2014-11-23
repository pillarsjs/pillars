
var LoggerRules = {
	all : function(groups,lvl,msg,meta){
		return ['console'];
	}
};

var LoggerStores = {
	console:function(groups,lvl,msg,meta,callback){
		var error = (meta.error)?meta.error.stack:false;
		if(error){
			console.log(groups,lvl,msg,meta,error);
		} else {
			console.log(groups,lvl,msg,meta);
		}
		callback();
	}
};

var LoggerColors = {};

module.exports = new Logger();
function Logger(parent,group){
	var logger = this;

	logger.id = group || 'root';

	if(parent){
		logger.msg = function(groups,lvl,msg,meta,callback){
			var groups = groups || [];
			groups.push(group);
			parent.msg(groups,lvl,msg,meta,callback);
		};
	} else {
		logger.msg = function(groups,lvl,msg,meta,callback){
			var timestamp = Date.now();
			var groups = groups || [];
			var msg = msg || '';
			var meta = meta || {};
			meta.timestamp = timestamp;
			var to = [];
			for(var i in LoggerRules){
				var result = LoggerRules[i](groups,lvl,msg,meta) || [];
				for(var ii in result){
					if(to.indexOf(result[ii])<0){
						to.push(result[ii]);
					}
				}
			}
			var storesChain = new Chain();
			for(var i in to){
				var store = to[i];
				if(LoggerStores[store]){
					storesChain.add(LoggerStores[store],groups,lvl,msg,meta,storesChain.next);
				}
			}
			if(callback){
				storesChain.add(callback,storesChain);
			}
			storesChain.pull();
		};
	}

	logger.stores = LoggerStores;
	logger.rules = LoggerRules;

	logger.getColor = function(lvl){
		return LoggerColors[lvl];
	}
	logger.addLvl = function(lvl,color){
		if(color){LoggerColors[lvl]=color;}
		Logger.prototype[lvl] = function(msg,meta,callback){
			var logger = this;
			logger.msg([],lvl,msg,meta,callback);
			return logger;
		};
		return logger;
	}
	logger.addGroup = function(group){
		logger[group] = new Logger(logger,group);
		return logger[group];
	}
}