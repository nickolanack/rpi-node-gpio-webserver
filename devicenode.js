var events = require('events');

function DeviceNode() {


	var me=this;

	me.on('change', function(id, value){

		me._wsServer.broadcast('notification.statechange', JSON.stringify({
			id: id,
			value: value
		}));

		if (me._wsProxy) {

			console.log('Check Forward Proxy: '+me._proxyMap[id]+' '+Object.keys(me._proxyMap));

			if( me._proxyMap[id]){
				console.log('Forward Client: Set device: ' + me._proxyMap[id] + ' to ' + value);
				try {
					me._wsProxy.send('set_device_value', {
						id: me._proxyMap[id],
						value: value
					}, function(response) {
						console.log('forwarded on');
					});
				} catch (e) {
					console.log('Error Forwarding to proxy');
					console.error(e);
				}
			}

		}


	})
	


};
DeviceNode.prototype.__proto__ = events.EventEmitter.prototype;
DeviceNode.prototype.startWebServer = function(config, path) {

	var me = this;

	var Twig = require('twig');
	var twig = Twig.twig;

	var TinyServer = require('tinywebjs');
	me._webserver = new TinyServer({
		port: config.serverPort,
		documentRoot: path,
		formatters: {
			html: function(data) {

				var template = twig({
					data: data.toString()
				});

				var out = template.render(config);
				return out;
			}
		}
	});


}

DeviceNode.prototype.initializeDevices = function(devices) {

	var me = this;
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


				me.addDevice(device, function(callback) {
					callback(device.state);
				}, function(value, callback) {

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


				});

			});

		});

		

	});



}

DeviceNode.prototype.addDevice = function(device, read, write) {

	var me=this;
	if(!me._devices){
		me._devices = [];
	}
	me._devices.push(device);

	if (typeof device.id == "undefined") {
		var index = me._devices.indexOf(device);
		device.id = index;
	}

	if(!me._deviceHandlers){
		me._deviceHandlers = {};
	}
	me._deviceHandlers[device.id] = {
		read: read,
		write: write
	}
}


//Deprecated - for refactoring only
DeviceNode.prototype.getDeviceHandlers = function(config, path) {

	var me = this;
	return me._deviceHandlers;

}

DeviceNode.prototype.startWebSocketServer = function(config) {
	var me = this;
	var WebSocketServer = require('tinywebsocketjs');
	me._wsServer = new WebSocketServer({
		port: config.websocketPort
	});

	me._addWsTaskHandlers();



}
DeviceNode.prototype._addWsTaskHandlers = function(config) {
	var me = this;
	me._wsServer.addTask('list_devices', function(options, callback) {

		console.log('sent device list: ' + me._devices.length + ' devices');
		callback(me._devices);

	}).addTask('set_device_value', function(options, callback) {
		var arguments = options.args;
		var id = arguments.id;
		var value = !!arguments.value;

		console.log('Recieved: Set device: ' + id + ' to ' + value);

		if (me.isWriteable(id, options.client)) {

			me.setDeviceValue(id, value, function(newValue) {
				callback('Set device: ' + id + ' to ' + newValue);
			});



		}



	}).addTask('publish_client_devices', function(options, callback) {



		console.log(options.cid);
		console.log(options.args.devices);
		var prefix = 'proxy-client-' + options.cid + '-';
		var map = {};

		var clientDevices = [];
		var clientDevicesHandlers = [];

		options.args.devices.forEach(function(device, index) {



			var pin = device.pin;
			if (typeof device.id == "undefined") {
				device.id = index;
			}


			device.id = prefix + index;

			device.pin = prefix + pin;
			device.cid = options.cid;
			map[index] = device.id;
			me._devices.push(device);
			clientDevices.push(device);
			var handler = {
				read: function(callback) {
					callback(device.state);
				},
				write: function(value, callback) {
					console.log('Client Proxy: Set device: ' + device.id + ' to ' + value);

					//braodcast;
					device.state = value;
					callback(value);
				}
			}
			clientDevicesHandlers.push(device.id);
			me._deviceHandlers[device.id] = handler
			me._wsServer.broadcast('notification.deviceupdate', JSON.stringify(device));
		})

		options.client.on('close', function() {
			console.log('Client Device Closed. Remove pushed devices');
			clientDevices.forEach(function(d) {
				me._devices.splice(me._devices.indexOf(d), 1);
				delete me._deviceHandlers[d.id];
			});
		});

		callback(map);

	});
}

DeviceNode.prototype.getWebSocketServer = function(config) {
	var me = this;
	return me._wsServer;
}


