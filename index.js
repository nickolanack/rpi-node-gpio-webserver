/**
 * 
 */

var config = require('./server.json');
if (config.serverPort !== false) {

	(function() {

		var Twig = require('twig'); // Twig module
    	var twig = Twig.twig;

		var Server = require('tinywebjs');
		new Server({
			port: config.serverPort,
			documentRoot: __dirname + '/html/',
			formatters:{
				html:function(data){
					
					var template = twig({
					    data: data.toString()
					});

					var out=template.render(config);
					return out;
				}
			}
		});

	})();
}

if (config.websocketPort !== false) {

	var devices = [];
	var gpio;

	


	var devices = require('./devices.json');		


	var controls={};

	if(devices){



		var gpio;
		try {
			gpio = require('rpi-gpio');
		} catch (e) {
			console.log('using mock gpio')
			gpio = require('./test/mock-gpio.js');

		}

		devices.forEach(function(device) {

			var direction = device.direction === 'in' ? gpio.DIR_IN : gpio.DIR_OUT;

			gpio.setup(device.pin, direction, function(err) {



				gpio.read(device.pin, function(err, value) {
					console.log('device: ' + device.pin + ' initial state: ' + value);
					device.state = value ? true : false;
				});

			});

			controls[device.pin]={
				write:function(value, callback){
					gpio.write(device.pin, value, function(err){


						device.state = value;
						callback(value);
						
					});

				}
			}
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


	var setDeviceState = function(pin, value, callback) {
		controls[pin].write(value, callback);
	}
	var clientCanSetPin = function(client, pin) {
		return isOutputPin(pin);
	};

	var isOutputPin = function(pin) {
		return true;
	};


	(function() {





		var WebSocketServer = require('tinywebsocketjs');
		var wsserver = new WebSocketServer({
			port: config.websocketPort
		});


		if (config.proxy) {
			console.log('Setting up proxy @'+config.proxy.remote);
			if(config.proxy.remote){

				var localDevices=devices.slice(0);

				var WebSocketServer = require('tinywebsocketjs');
				new WebSocketServer.Client({
					url: config.proxy.remote
				}, function(ws){
					ws.send('list_devices', {}, function(response) {
						console.log('GOT Devices: '+response);

						var prefix='proxy-server-';

						JSON.parse(response).forEach(function(device){
							var pin=device.pin;
							device.pin=prefix+device.pin;
							console.log('Add device: '+device.pin);

							devices.push(device);
							console.log(JSON.stringify(devices));
							controls[device.pin]={
								write:function(value, callback){
									ws.send('set_device_value', {
										pin: pin,
										value: value
									}, function(response) {
										device.state = value;
										callback(value);
									});

								}
							}
							wsserver.broadcast('notification.deviceupdate', JSON.stringify(device));
						});

						ws.on('notification.statechange', function(response){
							console.log('GOT UPDATE: '+response);
							var data=JSON.parse(response);

							devices.forEach(function(d){
								if(d.pin==prefix+data.pin){
									d.state=data.value;
								}
							})

							wsserver.broadcast('notification.statechange', JSON.stringify({
								pin: prefix+data.pin,
								value: data.value
							}));
						})


						ws.send('publish_devices', {
							"devices":localDevices
						}, function(response) {
							var original=setDeviceStateAndBroadcast;
							var map=JSON.parse(response);
							setDeviceStateAndBroadcast=function(pin, value){

								original.apply(null, arguments);
								if(map[pin]){

									ws.send('set_device_value', {
										pin: map[pin],
										value: value
									}, function(response) {
										console.log('forward');
									});

								}
							}
							
						});

					});
				});
			}
		} 


		var setDeviceStateAndBroadcast = function(pin, value) {

			setDeviceState(pin, value, function(value) {
				console.log('set device: ' + pin + ' to ' + value);

				wsserver.broadcast('notification.statechange', JSON.stringify({
					pin: pin,
					value: value
				}));

			});
		};

		wsserver.addTask('list_devices', function(options, callback) {

			console.log('sent device list: ' + devices.length + ' devices');
			callback(devices);

		}).addTask('set_device_value', function(options, callback) {
			var arguments = options.args;

			var pin = arguments.pin;
			var value = !!arguments.value;
			if (clientCanSetPin(options.client, pin)) {
				setDeviceState(pin, value, function(value) {
					callback('set ' + pin + ' to ' + value);
					console.log('set device: ' + pin + ' to ' + value);

					wsserver.broadcast('notification.statechange', JSON.stringify({
						pin: pin,
						value: value
					}), function(client) {
						return options.client !== client;
					});

				});
			}

		}).addTask('publish_devices', function(options, callback){


			
			console.log(options.cid);
			console.log(options.args.devices);
			var prefix='proxy-client-'+options.cid+'-';
			var map={};
			options.args.devices.forEach(function(device){
				var pin=device.pin;

				device.pin=prefix+pin;
				map[pin]=device.pin;
				devices.push(device);
				controls[device.pin]={
					write:function(value, callback){
						console.log('set client');
					}
				}
				wsserver.broadcast('notification.deviceupdate', JSON.stringify(device));
			})
			callback(map);

		});



		var schedules = require("./schedule.json");
		var scheduler = require("./schedule.js");

		schedules.forEach(function(event) {

			scheduler.schedule(event, function(task, callback) {
				setDeviceStateAndBroadcast(task.setPin, task.to);
				setTimeout(function() {
					setDeviceStateAndBroadcast(task.setPin, task.thenTo);
					callback();
				}, scheduler.interval(task.for))
			});

		});


	})();



}