var crier = require('crier').addGroup('pillars').addGroup('plugins').addGroup('MaxUploadSize');
var Plugin = require('../lib/Plugin');

var plugin = module.exports = new Plugin({id:'MaxUploadSize'},function(gw,next){
  var maxsize = gw.routing.check('maxSize',plugin.maxUploadSize);
  if(gw.content.length>maxsize){
      gw.error(413);
  } else {
    next();
  }
});

plugin.maxUploadSize = 10*1024*1024;