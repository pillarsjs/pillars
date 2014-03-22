
var pillars = require('../../pillars').Pillars;
//var pillarsFields = require('../../pillars').PillarsFields;

var sampleBeam = new pillars.Beam();
sampleBeam.setId('sample-beam');
sampleBeam.setTemplate('beams/sample/beam.jade');

/*
a nivel de beam tenemos los permisos basicos administrativos que vienen de las llaves see, edit, manage
en base a esto se define para cada field la psobilidad de definir una key especial en cada una de esas ramas, por ejemplo:

field1 : new pillar.fields.text({
	label : 'Field1',
	details : 'Rellena este campo...'
	see : [keys]
	edit
	manage

Esto quiere decir que es ncesario esa credencial adicional para ese caso en ese field.

Un beam puede definir nuevas keysroot que definiran propiedasdes del tipo for_xxx, permieitnedo ampliar la funcioanlidad.

}),

Como enrutar esto:

al recibir un request parseamos la cabecera, tendremos los datos necesarios para establecer la psobilidad de la ruta.
montamos, la base es el path, tendremos un array con las expresiones regulares de todas las acciones en la forma

post+http://sub.dom.ext/path/path/path

^(?:(get)|(post)|(put)|(delete))\+(?:(http)|(https))\:\/\/(?:([^\/]+?))\/(?:([^\/]+?))\/(?:([^\/]+?))\/?$

^\/pillar\/admin\/samplepanel\/edit\/(?:([^\/]+?))\/(?:([^\/]+?))\/?$

/^\/pillar\/admin\/samplepanel\/edit\/(?:([^\/]+?))\/?$/i

vale: ^(?:(get)|(post)|(put)|(delete))\+(?:(http)|(https))\:\/\/(?:([^\/]+?))\/(?:([^\/]+?))\/(?:([^\/]+?))\/?$

el beam solicita la regexp al action cuando este se enlaza. un action sin enlazar no puede responder a nada
si se desea retirar un action solo hay que desconectarlo desde el beam.

pillar debe terner un metodo global de refresco de rutas en el que se toman todas las regexp pero utiliza un truco
monta primero regexp genricas con el path del beam que sirven de primer filtro.
Una vez localizada una ruta comprueba los requisitos generales del action (los actions deben tener una funcion para esto)
y una vez validada la posibilidad de responder a la accion se continua, en este punto pueden ocurrir:
la ruta no existe y se da un 404
la ruta existe y pero devuelve un forbidden por falta de credenciales
la ruta existe y pero devuelve un metodo no valido
la ruta existe y continua su ejecucion.

un action puede entregar directamente una regexp como path que se añadira a la propia del beam.



*/
var sampleAction = new pillars.Action('list',{
	path:'/',		// 
	methods:[],		// array of methods, string for one method, 'any' for all, undefined or empty array is get.
					// method post, delete & put be able to datatype form-url
					// el metodo es determinandte junto con la ruta, otros actions pueden gestionar la misma ruta pero otro metodo.
	auth:false, 	// function callback(user,pass){return true|false;}
	login:false, 	// boolean or array of keys
	hostname:false,	// hostname
	https:false,	// https protocol boolean or 'any'
	query:false,	// false|undefined for no requires, array of field names necesary
	upload:true,	// is posible upload files. enctype multipart.
	maxupload:1,	// MB able to upload, default by sistem config.
},function(req,res){
	beam = this;
	beam.db.find().toArray(function(error, result) {
		if(!error && result && result.length>0){
			for(var i in result){
				var _id = result[i]._id;
				result[i] = beam.fields.getter(result[i]);
				result[i]._id = _id;
			}
		}
		if(error){res.msgs.push(new msg("pillar.database.errors.list","model",error));}
		beam.template.view('list',req,res,result);
	});
});
sampleBeam.addAction(sampleAction);


sampleAction.status();
sampleBeam.status();

module.exports = sampleBeam;

