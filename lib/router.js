
var querystring = require('querystring');
var formidable = require('formidable');

module.exports = router;
router.pillars = {};
function router(gw){
	if(!gw.encoding){
		gw.encoding = "identity";
		gw.error(406,'Not Acceptable');
	}	else {
		if(!findRoutes(gw)){gw.error(404,'Page not found');}
	}
}

function isArray(ar) {
  return Array.isArray(ar);
}

function isString(arg) {
  return typeof arg === 'string';
}

function queryParser(query){
	var result = {};
	for(var i in query){
		if(/^[^\[\]]+(\[[^\[\]]*\])*$/i.test(i)){
			result = merge(result,i.split(/\[|\]\[|\]/ig).slice(0,-1),query[i]);
		} else {
			result[i]=query[i];
		}
	}
	function merge(o,m,v){
		if(m.length>1){
			var im = m.splice(0,1).toString();
			if(im==''){im=Object.keys(o).length;}
			if(im==parseInt(im)){im='$'+im;}
			if(!o[im]){o[im]={};}
			merge(o[im],m,v);
		} else {
			o[m[0]]=v;
		}
		return o;
	}
	return result;
}

function findRoutes(gw){
	for(var pillarid in router.pillars){
		var pillar = router.pillars[pillarid]
		var regexps = pillar.regexps;
		for(var beamid in regexps){
			if(regexps[beamid].test(gw.routePath)){
				gw.beam = pillar.getBeam(beamid);
				gw.pillar = pillar;
				readEntity(gw);
				return true;
			}
		}
	}
	return false;
}

function readEntity(gw){
	gw.params = queryParser(gw.query);
	if(gw.content.length>gw.beam.maxlength){
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
		if(!gw.beam.upload){
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
	gw.pathparams();
	if(gw.beam.session){
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