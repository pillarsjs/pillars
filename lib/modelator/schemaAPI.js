
var mongoInterface = require('./mongoInterface');

module.exports = schemaAPI;

function schemaAPI(route,schema,interface){
	interface = interface || mongoInterface;
	route
		.addRoute(new Route({id:'search',path:'/api'},function(gw){
			interface.list(schema,gw.params,function(result){
				gw.json(result);
			},gw.user);
		}))
		.addRoute(new Route({id:'get',path:'/api/:_id'},function(gw){
			interface.get(schema,gw.params,function(result){
				gw.json(result);
			},gw.user);
		}))
		.addRoute(new Route({id:'update',path:'/api/:_id',method:'put',multipart:true},function(gw){
			interface.update(schema,gw.params,function(result){
				gw.json(result);
			},gw.user);
		}))
		.addRoute(new Route({id:'insert',path:'/api',method:'post',multipart:true},function(gw){
			interface.insert(schema,gw.params,function(result){
				gw.json(result);
			},gw.user);
		}))
		.addRoute(new Route({id:'remove',path:'/api/:_id',method:'delete'},function(gw){
			interface.remove(schema,gw.params,function(result){
				gw.json(result);
			},gw.user);
		}))
		.addRoute(new Route({id:'files',path:'/files/*:path',method:'get'},function(gw){
			interface.files(schema,gw.params,function(result){
				if(result.error){
					gw.error(result.error,result.details);
				} else {
					gw.file(result.data.file,result.data.name);
				}
			},gw.user);
		}))
	;
	return route;
}