DeviceNode.prototype.startWebSocketProxyClient = function(proxy) {

	var me = this;
	console.log('Setting up proxy @' + proxy.remote);

	var localDevices = me._devices.slice(0);

	var WebSocketServer = require('tinywebsocketjs');
	me._wsProxy = new WebSocketServer.Client({
		url: proxy.remote
	});
	var prefix = 'proxy-server-';

	me._wsProxy.on('close', function() {

		console.log('Server Device Closed. Remove pulled devices');

		me._devices = localDevices.slice();
		localHandlers = {};

		me._devices.forEach(function(d) {
			localHandlers[d.id] = me._deviceHandlers[d.id];
		});
		me._deviceHandlers = localHandlers;

	})


	me._wsProxy.on('open', function() {



		try {
			me._wsProxy.send('list_devices', {}, function(response) {
				console.log('Received client device list');



				JSON.parse(response).forEach(function(device) {
					var id = device.id;
					device.id = prefix + id;
					console.log('Add device(' + id + ') as: ' + device.id);
					me._devices.push(device);
					//console.log(JSON.stringify(me._devices));
					me._deviceHandlers[device.id] = {
						read: function(callback) {
							callback(device.state);
						},
						write: function(value, callback) {
							try {
								me._wsProxy.send('set_device_value', {
									id: id,
									value: value
								}, function(response) {
									device.state = value;
									callback(value);
								});
							} catch (e) {
								console.log('Error Setting Upstream Device');
								console.error(e);
							}

						}
					}
					me._wsServer.broadcast('notification.deviceupdate', JSON.stringify(device));
				});

				try {
					me._wsProxy.send('publish_client_devices', {
						"devices": localDevices
					}, function(response) {
						me._proxyMap = JSON.parse(response);
					});
				} catch (e) {
					console.log('Error Pushing Devices');
					console.error(e);
				}


			});
		} catch (e) {
			console.log('Error Pulling Devices');
			console.error(e);
		}
	});

	me._wsProxy.on('notification.statechange', function(response) {

		console.log(response);
		var data = JSON.parse(response);

		console.log('Recieved Upstream Notification: Set device: ' + data.id + ' to ' + data.value + ' ' + JSON.stringify(me._proxyMap));


		me._devices.forEach(function(d) {
			if (d.id == prefix + data.id) {
				d.state = data.value;

				me._wsServer.broadcast('notification.statechange', JSON.stringify({
					id: prefix + data.id,
					value: data.value
				}));

			}
		})

		Object.keys(me._proxyMap).forEach(function(k) {

			if (me._proxyMap[k] == data.id) {
				console.log('Set local device: ' + k + ' aka:' + data.id);
				me.setDeviceValue(k, data.value);
			}

		});

	})

}

DeviceNode.prototype._setDeviceState = function(id, value, callback) {
	var me = this;

	if (!me._deviceHandlers[id]) {
		console.trace();
		throw 'Does not have device with id: ' + id + ' available ids: ' + JSON.stringify(Object.keys(me._deviceHandlers));
	}

	me._deviceHandlers[id].write(value, callback);
}
DeviceNode.prototype.getDeviceState = function(id, callback) {
	var me = this;

	if (!me._deviceHandlers[id]) {
		console.trace();
		throw 'Does not have device with id: ' + id + ' available ids: ' + JSON.stringify(Object.keys(me._deviceHandlers));
	}

	me._deviceHandlers[id].read(callback);
}


DeviceNode.prototype.isWriteable = function(id, client) {
	var me = this;

	for (var i = 0; i < me._devices.length; i++) {
		if (me._devices[i].id + "" === id + "") {
			return me._devices[i].direction === 'out';
		}
	}

	throw 'Not a valid device: ' + id;

};
DeviceNode.prototype.getDevice = function(id) {
	var me = this;
	for (var i = 0; i < me._devices.length; i++) {
		if (me._devices[i].id + "" === id + "") {
			return me._devices[i];
		}
	}

	throw 'Not a valid device: ' + id;

};
DeviceNode.prototype.deviceId = function(idOrPin) {
	var me = this;
	for (var i = 0; i < me._devices.length; i++) {
		if (me._devices[i].id + "" === idOrPin + "") {
			return me._devices[i].id
		}
	}

	for (var i = 0; i < me._devices.length; i++) {
		if ((typeof me._devices[i].pin != "undefined") && me._devices[i].pin + "" === idOrPin + "") {
			return me._devices[i].id
		}
	}

	throw 'Not a valid device: ' + idOrPin;

};


DeviceNode.prototype.isOutputPin = function(pin) {
	throw 'is output pin: ' + pin;
	return true;
};


DeviceNode.prototype.setDeviceValue = function(id, value, callback) {

	var me = this;


	var device=me.getDevice(id);

	if(device.type=="options"&&device.options.indexOf(value)===-1){
		throw 'Must set options to one of: '+JSON.stringify(device.options);
	}


	if (device.type == "trigger"&&value===true) {

		var innerCallback=callback;
		callback=function(value){
			innerCallback(value);
			setTimeout(function() {
				me.setDeviceValue(device.id, false, innerCallback);
			}, device.duration||500);
		}

		
	}

	me.getDeviceState(id, function(currentValue) {

		if (currentValue === value) {
			if (callback) {
				callback(value);
			}
			return;
		}

		me._setDeviceState(id, value, function(newValue) {

			if(value!==newValue){
				throw 'Failed to set value device: ' + id + ' to ' + value;
			}


			if (callback) {
				callback(value);
			}

			console.log('Set device: ' + id + ' to ' + value + ' broadcast' + (filterClient ? ' (but not to originator)' : ''));
			me.emit('change', id, value);

		});

	});


	



};


module.exports = DeviceNode;