var textualization = require('./lib/textualization').languages(['es','en']);
var formwork = require('./lib/formwork');
var Pillar = require('./lib/Pillar');
var bricks = require('./lib/bricks');
var Beam = require('./lib/Beam');
var beams = require('./lib/beams');


var server = formwork().mongodb('primera')

textualization.load('crud','languages/crud');
textualization.load('system','languages/system');

var mymodel = new bricks.Schema('system',{
	server : server,
	collection : 'system',
	//t12n : './lib/crud.t12n'
	limit : 3,
	filter : ['_id','field1','field2'], 
	headers : ['_id','field1','field2','reverse']
})
	.addField(new bricks.Text('field1'))
	.addField(new bricks.Checkbox('fieldCheck'))
	.addField(new bricks.Checkboxes('fieldCheckboxes',{
		values : {
			'A':'Opción 1',
			'B':'Opción 2',
			'C':'Opción 3',
			'D':'Opción 4'	
		}
	}))
	.addField(new bricks.Radios('fieldRadios',{
		values : {
			'A':'Opción 1',
			'B':'Opción 2',
			'C':'Opción 3',
			'D':'Opción 4'	
		}
	}))
	.addField(new bricks.Select('field2',{
		values : {
			'A':'Opción 1',
			'B':'Opción 2',
			'C':'Opción 3',
			'D':'Opción 4'
		},
		keys : {
			see : 'manager',
			edit : 'manager'
		}
	}))
	.addField(new bricks.Time('fieldTime'))
	.addField(new bricks.Reference('fieldRef',{
		collection : 'system',
		headers : ['_id','_img','field1','field2','reverse']
	}))
	.addField(new bricks.Img('_img'))
	.addField(new bricks.Reverse('reverse'))
	.addField(new bricks.List('listFiles')
		.addField(new bricks.Img('file'))
		.addField(new bricks.Text('text'))
	)
	.addField(new bricks.List('list')
		.addField(new bricks.File('file'))
		.addField(new bricks.Text('field2'))
		.addField(new bricks.Reverse('reverse'))
	)
	.addField(new bricks.Editor('texti18n',{i18n : true}))
	.addField(new bricks.Text('field3'))
	.addField(new bricks.Subset('thesubset')
		.addField(new bricks.Text('subset1'))
		.addField(new bricks.Text('subset2'))
		.addField(new bricks.Text('subset3'))
	)
;

server.addPillar(new Pillar({
	id:'sample-pillar',
	path:'/system'
})
	.addBeam(new Beam('template',{account:true,schema:mymodel},beams.apiTemplate))
	.addBeam(new Beam('search',{path:'/api',account:true,schema:mymodel},beams.apiList))
	.addBeam(new Beam('get',{path:'/api/:_id',account:true,schema:mymodel},beams.apiGet))
	.addBeam(new Beam('update',{path:'/api/:_id',method:'put',upload:true,account:true,schema:mymodel},beams.apiUpdate))
	.addBeam(new Beam('insert',{path:'/api',method:'post',account:true,schema:mymodel},beams.apiInsert))
	.addBeam(new Beam('remove',{path:'/api/:_id',method:'delete',account:true,schema:mymodel},beams.apiRemove))
	.addBeam(new Beam('files',{path:'/files/*:path',method:'get',account:true,schema:mymodel,directory:'./uploads/system'},beams.apiFiles))
);




var usersSchema = new bricks.Schema('users',{
	server : server,
	collection : 'users',
	//t12n : './lib/crud.t12n'
	limit : 3,
	filter : ['_id','user','firstname','lastname'], 
	headers : ['_id','user','firstname','lastname','password']
})
	.addField(new bricks.Text('user'))
	.addField(new bricks.Text('firstname'))
	.addField(new bricks.Text('lastname'))
	.addField(new bricks.Text('password'))
	.addField(new bricks.Text('keys'))

server.addPillar(new Pillar({
	id:'users',
	path:'/users'
})
	.addBeam(new Beam('template',{account:true,schema:usersSchema},beams.apiTemplate))
	.addBeam(new Beam('search',{path:'/api',account:true,schema:usersSchema},beams.apiList))
	.addBeam(new Beam('get',{path:'/api/:_id',account:true,schema:usersSchema},beams.apiGet))
	.addBeam(new Beam('update',{path:'/api/:_id',method:'put',upload:true,account:true,schema:usersSchema},beams.apiUpdate))
	.addBeam(new Beam('insert',{path:'/api',method:'post',account:true,schema:usersSchema},beams.apiInsert))
	.addBeam(new Beam('remove',{path:'/api/:_id',method:'delete',account:true,schema:usersSchema},beams.apiRemove))
	.addBeam(new Beam('files',{path:'/files/*:path',method:'get',account:true,schema:usersSchema,directory:'./uploads/users'},beams.apiFiles))
);


server.addPillar(new Pillar({id:'login'})
	.addBeam(new Beam('login',{path:'/login',method:'(get|post)',session:true},function(){
		var gw = this;
		var redirect = gw.params.redirect;
		if(typeof gw.params.redirect === 'undefined' && gw.referer){
			redirect = gw.referer;
		}
		console.log(redirect);
		if(typeof gw.params.user === "string" && typeof gw.params.password === "string"){
			var login = {
				user : gw.params.user,
				password : gw.params.password
			};
			var users = gw.server.database.collection('users');
			users.findOne({user:login.user,password:login.password},function(error, result) {
				console.log('login check');
				if(!error && result){
					console.log('login ok');
					gw.session.user = result._id.toString();
					//gw.redirect(redirect);
					gw.render('templates/login.jade',{redirect:redirect,msg:'login.ok'});
				} else {
					gw.render('templates/login.jade',{redirect:redirect,msg:'login.fail'});
				}
			});
		} else {
			gw.render('templates/login.jade',{redirect:redirect});
		}
	}))
);

