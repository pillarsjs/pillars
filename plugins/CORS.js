var crier = require('crier').addGroup('pillars').addGroup('plugins').addGroup('CORS');
var Plugin = require('../lib/Plugin');

module.exports = new Plugin({id:'CORS'},function(gw,next){
	if(gw.origin){
		var cors =gw.routing.check('cors',ENV.server.cors);
		if(cors===true || (Array.isArray(cors) && cors.indexOf(gw.origin)>-1)){
			gw.cors.origin = gw.origin;
			gw.cors.credentials = true;
			gw.cors.methods = gw.beam.method.concat(['OPTIONS','HEAD']);
		}
	}
	next();
});