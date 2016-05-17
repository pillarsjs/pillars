// jshint strict:true, node:true, camelcase:true, curly:true, maxcomplexity:15, newcap:true
"use strict";

var pillars = require('../index');
var crier = require('crier').addGroup('pillars').addGroup('plugins').addGroup('CORS');
var Plugin = require('../lib/Plugin');

var plugin = module.exports = new Plugin({
  id: 'CORS'
}, function (gw, done) {
  if (gw.origin) {
    var cors = gw.routing.check('cors', pillars.config.cors);
    if (cors === true || (Array.isArray(cors) && cors.indexOf(gw.origin) >= 0)) {
      gw.cors.origin = gw.origin;
      gw.cors.credentials = true;
      gw.cors.methods = gw.routing.inheritance.method.concat(['OPTIONS', 'HEAD']);
    }
  }
  done();
});
