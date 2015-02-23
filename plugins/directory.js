
var paths = require('path');
var fs = require('fs');
var crier = require('crier').addGroup('pillars').addGroup('plugins').addGroup('Directory');
var Plugin = require('../lib/Plugin');
var templated = require('templated');

var plugin = module.exports = new Plugin({id:'Directory'},function(gw,next){
	var directory = gw.routing.check('directory',false);
	if(directory){
		directory.path = directory.path || '/';
		directory.listing = directory.listing || false;

		var path = paths.join(directory.path,(gw.params.path || ''));
		var ext = path.replace(/^.*\./,'');
		var filename = path.replace(/^.*[\\\/]/,'');
		var reidx = new RegExp('^index\\.('+templated.getEngines().join('|')+')$','i');

		if(filename[0] !== '.'){
			fs.stat(path, function(error, stats){
				if(error || (!stats.isFile() && !stats.isDirectory())){
					gw.error(404,error);
				} else if(stats.isDirectory() && directory.listing) { // mostrar un index.xxx deberia ser posible sin directoryListing.
					fs.readdir(path, function(error, files){
						if(error){
							gw.error(404,error);
						} else {
							var index = false;
							for(var i in files){
								if(reidx.test(files[i])){ // .html y .htm deberian ser validos tb.
									index=files[i];
									break;
								}
							}
							if(index){
								gw.render(paths.join(path, index));
							} else {
								gw.render(plugin.staticTemplate,{
									path:decodeURIComponent(gw.originalPath.replace(/\/$/,'')),
									files:files
								});
							}
						}
					});
				} else if(stats.isFile()) {
					if(templated.getEngines().indexOf(ext) >= 0){
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

var staticTemplate;
Object.defineProperty(plugin,"staticTemplate",{
	enumerable : true,
	get : function(){return staticTemplate;},
	set : function(set){
		staticTemplate = set;
		templated.load(staticTemplate);
	}
});

plugin.staticTemplate = paths.join(__dirname,'../templates/directory.jade');

