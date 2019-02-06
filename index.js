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
		
		var gpio;
		try {
			gpio = require('rpi-gpio');
			gpio.on('change', function(channel, value) {
				console.log('on change: ' + channel + " " + value ? "true" : "false");
			});
		} catch (e) {
			console.log('using mock gpio')
			gpio = require('./test/mock-gpio.js');

		}

		devices.forEach(function(device) { //device REFERENCE


			if (!device.pin) {
				throw 'Expected gpio pin: ' + JSON.stringify(device);
			}

			var direction = device.direction === 'in' ? gpio.DIR_IN : gpio.DIR_OUT;

			gpio.setup(device.pin, direction, function(err) {

				gpio.read(device.pin, function(err, value) {
					console.log('device: ' + device.pin + ' initial state: ' + value);
					device.state = value ? true : false;


					node.addDevice(device, {
						read:function(callback) {
							callback(device.state);
						}, 
						write:function(value, callback) {

							if (!device.pin) {
								throw 'expected pin: ' + JSON.stringify(device);
							}

							if (device.type == "trigger" && value !== true) {
								//throw 'can only set trigger value to true'
							}

							gpio.write(device.pin, value, function(err) {

								device.state = value;
								callback(value);

							});


						}
					});

				});

			});



		});
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
	setTimeout(function() {
		//delay schedule to prevent running right away 
		//and alows devices to init
		schedules.forEach(function(event) {




			(new Scheduler(event)).run(
				function(task, interval, callback) {
					node.setDeviceValue(node.deviceId(task.setDevice || task.setPin), task.to);
				},
				function(task) {
					node.setDeviceValue(node.deviceId(task.setDevice || task.setPin), task.thenTo);
				}
			);

			var device=node.getDevice(node.deviceId(event.tasks[0].setDevice || event.tasks[0].setPin));
			node.addDevice({
				"name":"Schedule: "+device.name+' '+event.interval,
				"direction":"out",
				"type":"bool",
				"state":true
			}, {
				read:function(){
					return "interval";
				}
			});

		});

	}, 10000)



}