/* jslint node: true */
"use strict";

require('date.format');

module.exports = Middleware;
function Middleware(config,handler){
  if(!(this instanceof Middleware)){return new Middleware(config);}
  var plugin = this;
  handler = (typeof config === 'function')?config:handler;
  config = (typeof config === 'object')?config:{};
  plugin.id = (new Date()).format("{YYYY}{MM}{DD}{hh}{mm}{ss}{ms}")+Math.round(Math.random()*1000000000000000).toString(36);
  
  plugin.handler = handler;
  plugin.active = true;
  
  plugin.configure(config);
}
  Middleware.prototype.configure = function configure(config){
    for(var i=0,k=Object.keys(config),l=k.length;i<l;i++){
      this[k[i]]=config[k[i]];
    }
    return this;
  };