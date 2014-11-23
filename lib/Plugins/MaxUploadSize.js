var logger = global.logger.pillars.plugins.addGroup('MaxUploadSize');

module.exports = new Plugin({id:'MaxUploadSize',priority:1001},function(gw,next){
	var maxsize = gw.routing.check('maxsize',ENV.server.maxUploadSize);
	if(gw.content.length>maxsize){
			gw.error(413);
	} else {
		next();
	}	
});