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
	
	var timeString;
	var time = {
		minutes: function(value){return true;},			// 0-59 || */2 || 0,1,2,3
		hours: function(value){return true;},				// 0-23 || */2 || 0,1,2,3
		monthdays: function(value){return true;},		// 1-31 || */2 || 0,1,2,3
		weekdays: function(value){return true;},		// 1-7 (1=monday) || */2 || 0,1,2,3
		months: function(value){return true;},			// 1-12 || */2 || 0,1,2,3
		years: function(value){return true;},				// any || */2 || 0,1,2,3
	};

	Object.defineProperty(job,"time",{
		enumerable : true,
		get : function(){return timeString;},
		set : function(set){
			timeString = set;
			
		}
	});


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
    var func = formatCheck(format,min,max);
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

*/

var date = new Date();
date.setFullYear(2014);
date.setMonth(10); // 0-11
date.setDate(23); // 1-31
date.setHours(12); // 0-59
date.setMinutes(30); // 0-23
tester(date);

function tester(date){
	var cursor = new Cursor('0-30 13-16 15-20 6-8 * 2017');
	var next = cursor.next(date);
	console.log(date,next);
}


function Cursor(timeString){
	var cursor = this;
	var timeString = timeString || '';
	var ctrl = {};
	var segments = timeString.split(' ');
	if(segments.length<=6){
		try {
			ctrl.minute = formatCheck(segments[0] || '*',0,59);
			ctrl.hour = formatCheck(segments[1] || '*',0,23);
			ctrl.monthday = formatCheck(segments[2] || '*',1,31);
			ctrl.month = formatCheck(segments[3] || '*',1,12);
			ctrl.weekday = formatCheck(segments[4] || '*',1,7);
			ctrl.year = formatCheck(segments[5] || '*',1000,3000);
		} catch(error) {
			throw error;
		}
	} else {
		throw new Error('Invalid format "'+timeString+'"');
	}

		
	var date = new Date(0);
	var week = [7,1,2,3,4,5,6];
	var resetMonth = ctrl.month(false);
	var resetDate = ctrl.monthday(false);
	var resetHours = ctrl.hour(false);
	var resetMinutes = ctrl.minute(false);

	function nextYear(){
		console.log('next year');
		date.setFullYear(ctrl.year(date.getFullYear(),true));
		date.setMonth(resetMonth-1);
		date.setDate(resetDate);
		date.setHours(resetHours);
		date.setMinutes(resetMinutes);
	}
	function nextMonth(){
		console.log('next month');
		date.setMonth(ctrl.month(date.getMonth()+1,true)-1);
		if(date.getMonth()+1==resetMonth){
			nextYear();
		} else {
			date.setDate(resetDate);
			date.setHours(resetHours);
			date.setMinutes(resetMinutes);
		}
	}
	function nextDate(){
		console.log('next monthday');
		date.setDate(ctrl.monthday(date.getDate(),true));
		if(date.getDate()==resetDate){
			nextMonth();
		} else {
			date.setHours(resetHours);
			date.setMinutes(resetMinutes);
		}
	}
	function nextHour(){
		console.log('next hour');
		date.setHours(ctrl.hour(date.getHours(),true));
		if(date.getHours()==resetHours){
			nextDate();
		} else {
			date.setMinutes(resetMinutes);
		}
	}
	function nextMinute(){
		console.log('next minute');
		date.setMinutes(ctrl.minute(date.getMinutes(),true));
		if(date.getMinutes()==resetMinutes){
			nextHour();
		}
	}
	cursor.next = function(_date){
		date = _date;
		console.log('Nex:',date);
		nextMinute();
		var limiter = 0;
		while(true){
			console.log('...',date);
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
}

function formatCheck(value,min,max){
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



var jobs = {
	'name': {
		minutes: '',		// 0-59 || */2 || 0,1,2,3
		hours: '',			// 0-23 || */2 || 0,1,2,3
		monthdays: '',	// 1-31 || */2 || 0,1,2,3
		weekdays: '',		// 1-7 (1=monday) || */2 || 0,1,2,3
		months: '',			// 1-12 || */2 || 0,1,2,3
		years: '',				// any || */2 || 0,1,2,3
		handler: function(){},
		callback: undefined,
		active:true,
		timeout:,
	}
};

function Job(config){
	var job = this;
	job.id = config.id || 
}

cron.job = function(config){
	jobs[config.id]={
		id = 
	};
}


setTimeout();

* * * * * *
| | | | | | 
| | | | | +-- Year              (range: 1900-3000)
| | | | +---- Day of the Week   (range: 1-7, 1 standing for Monday)
| | | +------ Month of the Year (range: 1-12)
| | +-------- Day of the Month  (range: 1-31)
| +---------- Hour              (range: 0-23)
+------------ Minute            (range: 0-59)



module.exports = 


    try {
        new CronJob('invalid cron pattern', function() {
            console.log('this should not be printed');
        })
    } catch(ex) {
        console.log("cron pattern not valid");
    }




CronJob

    constructor(cronTime, onTick, onComplete, start, timezone, context) - Of note, the first parameter here can be a JSON object that has the below names and associated types (see examples above).
        cronTime - [REQUIRED] - The time to fire off your job. This can be in the form of cron syntax or a JS Date object.
        onTick - [REQUIRED] - The function to fire at the specified time.
        onComplete - [OPTIONAL] - A function that will fire when the job is complete, when it is stopped.
        start - [OPTIONAL] - Specifies whether to start the job just before exiting the constructor. By default this is set to false. If left at default you will need to call job.start() in order to start the job (assuming job is the variable you set the cronjob to).
        timeZone - [OPTIONAL] - Specify the timezone for the execution. This will modify the actual time relative to your timezone.
        context - [OPTIONAL] - The context within which to execute the onTick method. This defaults to the cronjob itself allowing you to call this.stop(). However, if you change this you'll have access to the functions and values within your context object.
    start - Runs your job.
    stop - Stops your job.


var CronJob = require('cron').CronJob;
var job = new CronJob('00 30 11 * * 1-5', function(){
    // Runs every weekday (Monday through Friday)
    // at 11:30:00 AM. It does not run on Saturday
    // or Sunday.
  }, function () {
    // This function is executed when the job stops
  },
  true /* Start the job right now */,
  timeZone /* Time zone of this job. */
);