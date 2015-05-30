/* jslint node: true */
"use strict";

var pillars = require('../index');
var http = require('http');
var https = require('https');
var crier = require('crier').addGroup('pillars').addGroup('httpService');

module.exports = HttpService;
function HttpService(config){
  var service = this;
  var server = config.key?https.createServer(config):http.createServer();
  service.server = server;

  config = config || {};
  config.port = config.port || 80;

  Object.defineProperty(service,"timeout",{
    enumerable : true,
    get : function(){return server.timeout;},
    set : function(set){
      server.timeout = set;
    }
  });

  service.configure(config);

  server
    .on('error',function(error){
      service.running = false;
      crier.error('error',{service:service,error:error});
    })
    .on('listening',function(){
      service.running = true;
      service.timer = Date.now();
      crier.info('listening',{service:service});
    })
    .on('close',function(){
      service.running = false;
      crier.warn('closed',{service:service,time:parseInt((Date.now()-service.timer)/1000/60*100, 10)/100});
    })
    .on('request',pillars.handler)
  ;
}
  HttpService.prototype.configure = function configure(config){
    for(var i=0,k=Object.keys(config),l=k.length;i<l;i++){
      this[k[i]]=config[k[i]];
    }
    return this;
  };
  HttpService.prototype.start = function(callback){
    var service = this;
    var server = service.server;
    service.stop(function(error){
      if(!error){
        server.listen(service.port,service.hostname,callback);
      } else if(callback) {
        callback(error);
      }
    });
    return service;
  };
  HttpService.prototype.stop = function(callback){
    var service = this;
    var server = service.server;
    if(service.running){
      server.close(function(error){
        if(error){
          crier.error('error',{service:service,error:error});
        }
        if(callback){
          callback();
        }
      });
    } else if(callback){
      callback();
    }
    return service;
  };