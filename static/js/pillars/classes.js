
function xhrLoader(){
	var loader = this;
	var xhr = new XMLHttpRequest();
	loader.response = false;
	loader.running = false;
	loader.sending = 0;
	loader.receiving = 0;

	loader.send = function(method, url, form, files){
		xhr.open(method, url, true);
		loader.response = false;
		loader.running = true;
		loader.sending = 0;
		loader.receiving = 0;
		//xhr.responseType="json";
		if(form){
			if(files){
				var formdata = new FormData(form);
				/*
				var fieldscount = form.length;
				for(var i = 0; i<fieldscount; i++){
					if(form[i].name && !form[i].disabled && (!form[i].className || form[i].className.indexOf('ng-pristine')<0)){
						console.log(form[i].name);
						if(form[i].type=="file"){
							console.log(form[i]);
						} else {
							formdata.append(form[i].name,form[i].value);
						}
					}
				}*/
				xhr.send(formdata);
			} else {
				xhr.setRequestHeader("Content-Type", "application\/x-www-form-urlencoded");
				xhr.send($(form).serialize());
			}
		} else {
			xhr.send();
		}
		return loader;
	};

	loader.progress = function(){};
	loader.success = function(){};
	loader.fail = function(){};
	loader.abort = function(){
		if(loader.running){
			loader.running = false;
			loader.progress();
		}
	};
	loader.end = function(){
		loader.success();
		loader.running = false;
		loader.progress();
	};
	loader.error = function(){
		if(loader.running){
			loader.fail();
			loader.running = false;
			loader.progress();
		}
	};

	xhr.addEventListener("progress", function(e){
		if(e.lengthComputable) {
			loader.receiving = Math.ceil(e.loaded / e.total * 100);
			loader.progress();
		}
	},false);
	xhr.addEventListener("load", function(){
		loader.receiving = 100;
		if(xhr.getResponseHeader('Content-Type')=='application/json'){
			try {
				loader.response = JSON.parse(xhr.response);
			} catch(e) {
				loader.error();
			} finally {
				loader.end();
			}
		} else {
			loader.error();
		}
	},false);
	xhr.addEventListener("error", function(){
		loader.error();
	},false);
	xhr.addEventListener("abort",function(){
		loader.abort();
	},false);
	xhr.upload.addEventListener("progress", function(e){
		if(e.lengthComputable) {
			loader.sending = Math.ceil(e.loaded / e.total * 100);
			loader.progress();
		}
	},false);
	xhr.upload.addEventListener("load", function(){
		loader.sending = 100;
		loader.progress();
	},false);
	xhr.upload.addEventListener("error", function(){
		loader.error();
	},false);
	xhr.upload.addEventListener("abort", function(){
		loader.abort();
	},false);
}

