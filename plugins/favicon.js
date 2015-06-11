// jshint strict:true, node:true, camelcase:true, curly:true, maxcomplexity:15, newcap:true
"use strict";

var pillars = require('../index');
var crier = require('crier').addGroup('pillars').addGroup('plugins').addGroup('favicon');
var Plugin = require('../lib/Plugin');

module.exports = new Plugin({
  id:'favicon'
}, function (gw, done){
  if (pillars.config.favicon && gw.originalPath==='/favicon.ico') {
    gw.file(pillars.config.favicon);
  } else {
    done();
  }
});