var logger = Logger.pillars.plugins.addGroup('OPTIONS');

module.exports = new Plugin({id:'OPTIONS'},function(gw,next){
	if(gw.method=='OPTIONS'){
		gw.setHeader("Allow", gw.beam.method.concat(['OPTIONS','HEAD']));
		gw.send();
	} else {
		next();
	}
});