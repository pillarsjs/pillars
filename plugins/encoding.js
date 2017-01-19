// jshint strict:true, node:true, camelcase:true, curly:true, maxcomplexity:15, newcap:true
"use strict";

var pillars = require('../index');
var crier = require('crier').addGroup('pillars').addGroup('middleware').addGroup('Encoding');
var Middleware = require('../lib/Middleware');

var middleware = module.exports = new Middleware({
  id: 'Encoding'
}, function (gw, done) {
  if (!gw.encoding) {
    gw.encoding = "identity";
    gw.error(406);
  } else {
    done();
  }
});