// Pillars.js require & config
var project = require('../../index').configure({
  debug: true,                     //> Show detailed errors on response. (Error 500...)
  renderReload: true               // Check modified template files and refresh render.

  /* More options */

  // cors: false,                  //> Enable, disable or avaliable origins array for CORS
  // maxUploadSize: 5*1024*1024,   //> Default max upload size for request body
  
  // fileMaxAge : 7*24*60*60,        //> Default max age (client cache negotiation) for served files.
  
  // favicon: project.resolve('./favicon.ico') //> favicon place

  // directoryTemplate: false  //> Custom directory listing template
  // errorTemplate: false      //> Custom error template

  // maxCacheFileSize : 5*1024*1024, //> Memory file cache aceptable file size
  // cacheMaxSamples : 100,          //> Limit of request log (average usage) for each file
  // cacheMaxSize : 250*1024*1024,   //> Cache size limit
  // cacheMaxItems : 5000,           //> Max number of files in memory cache

  /* ... */
});



// HTTP server config & start (default builtin http service)
project.services.get('http').configure({timeout:8000,port:3001}).start();



// Add more HTTP/HTTPS services
var fs = require('fs');
var key = fs.readFileSync('./localhost.key');
var cert = fs.readFileSync('./localhost.crt');
project.services.insert((new HttpService({
	id:'https',            //> For get by project.services.get('https')...configure({})...start()....stop()...
  timeout:8000,
	key: key,              //> If is set key & cert, httpService create a HTTPS service.
	cert: cert,
  port: 3002             //> Port, default as 8080
  // hostname: undefined //> Restricted hostname

  /* ... Each property is passed to createServer method for full config control */
})).start());



// Config i18n
i18n.languages = ['en','es'];        //> Set project accepted languages (First element used as default language)
i18n.load('overview','./languages'); //> Example translation sheet



// Config Log manager
var crier = global.crier.addGroup('overview'); //> Get global log manager and set local version, you can add unlimited tree subgroups



// Controllers

project.routes.add(new Route({
  id:'Root',
  path: '/'
},function(gw){
  gw.redirect("/examples",307); //> default redirect is 301
}));

var ExamplesRoot = new Route({
  id:'Examples',
  path:'/examples',
  method: ['get','post']
},function(gw){

  // Examples link list
  var sections = [
    {title:"Status",path:"/examples/status"},
    {title:"Source",path:"/examples/source"},
    {title:"Error handling",path:"/examples/error-handling"},
    {title:"Timeout (wait 10 seconds please)",path:"/examples/timeout"},
    {title:"Sessions (no persistable)",path:"/examples/session"},
    {title:"Query string",path:"/examples/query?a=1&b=2&c=3&d[x]=X&d[y]=Y&d[z]=Z&e.x=X&e.y=Y&e.z=Z"},
    {title:"Path parameters",path:"/examples/path-params/a/b/c"},
    {title:"Template",path:"/examples/template"},
    {title:"Advanced routing control (restricted to GET>https://localhost:3002)",path:"/examples/routing"},
    {title:"Basic cache (304)",path:"/examples/cache"},
    {title:"Request body read (Forms & uploads)",path:"/examples/body-reader"},
    {title:"File directory service",path:"/examples/static"},
    {title:"Auto directory file render (Gangway overview)",path:"/examples/static/auto-render.jade"},
    {title:"Chunked",path:"/examples/chunked"},
    {title:"Show http services",path:"/examples/http-services"},
    {title:"Show scheduled jobs",path:"/examples/scheduled-tasks"},
    {title:"Route config inheritance",path:"/examples/inheritance"},
    {title:"Multi language sites (http://www.example.com/es style)",path:"/examples/lang-path"},
    {title:"Multi language sites [es]",path:"/es/examples/lang-path"},
    {title:"i18n URLs",path:"/examples"+i18n("overview.iPathExample",{},'en')}, //> Get the path from i18n sheet
    {title:"i18n URLs (es)",path:"/es/examples"+i18n("overview.iPathExample",{},'es')},
  ];

  // HTML for examples link list
  var output = '';
  output += '<!DOCTYPE html>';
  output += '<html lang="'+gw.language+'">';
    output += '<head>';
      output += '<title>'+gw.i18n('overview.welcome')+'</title>'; //> gw.i18n translates to request language
      output += '<meta charset="utf-8">';
      output += '<link rel="stylesheet" href="//netdna.bootstrapcdn.com/bootstrap/3.1.1/css/bootstrap.min.css">';
    output += '</head>';
    output += '<body>';
      output += '<div class="container">';
        output += '<header>';
          output += '<h1>'+gw.i18n('overview.welcome')+'</h1>';
        output += '</header>';
        output += '<div id="page">';
          output += '<ul>';
          for(var i=0,l=sections.length;i<l;i++){
            output += '<li><a href="'+sections[i].path+'">'+sections[i].title+'</li>';
          }
          output += '</ul>';
        output += '</div>';
      output += '</div>';
    output += '</body>';
  output += '</html>';

  // Finally response output as HTML.
  gw.html(output);

});

