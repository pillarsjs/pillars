// jshint strict:true, node:true, camelcase:true, curly:true, maxcomplexity:15, newcap:true
"use strict";

var fs = require('fs');
var paths = require('path');
var colors = require('colors');
var pillarsPackage = require('./package');


// Splash screen...
console.log(("\n\n"+
"      ###########################################################\n"+
"      ##·······················································##\n"+
"      ##·········##############···###···##############·········##\n"+
"      ##········###·········###···###···###·········###········##\n"+
"      ##········###·········###···###···###·········###········##\n"+
"      ##·········###········###···###···###········###·········##\n"+
"      ##···········####·····###···###···###·····####···········##\n"+
"      ##····················###···###···###····················##\n"+
"      ##····················###···###···###····················##\n"+
"      ##····················###···###···###····················##\n"+
"      ##····················###···###···###····················##\n"+
"      ##····················###···###···###····················##\n"+
"      ##····················###···###···###····················##\n"+
"      ##····················###···###···###····················##\n"+
"      ##····················###···###···###····················##\n"+
"      ##···········####·····###···###···###·····####···········##\n"+
"      ##·········###········###···###···###········###·········##\n"+
"      ##········###·········###···###···###·········###········##\n"+
"      ##········###·········###···###···###·········###········##\n"+
"      ##·········##############···###···##############·········##\n"+
"      ##·······················································##  "+pillarsPackage.description+"\n"+
"      ###########################################################  v"+pillarsPackage.version+"\n\n"
).replace(/·/g,' '.bgRed).replace(/#/g,' '.bgWhite));


// Pillars base export (for cyclical requires)
var pillars = module.exports = {
  debug: true
};


// Pillars version
Object.defineProperty(pillars,"version",{
  enumerable : true,
  get : function(){return pillarsPackage.version;}
});


// Path & resolve
pillars.path = __dirname;
pillars.resolve = function(path){
  return paths.resolve(pillars.path,path);
};


// Configuration propierties & config method
pillars.config = {
  cors: false,
  maxUploadSize: 5*1024*1024,
  maxCacheFileSize : 5*1024*1024,
  cacheMaxSamples : 100,
  cacheMaxSize : 250*1024*1024,
  cacheMaxItems : 5000,
  fileMaxAge : 7*24*60*60,
  renderReload: false
};

pillars.configure = function(config){
  for(var i=0,k=Object.keys(config),l=k.length;i<l;i++){
    pillars.config[k[i]]=config[k[i]];
  }
  return pillars;
};


// Dependencies, globals...
global.templated = require('templated');
global.crier = require('crier');
var crier = global.crier.addGroup('pillars');
crier.constructor.console.language = 'en';
var i18n = global.textualization = require('textualization');
i18n.load('pillars',paths.join(__dirname,'./languages'));
i18n.languages = ['en'];
var Procedure = global.Procedure = require('procedure');
var ObjectArray = global.ObjectArray = require('objectarray');
var Scheduled = global.Scheduled = require('scheduled');
require('date.format');
require('string.format');
require('json.decycled');


// Pillars components
var Gangway = global.Gangway = require('./lib/Gangway');
var Route = global.Route = require('./lib/Route');
var Plugin = global.Plugin = require('./lib/Plugin');
var HttpService = global.HttpService = require('./lib/HttpService');


// Plugins & Routes & Services
pillars.plugins = new ObjectArray();
pillars.routes = new ObjectArray();
pillars.services = new ObjectArray();


// Setup log file
function logFileLoader(){
  if(pillars.logFile){
    pillars.logFile.end();
  }
  pillars.logFile = fs.createWriteStream('./logs/'+(new Date()).format('{YYYY}{MM}{DD}')+'.log',{flags: 'a'})
    .on('open',function(fd){
      crier.log('logfile.ok');
    })
    .on('error',function(error){
      crier.warn('logfile.error',{error:error});
    })
  ;
}
logFileLoader();

crier.rules.add({
  id:'logFile',
  rule:function(stores,location,lvl,msg,meta){
    if(['log','alert','error','warn'].indexOf(lvl)>=0){
      stores.push('logFile');
    }
  }
});
crier.stores.add({
  id:'logFile',
  handler: function(location,lvl,msg,meta,done){
    var line = (new Date()).format('{YYYY}/{MM}/{DD} {hh}:{mm}:{ss}:{mss}',true)+'\t'+lvl.toUpperCase()+'\t'+location.join('.')+'\t'+JSON.decycled(msg)+'\t'+JSON.decycled(meta)+'\n';
    pillars.logFile.write(line);
    done.result(line);
  }
});

pillars.logCleaner = new Scheduled({
  id: 'logCleaner',
  pattern: '0 0 *',
  task: logFileLoader
}).start();


// Load builtin Plugins
var plugins = [
  require('./plugins/langPath.js'),
  require('./plugins/encoding.js'),
  require('./plugins/router.js'),
  require('./plugins/maxUploadSize.js'),
  require('./plugins/CORS.js'),
  require('./plugins/OPTIONS.js'),
  //require('./plugins/sessions.js'),
  require('./plugins/directory.js'),
  require('./plugins/bodyReader.js')
];

for(var i=0,l=plugins.length;i<l;i++){
  pillars.plugins.insert(plugins[i]);
}
crier.info('plugins.loaded',{list:pillars.plugins.keys()});


// Pillars handler
pillars.handler = function pillarsHandler(req,res){
  var gw = new Gangway(req,res);
  var pluginHandling = new Procedure();
  for(var i=0,l=pillars.plugins.length;i<l;i++){
    var plugin = pillars.plugins[i];
    pluginHandling.add(plugin.id,plugin.handler,gw);
  }
  pluginHandling.launch(function(errors){
    if(errors){
      gw.error(500,errors[0]);
    } else if(gw.routing && gw.routing.handlers && gw.routing.handlers.length>0){
      var routeHandling = new Procedure();
      var routeNames = ObjectArray.prototype.keys.call(gw.routing.routes).join('.');
      for(var i=0,l=gw.routing.handlers.length;i<l;i++){
        var handler = gw.routing.handlers[i];
        var handlerName = routeNames+".";
        handlerName += handler.name?handler.name:i+1===l?"handler":"middleware["+i+"]";
        routeHandling.add(handlerName,handler,gw);
      }
      routeHandling.launch(function(errors){
        if(errors){
          gw.error(500,errors[0]);
        }
      });
    } else {
      gw.error(404);
    }
  });
};


// Default http service
pillars.services.insert(new HttpService({id:'http'}));


// Shutdown control
var shuttingdown = false;
var shuttingdownCounter = 0;
process.on('SIGINT', function() {
  if(!shuttingdown){
    shuttingdown = true;
    var procedure = new Procedure();
    var i,l;
    for(i=0,l=pillars.services.length;i<l;i++){
      if(typeof pillars.services[i].stop === 'function'){
        procedure.add(pillars.services[i].stop);
      }
    }
    Scheduled.close();
    procedure.race().launch(function(errors){
      if(errors){
        crier.error('shutdown.errors',{errors:errors},processExit);
      } else {
        crier.info('shutdown.ok',{},processExit);
      }
    });
  } else {
    shuttingdownCounter++;
    crier.info('shuttingdown');
    if(shuttingdownCounter>=3){
      crier.info('forced-shuttingdown',{},processExit);
    }
  }
});

function processExit(){
  setTimeout(process.exit,500);
}







