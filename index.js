// jshint strict:true, node:true, camelcase:true, curly:true, maxcomplexity:15, newcap:true
"use strict";

var fs = require('fs');
var paths = require('path');
var colors = require('colors');



// Splash screen...
console.log(("\n\n"+
"------###########################################################\n"+
"------##                                                       ##\n"+
"------##         ##############   ###   ##############         ##\n"+
"------##        ###         ###   ###   ###         ###        ##\n"+
"------##        ###         ###   ###   ###         ###        ##\n"+
"------##         ###        ###   ###   ###        ###         ##\n"+
"------##           ####     ###   ###   ###     ####           ##\n"+
"------##                    ###   ###   ###                    ##\n"+
"------##                    ###   ###   ###                    ##\n"+
"------##                    ###   ###   ###                    ##\n"+
"------##                    ###   ###   ###                    ##\n"+
"------##                    ###   ###   ###                    ##\n"+
"------##                    ###   ###   ###                    ##\n"+
"------##                    ###   ###   ###                    ##\n"+
"------##                    ###   ###   ###                    ##\n"+
"------##           ####     ###   ###   ###     ####           ##\n"+
"------##         ###        ###   ###   ###        ###         ##\n"+
"------##        ###         ###   ###   ###         ###        ##\n"+
"------##        ###         ###   ###   ###         ###        ##\n"+
"------##         ##############   ###   ##############         ##\n"+
"------##                                                       ##\n"+
"------###########################################################\n\n"
).replace(/ /g,' '.bgRed).replace(/#/g,' '.bgWhite).replace(/-/g,' '));



// Pillars base export (for cyclical requires)
var pillars = module.exports = {
  debug: true
};

// Pillars version
var pillarsPackage = require('./package');
Object.defineProperty(pillars,"version",{
  enumerable : true,
  get : function(){return pillarsPackage.version;}
});

// Path & resolve
pillars.path = paths.resolve(__dirname,'../');
pillars.resolve = function(path){
  return paths.resolve(pillars.path,path);
};



// Dependencies, globals...
var crier = require('crier').addGroup('pillars');
crier.constructor.console.language = 'en';
var i18n = require('textualization');
i18n.load('pillars',paths.join(__dirname,'./languages'));
crier.constructor.console.format = function(text,meta,lang){
  return i18n(text,meta,lang);
};
i18n.languages = ['en'];
var templated = require('templated');
var Procedure = global.Procedure = require('procedure');
var ObjectArray = global.ObjectArray = require('objectarray');
var Jailer = global.Jailer = require('jailer');
var Scheduled = global.Scheduled = require('scheduled');
require('date.format');
require('string.format');
require('json.decycled');



// Setup log file
var pillarsLog = fs.createWriteStream('./pillars.log',{flags: 'a'})
  .on('open',function(fd){
    crier.log('logfile.ok');
  })
  .on('error',function(error){
    crier.warn('logfile.error',{error:error});
  })
;

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
    pillarsLog.write(line);
    done.result(line);
  }
});



// Setup Templated .jade support.
var jade = require('jade');
var marked = require('marked');
var hljs = require('highlight.js');
function hljsFix(str,lang){
  var result;
  if(lang){
    result = hljs.highlight(lang,str,true).value;
  } else {
    result = hljs.highlightAuto(str).value;
  }
  result = result.replace(/^((<[^>]+>|\s{4}|\t)+)/gm, function(match, r) {
    return r.replace(/\s{4}|\t/g, '  ');
  });
  result = result.replace(/\n/g, '<br>');
  return '<pre class="highlight"><code>'+result+'</pre></code>';
}
jade.filters.highlight = function(str,opts){
  return hljsFix(str,opts.lang);
};
marked.setOptions({
  highlight: function (code,lang) {
    return hljsFix(code,lang);
  }
});
templated.addEngine('jade',function compiler(source,path){
  return jade.compile(source,{filename:path,pretty:true,debug:false,compileDebug:true});
});



// Pillars components
var Gangway = global.Gangway = require('./lib/gangway');
var Route = global.Route = require('./lib/Route');
var Plugin = global.Plugin = require('./lib/Plugin');



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

pillars.config.staticTemplate = paths.join(__dirname,'./templates/directory.jade');
templated.load(pillars.config.staticTemplate);

pillars.config.errorTemplate = paths.join(__dirname,'./templates/error.jade');
templated.load(pillars.config.errorTemplate);

pillars.configure = function(config){
  for(var i=0,k=Object.keys(config),l=k.length;i<l;i++){
    pillars.config[k[i]]=config[k[i]];
  }
  return pillars;
};



// Plugins & Routes
pillars.plugins = new ObjectArray();
pillars.routes = new ObjectArray();



