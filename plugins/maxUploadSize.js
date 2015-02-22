var logger = Logger.pillars.plugins.addGroup('MaxUploadSize');

module.exports = new Plugin({id:'MaxUploadSize'},function(gw,next){
	var maxsize = gw.routing.check('maxSize',ENV.server.maxUploadSize);
	if(gw.content.length>maxsize){
			gw.error(413);
	} else {
		next();
	}	
});