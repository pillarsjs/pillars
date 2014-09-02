
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
	var selection = {};
	var weekini = weekini || 0;
	var weekformat = [0,1,2,3,4,5,6].slice(weekini).concat([0,1,2,3,4,5,6].slice(0,weekini));
	Object.defineProperty(this,"weekformat",{
		enumerable : true,
		get : function(){return weekformat;}
	});

	var days = false;
	Object.defineProperty(this,"days",{
		enumerable : true,
		get : function(){return days;}
	});

	var position = new Date();
	position.setDate(1);
	position.setHours(0);
	position.setMinutes(0);
	position.setSeconds(0);
	position.setMilliseconds(0);
	
	Object.defineProperty(this,"year",{
		enumerable : true,
		get : function(){return position.getFullYear();},
		set : function(set){
			position.setFullYear(set);
			this.refresh();
		}
	});
	Object.defineProperty(this,"month",{
		enumerable : true,
		get : function(){return ''+position.getMonth()+'';},
		set : function(set){
			position.setMonth(set);
			this.refresh();
		}
	});
	
	Object.defineProperty(this,"selection",{
		enumerable : true,
		get : function(){return selection;},
		set : function(set){
			selection.year = set.year;
			selection.month = set.month;
			selection.date = set.date;
		}
	});

	Object.defineProperty(this,"tz",{
		enumerable : true,
		get : function(){
			var gmt = position.getTimezoneOffset()/-60;
			return 'GMT'+((gmt>=0)?'+':'-')+gmt;
		}
	});

	this.checkSelection = function(){
		var dparse = new Date(selection.year,selection.month,selection.date,selection.hours || 0,selection.minutes || 0,0,0);
		if(dparse && selection.year==dparse.getFullYear() && selection.month==dparse.getMonth() && selection.date==dparse.getDate()){
			position.setFullYear(dparse.getFullYear());
			position.setMonth(dparse.getMonth());
			this.refresh();
			return true;
		} else if(selection.year=='' && selection.month=='' && selection.date=='' && selection.hours=='' && selection.minutes==''){
			return true;
		} else {
			return false;
		}
	}

	this.getSelectionTime = function(){
		if(selection.year=='' && selection.month=='' && selection.date=='' && selection.hours=='' && selection.minutes==''){return "";}
		return (new Date(selection.year, selection.month, selection.date, selection.hours || 0, selection.minutes || 0, selection.seconds || 0, selection.milliseconds || 0)).getTime();
	}

	this.setSelectionTime = function(value){
		var value = new Date(parseInt(value));

		selection.year=value.getFullYear();
		selection.month=value.getMonth();
		selection.date=value.getDate();
		selection.hours=value.getHours();
		selection.minutes=value.getMinutes();
		selection.seconds=value.getMinutes();
		selection.milliseconds=value.getMinutes();

		position.setFullYear(value.getFullYear());
		position.setMonth(value.getMonth());
		
		this.refresh();
	}

	this.nextMonth = function(){
		this.month++;
	}
	this.prevMonth = function(){
		this.month--;
	}

	this.nextYear = function(){
		this.year++;
	}
	this.prevYear = function(){
		this.year--;
	}

	this.firstDay = function(){
		return (new Date(this.year,this.month,1,0,0,0,0)).getDay();
	}
	this.lastDate = function(){
		return (new Date(this.year,this.month+1,0,0,0,0,0)).getDate();
	}

	this.isToday = function(d){
		var today = new Date();
		return (d.year==today.getFullYear() && d.month==today.getMonth() && d.date==today.getDate());
	}

	this.isSelection = function(d){
		return (d.year==selection.year && d.month==selection.month && d.date==selection.date);
	}

	this.refresh = function(){
		days = [[]];
		var w = 0;
		var d;
		if(this.firstDay()!=weekini){
			for(var di=weekformat.indexOf(this.firstDay());di>0;di--){
				d = new Date(this.year,this.month,1-di,0,0,0,0);
				days[w].push({
					year: d.getFullYear(),
					month: d.getMonth(),
					date: d.getDate()
				});
			}
		}
		d = new Date(this.year,this.month,1,0,0,0,0)
		while(d.getMonth()==this.month){
			if(d.getDay()==weekini && d.getDate()!=1){w++;days[w]=[];}
			days[w].push({
				year: d.getFullYear(),
				month: d.getMonth(),
				date: d.getDate()
			});
			d.setDate(d.getDate()+1);
		}
		while(d.getDay()!=weekini){
			days[w].push({
				year: d.getFullYear(),
				month: d.getMonth(),
				date: d.getDate()
			});
			d.setDate(d.getDate()+1);
		}
	}
	this.refresh();
}