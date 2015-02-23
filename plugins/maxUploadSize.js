var crier = require('crier').addGroup('pillars').addGroup('plugins').addGroup('MaxUploadSize');
var Plugin = require('../lib/Plugin');

module.exports = new Plugin({id:'MaxUploadSize'},function(gw,next){
  var maxsize = gw.routing.check('maxSize',ENV.server.maxUploadSize);
  if(gw.content.length>maxsize){
      gw.error(413);
  } else {
    next();
  }
});