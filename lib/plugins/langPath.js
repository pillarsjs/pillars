var textualization = require('../textualization.js');
var logger = global.logger.pillars.plugins.addGroup('LangPath');

module.exports = new Plugin({id:'LangPath',priority:0},function(gw,next){
	if(textualization.langs.length>0){
		// Language based on request path.
		var locale = textualization.langs[0];
		if(textualization.langs.length>1){
			var langpath = new RegExp('^\\/('+textualization.langs.slice(1).join('|')+')','i');
			if(langpath.test(gw.path)){
				locale = langpath.exec(gw.path).slice(1).shift();
				gw.path = gw.path.replace("/"+locale,"");
			}
		}
		gw.language = locale;
	}
	next();
});