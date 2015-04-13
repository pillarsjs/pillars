/* jslint node: true */
"use strict";

var pillars = require('../index');
var crier = require('crier').addGroup('pillars').addGroup('plugins').addGroup('BodyReader');
var Plugin = require('../lib/Plugin');
var querystring = require('querystring');
var formidable = require('formidable');
var fs = require('fs');

var plugin = module.exports = new Plugin({id: 'BodyReader'}, function (gw, next) {
  var multipart = gw.routing.check('multipart', undefined);
  // Parse json, urlencoded or multipart body.
  if (gw.content.type === 'application/json') {
    jsonEncoded(gw, next);
  } else if (gw.content.type === 'application/x-www-form-urlencoded') {
    urlEncoded(gw, next);
  } else if (gw.content.type === 'multipart/form-data' && gw.content.boundary && ENV.directories.temp) {
    if (multipart === undefined) {
      next();
    } else if (multipart === false) {
      gw.error(400);
    } else {
      multipartEncoded(gw, next);
    }
  } else {
    next();
  }
});

var uploadsDirectory;
Object.defineProperty(plugin, "uploadsDirectory", {
  enumerable : true,
  get : function () {return uploadsDirectory;},
  set : function (set) {
    fs.stat(set, function (error, stats){
      if (error) {
        uploadsDirectory = undefined;
        crier.error('directories.uploads.error',{path: set});
      } else {
        uploadsDirectory = set;
        crier.info('directories.uploads.ok',{path: set});
      }
    });
  }
});
var tempDirectory;
Object.defineProperty(plugin, "tempDirectory", {
  enumerable : true,
  get : function () {return tempDirectory;},
  set : function (set) {
    fs.stat(set, function (error, stats){
      if(error){
        tempDirectory = undefined;
        crier.error('directories.temp.error',{path: set});
      } else {
        tempDirectory = set;
        crier.info('directories.temp.ok',{path: set});
      }
    });
  }
});

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
        for(var v in params){gw.params[v] = params[v];}
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
      var params = gw.queryHeap(querystring.parse(buffer, '&', '='));
      gw.content.params = params;
      for (var v in params) {gw.params[v] = params[v];}
      callback();
    }
  });
}

// Multipart parser.

function multipartEncoded(gw, callback){
  var upload = new formidable.IncomingForm();
  var files = {};
  var fields = {};    

  gw.on('close',cleanTemp);

  upload.uploadDir = ENV.directories.temp;
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
      fields = gw.queryHeap(fields);
      gw.content.params = fields;
      for (var v in fields) {gw.params[v] = fields[v];}
      gw.files = files;
      callback();
    })
  ;
  upload.parse(gw.req);
}

function cleanTemp(gw){
  // Remove temp files
  var gw = this;
  for (var f in gw.files) {
    if (Array.isArray(gw.files[f])) {
      for (var sf in gw.files[f]) {
        if (gw.files[f][sf].path) {
          unlinktemp(gw.files[f][sf]);
          delete gw.files[f][sf];
        }
      }
    } else {
      if (gw.files[f].path) {
        unlinktemp(gw.files[f]);
        delete gw.files[f];
      }
    }     
  }
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

