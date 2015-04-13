// jshint strict:true, node:true, camelcase:true, curly:true, maxcomplexity:15, newcap:true
"use strict";

var pillars = require('../index');
var crier = require('crier').addGroup('pillars').addGroup('plugins').addGroup('Directory');
var Plugin = require('../lib/Plugin');

var templated = require('templated');
var paths = require('path');
var fs = require('fs');

var plugin = module.exports = new Plugin({
  id: 'Directory'
}, function (gw, done) {
  var directory = gw.routing.check('directory',false);
  if (directory) {
    directory.path = directory.path || '/';
    directory.listing = directory.listing || false;
    directory.template = directory.template || pillars.config.staticTemplate;

    var path = paths.join(directory.path, (gw.params.path || ''));
    var ext = path.replace(/^.*\./,'');
    var filename = path.replace(/^.*[\\\/]/,'');
    var reidx = new RegExp('^index\\.('+templated.getEngines().concat(['htm','html']).join('|')+')$', 'i');

    if (filename[0] !== '.') {
      fs.stat(path, function (error, stats) {
        if (error || (!stats.isFile() && !stats.isDirectory())) {
          gw.error(404,error);
        } else if (stats.isDirectory()) {
          fs.readdir(path, function (error, files){
            if (error) {
              gw.error(404, error);
            } else {
              var index = false;
              for (var i in files) {
                if (reidx.test(files[i])) {
                  index = files[i];
                  break;
                }
              }
              if (index) {
                if (index === 'index.html' || index === 'index.htm') {
                  gw.file(paths.join(path, index));
                } else {
                  gw.render(paths.join(path, index));
                }
              } else if (directory.listing) {
                gw.render(directory.template, {
                  path:decodeURIComponent(gw.originalPath.replace(/\/$/, '')),
                  files:files
                });
              } else {
                gw.error(403);
              }
            }
          });
        } else if (stats.isFile()) {
          if (templated.getEngines().indexOf(ext) >= 0) {
            gw.render(path);
          } else {
            stats.path = path;
            gw.file(stats);
          }
        } else {
          gw.error(404, error);
        }
      });
    } else {
      gw.error(403);
    }
  } else {
    done();
  }
});