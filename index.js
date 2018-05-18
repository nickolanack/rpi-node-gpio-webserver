/**
 * 
 */

var config = require('./server.json');

var DeviceNode = require('./devicenode.js');
var node = new DeviceNode();


if (config.serverPort !== false) {

	node.startWebServer(config, __dirname + '/html/');
}

if (config.websocketPort !== false) {

	var devices = [];
	var gpio;



	var devices = require('./devices.json');


	if (devices) {
		node.initializeDevices(devices)
	}



	/* detect changes. another application could set gpio pins simultaneously.
	 * 
	gpio.on('change', function(pin, value) {
	    devices.forEach(function(device){
	    	if(device.pin===pin){
	    		device.state=value;
	    	}
	    });
	});
	 */



	node.startWebSocketServer(config);
	var wsserver = node.getWebSocketServer();


	if (config.proxy && config.proxy.remote) {
		node.startWebSocketProxyClient(config.proxy);

	}



	var schedules = require("./schedule.json");
	var scheduler = require("./schedule.js");
	setTimeout(function(){
		//delay schedule to prevent running right away 
		//and alows devices to init
		schedules.forEach(function(event) {

			scheduler.schedule(event, function(task, callback) {
				node.setDeviceStateAndBroadcast(task.setPin, task.to);
				setTimeout(function() {
					node.setDeviceStateAndBroadcast(task.setPin, task.thenTo);
					callback();
				}, scheduler.interval(task.for))
			});

		});

	}, 10000)
	



}