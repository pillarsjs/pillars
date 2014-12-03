
var paths = require('path');

textualization.load(ENV.resolve('languages/crud'));

var fs = require('fs');
var ObjectID = require('mongodb').ObjectID;


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
	var config = config || {directory:'/',listing:false};
	return function(gw){
		var path = paths.join(config.directory,(gw.params.path || ''));
		var ext = path.replace(/^.*\./,'');
		var filename = path.replace(/^.*[\\\/]/,'');
		var reidx = new RegExp('^index\.('+renderer.engines.join('|')+')$','i');
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

module.exports.CRUD = CRUD;
function CRUD(route,schema){
	route.account = true;
	route
		.addRoute(new Route({id:'template'},function(gw){
			gw.render(paths.resolve(__dirname,'../templates/crud.jade'),{schema:schema});
		}))
		.addRoute(new Route({id:'search',path:'/api'},function(gw){
			schema.list(gw,gw.params,function(result){
				gw.send(result);
			});
		}))
		.addRoute(new Route({id:'get',path:'/api/:_id'},function(gw){
			schema.one(gw,gw.params,function(result){
				gw.send(result);
			});
		}))
		.addRoute(new Route({id:'update',path:'/api/:_id',method:'put'},{multipart:true},function(gw){
			schema.update(gw,gw.params,function(result){
				gw.send(result);
			});
		}))
		.addRoute(new Route({id:'insert',path:'/api',method:'post'},{multipart:true},function(gw){
			schema.insert(gw,gw.params,function(result){
				gw.send(result);
			});
		}))
		.addRoute(new Route({id:'remove',path:'/api/:_id',method:'delete'},function(gw){
			schema.remove(gw,gw.params,function(result){
				gw.send(result);
			});
		}))
		.addRoute(new Route({id:'files',path:'/files/*:path',method:'get'},function apiFiles(gw){
			var path = gw.params.path || '';
			var pathfs = paths.resolve(paths.join(ENV.directories.uploads,schema.id,path));
			var _id = path.split('/').shift();
			if(/^[a-f0-9]{24}$/i.test(_id)){_id = new ObjectID.createFromHexString(_id);}
			var field = path.split('/').pop();
			var cols = {};
			cols[field]=1;
			var db = DB.collection(schema.id);
			db.findOne({_id:_id},cols,function(error, result) {
				if(error){
					gw.error(500,error);
				} else if(!result) {
					gw.error(404);
				} else {
					var search = result;
					var dots = field.split('.');
					var last = dots.pop();
					while(dots.length>0){
						var i = dots.shift();
						if(search[i]){
							search = search[i];
						} else {
							search = false;
							break;
						}
					}
					if(search[last]){
						var file = search[last];
						gw.file(pathfs,file.name);
					} else {
						gw.error(404);
					}
				}
			});
		}))
	;
	return route;
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


