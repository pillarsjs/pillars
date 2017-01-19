// jshint strict:true, node:true, camelcase:true, curly:true, maxcomplexity:15, newcap:true
"use strict";

var pillars = require('../index');
var crier = require('crier').addGroup('pillars').addGroup('middleware').addGroup('MaxUploadSize');
var Middleware = require('../lib/Middleware');

var middleware = module.exports = new Middleware({
  id:'MaxUploadSize'
}, function (gw, done) {
  var maxsize = gw.routing.check('maxUploadSize', pillars.config.maxUploadSize || 5*1024*1024);
  if (gw.content.length > maxsize) {
      gw.error(413);
  } else {
    done();
  }
});