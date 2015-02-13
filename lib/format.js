/* jslint node: true */
"use strict";

var decycler = require('./decycler');

module.exports = format;
function format(string,params){
	var replaced = string.replace(/\{([a-z0-9\$]+(?:\.[a-z0-9\-\_]+)*)\}/gmi,function(match,capture,index,all){
		var replace;
		try {
			capture = '["'+capture.split('.').join('"]["')+'"]';
			replace = eval('params'+capture);
		} catch(error){
			return match;
		} finally {
			if(replace){
				replace = JSON.stringify(decycler(replace)).replace(/(^\"|\"$)/g,'').replace(/\\n/g,'\n');
				return replace;
			} else {
				return match;
			}
		}
	});
	return replaced;
}