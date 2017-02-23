/* jslint node: true */
"use strict";

require('date.format');

module.exports = Middleware;
function Middleware(config,handler){
  if(!(this instanceof Middleware)){return new Middleware(config,handler);}
  var middleware = this;
  handler = (typeof config === 'function')?config:handler;
  config = (typeof config === 'object')?config:{};
  middleware.id = (new Date()).format("{YYYY}{MM}{DD}{hh}{mm}{ss}{ms}")+Math.round(Math.random()*1000000000000000).toString(36);
  middleware.active = true;

  Object.defineProperty(middleware,"connectSupport",{
    enumerable : true,
    get : function(){
      return handler.length >= 3;
    }
  });

  Object.defineProperty(middleware,"handler",{
    enumerable : true,
    get : function(){
      handler.isConnect = handler.length >= 3;
      return handler;
    },
    set : function(set){
      handler = set;
    }
  });
  
  middleware.configure(config);
}
  Middleware.prototype.configure = function configure(config){
    for(var i=0,k=Object.keys(config),l=k.length;i<l;i++){
      this[k[i]]=config[k[i]];
    }
    return this;
  };