var fs = require('fs');

Date.prototype.toYMDHMS = function toYMDHMS(milliseconds) {
	var YMDHMS = {
		year: this.getUTCFullYear(),
		month: this.getUTCMonth(),
		day: this.getUTCDate(),
		hours: this.getUTCHours(),
		minutes: this.getUTCMinutes(),
		seconds: this.getUTCSeconds(),
		milliseconds: ''
	};
	if(YMDHMS.month<10){YMDHMS.month='0'+YMDHMS.month;}
	if(YMDHMS.day<10){YMDHMS.day='0'+YMDHMS.day;}
	if(YMDHMS.hours<10){YMDHMS.hours='0'+YMDHMS.hours;}
	if(YMDHMS.minutes<10){YMDHMS.minutes='0'+YMDHMS.minutes;}
	if(YMDHMS.seconds<10){YMDHMS.seconds='0'+YMDHMS.seconds;}
	if(milliseconds){YMDHMS.milliseconds = this.getUTCMilliseconds();}
	return YMDHMS.year+YMDHMS.month+YMDHMS.day+YMDHMS.hours+YMDHMS.minutes+YMDHMS.seconds+YMDHMS.milliseconds;
};

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

var lCC = {log:'cyan',info:'green',alert:'bgYellow',error:'bgRed',warn:'bgRed'}; // lCC = loggerConsoleColors.
logger.addStore({
	id:'consoleFormat',
	handler: function(groups,lvl,msg,meta,next){
		var node = groups.join('.')+'.'+msg;
		var format = i18n(node,meta);

		if(format===node){
			console.log((lvl.toUpperCase()+'.'+groups.join('.')+': ')[(lCC[lvl]?lCC[lvl]:'white')],msg,'\n',meta,'\n');
		} else {
			console.log(format,meta.error || '');
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
				var line = (new Date()).toYMDHMS()+'\t'+lvl.toUpperCase()+'.'+groups.join('.')+'\t'+JSON.stringify(msg)+'\t'+JSON.stringify(meta)+'\r';
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


