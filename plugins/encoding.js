var crier = require('crier').addGroup('pillars').addGroup('plugins').addGroup('Encoding');
var Plugin = require('../lib/Plugin');

module.exports = new Plugin({id:'Encoding'},function(gw,next){
	if(!gw.encoding){
		gw.encoding = "identity";
		gw.error(406);
	} else {
		next();
	}
});