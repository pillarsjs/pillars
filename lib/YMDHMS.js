/* jslint node: true */
"use strict";

module.exports = YMDHMS;
function YMDHMS(date,milliseconds,beautify) {
	var d = {
		year: date.getUTCFullYear(),
		month: date.getUTCMonth(),
		day: date.getUTCDate(),
		hours: date.getUTCHours(),
		minutes: date.getUTCMinutes(),
		seconds: date.getUTCSeconds(),
		milliseconds: ''
	};
	if(d.month<10){d.month='0'+d.month;}
	if(d.day<10){d.day='0'+d.day;}
	if(d.hours<10){d.hours='0'+d.hours;}
	if(d.minutes<10){d.minutes='0'+d.minutes;}
	if(d.seconds<10){d.seconds='0'+d.seconds;}
	if(milliseconds){
		d.milliseconds = date.getUTCMilliseconds().toString();
		while(d.milliseconds.length<4){d.milliseconds='0'+d.milliseconds;}
	}
	// Output compact || beautify
	if(beautify){
		return d.year+'/'+d.month+'/'+d.day+' '+d.hours+':'+d.minutes+':'+d.seconds+':'+d.milliseconds;
	} else {
		return d.year+d.month+d.day+d.hours+d.minutes+d.seconds+d.milliseconds;
	}
}