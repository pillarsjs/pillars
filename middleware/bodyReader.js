// jshint strict:true, node:true, camelcase:true, curly:true, maxcomplexity:15, newcap:true
"use strict";

var pillars = require('../index');
var crier = require('crier').addGroup('pillars').addGroup('middleware').addGroup('BodyReader');
var Middleware = require('../lib/Middleware');
var querystring = require('querystring');
var formidable = require('formidable');
var fs = require('fs');

var middleware = module.exports = new Middleware({id: 'BodyReader'}, function (gw, done) {
  var multipart = gw.routing.check('multipart', undefined);
  // Parse json, urlencoded or multipart body.
  if (gw.content.type === 'application/json') {
    jsonEncoded(gw, done);
  } else if (gw.content.type === 'application/x-www-form-urlencoded') {
    urlEncoded(gw, done);
  } else if (gw.content.type === 'multipart/form-data' && gw.content.boundary) {
    if (multipart === undefined) {
      done();
    } else if (multipart === false) {
      gw.error(400);
    } else {
      multipartEncoded(gw, done);
    }
  } else {
    done();
  }
});

var tempDirectory;
Object.defineProperty(middleware, "tempDirectory", {
  enumerable : true,
  get : function () {return tempDirectory;},
  set : function (set) {
    fs.stat(set, function (error, stats){
      if(error){
        fs.mkdir(set,function(error){
          if(error){
            tempDirectory = undefined;
            crier.error('temp.error',{path: set});
          } else {
            tempDirectory = set;
            crier.info('temp.ok',{path: set});
          }
        });
      } else if(!stats.isDirectory()){
        tempDirectory = undefined;
        crier.info('temp.exists',{path: set});
      } else {
        tempDirectory = set;
        crier.info('temp.ok',{path: set});
      }
    });
  }
});
middleware.tempDirectory = "./temp";

// JSON-encoded parser.

function jsonEncoded(gw, callback){
  var buffer = '';
  var readlength = 0;
  var $error = false;
  gw.req.on('data', function (chunk) {
    if (readlength > gw.content.length){$error = true;}
    if (!$error) {
      readlength += chunk.length;
      buffer += chunk.toString('ascii');
    }
  });
  gw.req.on('end', function () {
    if ($error) {
      gw.error(400);
    } else {
      try {
        var params = JSON.parse(buffer);
        gw.content.params = params;
        for(var i=0,k=Object.keys(params),l=k.length;i<l;i++){
          gw.params[k[i]]=params[k[i]];
        }
        callback();
      } catch (error) {
        gw.error(400);
      }
    }
  });
}

// url-enconded parser.

function urlEncoded(gw, callback){
  var buffer = '';
  var readlength = 0;
  var $error = false;
  gw.req.on('data', function (chunk) {
    if (readlength > gw.content.length) {$error = true;}
    if (!$error) {
      readlength += chunk.length;
      buffer += chunk.toString('ascii');
    }
  });
  gw.req.on('end', function () {
    if ($error) {
      gw.error(400);
    } else {
      var params = gw.constructor.queryHeap(querystring.parse(buffer, '&', '='));
      gw.content.params = params;
      for(var i=0,k=Object.keys(params),l=k.length;i<l;i++){
        gw.params[k[i]]=params[k[i]];
      }
      callback();
    }
  });
}

// Multipart parser.

function multipartEncoded(gw, callback){
  var upload = new formidable.IncomingForm();
  var files = {};
  var fields = {};    

  gw.eventium.on('end',cleanTemp);

  upload.uploadDir = tempDirectory;
  upload.keepExtensions = true;
  upload.onPart = function(part) {
    if (part.filename!="") {
      upload.handlePart(part);
    }
  }
  upload
    .on('progress', function(bytesReceived, bytesExpected) {
      var percent_complete = (bytesReceived / bytesExpected) * 100;
    })
    .on('error', function (error) {gw.error(500,error);})
    .on('field', function (field, value) {
      if (fields[field]) {
        if (!Array.isArray(fields[field])) {fields[field]=[fields[field]];}
        fields[field].push(value);
      } else {
        fields[field]=value;
      }
    })
    .on('file', function(field, file) {
      file.ext =  file.name.replace(/^.*\./,'');
      if (fields[field]) {
        if(!Array.isArray(fields[field])){fields[field]=[fields[field]];}
        fields[field].push(file);
      } else {
        fields[field]=file;
      }
      if (files[field]) {
        if (!Array.isArray(files[field])) {files[field]=[files[field]];}
        files[field].push(file);
      } else {
        files[field]=file;
      }
    })
    .on('end', function() {
      fields = gw.constructor.queryHeap(fields);
      gw.content.params = fields;
      for(var i=0,k=Object.keys(fields),l=k.length;i<l;i++){
        gw.params[k[i]]=fields[k[i]];
      }
      gw.files = files;
      callback();
    })
  ;
  upload.parse(gw.req);
}

function cleanTemp(gw,meta,done){
  // Remove temp files
  for(var i=0,k=Object.keys(gw.files),l=k.length;i<l;i++){
    var file = gw.files[k[i]];
    if (Array.isArray(file)) {
      for(var fi=0,fk=Object.keys(file),fl=fk.length;fi<fl;fi++){
        if (file[fk[fi]].path) {
          unlinktemp(file[fk[fi]]);
          delete file[fk[fi]];
        }
      }
    } else if (file.path) {
      unlinktemp(file);
      delete gw.files[k[i]];
    }
  }
  done();
}

function unlinktemp(file){
  if (!file.moved) {
    fs.unlink(file.path, function (error) {
      if (error) {
        crier.error('unlink-error',{file: file.path, error: error});
      } else {
        crier.info('unlink-ok',{file: file.path});
      }
    });
  }
}

