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
		console.log(JSON.stringify(devices, null, '   '))
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
	var Scheduler = require("./schedule.js");
	setTimeout(function(){
		//delay schedule to prevent running right away 
		//and alows devices to init
		schedules.forEach(function(event) {

			(new Scheduler(event)).run(
				function(task, interval, callback) {
					node.setDeviceStateAndBroadcast(task.setPin, task.to);
				}, 
				function(task) {
					node.setDeviceStateAndBroadcast(task.setPin, task.thenTo);
				}
			);

		});

	}, 10000)
	



}