// Important! Add the new Route object to the project. project.routes is a ObjectArray (github.com/bifuer/ObjectArray)
project.routes.add(ExamplesRoot); //> You can get, move... project.routes.get(id).configure({})...



// Show project info, the project object as is
ExamplesRoot.routes.add(new Route({
  id:'Status',
  path:'/status'
},function(gw){
  gw.json(project,{deep:3});
  // gw.json limit (by default) the object deep to one level and clean circular references (github.com/bifuer/JSON.decycled)
  // gw.json accept JSON.decycled params optionally {deep,dates,functions...}
}));



// Send this file and show as text file.
ExamplesRoot.routes.add(new Route({
  id:'Source',
  path:'/source'
},function(gw){
  gw.file('./app.js','pillarsjs-overview-source.txt'); //> Second paramater force new name for file, third parameter force download.
  // gw.file() support byte-serving (broken downloads, video players...), memCache, clientCache, compression and preprocesors
}));



// Test auto error handling
ExamplesRoot.routes.add(new Route({
  id:'ErrorHanling',
  path:'/error-handling'
},function(gw){
  var a = b + c; //> throw a exception
}));



// Timeout handler example
ExamplesRoot.routes.add(new Route({
  id:'timeout',
  path: '/timeout'
},function(gw){
  // ... Response Server timeout error.
}));



// Basic no persistable session support
ExamplesRoot.routes.add(new Route({
  id:'Session',
  path:'/session',
  session: true //> launch session support for this controller.
},function(gw){
  gw.session.counter = gw.session.counter || 0; //> Get&set counter value
  gw.session.counter++;
  gw.json(gw.session); //> Show session values as JSON
}));



// Query string example
ExamplesRoot.routes.add(new Route({
  id:'Query',
  path:'/query'
},function(gw){
  // The query string (and request body values) support 'heaping': a[b][c] || a.b.c
  gw.json(gw.query); //> Aditionally copied in gw.params
}));



// Parametrized paths example
ExamplesRoot.routes.add(new Route({
  id:'PathParams',
  path:'/path-params/:param1/*:restOfPath'
},function(gw){
  gw.json(gw.pathParams); //> Aditionally copied in gw.params
}));



// Template engine example
ExamplesRoot.routes.add(new Route({
  id:'Template',
  path:'/template'
},function(gw){
  gw.render('./example.jade',{
    contents: '<strong>I❤︎Pillars.js</strong>'
  });
}));



// Advanced routing control example
ExamplesRoot.routes.add(new Route({
  id:'Routing',
  path:'/routing',
  https: true,                   //> only ssl requests
  host: 'localhost',             //> only on localhost
  method: ['GET'],               //> only GET method
  // port: 8080,                 //> Filter by port
  // maxUploadSize: 10*1024*1024 //> Add some controller instance properties overwrite defaults
},function(gw){
  gw.text("Hello! This is a very exquisite Route.");
}));



// Client cache negotiation
ExamplesRoot.routes.add(new Route({
  id:'CacheControl',
  path:'/cache'
},function(gw){
  var hash = new Date(1); //> Set old date as identificative 'hash' for the response.
  if(!gw.cacheck(hash)){
    gw.text("Hello!");
  }
  // cmd+R reponses as 304, cmd+shift+R reponses with "Hello!" and 200 statusCode
}));



