var schedule = require('../schedule.js');

var assert = require('assert');

assert.equal(1000 * 60 * 60 * 2 + 35 * 1000, schedule.interval('2 hours and 35 seconds'));


var scheduleEvent=function(){

	schedule.schedule({
		"interval": "every 5 seconds",
		"name": "Test",
		"tasks":[1]
	}, function(task, callback) {
		

		setTimeout(function(){

			callback();

		}, schedule.interval('1 second'));
	});


}

scheduleEvent();