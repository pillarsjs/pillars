// jshint strict:true, node:true, camelcase:true, curly:true, maxcomplexity:15, newcap:true
"use strict";

var pillars = require('../index');
var crier = require('crier').addGroup('pillars').addGroup('middleware').addGroup('Sessions');
var Middleware = require('../lib/Middleware');

require('json.crypt');
require('objectarray');

var sessionStore = new ObjectArray();

var middleware = module.exports = new Middleware({id:'Sessions'},function(gw,done){
  var session = gw.routing.check('session',false);
  if(session){
    middleware.getSession(gw,function(error){
      if(error){
        gw.error(500,error);
      } else {
        gw.eventium.on('end', middleware.saveSession);
        done();
      }
    });
  } else {
    done();
  }
});

middleware.getSession = function(gw,callback){
  // Check cookie for session id+key, if not, create a new session and send session cookie.
  if(!gw.cookie.sid) {
    middleware.newSession(gw,callback);
  } else {
    var sid = gw.cookie.sid = JSON.decrypt(gw.cookie.sid);
    if(sid && sid.id){
      var session = sessionStore.get(sid.id);
      if(!session){
        middleware.newSession(gw,callback);
      } else {
        gw.session = session;
        if(callback){callback();}
      }
    } else {
      middleware.newSession(gw,callback);
    }
  }
};

middleware.newSession = function(gw,callback){
  // Create a new session on datastore.
  var id = Math.round(Math.random()*100000000000000000000000000000).toString(36);
  var session = {
    id:id,
    timestamp:(new Date()),
    lastaccess:(new Date()),
  };
  sessionStore.add(session);
  var cookie = {
    id:id
  };
  gw.setCookie('sid',JSON.encrypt(cookie),{maxAge:365*24*60*60});
  gw.cookie.sid = cookie; // Forced cookie setting
  gw.session = session;
  if(callback){callback();}
};

middleware.saveSession = function(gw,meta,done){
  // Save gw.session Objet on datastore.
  var sid = gw.cookie.sid || false;
  if(gw.session && sid && sid.id){
    gw.session.lastaccess = new Date();
    done();
  } else {
    done(new Error('Unable to save the session, no SID or empty session.'));
  }
};
