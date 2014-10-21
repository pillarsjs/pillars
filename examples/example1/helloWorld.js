var pillars = require('../../pillars.js').global().configure({
	templatesCache:false
});

var app = new App().start()
	.add(new Pillar()
		.add(new Beam(function(gw){
			gw.send("Hola Mundo");
		}))
	)
;