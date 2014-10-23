var pillars = require('../../pillars.js').global().configure({
	templatesCache:false
});

var app = new App().start();
var pillar = new Pillar();

app.add(pillar
	.add(new Beam(function(gw){
		console.log(pillar.path, pillar.id, pillar.priority, pillar.host, pillar.beams);
		gw.send("holaa");
	}))
)
;