// jshint strict:true, node:true, camelcase:true, curly:true, maxcomplexity:15, newcap:true
"use strict";

var pillars = require('../index');
var crier = require('crier').addGroup('pillars').addGroup('middleware').addGroup('OPTIONS');
var Middleware = require('../lib/Middleware');

var middleware = module.exports = new Middleware({
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