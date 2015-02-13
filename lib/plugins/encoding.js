var logger = Logger.pillars.plugins.addGroup('Encoding');

module.exports = new Plugin({id:'Encoding'},function(gw,next){
	if(!gw.encoding){
		gw.encoding = "identity";
		gw.error(406);
	} else {
		next();
	}
});