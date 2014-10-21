
var apikey = 'sdfjsa3426897sxfddsf';

var statusPillar = new Pillar({id:'statusPillar',path:'/status'})
	.add(new Beam({id:'statusHome'},function(gw){
		var a = apikey;
		gw.send(gw.app.routes);
	}))
;

module.exports = statusPillar;