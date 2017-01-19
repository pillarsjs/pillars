// jshint strict:true, node:true, camelcase:true, curly:true, maxcomplexity:15, newcap:true
"use strict";

var pillars = require('../index');
var crier = require('crier').addGroup('pillars').addGroup('midleware').addGroup('Encoding');
var Midleware = require('../lib/Midleware');

var midleware = module.exports = new Midleware({
  id: 'Encoding'
}, function (gw, done) {
  if (!gw.encoding) {
    gw.encoding = "identity";
    gw.error(406);
  } else {
    done();
  }
});