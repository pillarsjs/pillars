var textualization = require('textualization');
var crier = require('crier').addGroup('pillars').addGroup('plugins').addGroup('LangPath');
var Plugin = require('../lib/Plugin');

module.exports = new Plugin({id:'LangPath'},function(gw,next){
	if(textualization.languages.length>0){
		// Language based on request path.
		var locale = textualization.languages[0];
		if(textualization.languages.length>1){
			var langpath = new RegExp('^\\/('+textualization.languages.slice(1).join('|')+')','i');
			if(langpath.test(gw.path)){
				locale = langpath.exec(gw.path).slice(1).shift();
				gw.path = gw.path.replace("/"+locale,"");
			}
		}
		gw.language = locale;
	}
	next();
});