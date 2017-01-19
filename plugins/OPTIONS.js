// jshint strict:true, node:true, camelcase:true, curly:true, maxcomplexity:15, newcap:true
"use strict";

var pillars = require('../index');
var crier = require('crier').addGroup('pillars').addGroup('midleware').addGroup('OPTIONS');
var Midleware = require('../lib/Midleware');

var midleware = module.exports = new Midleware({
  id:'OPTIONS'
}, function (gw, done) {
  if (gw.method == 'OPTIONS') {
    var methods = Array.isArray(gw.routing.inheritance.method)?gw.routing.inheritance.method.concat(['OPTIONS', 'HEAD']):['GET','PUT','POST','DELETE','OPTIONS', 'HEAD'];
    gw.setHeader("Allow", methods.join(', '));
    gw.send();
  } else {
    done();
  }
});