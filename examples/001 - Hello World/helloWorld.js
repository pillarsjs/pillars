require('../../pillars.js').start();

ENV.languages = ['es','en'];
ENV.templates.cache = false;


route = new Route(function(gw){gw.send("Hola Mundo")});
console.log(route.id);
//Imprime: i45w7qt1
route.id = "myRoute";
console.log(route.id);
//Imprime: myRoute