server.addPillar(new Pillar({id:'staticfiles'})
	.addBeam(new Beam('css',{path:'/css/*:path',directory:'./static/css'},beams.directory))
	.addBeam(new Beam('img',{path:'/img/*:path',directory:'./static/img'},beams.directory))
	.addBeam(new Beam('js',{path:'/js/*:path',directory:'./static/js'},beams.directory))
);

/*
var options = new bricks.Schema('options',{
	title : 'Opciones de sistema',
	details : 'Configura tu entorno Pillars',
	server : server,
	collection : 'config',
	panel : 'options'
})
	.addField(new bricks.Text('title',{
		label : 'Titulo',
		details : 'Titulo del sitio'
	}))
	.addField(new bricks.Text('description',{
		label : 'Descripción',
		details : 'Descripción corta del sitio'
	}))

server.addPillar(new Pillar({
	id:'sample-pillar',
	path:'/config'
})
	.addBeam(new Beam('options',{path:'/options',session:true,schema:mymodel},beams.apiPanelTemplate))
	.addBeam(new Beam('options-get',{path:'/options/api',session:true,schema:mymodel},beams.apiPanelGet))
	.addBeam(new Beam('options-update',{path:'/options/api',method:'put',upload:true,session:true,schema:mymodel},beams.apiPanelUpdate))

	.addBeam(new Beam('files',{path:'/files/*:path',method:'get',session:true,schema:mymodel,directory:'./files/config'},beams.apiFiles))
);
*/




/*

var timetag = ('TranslationTime').cyan;console.time(timetag);
var translations = [
	gw.t12n("general.actionbutton",{context:'post',action:'new',num:5}),
	gw.t12n("general.actionbutton",{context:'post',action:'new',num:1}),
	gw.t12n("general.welcome",{genre:'female',num:3}),
	gw.t12n("general.welcome",{num:2}),
	gw.t12n("general.goobye",{genre:'female',num:3}),
	gw.t12n("general.logout"),
	gw.t12n("general.error",{error:'crashhhh!!!'}),
	gw.t12n("general.you_have_new_messages",0),
	gw.t12n("general.you_have_new_messages",1),
	gw.t12n("general.you_have_new_messages",20),
	gw.t12n("general.noexist",2),
	gw.t12nc(["clasical basic"]),
	gw.t12nc(["clasical %s here %s ..."],["Translation","now"]),
	gw.t12nc(["You have 1 mail","You have %s mails"],[0]),
	gw.t12nc(["You have 1 mail","You have %s mails"],[1]),
	gw.t12nc(["You have 1 mail","You have %s mails"],[30]),
	gw.t12nc("You have 1 message",[0]),
	gw.t12nc("You have 1 message",[1]),
	gw.t12nc("You have 1 message",[30]),
	gw.t12nc(["You no have mails","You have 1 mail","You have %s mails"],[0]),
	gw.t12nc(["You no have mails","You have 1 mail","You have %s mails"],[1]),
	gw.t12nc(["You no have mails","You have 1 mail","You have %s mails"],[18]),
	gw.t12nc("You no have messages",0),
	gw.t12nc("You no have messages",1),
	gw.t12nc("You no have messages",18)
];
console.timeEnd(timetag);

*/

/* *
var memwatch = require('memwatch');
var hd = new memwatch.HeapDiff();
var leaks = [];
var stats = [];
memwatch.on('stats', function(_stats) {
	_stats.diff = hd.end();
	stats.push(_stats);
	hd = new memwatch.HeapDiff();
});
memwatch.on('leak', function(info) {
	leaks.push(info);
});
.addBeam(new Beam('stats',{path:'/stats'},function(){
	var gw = this;
	gw.send(stats);
}))
.addBeam(new Beam('leaks',{path:'/leaks'},function(){
	var gw = this;
	gw.send(leaks);
}))
/* */

/*

.addBeam(new Beam('download',{path:'/file',session:true},function(){
	var gw = this;
	gw.file('./uploads/exquisite0002.png','prueba.txt',false);
}))
.addBeam(new Beam('form',{path:'/form',method:'(get|post)',session:true,upload:true},function(){
	var gw = this;
	if(!gw.session.counter){gw.session.counter=0;}
	gw.session.counter++;

	var body = templates.render('./form.jade',{
		trace: util.format(gw),
		title:'Method test',
		h1:'Method testing:'
	});
	gw.send(body);	
}))

*/

//var filepath = path.replace(/[^\\\/]*$/,'');
//var filename = path.replace(/^.*[\\\/]/,'').replace(/\..*$/,'');
//var fileext = path.replace(/^.*[\.]/,'');

/* Emitter-mod *
var EventEmitter = require('events').EventEmitter;
EventEmitter.prototype.__emit = EventEmitter.prototype.emit;
EventEmitter.prototype.__onAll = function(type){console.log('{Event}--'+this.constructor.name+'('+type+')');}
EventEmitter.prototype.emit = function(){
	this.__onAll.apply(this,arguments);
	return this.__emit.apply(this,arguments);
}
/* */

/* *

function isUndefined(arg) {
  return arg === void 0;
}

function isString(arg) {
  return typeof arg === 'string';
}
function isBuffer(arg) {
  return arg instanceof Buffer;
}
function isObject(arg) {
  return typeof arg === 'object' && arg !== null;
}

/* */

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
