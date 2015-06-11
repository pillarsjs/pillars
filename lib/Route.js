/* jslint node: true */
"use strict";

var ObjectArray = require('objectarray');
require('date.format');

module.exports = Route;
function Route(config){
  var route = this;
  config = (config && typeof config !== 'function')?config:{};
  route.id = (new Date()).format("{YYYY}{MM}{DD}{hh}{mm}{ss}{ms}")+Math.round(Math.random()*1000000000000000).toString(36);

  if(!config.pathRegexp && !config.path){config.path = '/';}

  route.routes = new ObjectArray();
  route.active = true;
  route.host = undefined;
  route.port = undefined;
  route.pathParams = [];
  route.pathRegexp = undefined;
  route.handlers = [];

  var handlers = Array.prototype.slice.call(arguments);
  for(var i=0,l=handlers.length;i<l;i++){
    if(typeof handlers[i] === 'function'){
      route.handlers.push(handlers[i]);
    }
  }

  var path; // on set: regenerate .pathRegexp & .pathParams
  Object.defineProperty(route,"path",{
    enumerable : true,
    get : function(){return path;},
    set : function(set){
      path = set.replace(/\/+/gi,'/').replace(/^\/|\/$/gi,'');
      var parts = path.split('/');
      var compose = [];
      var newparams = [];
      var arg;
      for(var i=0,l=parts.length;i<l;i++){
        if(/^:/.test(parts[i])){
          arg = parts[i].replace(/^:/,'');
          newparams.push(arg);
          compose.push("\\/([^\\/]+)");
        } else if(/^\*:/.test(parts[i])){
          arg = parts[i].replace(/^\*:/,'');
          newparams.push(arg);
          compose.push("(?:\\/(.*))?");
        } else if(parts[i]!=='') {
          compose.push("\\/"+parts[i]);
        }
      }
      route.pathParams = newparams;
      route.pathRegexp = new RegExp('^'+compose.join(''),'i');
    }
  });

  var method; // Parse String to [String].
  Object.defineProperty(route,"method",{
    enumerable : true,
    get : function(){return method;},
    set : function(set){
      if(set===undefined){
        method = undefined;
      } else {
        set = Array.isArray(set)?set:[set];
        set = set.map(function(e,i){return e.toUpperCase();});
        method = set;
      }
    }
  });

  var https;
  Object.defineProperty(route,"https",{
    enumerable : true,
    get : function(){return https;},
    set : function(set){
      if(set===undefined){
        https = undefined;
      } else {
        https = set?true:false;
      }
    }
  });

  route.configure(config);
}
  Route.prototype.configure = function configure(config){
    for(var i=0,k=Object.keys(config),l=k.length;i<l;i++){
      this[k[i]]=config[k[i]];
    }
    return this;
  };
