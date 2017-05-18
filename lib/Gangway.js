// jshint strict:true, node:true, camelcase:true, curly:true, maxcomplexity:18, newcap:true
"use strict";

var i18n = require('textualization');
var templated = require('templated');

var util = require("util");
var stream = require("stream");

var paths = require('path');
var fs = require('fs');
var zlib = require("zlib");
var mime = require('mime');
var querystring = require('querystring');
var paths = require('path');

var pillars = require('../index');
var crier = require('crier').addGroup('pillars').addGroup('gangway');
require('date.format');
require('json.crypt');
var ObjectArray = require('objectarray');
var Procedure = require('procedure');
var Scheduled = require('scheduled');
var crypto = require('crypto');
var Eventium = require('eventium');

module.exports = Gangway;
Gangway.cache = {};
function Gangway(req,res){
  var gw = this;

  // ###################################
  // Initialization properties & methods
  // ###################################

  gw.timer = Date.now();
  gw.responseTime = 0;
  gw.id = (new Date()).format("{YYYY}{MM}{DD}{hh}{mm}{ss}{ms}")+'.'+req.socket.remoteAddress+'.'+Math.round(Math.random()*1000000000000000).toString(36);

  // #######################################
  // Properties & methods alias from req/res
  // #######################################

  Object.defineProperty(gw, "req", {
    enumerable : false,
    get : function(){return req;}
  });
  Object.defineProperty(gw, "res", {
    enumerable : false,
    get : function(){return res;}
  });
  Object.defineProperty(gw, "socket", {
    enumerable : false,
    get : function(){return req.socket;}
  });
  Object.defineProperty(gw,"statusCode",{
    enumerable : true,
    get : function(){return res.statusCode;},
    set : function(set){res.statusCode = set;}
  });
  Object.defineProperty(gw,"headers",{
    enumerable : true,
    get : function(){return req.headers;},
  });
  Object.defineProperty(gw,"headersSent",{
    enumerable : true,
    get : function(){return res.headersSent;},
  });
  Object.defineProperty(gw,"finished",{
    enumerable : true,
    get : function(){return res.finished;},
  });

  gw.setTimeout = function(msecs,callback){return res.setTimeout(msecs, callback);};
  gw.writeContinue = function(){return res.writeContinue.call(res);};
  gw.writeHead = function(statusCode,phrase,headers){
    statusCode = statusCode || gw.statusCode || 200;
    if(!gw.headersSent){
      return res.writeHead.call(res,statusCode,phrase,headers);
    }
  };
  gw.setHeader = function(name,value){if(!gw.headersSent){return res.setHeader.call(res,name,value);}};
  gw.getHeader = function(name){return res.getHeader.call(res,name);};
  gw.removeHeader = function(name){return res.removeHeader.call(res,name);};
  gw.addTrailers = function(headers){return res.addTrailers.call(res,headers);};
  gw.write = function(chunk,encoding){
    if(!gw.headersSent){chunkedHeading(gw);}
    return res.write.call(res,chunk,encoding);
  };
  gw.end = function(data,encoding){
    if(!gw.headersSent){heading(gw);}
    return res.end.call(res,data,encoding);
  };




  // ##############
  // Events control
  // ##############



  res
    .on('timeout',function(){
      gw.error(408);
    })
    .on('close',function(){
      ending();
      crier.log('close',{gw:gw});
    })
    .on('error',function(error){
      ending();
      crier.error('broken',{gw:gw,error:error});
    })
    .on('finish',function(){
      ending();
      crier.log('finish',{gw:gw});
    });

    var ended = false; 
    function ending(){
      if(!ended){
        ended = true;
        gw.eventium.fire('end');
      }
    }


  // #########################
  // Request parsed properties
  // #########################

  gw.accepts = acceptsParser(req);
  /* {
    types:[{value:'text/html',q=100},{value:'text/xml',q=80}],    // priority sort array of content-types accepts
    languages:[{value:'ES-es',q=100},{value:'es',q=80}],          // priority sort array of languages accepts
    encodings:[{value:'gzip',q=100},{value:'deflate',q=80}]       // priority sort array of encodings accepts
  } */
  gw.content = contentParser(req);
  /* {
    type:'',      // contet-type string
    length:'',    // ontent-length
    boundary:'',  // boundary for multipart
    params:{}     // parsed contents params object
  }; */
  gw.ranges = rangesParser(req);
  /* {
    check: true,  // if-range header or true, for identity check control
    unit: '',     // range units string.
    start: 0,     // range start byte/unit
    end: 0        // range end byte/unit
  } */
  gw.cookie = cookieParser((req.headers['cookie'] || '')); // parsed request cookies vars object
  
  gw.auth = authParser(req); // {user:'',pass:''} For http authetication control.
  gw.ua = uaParser(req);
  /* {
    mobile: false,  // Boolean, if 'mobi' string exist.
    os:'',          // OS string or 'unknow'
    engine:'',      // 'Gecko', 'WebKit', 'Presto', 'Trident', 'Blink' or 'unknow'
    browser:''      // 'Firefox', 'Seamonkey', 'Chrome', 'Chromium', 'Safari', 'Opera', 'MSIE' or 'unknow'.
  } */

  gw.origin = req.headers['origin'] || false;
  gw.ip = req.socket.remoteAddress;
  gw.httpVersion = req.httpVersion;
  gw.https = req.socket.server?req.socket.server.ssl:false;
  gw.host = (req.headers['host'] || '').replace(/\:.*$/,'');
  gw.port = (req.headers['host'] || '')==gw.host?'80':(req.headers['host'] || '').replace(/^.*\:/,'');
  gw.method = req.method || 'unknow';
  gw.path = req.url.replace(/\?.*$/i,'').replace(/\/*$/i,'');
  gw.originalPath = gw.path;
  gw.query = queryHeap(((req.url.indexOf("?")>=0 && querystring.parse(req.url.substr(req.url.indexOf("?")+1))) || {}));
  gw.referer = req.headers['referer'] || false;
  gw.connection = req.headers['connection'] || false;
  gw.cache = {
    control: req.headers['cache-control'] || false,
    eTag: req.headers['if-none-match']?JSON.decrypt(req.headers['if-none-match']):false,
    lastMod: req.headers['if-modified-since'] || false
  };





  // ########################
  // Gangway added properties
  // ########################

  gw.files = {}; // Files descriptors from multipart upload.
  gw.pathParams = {}; // Only path params parsed.
  gw.params = {};
  for(var i=0,k=Object.keys(gw.query),l=k.length;i<l;i++){
    gw.params[k[i]]=gw.query[k[i]];
  }
  
  /*
    All params grouped, query params + post params + path params.
    - only query on: gw.query
    - only post on: gw.content.params
  */
  gw.data = {}; // Best place for save temp data on gangway.







  // ###############################
  // Response and control properties
  // ###############################

  gw.encoding = getEncoding(gw.accepts.encodings || false); // automatic encoding for response, based on request accepts. deflate,gzip,identity,false.
  gw.language = false; // Language for response.
  gw.responseCookies = []; // parsed cookies packed for send on response.
  gw.cors = { // CORS headers for response.
    origin:false,
    credentials:false,
    methods:false,
    headers:false
  };
  gw.size = 0; // response content-length
  gw.lastMod = false; // response date.
  gw.eTag = gw.cache.eTag || {}; // eTag header for response.
  gw.maxAge = 0;


  // ###############################
  // Eventium event manager
  // ###############################
  gw.eventium = new Eventium(gw);


  crier.log('start',{gw:gw});
  gw.eventium.fire('start');






  // REQ BINDS

  req.app = pillars;
  // req.baseUrl
  Object.defineProperty(req,"body",{
    enumerable : true,
    get : function(){return gw.content.params;},
    set : function(set){gw.content.params = set;}
  });
  Object.defineProperty(req,"cookies",{
    enumerable : true,
    get : function(){return gw.cookie;},
    set : function(set){gw.cookie = set;}
  });
  // req.fresh
  Object.defineProperty(req,"hostname",{
    enumerable : true,
    get : function(){return gw.host;},
    set : function(set){gw.host = set;}
  });
  Object.defineProperty(req,"ip",{
    enumerable : true,
    get : function(){return gw.ip;},
    set : function(set){gw.ip = set;}
  });
  // req.ips
  Object.defineProperty(req,"method",{
    enumerable : true,
    get : function(){return gw.method;},
    set : function(set){gw.method = set;}
  });
  Object.defineProperty(req,"originalUrl",{
    enumerable : true,
    get : function(){return gw.originalPath;},
    set : function(set){gw.originalPath = set;}
  });  
  Object.defineProperty(req,"params",{
    enumerable : true,
    get : function(){return gw.params;},
    set : function(set){gw.params = set;}
  });
  Object.defineProperty(req,"path",{
    enumerable : true,
    get : function(){return gw.path;},
    set : function(set){gw.path = set;}
  });  
  Object.defineProperty(req,"protocol",{
    enumerable : true,
    get : function(){return gw.https?'https':'http';}
  }); 
  Object.defineProperty(req,"query",{
    enumerable : true,
    get : function(){return gw.query;},
    set : function(set){gw.query = set;}
  });
  // req.route
  Object.defineProperty(req,"secure",{
    enumerable : true,
    get : function(){return gw.https;}
  }); 
  // req.signedCookies
  // req.stale
  // req.subdomains
  // req.xhr

  Object.defineProperty(req,"session",{
    enumerable : true,
    get : function(){return gw.session;},
    set : function(set){gw.session = set;}
  });

  // REQ METHODS
    // req.accepts()
    // req.acceptsCharsets()
    // req.acceptsEncodings()
    // req.acceptsLanguages()
    // req.get()
    // req.is()
    // req.param()
    // req.range()


  // RES BINDS

  res.app = pillars;
  // res.locals

  // RES METHODS
  // res.append = gw.setHeader;
  //res.attachment = function(filename){return gw.file(filename,undefined,false);}
  res.cookie = Gangway.prototype.setCookie;
  // res.clearCookie
  // res.download = function(filename){return gw.file(filename,undefined,true);}
  // res.end
  // res.format
  // res.get
  res.json = Gangway.prototype.json;
  // res.jsonp
  // res.links
  // res.location
  res.redirect = Gangway.prototype.redirect;
  res.render = Gangway.prototype.render;
  res.send = Gangway.prototype.send;
  res.sendFile = Gangway.prototype.file;
  res.sendStatus = function(code){gw.statusCode = code;Gangway.prototype.send.call(gw);};
  res.set = Gangway.prototype.setHeader;
  res.status = function(code){gw.statusCode = code;};
  // res.type
  // res.vary

  // SELF REFERENCES
  res.req = req;
  req.res = res;

}

Gangway.prototype.setCookie = function(name,value,config){
  // Save new cookie for send on response.
  var gw = this;
  config = config || {}; // domain, path, expires, maxAge, secure, httpOnly;
  gw.responseCookies.push(cookieComposer(name,value,config));
};

Gangway.prototype.i18n = function(text,params,lang){
  // Return i18n alias with language preset
  var gw = this;
  return i18n(text,params,lang || gw.language);
};

util.inherits( BufferStream, stream.Readable );
function BufferStream(buffer){
  var bs = this; 
  stream.Readable.call(bs);
  bs._source = buffer;
  bs._offset = 0;
  bs._length = buffer.length;
}
  BufferStream.prototype._read = function(size){
    var bs = this;
    if(bs._offset < bs._length){
      bs.push(bs._source.slice(bs._offset, (bs._offset + size)));
      bs._offset += size;
    } else if(bs._offset >= bs._length) {
      bs.push(null);
    }
  };

Gangway.prototype.file = function(file,clientname,download){
  // Send file, can send with selected name (clientname:'name') and force download (download:true).
  // Automatic byte-range negotiation (allow broken donwloads and streaming), compression and cache control (if size<maxCacheFileSize).
  var gw = this;
  var path;
  if(typeof file === 'string'){
    path = file;
  } else if(file.path) {
    path = file.path;
  } else {
    return false;
  }
  var filename = path.replace(/^.*[\\\/]/,'');
  var filepath = path.replace(/[^\\\/]*$/,'');
  clientname = clientname || filename;

  //if(file.path) {stats = file;}
  pillars.cache.get(path,function(error,cache){
    if(error){
      gw.error(404,error);
    } else {
      gw.lastMod = cache.stats.mtime;
      if(!gw.cacheck(gw.lastMod.getTime())){
        if(cache.identity){
          if((gw.encoding === 'deflate' || gw.encoding === 'gzip') && !cache[gw.encoding]){
            zlib[gw.encoding](cache.identity, function (error, compressed) {
              if(error){
                gw.error(500,error);
              } else {
                cache[gw.encoding] = compressed;
                fileStream(cache);
              }
            });
          } else {
            fileStream(cache);
          }
        } else {
          gw.encoding='identity';
          fileStream(cache);
        }
      }
    }
  });

  function fileStream(file){
    var size = file.identity?file[gw.encoding].length:file.stats.size;
    var start = 0,end = size,ranges=false;
    if(gw.ranges && (gw.ranges.check === false || gw.ranges.check.hash === file.stats.mtime.getTime())){
      ranges = true;
      start = gw.ranges.start || start;
      end = gw.ranges.end || end;
    }
    gw.size = end-start;
    gw.maxAge = pillars.config.fileMaxAge;
    gw.setHeader("Accept-Ranges", 'bytes');
    gw.setHeader("Content-Location", '"'+path+'"');
    if(download){
      gw.setHeader('Content-Disposition', 'attachment; filename="'+clientname+'"');
    } else {
      //gw.setHeader('Content-Disposition', 'inline');
    }
    gw.setHeader('Content-type',mime.lookup(clientname));
    if(ranges){
      gw.statusCode = 206;
      gw.setHeader("Content-Range", "bytes "+start+"-"+end+"/"+size);
    }
    heading(gw);
    var stream;
    if(file.identity){
      stream = new BufferStream(ranges?file[gw.encoding]:file[gw.encoding].slice(start,end));
    } else {
      stream = fs.createReadStream(path,{start: start,end: end});
    }
    stream.on('error',function(error){
      gw.error(500,error);
    });
    stream.pipe(gw.res);
  }
};

Gangway.prototype.cacheck = function(hash){
  // cache control, set the hash of content and check client cache, return true and send 304 or false.
  var gw = this;
  if(typeof hash !== 'undefined'){
    gw.eTag.hash = hash.toString();
  }
  if(gw.cache.eTag && gw.cache.eTag.hash === gw.eTag.hash){
    gw.size = 0;
    gw.statusCode = 304;
    gw.end();
    return true;
  }
  return false;
};

Gangway.prototype.authenticate = function(msg){
  // Send http basic authetication with 'msg' message.
  // Save credentials on gangway.auth
  var gw = this;
  msg = msg || 'Restricted area, insert your credentials.';
  gw.statusCode = 401;
  gw.setHeader("WWW-Authenticate",'Basic realm="'+msg+'"');
  gw.end();
};

Gangway.prototype.redirect = function(location,code){ // Maybe 307?
  // HTTP Header redirection
  var gw = this;
  gw.statusCode = code || 301;
  gw.setHeader("Location", location || 'http://'+gw.host+'/');
  gw.end();
};

Gangway.prototype.send = function(data,type){
  // Send response, if data is string send as text/html else send as application/json parsed object.
  var gw = this;
  type = type || "text/html; charset=utf-8;";
  var body;
  var ct = false;
  if(!data){
    body = '';
  } else if(typeof data === 'string' || data instanceof Buffer) {
    ct =type;
    body = data;
  } else {
    ct = "application/json; charset=utf-8"; // TODO: for all CTs using mime.lookup("json.json") mime.charsets.lookup();
    body = JSON.decycled(data,{deep:2});
  }
  if(body){body = body instanceof Buffer ? body : new Buffer(body || "");}

  if(body && gw.encoding!='identity'){
    zlib[gw.encoding](body, function (error, body) {
      if(error){
        gw.error(500,error);
      } else {
        end(body);
      }
    });
  } else {
    end(body);
  }

  function end(body){
    gw.size = body.length;
    gw.setHeader("Content-Type", ct);
    gw.end(body);
  }
};

Gangway.prototype.json = function(data,decycledConfig){
  // forced application/json response
  decycledConfig = decycledConfig || {deep:2};
  var gw = this;
  gw.send(JSON.decycled(data,decycledConfig),"application/json; charset=utf-8");
};

Gangway.prototype.text = function(data){
  // forced text/plain response
  var gw = this;
  gw.send(data.toString(),"text/plain; charset=utf-8");
};

Gangway.prototype.html = function(data){
  // forced text/html response
  var gw = this;
  gw.send(data.toString());
};

Gangway.prototype.render = function(template,locals,reload){
  // Set default locals (gw,i18n) and render template by Templated.
  var gw = this;
  locals = locals || {};
  locals.gw = gw;
  locals.pillars = pillars;
  locals.i18n = function(){return gw.i18n.apply(gw,arguments);};

  reload = reload!==undefined?reload:pillars.config.renderReload;
  templated(template,locals,reload,function(error,html){
    if(error){
      gw.error(500,error);
    } else {
      var type = mime.lookup(gw.path.replace(/^.*\./,""));
      type = type == "application/octet-stream"? "text/html" : type;
      var charset = mime.charsets.lookup(type);
      if(charset){
        type += "; "+charset;
      }
      gw.send(html,type);
    }
  });
};

Gangway.prototype.error = function(code,error){
  // Compose a generic HTTP error page by code, optional argument Error object for details.
  var gw = this;
  gw.statusCode = code;
  var explain = gw.i18n('pillars.statusCodes',{code:code});
  var locals = {
    code: code,
    explain: explain,
    error: error
  };
  if(util.isError(error)){
    crier.error('error',{gw:gw,error:error});
    if(pillars.config.debug){
      locals.stack = error.stack;
    }
  }
  gw.render(pillars.config.errorTemplate || errorTemplate,locals);
};

/* Heading */

function chunkedHeading(gw){
  // Header composer for chuncked responses.

  gw.setHeader("Transfer-Encoding", 'chunked');
  gw.encoding = 'identity';
  gw.size = false;
  heading(gw);
}

function heading(gw){
  // Header composer for all responses.
  // Set contet-length, last-modified, cookies, language, cors, server.

  if(gw.size>=0){
    gw.setHeader("Content-Length", gw.size);
  }

  if(Object.keys(gw.eTag).length>0){
    gw.setHeader("Etag", JSON.encrypt(gw.eTag));
  }

  if(gw.responseCookies.length>0){
    gw.setHeader("Set-Cookie", gw.responseCookies);
  }

  if(gw.language){
    gw.setHeader("Content-Language", gw.language);
  }

  if(gw.encoding!='identity'){
    gw.setHeader("Vary", "Accept-Encoding");
    gw.setHeader("Content-Encoding", gw.encoding);
  }

  gw.setHeader("Server", 'Pillars.js v'+pillars.version);

  if(gw.statusCode===200){
    gw.setHeader("Cache-Control", 'private, max-age='+gw.maxAge);
    gw.setHeader("Expires", (new Date(Date.now()+gw.maxAge*1000)).toUTCString());
    gw.setHeader("Last-Modified", (gw.lastMod || new Date()).toUTCString());

    if(gw.cors.origin){
      gw.setHeader('Access-Control-Allow-Origin',Array.isArray(gw.cors.origin)?gw.cors.origin.join(', '):gw.cors.origin);
    }

    if(gw.cors.methods){
      gw.setHeader('Access-Control-Allow-Methods',gw.cors.methods.join(', '));
    }

    if(gw.cors.headers){
      gw.setHeader('Access-Control-Allow-Headers',gw.cors.headers.join(', '));
    }

    if(gw.cors.credentials){
      gw.setHeader('Access-Control-Allow-Credentials',gw.cors.credentials);
    }
  }

  gw.responseTime = parseInt(Date.now()-gw.timer,10);
  gw.setHeader("X-ResponseTime", gw.responseTime+"ms");
  gw.writeHead();
}


/* Parsers */

function acceptsParser(req){
  return {
    types: parser(req.headers['accept'] || false),
    languages: parser(req.headers['accept-language'] || false),
    encodings: parser(req.headers['accept-encoding'] || false)
  };
  function parser(accepts){
    if(!accepts){return [];}
    accepts = accepts || '';
    accepts = accepts.split(',');
    var parsed = [];
    for(var a=0,l=accepts.length;a<l;a++){
      var accept = accepts[a];
      var q = 100;
      if(accept && accept.length>0){
        accept = accept.split(';q=');
        if(accept.length>1){
          q = parseFloat(accept[1])*100;
        }
        accept = accept[0].trim();
        if(accept.length>0 && !isNaN(q)){
          parsed.push({value:accept.trim(),q:q});
        }
      }
    }
    parsed.sort(function(a, b) {
      return b.q-a.q;
    });
    return parsed;
  }
}

function contentParser(req){
  var type = req.headers['content-type'] || false;
  var length = req.headers['content-length'] || 0;
  var boundary = false;
  var params = false;
  if(type){
    var parts = type.split(';');
    type = parts[0];
    if(parts[1]){boundary = parts[1].replace(' boundary=','');}
  }

  return {type:type,length:length,boundary:boundary,params:params};
}

function rangesParser(req){
  var range = req.headers['range'] || false;
  if(!range){return false;}
  range = range.split('=');
  var unit = range[0];
  if(unit!='bytes'){return false;}
  var start;
  var end;
  if(range[1]){
    range[1]=range[1].split('-');
    if(range[1][0]===''){
      return false;
    } else {
      if(range[1][0]!=='' && range[1][0]>=0){start=parseInt(range[1][0],10);}
      if(range[1][1]!=='' && range[1][1]>0){end=parseInt(range[1][1],10);}
    }
  }
  return {
    check: req.headers['if-range']?JSON.decrypt(req.headers['if-range']):false,
    unit:unit,
    start:start,
    end:end
  };
}

function authParser(req){
  var auth = req.headers['authorization'] || false;
  if(auth){
    auth = (new Buffer(auth.split(' ').pop(), 'base64')).toString().split(':');
    auth = {user:auth[0] || '',pass:auth[1] || ''};
  }
  return auth;
}

function uaParser(req){
  var ua  = req.headers['user-agent'] || false;
  if(!ua){return false;}
  var mobile = /mobi/.test(ua);
  var os = /\(([^\(\)]+)\)/.exec(ua);
  if(os){os=os[1];} else {os='unknow';}
  var engine = 'unknow';
  var engines = {
    'Gecko': /Gecko/,
    'WebKit': /AppleWebKit/,
    'Presto': /Opera/,
    'Trident': /Trident/,
    'Blink': /Chrome/,
  };
  for(var e=0,ek=Object.keys(engines),el=ek.length;e<el;e++){
    if(engines[ek[e]].test(ua)){engine=ek[e];}
  }
  var browser = 'unknow';
  var browsers = {
    'Firefox' : [/Firefox\/([a-z0-9\.]*)/,/Seamonkey/],
    'Seamonkey' : [/Seamonkey\/([a-z0-9\.]*)/],
    'Chrome' : [/Chrome\/([a-z0-9\.]*)/,/Chromium/],
    'Chromium' : [/Chromium\/([a-z0-9\.]*)/],
    'Safari' : [/Safari\/([a-z0-9\.]*)/,/Chrome|Chromium/],
    'Opera' : [/Opera\/([a-z0-9\.]*)|OPR\/([a-z0-9\.]*)/],
    'MSIE' : [/MSIE ([a-z0-9\.]*)/]
  };
  for(var b=0,bk=Object.keys(browsers),bl=bk.length;b<bl;b++){
    if(browsers[bk[b]][0].test(ua) && (browsers[bk[b]].length==1|| !browsers[bk[b]][1].test(ua))){browser=bk[b];}
  }
  return {mobile:mobile,os:os,engine:engine,browser:browser};
}

function getEncoding(encodings){
  encodings = encodings || [];
  if(!Array.isArray(encodings)){encodings=[];}
  if(encodings.length===0){
    return 'identity';
  }

  var all = false;
  var identity = true;
  var deflate = false;
  var gzip = false;

  for(var i=0,l=encodings.length;i<l;i++){
    var e = encodings[i];
    if(e.value==='*'){
      all = e.q>0;
    } else if(e.value==='deflate'){
      deflate = e.q>0;
    } else if(e.value==='gzip'){
      gzip = e.q>0;
    } else if(e.value==='identity'){
      identity = e.q>0;
    }
  }

  if(all || gzip){
    return 'gzip';
  } else if(deflate){
    return 'deflate';
  } else if(identity) {
    return 'identity';
  } else {
    return false;
  }
}

Gangway.queryHeap = queryHeap;
function queryHeap(query){
  var result = {};
  for(var i=0,k=Object.keys(query),l=k.length;i<l;i++){
    var param = k[i];
    if(/^[a-z0-9]+(\.[a-z0-9]+)+$/i.test(param)){
      result = merge(result,param.split('.'),query[param]);
    } else if(/^[^\[\]]+(\[[^\[\]]*\])+$/i.test(param)){
      result = merge(result,param.split(/\[|\]\[|\]/ig).slice(0,-1),query[param]);
    } else {
      result[param]=query[param];
    }
  }
  function merge(o,m,v){
    if(m.length>1){
      var im = m.splice(0,1).toString();
      if(im===''){im=Object.keys(o).length;}
      if(!o[im]){
        o[im]={};
      }
      merge(o[im],m,v);
    } else {
      o[m[0]]=v;
    }
    return o;
  }
  return result;
}

function cookieParser(cookieHeader) {
  var result = {};
  var pairs = cookieHeader.split(/; */);

  for(var p=0,l=pairs.length;p<l;p++){
    var pair = pairs[p];
    var i = pair.indexOf('=');
    if(i < 0){ break; }
    var key = pair.substr(0, i).trim();
    var val = pair.substr(++i, pair.length).trim();
    if('"' == val[0]){ val = val.slice(1, -1); }

    if(typeof result[key] === 'undefined'){
      try {
        result[key] = decodeURIComponent(val);
      } catch (e) {
        result[key] = val;
      }
    }
  }
  return result;
}

function cookieComposer(name, value, config){
  config = config || {};
  var pairs = [name+'='+encodeURIComponent(value)];

  if(config.domain && config.domain!='localhost'){
    pairs.push('Domain=' + config.domain);
  }

  if(typeof config.path === 'undefined'){config.path = '/';}
  if(config.path){
    pairs.push('Path=' + config.path);
  }

  if(config.maxAge && parseInt(config.maxAge,10)==config.maxAge && (!config.expires || !config.expires.toUTCString)){
    config.expires = new Date(Date.now()+config.maxAge*1000);
  }
  if(config.expires && config.expires.getTime && (!config.maxAge || parseInt(config.maxAge,10)!=config.maxAge)){
    config.maxAge = (Date.now()-config.expires.getTime())/1000;
  }

  if(config.expires && config.expires.toUTCString){
    pairs.push('Expires=' + config.expires.toUTCString());
  }
  if(config.maxAge && parseInt(config.maxAge,10)==config.maxAge) {
    pairs.push('Max-Age='+config.maxAge);
  }

  if(config.httpOnly){
    pairs.push('HttpOnly');
  }
  if(config.secure){
    pairs.push('Secure');
  }
  return pairs.join('; ');
}

function errorTemplate($){
  var output = '';
  output += '<!DOCTYPE html>';
  output += '<html lang="'+$.gw.language+'">';
    output += '<head>';
      output += '<title>'+$.code+' '+$.explain+'</title>';
      output += '<meta charset="utf-8">';
      output += '<meta http-equiv="X-UA-Compatible" content="IE=edge">';
      output += '<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no">';
      output += '<link rel="stylesheet" href="//netdna.bootstrapcdn.com/bootstrap/3.1.1/css/bootstrap.min.css">';
    output += '</head>';
    output += '<body>';
      output += '<div class="container">';
        output += '<header id="header">';
          output += '<h1>'+$.code+' '+$.explain+'</h1>';
        output += '</header>';
        output += '<div id="page">';
          if(typeof $.stack !== 'undefined'){
            output += '<pre>'+$.stack+'</pre>';
          }
        output += '</div>';
        output += '<footer id="footer"></footer>';
      output += '</div>';
    output += '</body>';
  output += '</html>';
  return output;
}
