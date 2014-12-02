var logger = global.logger.pillars.addGroup('cron');
var EventEmitter = require("events").EventEmitter;
var cron = module.exports = new EventEmitter;





var util = require("util");
util.inherits(Job, EventEmitter);
function Job(config){
	EventEmitter.call(this);
	var job = this;
	var config = config:{};

	job.configure = function(config){
		for(var i in config){job[i]=config[i];}
		return job;
	}
	job.configure(config);

	var id = config.id || Date.now().toString(36)+Math.round(Math.random()*10).toString(36);
	Object.defineProperty(job,"id",{
		enumerable : true,
		get : function(){return id;},
		set : function(set){
			if(set!==id){
				job.emit("idUpdate",id,set);
				id = set;
			}
		}
	});

	job.handler = config.handler || undefined;
	job.callback = config.callback || undefined;
	job.active = (typeof config.active !=='undefined')?config.active:true;
	
	var cursor;
	var scheduling;
	Object.defineProperty(job,"scheduling",{
		enumerable : true,
		get : function(){return scheduling;},
		set : function(set){
			cursor = new cronCursor(set);
			scheduling = set;
			if(task){job.start();}
		}
	});

	var next;
	var task;
	job.start = function(){
		if(!cursor){return false;}
		job.stop();
		try {
			var now = new Date();
			var lapse = cursor.lapse(now);
			next = new Date(now.getTime()+lapse);
			task = setTimeout(job.launch,lapse);
		} catch(error){
			return error;
		}
	};
	job.stop = function(){
		clearTimeout(task);
		next = undefined;
		task = undefined;
	};

	job.launch = function(){
		var error = false;
		try {
			job.handler();
		} catch(_error) {
			error = _error;
		}
		job.start();
		return error;
	}
}






function cronCursor(timeString){
	var cursor = this;
	var timeString = timeString || '';
	var ctrl = {};
	var segments = timeString.split(' ');
	if(segments.length<=6){
		try {
			ctrl.minute = cronSegmentCtrl(segments[0] || '*',0,59);
			ctrl.hour = cronSegmentCtrl(segments[1] || '*',0,23);
			ctrl.monthday = cronSegmentCtrl(segments[2] || '*',1,31);
			ctrl.month = cronSegmentCtrl(segments[3] || '*',1,12);
			ctrl.weekday = cronSegmentCtrl(segments[4] || '*',1,7);
			ctrl.year = cronSegmentCtrl(segments[5] || '*',1000,3000);
		} catch(error) {
			throw error;
		}
	} else {
		throw new Error('Invalid format "'+timeString+'"');
	}

	var date;
	var week = [7,1,2,3,4,5,6];

	function monthDays(){
		var nextMonth = new Date(date.getTime());
		nextMonth.setMonth(nextMonth.getMonth()+1);
		nextMonth.setDate(0);
		return nextMonth.getDate();
	}

	function nextYear(){
		var current = date.getFullYear();
		var next = ctrl.year(current,true);
		if(next<=current){throw new Error('Out of range.');}
		date.setMinutes(0);
		date.setHours(0);
		date.setDate(1);
		date.setMonth(0);
		date.setFullYear(next);
	}
	function nextMonth(){
		var current = date.getMonth()+1;
		var next = ctrl.month(current,true);
		if(next<=current){
			nextYear();
		} else {
			date.setMinutes(0);
			date.setHours(0);
			date.setDate(1);
			date.setMonth(next-1);
		}
	}
	function nextDate(){
		var current = date.getDate();
		var next = ctrl.monthday(current,true);
		if(next<=current || next>monthDays()){
			nextMonth();
		} else {
			date.setMinutes(0);
			date.setHours(0);
			date.setDate(next);
		}
	}
	function nextHour(){
		var current = date.getHours();
		var next = ctrl.hour(current,true);
		if(next<=current){
			nextDate();
		} else {
			date.setMinutes(0);
			date.setHours(next);
		}
	}
	function nextMinute(){
		var current = date.getMinutes();
		var next = ctrl.minute(current,true);
		if(next<=current){
			nextHour();
		} else {
			date.setMinutes(next);
		}
	}
	cursor.next = function(_date){
		var timer = Date.now();
		_date = _date || new Date();
		date = new Date(_date.getTime());
		nextMinute();
		var limiter = 0;
		while(true){
			if(limiter>100){throw new Error('Crontimer Error, limit overflow for "'+timeString+'"');};limiter++;
			if(!ctrl.year(date.getFullYear())){
				nextYear();
				continue;
			}
			if(!ctrl.month(date.getMonth()+1)){
				nextMonth();
				continue;
			}
			if(!ctrl.monthday(date.getDate())){
				nextDate();
				continue;
			}
			if(!ctrl.weekday(week[date.getDay()])){
				nextDate();
				continue;
			}
			if(!ctrl.hour(date.getHours())){
				nextHour();
				continue;
			}
			if(!ctrl.minute(date.getMinutes())){
				nextMinute();
				continue;
			}
			break;
		}
		return date;
	}
	cursor.lapse = function(_date){
		_date = _date || new Date();
		var start = _date.getTime();
		var end = cursor.next(_date).getTime();
		return end-start;
	}
}

