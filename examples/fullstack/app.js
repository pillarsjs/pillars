var project = require('../../index').configure({
  renderReload: true
});

project.services.get('http').configure({port:3000}).start();

var i18n = require('textualization');
i18n.languages = ['es','en'];

var crier = require('crier').addGroup('fullstack');
crier.constructor.console.language = 'es';



/*

// Mailer
var nodemailer = require('nodemailer');

var mailTransport;
Object.defineProperty(ENV,"smtp",{
  enumerable : true,
  get : function(){return mailTransport;},
  set : function(set){
    mailTransport = nodemailer.createTransport(set);
  }
});

var mailer = global.mailer = {};

mailer.send = function(mail,callback){
  if(!mail.from && ENV.administrator && ENV.administrator.mail){
    mail.from = ENV.administrator.mail;
    if(ENV.administrator.firstname){
      var fromName = (ENV.administrator.lastname)?ENV.administrator.firstname+' '+ENV.administrator.lastname:ENV.administrator.firstname;
      mail.from = fromName+' <'+mail.from+'>';
    }
  }
  if(mailTransport){
    ENV.emit('mail',mail);
    mailTransport.sendMail(mail, function(error,info){
      if(callback){callback(error,info);}
    });
  } else {
    if(callback){callback(new Error(i18n('pillars.mail.no-transport')));}
  }
};



*/


/*


// Setup Templated .jade support.
var templated = require('templated');
var jade = require('jade');
var marked = require('marked');
var hljs = require('highlight.js');
function hljsFix(str,lang){
  var result;
  if(lang){
    result = hljs.highlight(lang,str,true).value;
  } else {
    result = hljs.highlightAuto(str).value;
  }
  result = result.replace(/^((<[^>]+>|\s{4}|\t)+)/gm, function(match, r) {
    return r.replace(/\s{4}|\t/g, '  ');
  });
  result = result.replace(/\n/g, '<br>');
  return '<pre class="highlight"><code>'+result+'</pre></code>';
}
jade.filters.highlight = function(str,opts){
  return hljsFix(str,opts.lang);
};
jade.filters.codesyntax = function(str,opts){
  str = str.replace(/^((<[^>]+>|\s{4}|\t)+)/gm, function(match, r) {
    return r.replace(/\s{4}|\t/g, '  ');
  });
  return '<pre class="codesyntax"><code>'+str+'</pre></code>';
};
marked.setOptions({
  highlight: function (code,lang) {
    return hljsFix(code,lang);
  }
});
templated.addEngine('jade',function compiler(source,path){
  return jade.compile(source,{filename:path,pretty:true,debug:false,compileDebug:true});
});


*/


/*



// Static service
var pillarsStatic = new Route({
  id:'pillarsStatic',
  path:'/pillars/*:path',
  directory:{
    path:pillars.resolve('./static'),
    listing:true
  }
});
pillars.routes.add(pillarsStatic);


*/