/*






		myaction = new Action('list',['get','put','/:_id'],function(req,res){
			beam = this;
			beam.db.find().toArray(function(error, result) {
				if(!error && result && result.length>0){
					for(var i in result){
						var _id = result[i]._id;
						result[i] = beam.fields.getter(result[i]);
						result[i]._id = _id;
					}
				}
				if(error){res.msgs.push(new msg("pillar.database.errors.list","model",error));}
				beam.template.view('list',req,res,result);
			});
		});

		
		myaction = new Action('one',['get','put','/:_id'],function(req,res){
			beam = this;
			beam.db.findOne({_id:req.params._id},function(error, result) {
				if(!error && result){
					var _id = result._id;
					result = beam.fields.getter(result);
					result._id = _id;
				}
				if(error){res.msgs.push(new msg("pillar.database.errors.one","model",error));}
				if(!result){
					res.msgs.push(new msg("pillar.actions.one.noexist","actions","",{req:req,beam:beam}));
					beam.template.view('error',req,res);
				} else {
					beam.template.view('update',req,res,result);
				}
			});
		});

		myaction = new Action('insert',['get','put','/:_id'],function(req,res){
			beam = this;
			if(!req.body || !req.body[beam.id]){
				beam.template.view('insert',req,res);
			} else {
				var doc = req.body[beam.id]
				var validate = beam.fields.validate(doc);
				if(validate.length>0){
					res.msgs.push(validate);
					beam.template.view('insert',req,res,doc);
				} else {
					doc = beam.fields.setter(doc);
					beam.db.insert(doc,function(error, result) {
						if(error){res.msgs.push(new msg("pillar.database.errors.insert","model",error);}
						if(!error && data[0]){
							res.msgs.push(new msg("pillar.actions.insert.ok","actions","",{req:req,beam:beam}));
							beam.actions.update.call(beam,req,res);
						} else {
							res.msgs.push(new msg("pillar.actions.insert.fail","actions","",{req:req,beam:beam}));
							beam.template.view('insert',req,res,doc);
						}
					});
				}
			}
		});

		myaction = new Action('update',['get','put','/:_id'],function(req,res){
			beam = this;
			var doc = req.body[beam.id]
			var validate = beam.fields.validate(doc);
			doc._id = id;
			if(validate.length>0){
				res.msgs.push(validate);
				beam.template.view('update',req,res,doc);
			} else {
				doc = panel.fields.setter(doc);
				beam.db.update(query,doc,function(error, result) {
					if(error){res.msgs.push(new msg("pillar.database.errors.update","model",error));}
					if(!error && data>0){
						res.msgs.push(new msg("pillar.actions.update.updated","actions","",{req:req,beam:beam}));
						beam.actions.update.call(beam,req,res);
					} else {
						res.msgs.push(new msg("pillar.actions.update.fail","actions","",{req:req,beam:beam}));
						beam.template.view('update',req,res,doc);
					}
				});
			}
		});

		myaction = new Action('remove',['get','put','/:_id'],function(req,res){
			beam = this;
			beam.db.remove({_id:id},function(error, result) {
				if(error){res.msgs.push(new msg("pillar.model.errors.remove","model",error));}
				if(!error && data>0){
					res.msgs.push(new msg("pillar.actions.remove.ok","actions","",{req:req,beam:beam}));
					beam.actions.list.call(beam,req,res);
				} else {
					res.msgs.push(new msg("pillar.actions.remove.fail","actions","",{req:req,beam:beam}));
					beam.actions.update.call(beam,req,res);
				}
			});
		});



		var myadminpanel = new pillar.panel({
			uname : 'samplepanel',
			db : mongodb,
			collection : 'system',
			pathbase: 'admin',
			router: {
				list:[''],
				one:[':id'],
				insert:['get','post',':id'],
				update:['get','put',':id'],
				remove:{methods:['get'],path:':id'},
				


				one:['']
				insert:{path:'/new',method:'put|get',controller]
				update:{methods:'put'},
				remove:{methods:delete,controller:'remove'}
			}
			//id:'setup',
			fields : new pillar.fieldset({
				title : 'Un fieldset',
				details : 'Completa los campos',
				fields : {
					field1 : new pillar.fields.text({
						label : 'Field1',
						details : 'Rellena este campo...'
					}),
					field2 : new pillar.fields.text({
						label : 'Field2',
						details : 'Rellena este campo...'
					}),
					reverse : new pillar.fields.reverse({
						label : 'Reverse',
						details : 'Este va invertido en la bdd'
					}),
					textarea : new pillar.fields.textarea({
						i18n : true,
						label : 'Textarea i18n',
						details : 'Un campo internacional'
					}),
					field3 : new pillar.fields.text({
						label : 'Field1',
						details : 'Rellena este campo...'
					}),
					subset : new pillar.fields.subset({
						label : 'Multiples campos',
						details : 'Esto es un subset',
						fields : {
							subfield1 : new pillar.fields.text({
								label : 'subField1',
								details : 'Rellena este campo...'
							}),
							subfield2 : new pillar.fields.text({
								label : 'subField2',
								details : 'Rellena este campo...'
							})
						}
					}),
					field4 : new pillar.fields.text({
						label : 'Field2',
						details : 'Rellena este campo...'

					}),
					reverse2 : new pillar.fields.reverse({
						label : 'Reverse',
						details : 'Este va invertido en la bdd'
					}),
					textarea2 : new pillar.fields.textarea({
						i18n : true,
						label : 'Textarea i18n',
						details : 'Un campo internacional'
					})
				}
			}),
			fieldsets : {},
		});

*/
	/*
	
	control de cache antes? que politica de cacheo utilizar?
	cuentan los banners y analitics en una de cache? Supongo que si
	hacer que un mismo usuario no refreque contenido al navegar a no ser que exita nuevo contenido
	pero el contenido cambia constantemenete, por ejemplo la portada, ¿mantener un cache de unos minutos?
	las paginas estaticas de información, login etc deberian tener su propia gestion de cache como propiedad
	quizas asociarlo a un action o un beam o ambos.
	Por ejemplo un beam que se encarga del sistema de archivos juagara con la cache de una forma mas o menos igual en 
	todos sus actions, si un fichero tieen la version gzip se envia al usuario tal cual con el noombre cambiado ya comprimido
	y si el usuario tiene el etag de la ultima modificacion y nos coincide con el timestamp del fichero pues lo mismo.
	utilizar etags por puntos para controlar a la vez la cache y el id de session.
	llevar en una tabla las rutas y la ultima fecha de edicion para controlar la cache quizas sea lo mas claro,
	si un fichero es modificado hay que declarar que ha sido modificado en la tabla de cache, si no se hace
	los usuarios que lo tengan cacheado no descargaran la nueva version (a no ser que hagana cmd+r), lo que hara
	que el sistema busque el fichero en su version gzip, si no esta lo comprimira y dira a la bdd que hay version gzip
	y la fecha de creacion, si hay version gzip y se debe enviar se aprovecha para actualizar la marca de cache en la bdd mirando la ultima
	fecha de modificacion dle archivo.


	hay que diferenciar entre varios tipos de caches:
	estatico de ficheros del propio sistema, 
	estatico de ficheros que son subidos por los usuarios
	de rutas que generan contenido por un beam+action
	de 301, redirecciones a otor path
	de 404, paginas que no existen

	tenemos un metodo de cache sencillo que es por etag, el etag simboliza:
	identificadorderutaenlabdd.identificadordelaultimavezqueesteelementofuemodificado
	un cleinte que tiene etag de un recurso recibira una resolucion rapida basada en bdd y global, si el etag coincide le damos un 304
	si el etag no coincide 
	un cliente que no tiene etag pasara por el router, el router validara que la ruta es correcta.

	casos:
	nuevo usuario solicita una ruta, no tiene etag por lo que buscamos la ruta en la tabla de rutas, no nos importa el ultimo las changue
	nos importa el codigo 200-301-404, si es un 404 pasamos el 404 (al crear cualquier contenido hay que revisar su cache de ruta) si es
	un 301 pasamos la redireccion directmaente, si es un 200 miramos si hay redireccion a un server con cache de este archivo (cuando un server cachea un
	un path que no existe coloca su nombre en el campo redirect) si hay redireccion pasamos un 301 al server concreto, con el etag, ese servidor si conserva cache
	pasara el contenido de momoria, si ya no tiene la cache la volvera a generar en base al lapse. Si no  hay redireccion este servidor se encargara
	de guardar en momeria el archivo y actualizar el registro de path.

	Un usuario con etag solicita un contenido, este contenido esta en la cache del servidor, idelemento.fechamod, se devuelve de cache ya
	que el elemento es el mismo. El codigo etag no esta en nuestra cache, buscamos el etag en la tabla de rutas, (ver parrafo anterior)

	Un recurso no esta en la tabla de rutas, el servidor que se encuentre el caso generara la ruta en la tabla.

	En cada caso los servidores actualizan el hits,lashit,lapse,average(diferencia entre lapses acumulada)

	finalmente el gestor de cache debe ser un middleware de los actions, el action tiene o no cache y en base a esto
	se utiliza el gestor de cache, ahorrando la consulta extra a la bdd para resolver rutas que son de contenido totlamnete dinamico.

	debe haber un beam de tipo static.

	Solcuion, pasamos la gestion de cache estatico a un beam especifico con acciones ya prepardas para esto.
	pasamos la gestion de cache de rutas a un midleware que tendran activados unos u otros actions.
	esto deja que cada servidor primero compruebe rutas y de no tener una resolucion directa dara un 404, pero las rutas estan en momoria
	y anidadas por lo que es mas eficiente.

	*/