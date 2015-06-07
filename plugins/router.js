// jshint strict:true, node:true, camelcase:true, curly:true, maxcomplexity:15, newcap:true
"use strict";

var pillars = require('../index');
var crier = require('crier').addGroup('pillars').addGroup('plugins').addGroup('Router');
var Plugin = require('../lib/Plugin');

module.exports = new Plugin({
  id:'Router'
}, function (gw, done) {

  // Start 'routing' property.
  gw.routing = {
    inheritance: {},
    check: function(prop, preset){
      if (typeof this.inheritance[prop] !== 'undefined') {
        return this.inheritance[prop];
      } else {
        return preset;
      }
    },
    routes: [],
    handlers: []
  };

  // Check Routes...
  var found = false;
  for (var i=0,l=pillars.routes.length;i<l;i++) {
    if (routesWalker(gw, pillars.routes[i], gw.path)) {
      found = true;
      done();
      break;
    }
  }
  if (!found) {
    gw.error(404);
  }
});

function routesWalker(gw, route, path){
  if (route.active && route.pathRegexp.test(path)) { // check partiality or entire path
    var match = path.match(route.pathRegexp); // Extract matchs from path
    var matches = match.slice(1); // Only pathParams matches
    var routePath = match[0]; // Current match segment of the path
    var subPath = path.replace(route.pathRegexp, ''); // Rest of the path
    var isEndPath = (routePath === path);
    var haveChildren = (!isEndPath && route.routes.length>0);

    // Check "Routing" properties for this route.
    if ((isEndPath || haveChildren) && (!route.host || route.host === gw.host) && (!route.method || route.method.indexOf(gw.method) >= 0) && (route.https === undefined || route.https === gw.https)) {
      
      // inherits from this route
      var i, l, k;
      for (i=0,k=Object.keys(route),l=k.length;i<l;i++) {
        var prop = k[i];
        gw.routing.inheritance[prop] = route[prop];
      }

      // Add route this route to routing property
      gw.routing.routes.push(route);
      
      // Set up pathParams
      for (i=0,l=route.pathParams.length;i<l;i++) {
        gw.pathParams[route.pathParams[i]] = gw.params[route.pathParams[i]] = decodeURIComponent(matches[i] || '');
      }

      // Finally or continue walker
      if (isEndPath) {
        gw.routing.handlers = route.handlers;
        return true;
      } else {
        for (var c in route.routes) {
          if (routesWalker(gw,route.routes[c],subPath)) {
            return true;
          }
        }
      }
    } else {
      return false;
    }
  } else {
    return false;
  }
}