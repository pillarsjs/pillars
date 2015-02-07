
// Setup Logger & Textualization
var logger = global.Logger = require('./lib/Logger');
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


// ---------- Pillars static directory -----------------

var paths = require('path');
var pillarsStatic = new Route({
	id:'pillarsStatic',
	path:'/pillars/*:path',
	directory:{
		path:paths.resolve(__dirname,'./static'),
		listing:true
	}
});
ENV.add(pillarsStatic);

// --------------- Polyfilling -------------------------

Number.isInteger = Number.isInteger || function(value) {
	return typeof value === "number" && isFinite(value) && Math.floor(value) === value;
};