// BodyReader Plugin example
ExamplesRoot.routes.add(new Route({
  id:'BodyReaderPlugin',
  path:'/body-reader',
  method: ['post','get'],
  multipart: true
},function(gw){

  var uploadFile = gw.params.upload;
  if(uploadFile && uploadFile.path){
    fs.rename(uploadFile.path, './uploads/'+uploadFile.name, function(error){
      if(!error){
        uploadFile.moved = true;
        form();
      } else {
        form();
      }
    });
  } else {
    form();
  }

  function form(){
    var output = '';
    output += '<!DOCTYPE html>';
    output += '<html lang="'+gw.language+'">';
      output += '<head>';
        output += '<title>'+'Forms and files uploads'+'</title>';
        output += '<meta charset="utf-8">';
        output += '<link rel="stylesheet" href="//netdna.bootstrapcdn.com/bootstrap/3.1.1/css/bootstrap.min.css">';
      output += '</head>';
      output += '<body>';
        output += '<div class="container">';
          output += '<header>';
            output += '<h1>'+'Tools'+'</h1>';
          output += '</header>';
          output += '<div id="page">';
            
            output += '<fieldset>'+
               '<legend>Form POST method</legend>'+
              '<form method="POST">'+
                'A.<input type="text" name="A" /><br/>'+
                'B.<input type="text" name="B" /><br/>'+
                'C.<input type="text" name="C" /><br/>'+
                '<input type="submit" />'+
              '</form>'+
            '</fieldset>'+
            '<fieldset>'+
              '<legend>Form multipart</legend>'+
              '<form enctype="multipart/form-data" method="POST">'+
                'A.<input type="text" name="A" /><br/>'+
                'B.<input type="text" name="B" /><br/>'+
                'C.<input type="text" name="C" /><br/>'+
                'Upload.<input type="file" name="upload" /><br/>'+
                'MultipleUpload.<input type="file" name="uploadMulti" multiple="multiple" /><br/>'+
                '<input type="submit" />'+
              '</form>'+
            '</fieldset>'+
            '<pre>'+JSON.decycled(gw.params,3,'  ')+'</pre>';
            
          output += '</div>';
        output += '</div>';
      output += '</body>';
    output += '</html>';
    gw.html(output);
  }

}));



// Static service
ExamplesRoot.routes.add(new Route({
  id:'DirectoryPlugin',
  directory: {       //> this property launch the static directory Plugin "Directory".
    path:'./static', //> File system path to serve
    listing:true     //> directory listing?
  },
  path:'/static/*:path', //> Directory Plugin expects a 'path' parameter for real directory navigation
}));



// Chunked response example
ExamplesRoot.routes.add(new Route({
  id:'Chunked',
  path: '/chunked'
},function(gw){
  var slowchuncking = new Procedure(); //> Procedure is a utility for easy aync block executions (github.com/bifuer/procedure)
  function chunking(chunk,done){
    gw.write(chunk);
    setTimeout(done,1000); //> Write and little sleep.
  }
  for(var i=0;i<10;i++){
    slowchuncking.add(chunking,key); //> Use key (localhost.key file) as example data block 
  }
  slowchuncking.launch(function(errors){ //> Procedure handler, receives a errors array or false if all is ok.
    gw.end();
  });
}));



// Show only HTTP services in project
ExamplesRoot.routes.add(new Route({
  id:'HttpServices',
  path: '/http-services'
},function(gw){
  gw.json(project.services.getAll(HttpService,'constructor'),{deep:2}); //> See ObjectArray methods & JSON.decycled options
}));



// Show Scheduled task
ExamplesRoot.routes.add(new Route({
  id:'ScheduledTasks',
  path: '/scheduled-tasks'
},function(gw){
  gw.json(Scheduled.jobs,{deep:2}); //> See ObjectArray methods & JSON.decycled options
}));



// Route config inheritance example
ExamplesRoot.routes.add(new Route({
  id:'Inheritance',
  path: '/inheritance',
  method: ['get'],
  session: true,
  multipart: true,
  cors: false,
  dummy: 'dummyOption'
},function(gw){
  // Show routing result as JSON
  gw.json(gw.routing,{deep:4}); //> gw.json accept JSON.decycled params optionally (github.com/bifuer/JSON.decycled)
}));



// Internazionalized sites, site.com/en/... site.com/de/...
ExamplesRoot.routes.add(new Route({
  id:'LangPathPlugin',
  path:'/lang-path'
},function(gw){
  // LangPath plugin auto redirect any localized path and set gw.language property.
  gw.text(gw.i18n('overview.language'));
}));



// Internacionalized paths
ExamplesRoot.routes.add(new Route({
  id:'iPathsTest',
  iPath: 'overview.iPathExample' //> A i18n node as path for friendly localized URLs
},function(gw){
  gw.text(gw.i18n('overview.language')); //> Response text/plain
}));


