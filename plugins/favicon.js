// jshint strict:true, node:true, camelcase:true, curly:true, maxcomplexity:15, newcap:true
"use strict";

var pillars = require('../index');
var crier = require('crier').addGroup('pillars').addGroup('middleware').addGroup('favicon');
var Middleware = require('../lib/Middleware');

var middleware = module.exports = new Middleware({
  id:'favicon'
}, function (gw, done){
  if (pillars.config.favicon && gw.originalPath==='/favicon.ico') {
    gw.file(pillars.config.favicon);
  } else {
    done();
  }
});