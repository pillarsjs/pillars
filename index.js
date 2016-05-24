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
var templated = global.templated = require('templated');
var crier = global.crier = require('crier').addGroup('pillars');
var i18n = global.i18n = require('textualization');
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



// Check log && temp directory
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



// Setup log file
var logFile = false;
function logFileLoader(){
  if(logFile){
    logFile.end();
  }
  var path = logsDir+'/'+(new Date()).format('{YYYY}{MM}{DD}')+'.log';
  logFile = fs.createWriteStream(path,{flags: 'a'})
    .on('open',function(fd){
      crier.log('logfile.ok',{path:path});
    })
    .on('error',function(error){
      crier.warn('logfile.error',{path:path,error:error});
    })
  ;
}

function logFileStart(){
  logFileLoader();

  crier.rules.add({
    id:'logFile',
    rule:function(stores,location,lvl,msg,meta){
      if(['log','alert','error','warn'].indexOf(lvl)>=0){
        stores.push('logFile');
      }
    }
  });
  crier.rules.add({
    id:'consoleLogs',
    rule:function(stores,location,lvl,msg,meta){
      if(lvl === 'log' && !pillars.config.consoleLog){
        stores.splice(stores.indexOf('console'),1);
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
}



// Load builtin Plugins
var plugins = [
  require('./plugins/langPath.js'),
  require('./plugins/encoding.js'),
  require('./plugins/favicon.js'),
  require('./plugins/router.js'),
  require('./plugins/maxUploadSize.js'),
  require('./plugins/CORS.js'),
  require('./plugins/OPTIONS.js'),
  require('./plugins/sessions.js'),
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


// Add default template engines support to Templated (TODO)
/*
var jade = require('jade');
templated.addEngine('jade',function compiler(source,path){
  return jade.compile(source,{filename:path,pretty:false,debug:false,compileDebug:true});
});

var handlebars = require("handlebars");
templated.addEngine('hbs',function compiler(source,path){
  return handlebars.compile(source);
});

var hogan = require("hogan.js");
templated.addEngine('hgn',function compiler(source,path){
  return hogan.compile(source);
});

// Simple JavaScript Templating
// John Resig - http://ejohn.org/ - MIT Licensed
// From: http://ejohn.org/blog/javascript-micro-templating/
var jmt = (function(){
  var cache = {};
  return function tmpl(str, data){
    // Figure out if we're getting a template, or if we need to
    // load the template - and be sure to cache the result.
    var fn = new Function("obj",
        "var p=[],print=function(){p.push.apply(p,arguments);};" +
       
        // Introduce the data as local variables using with(){}
        "with(obj){p.push('" +
       
        // Convert the template into pure JavaScript
        str
          .replace(/[\r\t\n]/g, " ")
          .split("<%").join("\t")
          .replace(/((^|%>)[^\t]*)'/g, "$1\r")
          .replace(/\t=(.*?)%>/g, "',$1,'")
          .split("\t").join("');")
          .split("%>").join("p.push('")
          .split("\r").join("\\'")
      + "');}return p.join('');");
   
    // Provide some basic currying to the user
    return data ? fn( data ) : fn;
  };
})();
templated.addEngine('jmt',function compiler(source,path){
  return jmt.compile(source);
});

var nunjucks = require("nunjucks");
templated.addEngine('njk',function compiler(source,path){
  return nunjucks.compile(source);
});

var swig = require("swig");
templated.addEngine('swg',function compiler(source,path){
  return swig.compile(source);
});
*/
