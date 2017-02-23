// jshint strict:true, node:true, camelcase:true, curly:true, maxcomplexity:15, newcap:true
"use strict";

var pillars = require('../index');
var crier = require('crier').addGroup('pillars').addGroup('middleware').addGroup('Router');
var Middleware = require('../lib/Middleware');

var i18n = require('textualization');

var middleware = module.exports = new Middleware({
  id:'Router'
}, function (gw, done) {

  // Start 'routing' property.
  gw.routing = {
    inheritance: {},
    check: function(prop, preset){
      if (typeof gw.routing.inheritance[prop] !== 'undefined') {
        return gw.routing.inheritance[prop];
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
  var pathComponents = route.pathComponents( route.iPath !== undefined? gw.i18n(route.iPath) : route.path );
  //TODO: Log error for not translated paths
  var pathRegexp = pathComponents.regexp;
  var pathParams = pathComponents.params;

  if (route.active && pathRegexp.test(path)) { // check partiality or entire path
    var match = path.match(pathRegexp); // Extract matchs from path
    var matches = match.slice(1); // Only pathParams matches
    var routePath = match[0]; // Current match segment of the path
    var subPath = path.replace(pathRegexp, ''); // Rest of the path
    var isEndPath = (routePath === path);
    var haveChildren = (!isEndPath && route.routes.length>0);

    // Check "Routing" properties for this route.
    if ((isEndPath && (!route.host || route.host == gw.host) && (route.port === undefined || route.port == gw.port) && (!route.method || route.method.concat(['HEAD','OPTIONS']).indexOf(gw.method) >= 0) && (route.https === undefined || route.https === gw.https)) || haveChildren) {
      
      // inherits from this route
      var i, l, k;
      for (i=0,k=Object.keys(route),l=k.length;i<l;i++) {
        var prop = k[i];
        if(route[prop]!==undefined && ['id','path','iPath','handlers','routes','pathComponentsCache'].indexOf(prop)===-1){
          gw.routing.inheritance[prop] = route[prop];
        }
      }

      // Add route this route to routing property
      gw.routing.routes.push(route);
      
      // Set up pathParams
      for (i=0,l=pathParams.length;i<l;i++) {
        gw.pathParams[pathParams[i]] = gw.params[pathParams[i]] = decodeURIComponent(matches[i] || '');
      }

      // Finally or continue walker
      if (isEndPath) {
        gw.routing.handlers = route.handlers;
        return true;
      } else {
        for (i=0,l=route.routes.length;i<l;i++) {
          if (routesWalker(gw,route.routes[i],subPath)) {
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