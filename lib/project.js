var querystring = require('querystring');
var formidable = require('formidable');
var util = require('util');

function isArray(ar) {
  return Array.isArray(ar);
}

function isString(arg) {
  return typeof arg === 'string';
}

function queryParser(query){
	var result = {};
	for(var i in query){
		var name = i.replace(/\[.*$/i,'');
		var value = query[i];
		if(/\[([^\]]*)\]/i.test(i)){
			var check = /\[([^\]]*)\]/ig;
			var match;
			var matchs = [];
			while(match = check.exec(i)){matchs.push(match[1]);}
			matchs.reverse();
			var path;
			for(var p in matchs){
				if(matchs[p]==''){
					path = [];
					path.push(value);
				} else {
					path = {};
					path[matchs[p]]=value;
				}
				value=path;
			}
			result=merge(result,name,value);
		} else {
			result[name]=query[i];
		}
	}
	function merge(obj,name,prop){
		if(Array.isArray(prop)){
			if(!obj[name]){obj[name]=[];}
			obj[name].push(prop[0]); 
		} else if(typeof prop == "object"){
			if(!obj[name]){obj[name]={};}
			mergeProps(obj[name],prop);
		} else {
			obj[name]=prop;
		}
		return obj;
	}
	function mergeProps(obj,prop){
		for(var p in prop){
			merge(obj,p,prop[p]);
		}
	}
	return result;
}

var project = new Project();
module.exports = project;
function Project(){
	var project = this;
	project.pillars = {};
	project.router = function(gw){
		if(!gw.encoding){
			gw.encoding = "identity";
			gw.error(406,'Not Acceptable');
		}	else {
			if(!findRoutes(gw)){gw.error(404,'Page not found');}
		}
	}
	function findRoutes(gw){
		for(var pillar in project.pillars){
			//var path = project.pillars[p].getPath();
			var paths = project.pillars[pillar].getRegexps();
			for(var beam in paths){
				if(paths[beam].test(gw.path)){
					gw.beam = project.pillars[pillar].getBeam(beam);
					gw.pathMatchs = paths[beam].exec(gw.path).slice(1);
					readEntity(gw);
					return true;
				}
			}
		}
		return false;
	}
	function readEntity(gw){
		gw.params = queryParser(gw.query);
		if(gw.content.length>gw.beam.getConfig().maxlength){
			gw.error(413,'Request Entity Too Large');
		} else if(gw.content.type=='application/x-www-form-urlencoded'){
			gw.content.params = '';
			gw.req.on('readable', function() {
				var chunk;
				var readlength = 0;
				while (null !== (chunk = gw.req.read())) {
					readlength+=chunk.length;
					if(readlength>gw.content.length){
						gw.error(400,'Bad Request');
						return;
					} else {
						gw.content.params += chunk.toString('ascii');
					}
				}
				gw.content.params = queryParser(querystring.parse(gw.content.params, '&', '=')); //,{ maxKeys: 1000 } // default
				for(var v in gw.content.params){gw.params[v] = gw.content.params[v];}
				endRoute(gw);
			});

		} else if(gw.content.type=='multipart/form-data' && gw.content.boundary){
			if(!gw.beam.getConfig().upload){
				gw.error(400,'Bad Request');
			} else {
				var upload = new formidable.IncomingForm();
				var files = {};
				var fields = {};

				upload.uploadDir = "temp";
				upload.keepExtensions = true;
				upload.onPart = function(part) {
					if (part.filename!="") {
						upload.handlePart(part);
					}
				}
				upload
				.on('error', function(error) {gw.error(500,'Internal Server Error',error);})
				.on('field', function(field, value) {
					if(fields[field]){
						if(!isArray(fields[field])){fields[field]=[fields[field]];}
						fields[field].push(value);
					} else {
						fields[field]=value;
					}
				})
				.on('file', function(field, file) {
					if(files[field]){
						if(!isArray(files[field])){files[field]=[files[field]];}
						files[field].push(file);
					} else {
						files[field]=file;
					}
				})
				.on('end', function() {
					fields = queryParser(fields);
					files = queryParser(files);
					for(var v in fields){gw.params[v] = fields[v];}
					gw.files = files;
					endRoute(gw);
				});
				upload.parse(gw.req);
			}
		} else {
			endRoute(gw);
		}
	}
	function endRoute(gw){
		gw.beam.parseArgs(gw);
		if(gw.beam.getConfig().session){
			gw.getSession(function(error){
				if(error){
					gw.error(500,'Internal Server Error',error);
				} else {
					gw.beam.launch(gw);
				}
			});
		} else {
			gw.beam.launch(gw);
		}
	}
}


/*

 else {
			gw.setHeader('Allow',gw.beam.getConfig().methods.join(', ').toUpperCase());
			gw.error(405,'Method not allowed');
		}

*/
		/*
		if(/^\/contenido\/?$/.test(gw.path)){

			if(!gw.session.counter){gw.session.counter=0;}
			gw.session.counter++;

			var body = tiles.render('./form.jade',{
				//trace: util.format(gw),
				title:'Method test',
				h1:'Method testing:'
			});
			gw.send(body);	

		} else if(/^\/yalotengo\/?$/.test(gw.path)){
			if(!gw.cacheck(new Date(false))){
				gw.send('Este contenido es fijo y se cachea');
			}
		} else if(/^\/espera\/?$/.test(gw.path)){
			// Force timeout!
		} else if(/^\/redirecciona\/?$/.test(gw.path)){
			gw.redirect('http://localhost:3000/yalotengo');
		} else if(/^\/auth\/?$/.test(gw.path)){
			gw.authenticate();
		} else if(/^\/malapeticion\/?$/.test(gw.path)){
			gw.error(400,'Bad Request');// 405 Method not allowed 	Allow: GET, HEAD
		} else if(/^\/archivo\/?$/.test(gw.path)){
			gw.file('./uploads/exquisite0002.png','prueba.txt',false);
		} else if(/^\/error\/?$/.test(gw.path)){
			throw new Error("Crashhh!");
		} else {
			return false;
		}
		return true;
		*/