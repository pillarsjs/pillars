/* jslint node: true */
"use strict";

var templated = require('templated');
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
templated.addEngine('jade',function compiler(source,path){ // return funtion for render by -> function(locals).
  return jade.compile(source,{filename:path,pretty:true,debug:false,compileDebug:true});
});





var fs = require('fs');
var paths = require('path');
var Procedure = require('procedure');
var ObjectArray = require('objectarray');
var crier = require('crier').addGroup('pillars');
var i18n = require('textualization');

require('date.format');
require('json.decycled');

var Gangway = require('./lib/gangway');
var Route = global.Route = require('./lib/Route');
var Plugin = global.Plugin = require('./lib/Plugin');

var pillars = module.exports = {
};

// Configure method
pillars.configure = function(config){
  for(var i=0,k=Object.keys(config),l=k.length;i<l;i++){
    this[k[i]]=config[k[i]];
  }
  return this;
};

// Debug
pillars.debug = true;

// Package & version
var pillarsPackage = require('./package');
Object.defineProperty(pillars,"package",{
  enumerable : true,
  get : function(){return pillarsPackage;}
});
Object.defineProperty(pillars,"version",{
  enumerable : true,
  get : function(){return pillarsPackage.version;}
});

// Path & resolve
pillars.path = paths.resolve(__dirname,'../');
pillars.resolve = function(path){
  return paths.resolve(pillars.path,path);
};

// Administrator
pillars.administrator = { // get from process.env ?
  email: undefined,
  firstname: undefined,
  lastname: undefined
};

// Languages
Object.defineProperty(pillars,"languages",{
  enumerable : true,
  get : function(){return i18n.languages;},
  set : function(set){
    i18n.languages = set;
  }
});

// Directories
var directories = {};
Object.defineProperty(pillars,"directories",{
  enumerable : true,
  get : function(){return directories;},
  set : function(set){
    for(var i=0,k=Object.keys(set),l=k.length;i<l;i++){
      directories[k[i]]=set[k[i]];
    }
  }
});

// Templates
var templates = {};
Object.defineProperty(pillars,"templates",{
  enumerable : true,
  get : function(){return templates;},
  set : function(set){
    for(var i=0,k=Object.keys(set),l=k.length;i<l;i++){
      templates[k[i]]=set[k[i]];
    }
  }
});

// HTTP Server
var http = require('http');
var https = require('https');
var httpServer = http.createServer();

httpServer // Event handling
.on('error',function(error){
  httpServer.running = false;
  crier.error('httpServer.error',{server:httpServer,error:error});
})
.on('listening',function(){
  httpServer.running = true;
  httpServer.timer=Date.now();
  crier.info('httpServer.listening',{server:httpServer});
})
.on('close',function(){
  httpServer.running = false;
  crier.warn('httpServer.closed',{server:httpServer,time:parseInt((Date.now()-httpServer.timer)/1000/60*100, 10)/100});
})
.on('request',function(req,res){
  var gw = new Gangway(req,res);
  gangwayHanling(gw);
})
;

