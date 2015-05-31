// jshint strict:true, node:true, camelcase:true, curly:true, maxcomplexity:16, newcap:true
"use strict";

var i18n = require('textualization');
var templated = require('templated');

var util = require("util");

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

module.exports = Gangway;
Gangway.cache = {};
function Gangway(req,res){
  var gw = this;

  // ###################################
  // Initialization properties & methods
  // ###################################

  gw.events = new ObjectArray();
  gw.timer = Date.now();
  gw.responseTime = 0;
  gw.closed = false; // closed controller.
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
  gw.writeHead = function(statusCode,phrase,headers){if(!gw.headersSent){return res.writeHead.call(res,statusCode,phrase,headers);}};
  gw.setHeader = function(name,value){if(!gw.headersSent){return res.setHeader.call(res,name,value);}};
  gw.getHeader = function(name){return res.getHeader.call(res,name);};
  gw.removeHeader = function(name){return res.removeHeader.call(res,name);};
  gw.addTrailers = function(headers){return res.addTrailers.call(res,headers);};
  gw.write = function(chunk,encoding){return res.write.call(res,chunk,encoding);};
  gw.end = function(data,encoding){return res.end.call(res,data,encoding);};






  // ##############
  // Events control
  // ##############

  res
    .on('timeout',function(){gw.error(408);})
    .on('close',function(){gw.close();})
    .on('error',function(){crier.log('res.error',gw);})
    .on('finish',function(){gw.close();});
  




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
    check: true,  // if-range header or true, for entity check control
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
  gw.https = req.socket.ssl?true:false;
  gw.host = (req.headers['host'] || '').replace(/\:.*$/,'');
  gw.port = (req.headers['host'] || '')==gw.host?'80':(req.headers['host'] || '').replace(/^.*\:/,'');
  gw.method = req.method || 'unknow';
  gw.path = req.url.replace(/\?.*$/i,'').replace(/\/*$/i,'');
  gw.originalPath = gw.path;
  gw.query = ((req.url.indexOf("?")>=0 && querystring.parse(req.url.substr(req.url.indexOf("?")+1))) || {});
  gw.referer = req.headers['referer'] || false;
  gw.connection = req.headers['connection'] || false;
  gw.cache = {
    control: req.headers['cache-control'] || false,
    nonematch: req.headers['if-none-match']?JSON.decrypt(req.headers['if-none-match']):false,
    modsince: req.headers['if-modified-since'] || false
  };





  // ########################
  // Gangway added properties
  // ########################

  gw.files = {}; // Files descriptors from multipart upload.
  gw.pathParams = {}; // Only path params parsed.
  gw.params = queryHeap(gw.query);
  gw.queryHeap = queryHeap;
  
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
  gw.lastmod = new Date(); // response date.
  gw.etag = {}; // etag header for response.
  gw.maxage = 0;

  crier.log('open',gw);
  gw.event('open');
}

Gangway.prototype.event = function(name,meta,callback){
  var gw = this;
  var ons = gw.events.getAll(name,'name');
  if(ons.length>0){
    var procedure = new Procedure();
    var i,l;
    for(i=0,l=ons.length;i<l;i++){
      var event = ons[i];
      procedure.add('gw.event.'+name+"."+event.handler.name,event.handler,gw,meta);
    }
    procedure.launch(function(errors){
      if(errors){
        crier.error('error',{error:errors[i]},callback);
      } else if(callback){
        callback();
      }
    });
  } else if(callback){
    callback();
  }
};

Gangway.prototype.on = function(name,handler,index){
  var gw = this;
  gw.events.insert({name:name,handler:handler},index);
};

Gangway.prototype.close = function(){
  // Finish the ganway
  var gw = this;
  if(!gw.closed){
    gw.closed = true;
    gw.event('close',{},function(){
      gw.responseTime = parseInt((Date.now()-gw.timer)*100,10)/100;
      crier.log('close',gw);
    });
  }
};

Gangway.prototype.setCookie = function(name,value,config){
  // Save new cookie for send on response.
  var gw = this;
  config = config || {}; // domain, path, expires, maxAge, secure, httpOnly;
  gw.responseCookies.push(cookieComposer(name,value,config));
};

Gangway.prototype.i18n = function(text,params){
  // Return i18n alias with language preset
  var gw = this;
  return i18n(text,params,gw.language);
};

Gangway.cache = {
  size:0,
  items:{},
  stats: function(id){
    var item = Gangway.cache.items[id];
    if(typeof item !== 'undefined'){
      return item.stats;
    }
  },
  check : function(id){
    var item = Gangway.cache.items[id];
    if(typeof item !== 'undefined'){
      var uses = item.uses;
      uses.push(Date.now());
      if(uses.length>=pillars.config.cacheMaxSamples){uses.splice(0,uses.length-pillars.config.cacheMaxSamples);}
      var average = 0;
      for(var i=0,l=uses.length;i<l;i++){
        average+=uses[i];
      }
      item.average = Math.round(average/uses.length);
      return item;
    }
  },
  insert : function(id,data,stats){
    Gangway.cache.size += data.length;
    var item = Gangway.cache.items[id] = {
      uses: [Date.now()],
      identity: data,
      stats: stats
    };
    return item;
  },
  cleaner: function(){
    var rank = Object.keys(Gangway.cache.items);
    rank.sort(function(a, b) {
      a = Gangway.cache.items[a].average;
      b = Gangway.cache.items[b].average;
      if(typeof a === 'undefined'){return -1;}
      if(typeof b === 'undefined'){return 1;}
      return a-b;
    });
    while(Gangway.cache.size>pillars.config.cacheMaxSize || Gangway.cache.items.length>pillars.config.cacheMaxItems){
      var removed = rank.shift();
      var size = Gangway.cache.items[removed].identity.length;
      delete Gangway.cache.items[removed];
      Gangway.cache.size -= size;
    }
    crier.info('cacheCleaned');
  }
};

Gangway.cache.cleanerJob = new Scheduled({
  id: 'fileCacheCleaner',
  pattern: '*',
  task: Gangway.cache.cleaner
}).start();

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
  var filecname = false;
  clientname = clientname || filename;
  download = download?'attachment':'inline';
  var stats;

  if(typeof file === 'string'){
    stats = Gangway.cache.stat(path);
    if(stats && Date.now()-stats.mtime<30*1000){
      fileCheck();
    } else {
      fs.stat(path, function(error, _stats){
        if(error){
          gw.error(404,error);
        } else {
          stats = _stats;
          fileCheck();
        }
      });
    }
  } else if(file.path) {
    stats = file;
    fileCheck();
  }

  function fileCheck(){
    gw.lastmod = stats.mtime;
    if(!gw.cacheck(gw.lastmod.getTime())) {
      if(stats.size <= pillars.config.maxCacheFileSize){
        var cache = Gangway.cache.check(path);
        if(!cache || cache.stats.mtime<stats.mtime){
          fs.readFile(path,function(error,data){
            if(error){
              gw.error(500,error);
            } else {
              cache = Gangway.cache.insert(path,data,stats);
              cacheStream(cache);
            }
          });
        } else {
          cacheStream(cache);
        }
      } else {
        gw.encoding='identity';
        fileStream();
      }
    }
  }

  function cacheStream(cache){
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
  }

  function fileStream(cache){
    var size = cache?cache[gw.encoding].length:stats.size;
    var start = 0,end = size,ranges=false;
    if(gw.ranges && (gw.ranges.check === false || gw.ranges.check.lastmod === stats.mtime.getTime())){
      ranges = true;
      start = gw.ranges.start || start;
      end = gw.ranges.end || end;
    }
    gw.size = end-start;
    gw.maxage = pillars.config.fileMaxAge;
    gw.head();
    gw.setHeader("Accept-Ranges", 'bytes');
    gw.setHeader("Content-Location", '"'+path+'"');
    gw.setHeader('Content-Disposition', download+'; filename="'+clientname+'"');
    gw.setHeader('Content-type',mime.lookup(clientname));
    if(ranges){
      gw.statusCode = 206;
      gw.setHeader("Content-Range", "bytes "+start+"-"+end+"/"+size);
      gw.head();
    }

    if(cache){
      gw.end(ranges?cache[gw.encoding]:cache[gw.encoding].slice(start,end));
    } else {
      var stream = fs.createReadStream(path,{start: start,end: end});
      stream.on('error',function(error){
        gw.error(500,error);
      });
      stream.pipe(gw.res);
    }
  }
};

Gangway.prototype.cacheck = function(hash){
  // cache control, set the hash of content and check client cache, return true and send 304 or false.
  var gw = this;
  if(typeof hash !== 'undefined'){
    gw.etag.hash = hash.toString();
  }
  if(gw.cache.nonematch && gw.cache.nonematch.hash === gw.etag.hash){
    gw.size = 0;
    gw.statusCode = 304;
    gw.head();
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
  gw.head();
  gw.end();
};

Gangway.prototype.redirect = function(location){
  // HTTP Header redirection
  var gw = this;
  location = location || 'http://'+gw.host+'/';
  gw.statusCode = 301;
  gw.setHeader("Location",location);
  gw.head();
  gw.end();
};

Gangway.prototype.head = function(){
  // Header composer for all responses.
  // Set contet-length, last-modified, cookies, language, cors, server.

  var gw = this;

  gw.setHeader("Content-Length", gw.size);

  if(Object.keys(gw.etag).length>0){
    gw.setHeader("Etag", JSON.encrypt(gw.etag));
  }

  if(gw.responseCookies.length>0){
    gw.setHeader("Set-Cookie", gw.responseCookies);
  }

  if(gw.language){
    gw.setHeader("Content-Language", gw.language);
  }

  gw.setHeader("Vary", "Accept-Encoding");
  if(gw.encoding!='identity'){
    gw.setHeader("Content-Encoding", gw.encoding);
  }

  gw.setHeader("Server", 'Pillars.js v'+pillars.version);

  if(gw.statusCode===200){
    gw.setHeader("Cache-Control", 'private, max-age='+gw.maxage);
    gw.setHeader("Expires", (new Date(Date.now()+gw.maxage*1000)).toUTCString());
    gw.setHeader("Last-Modified", (gw.lastmod || new Date()).toUTCString());

    if(gw.cors.origin){
      gw.setHeader('Access-Control-Allow-Origin',gw.cors.origin);
    }

    if(gw.cors.methods){
      gw.setHeader('Access-Control-Allow-Methods',gw.cors.methods);
    }

    if(gw.cors.headers){
      gw.setHeader('Access-Control-Allow-Headers',gw.cors.headers);
    }

    if(gw.cors.credentials){
      gw.setHeader('Access-Control-Allow-Credentials',gw.cors.credentials);
    }
  }

  gw.responseTime = parseInt((Date.now()-gw.timer)*100,10)/100;
  gw.setHeader("X-ResponseTime", gw.responseTime);

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
    ct = "application/json";
    body = JSON.stringify(data);
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
    var hash = crypto.createHash('sha1').update(body).digest('hex');
    if(!gw.cacheck(hash)){
      gw.setHeader("Content-Type", ct);
      gw.head();
      gw.end(body);
    }
  }
};

Gangway.prototype.json = function(data){
  // forced application/json response
  var gw = this;
  gw.send(JSON.stringify(data),"application/json");
};

Gangway.prototype.text = function(data){
  // forced text/plain response
  var gw = this;
  gw.send(data.toString(),"text/plain");
};

Gangway.prototype.html = function(data){
  // forced text/html response
  var gw = this;
  gw.send(data.toString());
};

Gangway.prototype.render = function(template,locals,reload){
  // Set default locals (gw,i18n,util) and render template by Templated.
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
      gw.send(html);
    }
  });
};

Gangway.prototype.error = function(code,error){
  // Compose a generic HTTP error page by code, optional argument Error object for details.
  var gw = this;
  gw.statusCode = code;
  var explain = gw.i18n('pillars.statusCodes',{code:code});
  var h1 = gw.i18n('pillars.gangway.error-h1',{code:code,explain:explain});
  var locals = {
    code: code,
    title: explain,
    h1: h1,
    error: error
  };
  crier.error('error',{gw:gw,error:error});
  if(util.isError(error) && pillars.config.debug){
    locals.stack = error.stack;
  }
  gw.render(pillars.config.errorTemplate || errorTemplate,locals);
};





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
      deflate = e.q>0;
    } else if(e.value==='identity'){
      identity = e.q>0;
    }
  }

  if(all || deflate){
    return 'deflate';
  } else if(gzip){
    return 'gzip';
  } else if(identity) {
    return 'identity';
  } else {
    return false;
  }
}

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
      output += '<title>'+$.title+'</title>';
      output += '<meta charset="utf-8">';
      output += '<meta http-equiv="X-UA-Compatible" content="IE=edge">';
      output += '<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no">';
      output += '<link rel="stylesheet" href="//netdna.bootstrapcdn.com/bootstrap/3.1.1/css/bootstrap.min.css">';
    output += '</head>';
    output += '<body>';
      output += '<div class="container">';
        output += '<header id="header">';
          output += '<h1>'+$.h1+'</h1>';
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
