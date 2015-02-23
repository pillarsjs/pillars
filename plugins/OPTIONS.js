var crier = require('crier').addGroup('pillars').addGroup('plugins').addGroup('OPTIONS');
var Plugin = require('../lib/Plugin');

module.exports = new Plugin({id:'OPTIONS'},function(gw,next){
  if(gw.method=='OPTIONS'){
    gw.setHeader("Allow", gw.beam.method.concat(['OPTIONS','HEAD']));
    gw.send();
  } else {
    next();
  }
});