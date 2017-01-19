// jshint strict:true, node:true, camelcase:true, curly:true, maxcomplexity:15, newcap:true
"use strict";

var pillars = require('../index');
var crier = require('crier').addGroup('pillars').addGroup('midleware').addGroup('favicon');
var Midleware = require('../lib/Midleware');

var midleware = module.exports = new Midleware({
  id:'favicon'
}, function (gw, done){
  if (pillars.config.favicon && gw.originalPath==='/favicon.ico') {
    gw.file(pillars.config.favicon);
  } else {
    done();
  }
});