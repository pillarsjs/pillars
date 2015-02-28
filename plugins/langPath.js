// jshint strict:true, node:true, camelcase:true, curly:true, maxcomplexity:15, newcap:true
"use strict";

var pillars = require('../index');
var crier = require('crier').addGroup('pillars').addGroup('plugins').addGroup('LangPath');
var Plugin = require('../lib/Plugin');

var i18n = require('textualization');

module.exports = new Plugin({
  id:'LangPath'
}, function (gw, done){
  if (i18n.languages.length > 0) {
    var locale = i18n.languages[0];
    if (i18n.languages.length > 1) {
      var langpath = new RegExp('^\\/('+i18n.languages.slice(1).join('|')+')', 'i');
      if (langpath.test(gw.path)) {
        locale = langpath.exec(gw.path).slice(1).shift();
        gw.path = gw.path.replace("/"+locale,"");
      }
    }
    gw.language = locale;
  }
  done();
});