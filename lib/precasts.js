
var paths = require('path');

textualization.load(ENV.resolve('languages/crud'));

var fs = require('fs');


var staticTemplate;
Object.defineProperty(ENV.templates,"static",{
	enumerable : true,
	get : function(){return staticTemplate;},
	set : function(set){
		staticTemplate = set;
		renderer.preload(staticTemplate);
	}
});
ENV.templates.static = ENV.resolve('templates/static.jade');

module.exports.static = static;
function static(config){
	config = config || {directory:'/',listing:false};
	return function(gw){
		var path = paths.join(config.directory,(gw.params.path || ''));
		var ext = path.replace(/^.*\./,'');
		var filename = path.replace(/^.*[\\\/]/,'');
		var reidx = new RegExp('^index\\.('+renderer.engines.join('|')+')$','i');

		if(filename[0]!='.'){
			fs.stat(path, function(error, stats){
				if(error || (!stats.isFile() && !stats.isDirectory())){
					gw.error(404,error);
				} else if(stats.isDirectory() && config.listing) {
					fs.readdir(path, function(error,files){
						if(error){
							gw.error(404,error);
						} else {
							var index = false;
							for(var i in files){
								if(reidx.test(files[i])){index=files[i];break;}
							}
							if(index){
								gw.render(paths.join(path,index));
							} else {
								gw.render(ENV.templates.static,{
									path:decodeURIComponent(gw.originalPath.replace(/\/$/,'')),
									files:files
								});
							}
						}
					});
				} else if(stats.isFile()) {
					if(renderer.engines.indexOf(ext)>=0){
						gw.render(path);
					} else {
						stats.path = path;
						gw.file(stats);
					}
				} else {
					gw.error(404,error);
				}
			});
		} else {
			gw.error(403);
		}
	};
}



module.exports.pillarsLogin = new Route({id:'pillarsLogin'})
	.addRoute(new Route({id:'login',path:'/login',method:['get','post'],session:true},function(gw){
		var redirect = gw.params.redirect;
		if(typeof gw.params.redirect === 'undefined' && gw.referer){
			redirect = gw.referer;
		}
		if(typeof gw.params.user === "string" && typeof gw.params.password === "string"){
			var login = {
				user : gw.params.user,
				password : gw.params.password
			};
			var users = DB.collection('users');
			users.findOne({user:login.user,password:login.password},function(error, result) {
				if(!error && result){
					gw.session.user = result._id.toString();
					//gw.redirect(redirect);
					gw.render(paths.resolve(__dirname,'../templates/login.jade'),{redirect:redirect,msg:'login.ok'});
				} else {
					gw.render(paths.resolve(__dirname,'../templates/login.jade'),{redirect:redirect,msg:'login.fail'});
				}
			});
		} else {
			gw.render(paths.resolve(__dirname,'../templates/login.jade'),{redirect:redirect});
		}
	}));

module.exports.pillarsStatic = new Route({id:'pillarsStatic',path:'/pillars/*:path'},static({directory:paths.resolve(__dirname,'../static'),listing:true}));


