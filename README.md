# [![Pillars - nodejs web engine ](http://pillarsjs.com/logo.png)](http://pillarsjs.com/)

> _Pillars is still an Alpha version. In a few days the documentation and the first stable version will be available._
> __Very soon you'll see Node web development in a different way.__

## Scope

### HTTP negotiation (app+gangway)
* Cache control.
* File server + compression + cache + range negotiation.
* Query + Post + Path params control.
* __No more req+res. Now Gangway is the way.__
* Complete parsed HTTP request (ua,auth,ranges,etag,location,languages,content,cookies...).
* Full error handling.
***

### Modular router (pillars+beams)
* Grouped routes+handler (beam) in pillars.
* 2 step router is more organized and quickly.
* Dynamic routes /:param /*:param and their combinations.
* Dynamic enviroment, you can programmatically add, remove, move, reasign, copy routes (beams & pillars) in a running app.
* Named routes for better organization.
* Multi app, you can run multiple servers and share routes and handlers etc.
***

### Mongodb integration (modelator)
* Session control.
* Schema definitions and automatic REST-API generation.
* Automagically angular client app generation for schemas.
* Built-in user credential control based on keys & key rings.
***

### i18n (textualization)
* Textualization aka t12n is the integrated translation system, easy and fast, support context params.
* All enviroment is i18n-able, console included.
* JSON translation docs.
* You can translate by printf,cases or functions based in context params.
* Output messages (console and html) of entire system are translate in English and Spanish.
***

### build-in modules (precasts)
* One-line static server routes.
* One-line REST-API routes for schemas.
* Credential controlled static server based on modelator schemas.
***

### And...
* Very short dependency list.
* Tutorials and reference guide in English and Spanish.
* And examples with compared code for PHP, for new Nodejs adopters.
* is coming ... (90%)

## License

MIT