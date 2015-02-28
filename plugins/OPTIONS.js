// jshint strict:true, node:true, camelcase:true, curly:true, maxcomplexity:15, newcap:true
"use strict";

var pillars = require('../index');
var crier = require('crier').addGroup('pillars').addGroup('plugins').addGroup('OPTIONS');
var Plugin = require('../lib/Plugin');

module.exports = new Plugin({
  id:'OPTIONS'
}, function (gw, done) {
  if (gw.method == 'OPTIONS') {
    gw.setHeader("Allow", gw.beam.method.concat(['OPTIONS', 'HEAD']));
    gw.send();
  } else {
    done();
  }
});