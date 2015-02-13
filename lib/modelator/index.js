
//textualization.load(ENV.resolve('./languages/crud'));

var models = require('./models');
var schemaAPI = require('./schemaAPI');
var mongoInterface = require('./mongoInterface');

for(var i=0,k=Object.keys(models),l=k.length;i<l;i++){
	var key = k[i];
	module.exports[key]=models[key];
}

module.exports.schemaAPI = schemaAPI;
module.exports.mongoInterface = mongoInterface;