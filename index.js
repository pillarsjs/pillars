// jshint strict:true, node:true, camelcase:true, curly:true, maxcomplexity:15, newcap:true
"use strict";

global.modulesCache = global.modulesCache || {};
if(global.modulesCache.pillars){
  module.exports = global.modulesCache.pillars;
  return;
}

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
var pillars = module.exports = global.modulesCache.pillars = {
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



// Get argv > args
var arvRegexp = /^([\w]+)\=(.*)$/;
pillars.args = {};
for(var i=0,l=process.argv.length;i<l;i++){
  if(arvRegexp.test(process.argv[i])){
    var m = arvRegexp.exec(process.argv[i]);
    pillars.args[m[1]]=m[2];
  }
}



// Configuration propierties & config method
pillars.config = {
  debug: false,
  logFile: false,
  cors: false,
  maxUploadSize: 5*1024*1024,
  maxCacheFileSize : 5*1024*1024,
  cacheMaxSamples : 100,
  cacheMaxSize : 250*1024*1024,
  cacheMaxItems : 5000,
  fileMaxAge : 7*24*60*60,
  renderReload: false,
  favicon: pillars.resolve('./favicon.ico')
};

pillars.configure = function(config){
  for(var i=0,k=Object.keys(config),l=k.length;i<l;i++){
    pillars.config[k[i]]=config[k[i]];
  }
  return pillars;
};



// Dependencies, globals...
var templated = global.templated = pillars.templated = require('templated');
var crier = global.crier = pillars.crier = require('crier').addGroup('pillars');
var i18n = global.i18n = pillars.i18n = require('textualization');
i18n.load('pillars',paths.join(__dirname,'./languages'));
i18n.languages = ['en'];
var Procedure = global.Procedure = require('procedure');
var ObjectArray = global.ObjectArray = require('objectarray');
var Scheduled = global.Scheduled = pillars.scheduled = require('scheduled');
require('date.format');
require('string.format');
require('json.decycled');

// Templated default engines
templated.loadDefaultEngines();

// Pillars components
var Gangway = global.Gangway = require('./lib/Gangway');
var Route = global.Route = require('./lib/Route');
var Middleware = global.Middleware = require('./lib/Middleware');
//var Plugin = global.Plugin = require('./lib/Middleware'); // For old name support
var HttpService = global.HttpService = require('./lib/HttpService');



// Middleware & Routes & Services
pillars.middleware = new ObjectArray();
pillars.routes = new ObjectArray();
pillars.services = new ObjectArray();



// Crier default rule
crier.rules.add({
  id:'default',
  rule:function(stores,location,lvl,msg,meta){
    var consoleLogLevels = ['alert','error','warn'];
    if(pillars.config.debug){
      consoleLogLevels.push('log','info');
    }
    var haveConsoleStore = stores.indexOf("console");
    if(haveConsoleStore>=0){
      stores.splice(haveConsoleStore,1);
    }
    if(consoleLogLevels.indexOf(lvl)>=0){
      stores.push('console');
    }
  }
});




// Setup log file
if(pillars.config.logfile){
  // Check log directory
  var logsDir = "./logs";
  fs.stat(logsDir, function (error, stats){
    if(error){
      fs.mkdir(logsDir,function(error){
        if(error){
          crier.error('logfile.dir.error',{path: logsDir});
        } else {
          crier.info('logfile.dir.ok',{path: logsDir});
          logFileStart();
        }
      });
    } else if(!stats.isDirectory()){
      crier.info('logfile.dir.exists',{path: logsDir});
    } else {
      crier.info('logfile.dir.ok',{path: logsDir});
      logFileStart();
    }
  });

  var logFile = false;
  var logFileLoader = function(){
    if(logFile){
      logFile.end();
    }
    var path = logsDir+'/'+(new Date()).format('{YYYY}{MM}{DD}')+'.log';
    logFile = fs.createWriteStream(path,{flags: 'a'})
      .on('open',function(fd){
        crier.info('logfile.ok',{path:path});
      })
      .on('error',function(error){
        crier.warn('logfile.error',{path:path,error:error});
      })
    ;
  };

  var logFileStart = function(){
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
        logFile.write(line);
        done.result(line);
      }
    });

    new Scheduled({
      id: 'logCleaner',
      pattern: '0 0 *',
      task: logFileLoader
    }).start();
  };
}



// Load builtin Middleware
var middleware = [
  require('./middleware/langPath.js'),
  require('./middleware/encoding.js'),
  require('./middleware/favicon.js'),
  require('./middleware/router.js'),
  require('./middleware/maxUploadSize.js'),
  require('./middleware/CORS.js'),
  require('./middleware/OPTIONS.js'),
  require('./middleware/sessions.js'),
  require('./middleware/directory.js'),
  require('./middleware/bodyReader.js')
];