function dateCalendar(weekini){
	var calendar = this;
	var weekini = weekini || 0;
	var weekformat = [0,1,2,3,4,5,6].slice(weekini).concat([0,1,2,3,4,5,6].slice(0,weekini));
	Object.defineProperty(calendar,"weekformat",{
		enumerable : true,
		get : function(){return weekformat;}
	});

	var days = false;
	Object.defineProperty(calendar,"days",{
		enumerable : true,
		get : function(){return days;}
	});

	var position = new Date();
	position.setDate(1);
	position.setHours(0);
	position.setMinutes(0);
	position.setSeconds(0);
	position.setMilliseconds(0);
	
	Object.defineProperty(calendar,"year",{
		enumerable : true,
		get : function(){return position.getFullYear();},
		set : function(set){
			position.setFullYear(set);
			calendar.refresh();
		}
	});
	Object.defineProperty(calendar,"month",{
		enumerable : true,
		get : function(){return ''+position.getMonth()+'';},
		set : function(set){
			position.setMonth(set);
			calendar.refresh();
		}
	});
	
	var selection = {};
	var year = "";
	var month = "";
	var day = "";
	var hours = "";
	var minutes = "";
	var seconds = "";
	var milliseconds = "";
	selection.empty = true;
	selection.valid = true;
	selection.touched = false;
	selection.value = "";
	Object.defineProperty(calendar,"selection",{
		enumerable : true,
		get : function(){return selection;}
	});
	Object.defineProperty(selection,"year",{
		enumerable : true,
		get : function(){return year;},
		set : function(set){
			year = set;
			calendar.checkSelection();
		}
	});
	Object.defineProperty(selection,"month",{
		enumerable : true,
		get : function(){return month;},
		set : function(set){
			month = set;
			calendar.checkSelection();
		}
	});
	Object.defineProperty(selection,"day",{
		enumerable : true,
		get : function(){return day;},
		set : function(set){
			day = set;
			calendar.checkSelection();
		}
	});
	Object.defineProperty(selection,"hours",{
		enumerable : true,
		get : function(){return hours;},
		set : function(set){
			hours = set;
			calendar.checkSelection();
		}
	});
	Object.defineProperty(selection,"minutes",{
		enumerable : true,
		get : function(){return minutes;},
		set : function(set){
			minutes = set;
			calendar.checkSelection();
		}
	});
	Object.defineProperty(selection,"seconds",{
		enumerable : true,
		get : function(){return seconds;},
		set : function(set){
			seconds = set;
			calendar.checkSelection();
		}
	});
	Object.defineProperty(selection,"milliseconds",{
		enumerable : true,
		get : function(){return milliseconds;},
		set : function(set){
			milliseconds = set;
			calendar.checkSelection();
		}
	});


	Object.defineProperty(calendar,"tz",{
		enumerable : true,
		get : function(){
			var gmt = position.getTimezoneOffset()/-60;
			return 'GMT'+((gmt>=0)?'+':'-')+gmt;
		}
	});

	calendar.setSelectionValue = function(set){
		if(set){
			selection.empty = false;
			selection.valid = true;
			selection.value = set.toString();
			if(parseInt(set).toString()==set.toString()){
				set = new Date(parseInt(set));
				year=set.getFullYear();
				month=set.getMonth();
				day=set.getDate();
				hours=set.getHours();
				minutes=set.getMinutes();
				seconds=set.getSeconds();
				milliseconds=set.getMilliseconds();
				position.setFullYear(year);
				position.setMonth(month);
				calendar.refresh();
			} else {
				calendar.resetSelection();
				selection.valid = false;
			}
		} else {
			calendar.clearSelection();
		}
	}

	calendar.setSelectionDay = function(d){
		year=d.year;
		month=d.month;
		day=d.day;
		calendar.checkSelection();
	}

	calendar.resetSelection = function(){
		year="";
		month="";
		day="";
		hours="";
		minutes="";
		seconds="";
		milliseconds="";
	}

	calendar.clearSelection = function(){
		calendar.resetSelection();
		selection.empty = true;
		selection.valid = true;
		selection.value = "";
	}

	calendar.checkSelection = function(){
		selection.touched = true;
		calendar.selectionPosition();
		if(!year && !month && !day && !hours && !minutes){
			selection.empty = true;
			selection.valid = true;
			selection.value = "";
		} else {
			var dparse = new Date(year,month,day,hours || 0,minutes || 0, seconds || 0, milliseconds || 0);
			if(
				dparse && 
				year==dparse.getFullYear() && 
				month==dparse.getMonth() && 
				day==dparse.getDate() && 
				hours==dparse.getHours() && 
				minutes==dparse.getMinutes() && 
				seconds==dparse.getSeconds() && 
				milliseconds==dparse.getMilliseconds()
			){
				selection.empty = false;
				selection.valid = true;
				selection.value = dparse.getTime().toString();
			} else {
				selection.empty = false;
				selection.valid = false;
			}
		}
	}

	calendar.selectionPosition = function(){
		if(year != position.getFullYear() || month != position.getMonth()){
			position.setFullYear(year || position.getFullYear());
			position.setMonth(month || position.getMonth());
			calendar.refresh();
		}
	}

	calendar.nextMonth = function(){
		calendar.month++;
	}
	calendar.prevMonth = function(){
		calendar.month--;
	}

	calendar.nextYear = function(){
		calendar.year++;
	}
	calendar.prevYear = function(){
		calendar.year--;
	}

	calendar.firstDay = function(){
		return (new Date(calendar.year,calendar.month,1,0,0,0,0)).getDay();
	}
	calendar.lastDate = function(){
		return (new Date(calendar.year,calendar.month+1,0,0,0,0,0)).getDate();
	}

	calendar.isToday = function(d){
		var today = new Date();
		return (d.year==today.getFullYear() && d.month==today.getMonth() && d.day==today.getDate());
	}

	calendar.isSelection = function(d){
		return (d.year==year && d.month==month && d.day==day);
	}

	calendar.refresh = function(){
		days = [[]];
		var w = 0;
		var d;
		if(calendar.firstDay()!=weekini){
			for(var di=weekformat.indexOf(calendar.firstDay());di>0;di--){
				d = new Date(calendar.year,calendar.month,1-di,0,0,0,0);
				days[w].push({
					year: d.getFullYear(),
					month: d.getMonth(),
					day: d.getDate()
				});
			}
		}
		d = new Date(calendar.year,calendar.month,1,0,0,0,0);
		while(d.getMonth()==calendar.month){
			if(d.getDay()==weekini && d.getDate()!=1){w++;days[w]=[];}
			days[w].push({
				year: d.getFullYear(),
				month: d.getMonth(),
				day: d.getDate()
			});
			d.setDate(d.getDate()+1);
		}
		while(d.getDay()!=weekini){
			days[w].push({
				year: d.getFullYear(),
				month: d.getMonth(),
				day: d.getDate()
			});
			d.setDate(d.getDate()+1);
		}
	}
	calendar.refresh();
}