var fs = require('fs');
var decycler = require('./lib/decycler');
var YMDHMS = require('./lib/YMDHMS');

// Setup Logger & Textualization
var logger = global.Logger = require('./lib/Logger');
logger.addLvl('log').addLvl('info').addLvl('alert').addLvl('error').addLvl('warn');
logger = logger.addGroup('pillars');

global.textualization = require('./lib/textualization');
global.i18n = textualization.i18n;


logger.addRule({
	id:'console',
	rule:function(stores,groups,lvl,msg,meta){
		stores.push('consoleFormat');
	}
});

var colors = require('colors');
var lCC = {log:'cyan',info:'green',alert:'bgYellow',error:'bgRed',warn:'bgRed'}; // lCC = loggerConsoleColors.
logger.addStore({
	id:'consoleFormat',
	handler: function(groups,lvl,msg,meta,next){
		var node = groups.join('.')+'.'+msg;
		var format = i18n(node,meta);

		if(format===node){
			console.log(YMDHMS((new Date()),true,true).grey,(lvl.toUpperCase()+'.'+groups.join('.')+': ')[(lCC[lvl]?lCC[lvl]:'white')],msg,'\n',meta,'\n');
		} else {
			console.log(YMDHMS((new Date()),true,true).grey,format);
		}
		next();
	}
});

var pillarsLog = fs.createWriteStream('./pillars.log',{flags: 'a'})
	.on('open',function(fd){
		
		logger.addRule({
			id:'console',
			rule:function(stores,groups,lvl,msg,meta){
				if(['log','alert','error','warn'].indexOf(lvl)>=0){
					stores.push('logFile');
				}
			}
		});

		logger.addStore({
			id:'logFile',
			handler: function(groups,lvl,msg,meta,next){
				var line = YMDHMS((new Date()),true,true)+'\t'+lvl.toUpperCase()+'\t'+groups.join('.')+'\t'+JSON.stringify(decycler(msg))+'\t'+JSON.stringify(decycler(meta))+'\n';
				pillarsLog.write(line);
				next();
			}
		});

	})
	.on('error',function(error){
		logger.warn('logfile.error',{error:error});
	})
;

// Globals
global.Chain = require('./lib/Chain');

global.ENV = module.exports = require('./lib/ENV');
 global.addPlugin = ENV.addPlugin.bind(ENV);
 global.getPlugin = ENV.getPlugin.bind(ENV);
 global.removePlugin = ENV.removePlugin.bind(ENV);
 global.addRoute = ENV.addRoute.bind(ENV);
 global.getRoute = ENV.getRoute.bind(ENV);
 global.removeRoute = ENV.removeRoute.bind(ENV);
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


