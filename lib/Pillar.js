
var project = require('./project');
var templates = require('./template');

module.exports = Pillar;
function Pillar(_id){

	if(id){var id=_id.toString();} else {var id=Date.now().toString(36);}
	project.pillars[id]=this;
	var pillar = this;
	var title = "untitled";
	var path = '/';
	var prot = 'http';
	var host = '([^\\/]+?)';
	var regexps = [];
	var t12n = false;
	var t12nSheet = null;
	var t12nLangs = ['en','es'];
	var t12nDefault = ['es'];
	var template = '';
	var beams = {};
	
	this.status = function(){
		console.log('Id:',id);
		console.log('Title:',title);
		console.log('Path:',path);
		if(fieldset)console.log('Fielset:',fieldset.getId());
		console.log('Extensions:',Object.keys(extensions));
		console.log('T12n:',t12n);
		console.log('Beams:',Object.keys(beams));
		console.log('Project:',Object.keys(project.pillars));
	}
	this.setId = function(_id){
		var _id = _id.toString();
		delete project.pillars[id];
		id = _id;
		project.pillars[id]=pillar;
		return pillar;
	}
	this.getId = function(){
		return id;
	}
	this.setTitle = function(_title){
		var _title = _title.toString();
		title = _title;
		return pillar;
	}
	this.getTitle = function(){
		return title;
	}
	this.setPath = function(_path){
		var _path = _path.toString();
		path = _path;
		return pillar;
	}
	this.setProt = function(_prot){
		var _prot = _prot.toString();
		prot = _prot;
		return pillar;
	}
	this.getProt = function(){
		return prot;
	}
	this.setHost = function(_host){
		var _host = _host.toString();
		host = _host;
		return pillar;
	}
	this.getHost = function(){
		return host;
	}
	this.getPath = function(){
		return "/"+path.replace(/(^\/|\/$)/,'');
	}
	this.getRegexps = function(){
		return regexps;
	}
	this.makeLink = function(_id){
		if(beams[_id]){
			var args = Array.prototype.slice.call(arguments).slice(1);
			return this.getPath()+beams[_id].makeLink(args);
		} else {
			return "#unknow";
		}
	}
	this.setT12n = function(_path){
		// here t12n loading etc...
		t12n = true;
		t12nSheet = _path;
		return pillar;
	}
	this.unsetT12n = function(){
		t12n = false;
		t12nSheet = null;
		return pillar;
	}
	this.addBeam = function(_beam){
		beams[_beam.getId()]=_beam.setPillar(pillar);
		regexps[_beam.getId()]=_beam.getRegexp();
		return pillar;
	}
	this.getBeam = function(_id){
		var _id = _id.toString();
		if(beams[_id]){return beams[_id];}
		return false;
	}
	this.removeBeam = function(_id){
		var _id = _id.toString();
		if(beams[_id]){delete beams[_id];}
		if(regexps[_id]){delete regexps[_id];}
		return pillar;
	}
	this.setTemplate = function(_path){
		var _path = _path.toString();
		templates.preload(_path);
		template = _path;
		return pillar;
	}
	this.getTemplate = function(){
		return template;
	}
}