// Load builtin Plugins
var plugins = [
  require('./plugins/langPath.js'),
  require('./plugins/encoding.js'),
  require('./plugins/router.js'),
  require('./plugins/maxUploadSize.js'),
  require('./plugins/CORS.js'),
  require('./plugins/OPTIONS.js'),
  require('./plugins/sessions.js'),
  require('./plugins/accounts.js'),
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


// HTTP Server
var http = require('http');
var https = require('https');
pillars.servers = new ObjectArray();
pillars.createServer = createServer;
function createServer(options){
  var server = options?https.createServer(options):http.createServer();
  pillars.servers.insert(server);
  var config = server.config = {};
  server
    .on('error',function(error){
      server.running = false;
      crier.error('server.error',{config:config,error:error});
    })
    .on('listening',function(){
      server.running = true;
      server.timer=Date.now();
      crier.info('server.listening',{config:config});
    })
    .on('close',function(){
      server.running = false;
      crier.warn('server.closed',{config:config,time:parseInt((Date.now()-server.timer)/1000/60*100, 10)/100});
    })
    .on('request',pillars.handler)
  ;
  server.start = function(params,callback){
    if(typeof params === 'function'){
      callback = params;
      params = {};
    }
    if(typeof params === 'string' || typeof params === 'number'){
      params = {port:parseInt(params, 10)};
    }
    params = params || {};
    config.port = params.port || config.port || 80;
    config.timeout = params.timeout || config.timeout || 30*1000;
    config.hostname = params.hostname || config.hostname;
    
    server.stop(function(error){
      if(!error){
        server.timeout = config.timeout;
        server.listen(config.port,config.hostname,callback);
      } else if(callback) {
        callback(error);
      }
    });
    return server;
  };
  server.stop = function(callback){
    if(server.running){
      server.close(function(error){
        if(error){
          crier.error('server.error',{config:config,error:error});
        }
        if(callback){
          callback();
        }
      });
    } else if(callback){
      callback();
    }
    return server;
  };
  return server;
}


// MongoDB
var MongoClient = require('mongodb').MongoClient;
pillars.mongos = new ObjectArray();
pillars.createMongoConnection = createMongoConnection;
function createMongoConnection(){
  var connection = new MongoClient();
  pillars.mongos.insert(connection);
  connection.params = undefined;
  connection.database = undefined;
  connection.start = function(params,callback){
    var client = this.client;
    if(typeof params === 'function'){
      callback = params;
      params = {};
    }
    if(typeof params === 'string'){
      params = {database:params};
    }
    params = params || {};

    if(!params.url){
      params.port = params.port || 27017;
      params.hostname = params.hostname || 'localhost';
      params.database = params.database || 'pillars';

      var url = 'mongodb://';
      if(params.user){
        url += params.user;
        if(params.password){
          url += ':'+params.password;
        }
        url += '@';
      }
      url += params.hostname;
      url += ':'+params.port;
      if(params.database){
        url += '/'+params.database;
      }
      params.url = url;
    } 

    params.server = params.server || {};
    params.server.logger = params.server.logger || crier.addGroup('mongo.server');
    params.server.auto_reconnect = params.server.auto_reconnect!==false;

    connection.stop(function(error){
      if(!error){
        connection.connect(params.url, function(error, db) {
          if(error) {
            crier.error('mongo.error',{params:params,error:error});
          } else {
            connection.database = db;
            connection.params = params;
            crier.info('mongo.connect',{params:params});
          }
          if(callback){
            callback(error);
          }
        });
      } else if(callback){
        callback(error);
      }
    });
    return connection;
  };
  connection.stop = function(callback){
    if(connection.database){
      connection.database.close(function(error) {
        if(!error){
          connection.database = undefined;
          crier.info('mongo.disconnect',{params:connection.params});
        } else {
          crier.error('mongo.error',{params:connection.params,error:error});
        }
        if(callback){
          callback(error);
        }
      });
    } else if(callback) {
      callback();
    }
    return connection;
  };
  return connection;
}



// Shutdown control
var shuttingdown = false;
process.on('SIGINT', function() {
  if(!shuttingdown){
    shuttingdown = true;
    var procedure = new Procedure();
    var i,l;
    for(i=0,l=pillars.servers.length;i<l;i++){
      procedure.add(pillars.servers[i].stop);
    }
    for(i=0,l=pillars.mongos.length;i<l;i++){
      procedure.add(pillars.mongos[i].stop);
    }
    Scheduled.close();
    procedure.race().launch(function(errors){
      if(errors){
        crier.error('shutdown.errors',{errors:errors},processExit);
      } else {
        crier.info('shutdown.ok',processExit);
      }
    });
  } else {
    crier.info('shuttingdown');
  }
});

function processExit(){
  setTimeout(process.exit,500);
}














/*

// Mailer
var nodemailer = require('nodemailer');

var mailTransport;
Object.defineProperty(ENV,"smtp",{
  enumerable : true,
  get : function(){return mailTransport;},
  set : function(set){
    mailTransport = nodemailer.createTransport(set);
  }
});

var mailer = global.mailer = {};

mailer.send = function(mail,callback){
  if(!mail.from && ENV.administrator && ENV.administrator.mail){
    mail.from = ENV.administrator.mail;
    if(ENV.administrator.firstname){
      var fromName = (ENV.administrator.lastname)?ENV.administrator.firstname+' '+ENV.administrator.lastname:ENV.administrator.firstname;
      mail.from = fromName+' <'+mail.from+'>';
    }
  }
  if(mailTransport){
    ENV.emit('mail',mail);
    mailTransport.sendMail(mail, function(error,info){
      if(callback){callback(error,info);}
    });
  } else {
    if(callback){callback(new Error(i18n('pillars.mail.no-transport')));}
  }
};



*/











// ---------- Pillars static directory -----------------

var pillarsStatic = new Route({
  id:'pillarsStatic',
  path:'/pillars/*:path',
  directory:{
    path:paths.resolve(__dirname,'./static'),
    listing:true
  }
});
pillars.routes.add(pillarsStatic);



