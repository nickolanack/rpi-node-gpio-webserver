var events = require('events');



var executeSequentialTasks=function(tasks, initiator, resolver, callback){


		var executeTask=function(task){
			var interval=parseMillis(task.for)
			console.log(JSON.stringify(task));
			var next=function(){
				next=function(){};

				if(resolver){
					resolver(task);
				}

				if(tasks.length){
					executeTask(tasks.shift());
				}else if(callback){
					callback();
				}


			}
			initiator(task, interval, next);
			var cancelFn=onDate(new Date((new Date()).valueOf()+interval), next, 'current event: ');
		};

		executeTask(tasks.shift());

	};


var parseShortIntervals=function(time, date){

	var oneHour=3600000;
	var oneMin=60000;

	if(time.indexOf("every hour")===0){
		date.setMinutes(0);
		date.setSeconds(0);
		return new Date(date.valueOf()+oneHour);
	}

	if(time.indexOf("every minute")===0){
		date.setSeconds(0);
		return new Date(date.valueOf()+oneMin);
	}

	if(time.indexOf("every second")===0){
		return new Date(date.valueOf()+1000);
	}
	


	var parts=time.split(' ');
	if(parts[0]=='every'&&parts.length===3){

		var number=parseInt(parts[1]);
		if((typeof number)=='number'){

			if(parts[2]=='hours'){
				date.setMinutes(0);
				date.setSeconds(0);
				return new Date(date.valueOf()+oneHour*number);
			}

			if(parts[2]=='minutes'){
				date.setSeconds(0);
				return new Date(date.valueOf()+oneMin*number);
			}

			if(parts[2]=='seconds'){
				return new Date(date.valueOf()+1000*number);
			}


		}

	}


	return false;

}

var parseNextDate=function(time, fromDate){

	console.log('Parsing Date: "'+time+'"');
	var next=false;

	var currentDateMillis=(fromDate?fromDate:(new Date()).valueOf());

	var date=new Date(currentDateMillis);
	

	
	 next=parseShortIntervals(time, date);
	 if(next){
	 	console.log(next);
	 	return next;
	 }

	
	date.setSeconds(1, 0);

	



	var hour=time.split(' at ')[1];
	var pm=hour.indexOf('pm')>0;
	hour=hour.replace('am','');
	hour=hour.replace('pm','');

	hour=hour.split(':');
	var mins=hour.length>1?hour[1]:0;
	hour=parseInt(hour[0]%12)+(pm?12:0);
	//mins=parseInt(mins);

	

	console.log(hour+':'+mins);
	date.setHours(hour);
	date.setMinutes(mins);
	

	var oneDay=1000*3600*24;

	if(time.indexOf("even days ")===0){
		while(date.getDate()%2===1||date.valueOf()<currentDateMillis){
			date=new Date(date.valueOf()+oneDay);
		}
		next=date;

	}

	if(time.indexOf("odd days ")===0){
		while(date.getDate()%2===0||date.valueOf()<currentDateMillis){
			date=new Date(date.valueOf()+oneDay);
		}
		next=date;

	}
	if(time.indexOf("every day ")===0){
		next=date;

		if(next.valueOf()<currentDateMillis){
			next=new Date(next.valueOf()+oneDay);
		}
	}

	if(time.indexOf("the last day of the month")===0){
		date.setDate(1);
		if(date.getMonth()==12){
			date.setYear(date.getYear()+1);
			date.setMonth(0);
		}else{
			date.setMonth(date.getMonth()+1)
		}
		date.setDate(0);
		next=date;
	}


	

	if(next.valueOf()<currentDateMillis){
		throw 'next date less that current date!';
	}

	console.log(next);
	return next;
};

var parseMillis=function(time){

	if((typeof time)=='number'){
		return time;
	}

	var times=time.split(' and ');
	if(times.length>1){

		var sum=0;
		times.forEach(function(time){
			sum+=parseMillis(time);
		});
		return sum;

	}

	var parts=time.split(' ');
	var sum=parseInt(parts[0]);

	switch(parts[1]){
		case 'second':
		case 'seconds':
			sum*=1000;
		break;

		case 'minute':
		case 'minutes':
			sum*=1000*60;
		break;


		case 'hour':
		case 'hours':
			sum*=1000*3600;
		break;


	}

	return sum;


}



var recheckDate=function(date, callback, label){
	var delta=date.valueOf()-((new Date()).valueOf());
	var interval=30000;

	if(delta>3600000){
		interval=300000;
	}
	console.log(label+(delta)+'ms');
	setTimeout(function(){
		onDate(date, callback, label);
	}, interval);
};

var minDate=function(dates){
	return dates.filter(function(d){return !!d;}).sort(function(a,b){
		return a.valueOf()-b.valueOf();
	}).shift();
};
var onDate=function(date, callback, label){


	if(!label){
		label='next event: '
	}

	var delta=date.valueOf()-((new Date()).valueOf());
	
	if(delta>60000){
		recheckDate(date,callback, label);
		return;
	}
	console.log(label+(delta)+'ms');
	setTimeout(function(){
		console.log('Executing Event: '+date);
		callback();
	}, delta);
};

var millisToTime=function(time){

	var parts=[];
	var oneHour=3600000;
	var hours=Math.floor(time/oneHour);

	var oneMin=60000;
	var mins=Math.floor((time-(hours*oneHour))/oneMin);
	var secs=Math.floor((time-(hours*oneHour)-(mins*oneMin))/1000);

	parts.push(hours+' hour'+(hours==1?'':'s'));
	parts.push(mins+' minute'+(mins==1?'':'s'));
	parts.push(secs+' second'+(secs==1?'':'s'));

	var last=parts.pop();
	return parts.join(', ')+', and '+last;

};


function Scheduler(event){
	var me=this;
	me._event=event;

	if(event.timezone){
		process.env.TZ = event.timezone;
	}

}
Scheduler.prototype.__proto__ = events.EventEmitter.prototype;



Scheduler.prototype.run = function(initiator, resolver) {

		var me=this;
		var event=me._event;

		

		if((typeof event.interval)=='number'){

			console.log('Starting numeric interval schedule: '+event.interval);

			setInterval(function(){
				executeSequentialTasks(event.tasks.slice(0), initiator, resolver);
			}, event.interval);
		}


		if((typeof event.interval)=='string'){

			console.log('Starting text interval schedule: '+event.interval);
			var date=new Date();
			console.log('Current Date: '+ date);

			var parts=event.interval.split(' and ');
			//"even days at 2am and the last day of the month at 2am"
			
			var executing=false
			var setNextDateInterval=function(){


				var now=new Date();

				var nextDate=minDate(parts.map(function(timeIntervalString){
					return parseNextDate(timeIntervalString);
				}));



				var delta=nextDate.valueOf()-now.valueOf();
				if(delta<0){
					throw 'next value less than now '+delta;
				}
				console.log('Event starts '+require('moment')(nextDate).fromNow()+' : '+delta);
				onDate(nextDate, function(){
					setTimeout(setNextDateInterval, 100);
					if(!executing){
						console.log('Next Event: '+event.name+' - '+nextDate)
						executing=true;
						executeSequentialTasks(event.tasks.slice(0), initiator, resolver, function(){
							console.log('Event Finished');
							executing=false;
						});
					}else{

						
						console.log('Skipped next task becuase still running!');
					}
				});
			};
			setNextDateInterval();

		}



	};
Scheduler.interval=parseMillis;

module.exports=Scheduler;