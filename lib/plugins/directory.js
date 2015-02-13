
var paths = require('path');
var fs = require('fs');
var logger = Logger.pillars.plugins.addGroup('Directory');

var staticTemplate;
Object.defineProperty(ENV.templates,"directory",{
	enumerable : true,
	get : function(){return staticTemplate;},
	set : function(set){
		staticTemplate = set;
		renderer.preload(staticTemplate);
	}
});
ENV.templates.directory = ENV.resolve('templates/directory.jade');

module.exports = new Plugin({id:'Directory'},function(gw,next){
	var directory = gw.routing.check('directory',false);
	if(directory){
		directory.path = directory.path || '/';
		directory.listing = directory.listing || false;

		var path = paths.join(directory.path,(gw.params.path || ''));
		var ext = path.replace(/^.*\./,'');
		var filename = path.replace(/^.*[\\\/]/,'');
		var reidx = new RegExp('^index\\.('+renderer.engines.join('|')+')$','i');

		if(filename[0] !== '.'){
			fs.stat(path, function(error, stats){
				if(error || (!stats.isFile() && !stats.isDirectory())){
					gw.error(404,error);
				} else if(stats.isDirectory() && directory.listing) {
					fs.readdir(path, function(error, files){
						if(error){
							gw.error(404,error);
						} else {
							var index = false;
							for(var i in files){
								if(reidx.test(files[i])){
									index=files[i];
									break;
								}
							}
							if(index){
								gw.render(paths.join(path, index));
							} else {
								gw.render(ENV.templates.directory,{
									path:decodeURIComponent(gw.originalPath.replace(/\/$/,'')),
									files:files
								});
							}
						}
					});
				} else if(stats.isFile()) {
					if(renderer.engines.indexOf(ext) >= 0){
						gw.render(path);
					} else {
						stats.path = path;
						gw.file(stats);
					}
				} else {
					gw.error(404, error);
				}
			});
		} else {
			gw.error(403);
		}
	} else {
		next();
	}
});