
var pillars = require('./app.js');
var textualization = pillars.textualization;
var Beam = pillars.Beam;
var Pillar = pillars.Pillar;
var modelator = pillars.modelator;
var precasts = pillars.precasts;

var app = new pillars.App();
app.languages = ['es','en'];
app.database = 'primera';
app.start();



textualization.load('languages/system');
var systemModel = new modelator.Schema('system',{
	app : app,
	collection : 'system',
	limit : 3,
	filter : ['_id','field1','field2'], 
	headers : ['_id','field1','field2','reverse']
})
	.addField('Text','field1')
	.addField('Checkbox','fieldCheck')
	.addField('Checkboxes','fieldCheckboxes',{
		values : ['A','B','C','D']
	})
	.addField('Radios','fieldRadios',{
		values : ['A','B','C','D']
	})
	.addField('Select','field2',{
		values : ['A','B','C','D'],
		keys : {
			//see : 'manager',
			//edit : 'manager'
		}
	})
	.addField('Time','fieldTime')
	.addField('Reference','fieldRef',{
		collection : 'system',
		headers : ['_id','_img','field1','field2','reverse']
	})
	.addField('Img','_img')
	.addField('Reverse','reverse')
	.addField(new modelator.List('listFiles')
		.addField('Img','file')
		.addField('Text','text')
	)
	.addField(new modelator.List('list')
		.addField('File','file')
		.addField('Text','field2')
		.addField('Reverse','reverse')
	)
	.addField('Editor','texti18n',{i18n : true})
	.addField('Text','field3')
	.addField(new modelator.Subset('thesubset')
		.addField('Text','subset1')
		.addField('Text','subset2')
		.addField('Text','subset3')
	)
;


var systemPillar = new Pillar({
	id:'sample-pillar',
	path:'/system'
});
precasts.crudBeams(systemPillar,systemModel);
app.add(systemPillar);






var usersSchema = new modelator.Schema('users',{
	app : app,
	collection : 'users',
	limit : 3,
	filter : ['_id','user','firstname','lastname'], 
	headers : ['_id','user','firstname','lastname','password']
})
	.addField('Text','user')
	.addField('Text','firstname')
	.addField('Text','lastname')
	.addField('Text','password')
	.addField('Text','keys')

var systemPillar = new Pillar({
	id:'users',
	path:'/users'
});
precasts.crudBeams(systemPillar,usersSchema);
app.add(systemPillar);


app.add(new Pillar({id:'login'})
	.add(new Beam({id:'login',path:'/login',method:'(get|post)',session:true},function(){
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
			var users = gw.app.database.collection('users');
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

app.add(new Pillar({id:'staticfiles'})
	.add(new Beam({id:'css',path:'/css/*:path',directory:'./static/css'},precasts.directory))
	.add(new Beam({id:'img',path:'/img/*:path',directory:'./static/img'},precasts.directory))
	.add(new Beam({id:'js',path:'/js/*:path',directory:'./static/js'},precasts.directory))
);