pillars.start = function(params,callback){
  if(typeof params === 'function'){
    callback = params;
    params = {};
  }
  if(typeof params === 'string' || typeof params === 'number'){
    params = {port:parseInt(params, 10)};
  }
  params = params || {};

  httpServer.port = params.port || httpServer.port || 3000;
  httpServer.timeout = params.timeout || httpServer.timeout || 30*1000;
  httpServer.hostname = params.hostname || httpServer.hostname;
  httpServer.https = params.https || httpServer.https;

  var procedure = new Procedure();

  if(httpServer.running){
    procedure.add(httpServer.close);
  }
  if(httpServer.httpsMirror.running){
    procedure.add(httpServer.httpsMirror.close);
  }
  procedure
  .race()
  .add(function(done){
    httpServer.listen(httpServer.port, httpServer.hostname);
    done();
  });
     
  if(httpServer.https){
    httpServer.https.port = httpServer.https.port || 443;
    if(httpServer.https.key && httpServer.https.cert){
      procedure.add('key',fs.readFile,httpServer.https.key);
      procedure.add('cert',fs.readFile,httpServer.https.cert);
    }
    procedure
    .race()
    .add(function(options,done){
      var httpsServer = httpServer.httpsMirror = https.createServer(options);
      httpsServer.timeout = httpServer.timeout;

      httpsServer
      .on('error',function(error){
        httpsServer.running = false;
        crier.error('server.https.error',{server:httpServer,error:error});
      })
      .on('listening',function(){
        httpsServer.timer=Date.now();
        crier.info('server.https.listening',{server:httpServer});
      })
      .on('close',function(){
        httpsServer.running = false;
        crier.warn('server.https.closed',{server:httpServer,time:parseInt((Date.now()-httpsServer.timer)/1000/60*100, 10)/100});
      })
      .on('request',function(req,res){
        var gw = new Gangway(req,res);
        gw.https = true;
        gangwayHanling(gw);
      })
      .listen(httpServer.https.port, httpServer.hostname);
      done();
    });
  }

  procedure.launch(function(errors){
    if(errors){
      crier('server.https.error',{server:httpServer,error:errors[0]});
    }
    if(callback){
      callback(errors?errors[0]:undefined);
    }
  });
  
  return pillars;
};

pillars.stop = function(callback){
  var procedure = new Procedure();
  if(httpServer.running){
    procedure.add(httpServer.close);
  }
  if(httpServer.httpsMirror.running){
    procedure.add(httpServer.httpsMirror.close);
  }
  procedure.race().launch(function(errors){
    if(errors){
      crier.error('server.error',{server:httpServer,error:errors[0]});
    }
    if(callback){
      callback(errors[0]);
    }
  });
  return pillars;
};









// DB
var MongoClient = require('mongodb').MongoClient;
var database;

pillars.connect = function(params,callback){
  if(typeof params === 'function'){
    callback = params;
    params = {};
  }
  if(typeof params === 'string'){
    params = {store:params};
  }
  params = params || {};
  
  params.port = params.port || 27017;
  params.hostname = params.hostname || 'localhost';
  params.store = params.store || 'pillars';
  //params.user = params.user;
  //params.password = params.password;

  pillars.disconnect(function(disconnectError){
    if(!disconnectError){
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
      if(params.store){
        url += '/'+params.store;
      }
      MongoClient.connect(url, function(error, db) {
        if(error) {
          crier.error('db.connect-error',{params:params,url:url,error:error});
        } else {
          database = db;
          crier.info('db.connect-ok',{params:params,url:url});
        }
        if(callback){
          callback(error);
        }
      });
    } else {
      if(callback){
        callback(disconnectError);
      }
    }
  });
  
  return pillars;
};

pillars.disconnect = function(callback){
  if(database){
    database.close(function(error) {
      if(!error){
        database = undefined;
        crier.info('db.disconnect-ok');
      } else {
        crier.error('db.disconnect-error',{error:error});
      }
      if(callback){
        callback(error);
      }
    });
  } else if(callback) {
    callback();
  }
  return pillars;
};


// Shutdown event
process.on('SIGINT', function() {
  pillars.stop(function() {
    process.exit(0);
  });
});




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
crier.info('plugins.loaded',{list:plugins});




// Gangway handling
function gangwayHanling(gw){
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
      for(var i=0,l=gw.routing.handlers.length;i<l;i++){
        var handler = gw.routing.handlers[i];
        routeHandling.add(handler,gw);
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
}




// Loading....



var procedure = new Procedure();
procedure
.add(i18n.load,'pillars',paths.join(__dirname,'./languages'))
.add(function(i18nLoad,done){
  var pillarsLog = fs.createWriteStream('./pillars.log',{flags: 'a'})
    .on('open',function(fd){
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
      crier.info('logfile.ok');
      done();
    })
    .on('error',function(error){
      crier.warn('logfile.error',{error:error});
      done(error);
    })
  ;
})
.launch(function(errors){
  if(errors){

  } else {

  }
})
;




// Globals



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



