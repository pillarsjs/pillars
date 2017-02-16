// jshint strict:true, node:true, camelcase:true, curly:true, maxcomplexity:15, newcap:true
"use strict";

var pillars = require('../index');
var crier = require('crier').addGroup('pillars').addGroup('middleware').addGroup('Directory');
var Middleware = require('../lib/Middleware');

var templated = require('templated');
var paths = require('path');
var fs = require('fs');

var middleware = module.exports = new Middleware({
  id: 'Directory'
}, function (gw, done) {
  var directory = gw.routing.check('directory',false);
  if (directory) {
    directory.path = directory.path || '/';
    directory.listing = directory.listing || false;
    directory.hideExt = directory.hideExt || false;
    directory.template = directory.template || pillars.config.directoryTemplate || directoryTemplate;

    var path = paths.join(directory.path, (gw.params.path || ''));
    var parent = path.replace(/[\/][^\/]*$/,'');
    var ext = path.replace(/^.*\./,'');
    var filename = path.replace(/^.*[\\\/]/,'');
    var nameonly = filename.replace(/\.[^\.]*$/,'');
    var checkExt = new RegExp('\\.('+templated.getEngines().concat(['htm','html']).join('|')+')$', 'i');
    var reidx = new RegExp('^index'+checkExt.source, 'i');

    if (filename[0] !== '.') {
      fs.stat(path, function (error, stats) {
        if (error || (!stats.isFile() && !stats.isDirectory())) {
          fs.stat(parent, function (error2, stats) {
            if (!error2 && stats.isDirectory()) {
              fs.readdir(parent, function (error, files){
                if (error) {
                  gw.error(404, error);
                } else {
                  var template = false;
                  for (var i in files) {
                    var check = new RegExp('^'+nameonly+checkExt.source, 'i');
                    if (check.test(files[i])) {
                      template = files[i];
                      break;
                    }
                  }
                  if (template) {
                    var templateExt = template.replace(/^.*\./,'');
                    if (templateExt === 'html' || templateExt === 'htm') {
                      gw.file(paths.join(parent, template));
                    } else {
                      gw.render(paths.join(parent, template));
                    }
                  } else {
                    gw.error(404);
                  }
                }
              });

            } else {
              gw.error(404,error);
            }
          });

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
            //gw.render(path);
            gw.redirect(gw.path.replace(/\.[^\.]*$/,''));
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

function directoryTemplate($){
  var output = '';
  output += '<!DOCTYPE html>';
  output += '<html lang="'+$.gw.language+'">';
    output += '<head>';
      output += '<title>'+$.path+'</title>';
      output += '<meta charset="utf-8">';
      output += '<meta http-equiv="X-UA-Compatible" content="IE=edge">';
      output += '<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no">';
      output += '<link rel="stylesheet" href="//netdna.bootstrapcdn.com/bootstrap/3.1.1/css/bootstrap.min.css">';
    output += '</head>';
    output += '<body>';
      output += '<div class="container">';
        output += '<header id="header">';
          output += '<h1>'+$.path+'</h1>';
        output += '</header>';
        output += '<div id="page">';
        if($.path !== $.path.replace(/[^\\\/]*$/,'')){
          output += '<a href="'+$.path.replace(/[^\\\/]*$/,'')+'">../</a>';
        }
        output += '<hr>';
        for(var i=0,l=$.files.length;i<l;i++){
          if(/^\./i.test($.files[i])){
            output += '<a href="'+$.path+'/'+$.files[i]+'" class="help-block">'+$.files[i]+'</a>';
          } else {
            output += '<a href="'+$.path+'/'+$.files[i]+'">'+$.files[i]+'</a>';
          }
          output += '<hr>';
        }
        output += '</div>';
        output += '<footer id="footer"></footer>';
      output += '</div>';
    output += '</body>';
  output += '</html>';
  return output;
}