for(var i=0,l=middleware.length;i<l;i++){
  pillars.middleware.insert(middleware[i]);
}
crier.info('middleware.loaded',{list:pillars.middleware.keys()});



// Pillars handler
pillars.handler = function pillarsHandler(req,res){
  var gw = new Gangway(req,res);
  var middlewareHandling = new Procedure();
  for(var i=0,l=pillars.middleware.length;i<l;i++){
    var middleware = pillars.middleware[i];

    if(middleware.handler.isConnect){
      middlewareHandling.add(middleware.id,middleware.handler,gw.req,gw.res);
    } else {
      middlewareHandling.add(middleware.id,middleware.handler,gw);
    }
  }
  // Express binds (TODO: Move this as formal Middleware)
  middlewareHandling.launch(function(errors){
    if(errors){
      gw.error(500,errors[0]);
    } else if(gw.routing && gw.routing.handlers && gw.routing.handlers.length>0){
      var routeHandling = new Procedure();
      var routeNames = ObjectArray.prototype.keys.call(gw.routing.routes).join('.');
      for(var i=0,l=gw.routing.handlers.length;i<l;i++){
        var handler = gw.routing.handlers[i];
        var handlerName = routeNames+".";
        handlerName += handler.name?handler.name:i+1===l?"handler":"middleware["+i+"]";
        if(handler.isConnect){
          routeHandling.add(handlerName,handler,gw.req,gw.res);
        } else {
          routeHandling.add(handlerName,handler,gw);
        }
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
    crier.info('shutdown.shuttingdown');
    var procedure = new Procedure();
    var i,l;
    for(i=0,l=pillars.services.length;i<l;i++){
      if(typeof pillars.services[i].stop === 'function'){
        procedure.add(pillars.services[i].stop.bind(pillars.services[i]));
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
    if(shuttingdownCounter>=3){
      crier.info('shutdown.forced',{},processExit);
    }
  }
});

function processExit(){
  setTimeout(process.exit,500);
}








var fileCache = pillars.cache = {
  size:0,
  items:{}, // item: {uses:[],average:AverageTimeStamp}
  get : function(id,callback){
    var item = fileCache.items[id];
    if(typeof item !== 'undefined'){
      var uses = item.uses;
      uses.push(Date.now());
      if(uses.length>=pillars.config.cacheMaxSamples){
        uses.splice(0,uses.length-pillars.config.cacheMaxSamples);
      }
      // All samples sum
      var timesum = 0;
      for(var i=0,l=uses.length;i<l;i++){
        timesum+=uses[i];
      }
      // Average timestamp of all samples for this item
      item.average = Math.round(timesum/uses.length);

      if(Date.now()<=item.timeStamp+5000){
        callback(null,item);
      } else {
        fileCache.file(id,callback,item);
      }
    } else {
      fileCache.file(id,callback);
    }
  },
  file: function(id,callback,update){
    var item = update?update:{};
    
    fs.stat(id, function(error,stats){
      if(error){
        callback(error);
      } else if(stats.size > pillars.config.maxCacheFileSize){
        delete item.identity;
        delete item.deflate;
        delete item.gzip;
        delete fileCache.items[id];
        callback(null,{stats:stats});
      } else {
        item.timeStamp = Date.now();
        if(!update || stats.mtime>item.stats.mtime){
          fs.readFile(id, function(error,data){
            if(error){
              callback(error);
            } else {
              fileCache.items[id] = item;
              fileCache.size += stats.size;
              item.uses = item.uses || [Date.now()];
              item.stats = stats;
              delete item.identity;
              delete item.deflate;
              delete item.gzip;
              item.identity = data;
              callback(null,item);
            }
          });
        } else {
          callback(null,item);
        }
      }
    });
  },
  cleaner: function(){
    // Get a list of items ids/paths
    var rank = Object.keys(fileCache.items);
    // Sort by average.
    rank.sort(function(a, b) {
      a = fileCache.items[a].average;
      b = fileCache.items[b].average;
      if(typeof a === 'undefined'){return -1;}
      if(typeof b === 'undefined'){return 1;}
      return a-b;
    });
    // Reduce while
    while(fileCache.size>pillars.config.cacheMaxSize || fileCache.items.length>pillars.config.cacheMaxItems){
      var removed = rank.shift();
      var size = fileCache.items[removed].stats.size;
      delete fileCache.items[removed];
      fileCache.size -= size;
    }
    crier.info('fileCache.cacheCleaned');
  }
};

fileCache.cleanerJob = new Scheduled({
  id: 'fileCacheCleaner',
  pattern: '*',
  task: fileCache.cleaner
}).start();
