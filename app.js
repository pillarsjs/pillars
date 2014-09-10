
var paths = require('path');
var pillarsPackage = require('./package');
global.PILLARS = {
	package : pillarsPackage,
	version : pillarsPackage.version,
	path : function(path){
		var path = path || '';
		return paths.resolve(__dirname,path);
	},
	uploadsDirectory : paths.resolve('./uploads'),
	tempDirectory : paths.resolve('./temp'),
	maxUploadSize : 10*1024*1024,
	maxGzipSize : 5*1024*1024,
	htmlErrors : true
};

var textualization = require('./lib/textualization');
var t12n = textualization.t12n;
textualization.load(PILLARS.path('languages/pillars'));

var Pillar = require('./lib/Pillar');
var Beam = require('./lib/Beam');
var Gangway = require('./lib/Gangway');
var App = require('./lib/App');

var modelator = require('./lib/modelator');
var renderer = require('./lib/renderer');
var precasts = require('./lib/precasts');

renderer
	.preload(PILLARS.path('templates/static.jade'))
	.preload(PILLARS.path('templates/crud.jade'))
	.preload(PILLARS.path('templates/login.jade'))
	.preload(PILLARS.path('templates/error.jade'))
;

module.exports = new Pillars();
function Pillars(){
	var pillars = this;

	pillars.App = App;
	pillars.Pillar = Pillar;
	pillars.Beam = Beam;
	pillars.Gangway = Gangway;

	pillars.textualization = textualization;
	pillars.t12n = t12n;
	pillars.modelator = modelator;
	pillars.renderer = renderer;
	pillars.precasts = precasts;

	pillars.global = function(){
		global.App = App;
		global.Pillar = Pillar;
		global.Beam = Beam;
		global.Gangway = Gangway;

		global.textualization = textualization;
		global.t12n = t12n;
		global.modelator = modelator;
		global.renderer = renderer;
		global.precasts = precasts;

		return pillars;
	}

	pillars.configure = function(config){
		var values = ['uploadsDirectory','tempDirectory','maxUploadSize','maxGzipSize','htmlErrors'];
		var config = config || {};
		for(var i in config){
			if(values.indexOf(i)>=0){
				PILLARS[i] = config[i];
				console.log(t12n('config.ok',{prop:i,value:config[i]}));
			} else {
				console.log(t12n('config.unknow',{prop:i,value:config[i]}));
			}
		}
		return pillars;
	}

}