function cronSegmentCtrl(value,min,max){
	var min = parseInt(min);
	var max = parseInt(max);
	if(/^\*$/.test(value)){
		return function(value,next){
			if(value===false){return min;}
			if(next){
				value++;
				if(value>max || value<min){return min;}
				return value;
			} else {
				if(value>max || value<min){return false;}
				return true;
			}
		};
	} else if(/^([0-9]+|[0-9]+-[0-9]+)+(,([0-9]+|[0-9]+-[0-9]+))*$/.test(value)){
		var values = value.split(',');
		var first;
		var last = min;
		var numbers = [];
		var ranges = [];
		for(var i in values){
			var num = values[i];
			if(/^[0-9]+-[0-9]+$/.test(num)){
				var range = num.split('-');
				range[0] = parseInt(range[0]);
				range[1] = parseInt(range[1]);
				if(last>range[0] || (i>0 && last==range[0]) || range[0]>=range[1] || range[1]>max){throw new Error('Incorrect range '+num+' in "'+value+'", check the sintax and use correct incremental values.');}
				ranges.push(range);
				last = range[1];
				if(typeof first === 'undefined'){first = range[0];}
			} else {
				num = parseInt(num);
				if(last>num || (i>0 && last==num) || num>max){throw new Error('Incorrect value '+num+' in "'+value+'", check the sintax and use correct incremental values.');}
				numbers.push(num);
				last = num;
				if(typeof first === 'undefined'){first = last;}
			}
		}
		return function(value,next){
			if(value===false){return first;}
			if(next){
				value++;
				var nfound;
				for(var i in numbers){
					var number = numbers[i];
					if(number>=value){
						nfound = number;
						break;
					}
				}
				var rfound;
				for(var i in ranges){
					var range = ranges[i];
					if(value<=range[1]){
						rfound = value>range[0]?value:range[0];
						break;
					}
				}
				if(typeof nfound === 'undefined'){return rfound || first;}
				if(typeof rfound === 'undefined'){return nfound || first;}
				return Math.min(nfound,rfound);
			} else {
				if(numbers.indexOf(parseInt(value))>=0){
					return true;
				} else {
					for(var i in ranges){
						var range = ranges[i];
						if(value>=range[0] && value<=range[1]){
							return true;
						}
					}
					return false;
				}
			}
		};
	} else if(/^\*\/[0-9]+$/.test(value)){
		var each = parseInt(value.replace(/^\*\//,''));
		return function(value,next){
			if(value===false){return min;}
			var base = value-min;
			if(next){
				if(value<min || value>=max){return min;}
				value++;base++;
				if(base%each!==0){
					value = value-(base%each)+each;
				}
				if(value>max){return min;}
				return value;
			} else {
				if(value<min || value>max){return false;}
				return base%each===0;
			}
		};
	} else if(/^[0-9]+-[0-9]+\/[0-9]+$/.test(value)){
		var each = parseInt(value.replace(/^[0-9]+-[0-9]+\//,''));
		var range =value.replace(/\/[0-9]+$/,'').split('-');
		var first = parseInt(range[0]);
		var last = parseInt(range[1]);
		if(first<min || last>max){throw new Error('Incorrect range "'+value+'" for min:"'+min+'", max:"'+max+'" limits.');}
		return function(value,next){
			if(value===false){return first;}
			var base = value-first;
			if(next){
				if(value<first || value>=last){return first;}
				value++;base++;
				if(base%each!==0){
					value = value-(base%each)+each;
				}
				if(value>last){return first;}
				return value;
			} else {
				if(value<first || value>last){return false;}
				return base%each===0;
			}
		};
	} else {
		throw new Error('Incorrect value "'+value+'", check the sintax.');
	}
}

/*

testing('1,10-20,25,30-31',0,60,[
    {value:0,check:false,next:1},
	{value:1,check:true,next:10},
	{value:5,check:false,next:10},
	{value:10,check:true,next:11},
	{value:19,check:true,next:20},
	{value:20,check:true,next:25},
	{value:21,check:false,next:25},
	{value:30,check:true,next:31},
	{value:31,check:true,next:1},
    {value:32,check:false,next:1}
]);

testing('5-10,20-25,35',0,60,[
    {value:0,check:false,next:5},
	{value:4,check:false,next:5},
	{value:5,check:true,next:6},
	{value:6,check:true,next:7},
	{value:10,check:true,next:20},
	{value:11,check:false,next:20},
	{value:20,check:true,next:21},
    {value:24,check:true,next:25},
    {value:25,check:true,next:35},
	{value:30,check:false,next:35},
	{value:35,check:true,next:5},
    {value:36,check:false,next:5}
]);

testing('*',1,60,[
    {value:0,check:false,next:1},
	{value:1,check:true,next:2},
	{value:5,check:true,next:6},
	{value:10,check:true,next:11},
	{value:19,check:true,next:20},
	{value:20,check:true,next:21},
	{value:21,check:true,next:22},
	{value:60,check:true,next:1},
	{value:61,check:false,next:1},
]);

testing('* /3',1,60,[
    {value:0,check:false,next:1},
	{value:1,check:true,next:4},
	{value:2,check:false,next:4},
	{value:3,check:false,next:4},
	{value:4,check:true,next:7},
	{value:6,check:false,next:7},
	{value:7,check:true,next:10},
	{value:8,check:false,next:10}
]);

testing('* /3',0,60,[
    {value:0,check:true,next:3},
	{value:1,check:false,next:3},
	{value:2,check:false,next:3},
	{value:3,check:true,next:6},
	{value:4,check:false,next:6},
	{value:6,check:true,next:9},
	{value:7,check:false,next:9},
	{value:8,check:false,next:9}
]);

testing('* /2',0,9,[
    {value:0,check:true,next:2},
	{value:1,check:false,next:2},
	{value:2,check:true,next:4},
	{value:3,check:false,next:4},
	{value:4,check:true,next:6},
	{value:6,check:true,next:8},
	{value:7,check:false,next:8},
	{value:8,check:true,next:0}
]);

testing('5-10/3',0,60,[
    {value:0,check:false,next:5},
	{value:1,check:false,next:5},
	{value:2,check:false,next:5},
	{value:3,check:false,next:5},
	{value:5,check:true,next:8},
	{value:6,check:false,next:8},
	{value:7,check:false,next:8},
    {value:8,check:true,next:5}
]);

testing('5-10/3',1,60,[
    {value:0,check:false,next:5},
	{value:1,check:false,next:5},
	{value:2,check:false,next:5},
	{value:3,check:false,next:5},
	{value:5,check:true,next:8},
	{value:6,check:false,next:8},
	{value:7,check:false,next:8},
    {value:8,check:true,next:5}
]);

testing('5-20/5',0,20,[
    {value:0,check:false,next:5},
	{value:1,check:false,next:5},
	{value:4,check:false,next:5},
	{value:5,check:true,next:10},
	{value:6,check:false,next:10},
	{value:9,check:false,next:10},
    {value:10,check:true,next:15},
    {value:16,check:false,next:20},
    {value:19,check:false,next:20},
    {value:20,check:true,next:5},
    {value:21,check:false,next:5},
]);

console.log('END');
function testing(format,min,max,tests){
    var func = cronSegmentCtrl(format,min,max);
	for(var i in tests){
		var test = tests[i];
		var check = func(test.value);
		var next = func(test.value,true);
		if(check!=test.check){
			console.log('Fail check "'+format+'"('+min+','+max+'):',test.value,' is ',check,' not ',test.check);
		}
		if(next!=test.next){
			console.log('Fail next "'+format+'"('+min+','+max+'):',test.value,' is ',next,' not ',test.next);
		}
	}
}

var date = new Date(0);
date.setYear(2014);
date.setMonth(10); // 0-11
date.setDate(23); // 1-31
date.setHours(12); // 0-59
date.setMinutes(30); // 0-23
tester(date);

function tester(date){
	var cron = '0 0 22 3 6 *';
	var cursor = new cronCursor(cron);
	var next = cursor.next(date);
	var lapse = cursor.lapse(date);
	console.log('patrón:             ',cron);
	console.log('proxima ocurrencia  ',next.toString());
}

*/