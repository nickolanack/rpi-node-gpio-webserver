
var executeTasks=function(tasks, executer, callback){


		var executeTask=function(task){

			console.log(JSON.stringify(task));
			executer(task, function(){
				if(tasks.length){
					executeTask(tasks.shift());
				}else if(callback){
					callback();
				}
			});
			
		};

		executeTask(tasks.shift());

	};

var parseNextDate=function(time){

	console.log(time);
	var next=false;

	var date=new Date();

	var hour=time.split(' at ')[1];
	var pm=hour.indexOf('pm')>0;
	hour=hour.replace('am','');
	hour=hour.replace('pm','');

	hour=hour.split(':');
	var mins=hour.length>1?hour[1]:0;
	hour=parseInt(hour[0])+(pm?12:0);
	//mins=parseInt(mins);

	console.log(hour+':'+mins);
	date.setHours(hour);
	date.setMinutes(mins);
	date.setSeconds(0);

	var oneDay=1000*3600*24;

	if(time.indexOf("even days ")===0){
		while(date.getDate()%2===1||date.valueOf()<(new Date()).valueOf()){
			date=new Date(date.valueOf()+oneDay);
		}
		next=date;

	}

	if(time.indexOf("odd days ")===0){
		while(date.getDate()%2===0||date.valueOf()<(new Date()).valueOf()){
			date=new Date(date.valueOf()+oneDay);
		}
		next=date;

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


	if(next&&(time.indexOf(' day ')||time.indexOf(' days '))){
		if(next.valueOf()<(new Date()).valueOf()){
			next=new Date(next.valueOf()+oneDay);
		}
	}


	console.log(next);
	return next;
};
var recheckMinDate=function(dates, callback){
	setTimeout(function(){
		onMinDate(dates, callback);
	}, 10000);
}
var onMinDate=function(dates, callback){
	console.log(dates);
	var delta=dates[0].valueOf()-((new Date()).valueOf());
	console.log('delta: '+delta);
	if(delta>20000){
		recheckMinDate(dates,callback);
		return;
	}

	setTimeout(function(){
		callback();
	}, delta);
}


module.exports={


	schedule:function(event, executer){



		if((typeof event.interval)=='number'){

			console.log('Starting numeric interval schedule');

			setInterval(function(){
				executeTasks(event.tasks.slice(0), executer);
			}, event.interval);
		}


		if((typeof event.interval)=='string'){

			console.log('Starting named schedule');

			var parts=event.interval.split(' and ');
			//"even days at 2am and the last day of the month at 2am"
			var setNextDateInterval=function(){
				onMinDate(parts.map(parseNextDate), function(){
					executeTasks(event.tasks.slice(0), executer, setNextDateInterval);
				});
			};
			setNextDateInterval();

		}



	}




}