
// Setup Logger & Textualization
var logger = global.logger = require('./lib/Logger');
logger.addLvl('log','green').addLvl('info','green').addLvl('alert','orange').addLvl('error','red').addLvl('warn','red');
logger = logger.addGroup('pillars');

global.textualization = require('./lib/textualization');
global.i18n = textualization.i18n;

// Globals
global.Chain = require('./lib/Chain');

global.ENV = module.exports = require('./lib/ENV');
 global.addPlugin = ENV.addPlugin;
 global.getPlugin = ENV.getPlugin;
 global.removePlugin = ENV.removePlugin;
 global.addRoute = ENV.addRoute;
 global.getRoute = ENV.getRoute;
 global.removeRoute = ENV.removeRoute;
 global.encrypt = ENV.crypt.encrypt;
 global.decrypt = ENV.crypt.decrypt;

global.Plugin = require('./lib/Plugin');
global.Route = require('./lib/Route');
global.Gangway = require('./lib/Gangway');
global.renderer = require('./lib/renderer');

// Load builtin Plugins
var plugins = require('./lib/plugins');
for(var i in plugins){
	ENV.addPlugin(plugins[i]);
}
logger.info('plugins.loaded',{list:plugins});

// Modelator
global.modelator = require('./lib/modelator');

// Mailer
global.mailer = require('./lib/Mailer');

// Cron
//global.cron = require('./lib/Cron');

// Precasts
global.precasts = require('./lib/precasts');


// --------------------------------------------
// Pillars addons

var usersSchema = new modelator.Schema({
	collection : 'users',
	filter : ['_id','user','firstname','lastname'],
	indexes : [],
	uniques : [],
	headers : ['_id','user','firstname','lastname','password'],
	keys: {
		see: '',
		edit: '',
		manage: ''
	}
})
	.addField(new modelator.Text({id:'user'}))
	.addField(new modelator.Text({id:'firstname'}))
	.addField(new modelator.Text({id:'lastname'}))
	.addField(new modelator.Text({id:'password'}))
	.addField(new modelator.Text({id:'keys'}))
;

var usersBackend = modelator.schemaAPI(new Route({id:'usersBackend',path:'/users'}),usersSchema);

ENV
	.add(precasts.pillarsLogin)
	.add(precasts.pillarsStatic)
	.add(usersBackend)
;







