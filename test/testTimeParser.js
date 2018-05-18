var Scheduler = require('../schedule.js');

var assert = require('assert');

assert.equal(1000 * 60 * 60 * 2 + 35 * 1000, Scheduler.interval('2 hours and 35 seconds'));



var scheduleEvent=function(){

	(new Scheduler({

		"interval": "every day at 12:53am",
		"name": "Test",
		"tasks":[
			{
				"do":"something",
				"for":"1 minute"
			}
		]
	
	})).run(function(task, interval, callback) {
		
		console.log('wait for: '+require('moment').duration(interval).humanize());

	}, function(task){
		console.log('complete');
	});


}

scheduleEvent();