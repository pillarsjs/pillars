// jshint strict:true, node:true, camelcase:true, curly:true, maxcomplexity:15, newcap:true
"use strict";

var pillars = require('../index');
var crier = require('crier').addGroup('pillars').addGroup('plugins').addGroup('MaxUploadSize');
var Plugin = require('../lib/Plugin');

var plugin = module.exports = new Plugin({
  id:'MaxUploadSize'
}, function (gw, done) {
  var maxsize = gw.routing.check('maxUploadSize', pillars.config.maxUploadSize || 5*1024*1024);
  if (gw.content.length > maxsize) {
      gw.error(413);
  } else {
    done();
  }
});