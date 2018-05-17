

var events = require('events');

function DeviceNode(){};
DeviceNode.prototype.__proto__ = events.EventEmitter.prototype;
DeviceNode.prototype.startWebServer = function(config, path) {

	var me=this;

	var Twig = require('twig'); 
	var twig = Twig.twig;

	var TinyServer = require('tinywebjs');
	me._webserver=new TinyServer({
		port: config.serverPort,
		documentRoot: path,
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


}

DeviceNode.prototype.initializeDevices = function(devices) {

		var me=this;
		me._devices=devices; //REFERENCE!

		var gpio;
		try {
			gpio = require('rpi-gpio');
		} catch (e) {
			console.log('using mock gpio')
			gpio = require('./test/mock-gpio.js');

		}
		me._deviceHandlers={};
		me._devices.forEach(function(device) {//device REFERENCE

			var direction = device.direction === 'in' ? gpio.DIR_IN : gpio.DIR_OUT;

			gpio.setup(device.pin, direction, function(err) {

				gpio.read(device.pin, function(err, value) {
					console.log('device: ' + device.pin + ' initial state: ' + value);
					device.state = value ? true : false;
				});

			});

			me._deviceHandlers[device.pin]={
				write:function(value, callback){
					gpio.write(device.pin, value, function(err){

						device.state = value;
						callback(value);
						
					});

				}
			}
		});
	


}

//Deprecated - for refactoring only
DeviceNode.prototype.getDeviceHandlers = function(config, path) {

	var me=this;
	return me._deviceHandlers;

}

DeviceNode.prototype.startWebSocketServer = function(config) {
	var me=this;
	var WebSocketServer = require('tinywebsocketjs');
	me._wsServer = new WebSocketServer({
		port: config.websocketPort
	});

	me._addWsTaskHandlers();

	

}
DeviceNode.prototype._addWsTaskHandlers = function(config) {
	var me=this;
	me._wsServer.addTask('list_devices', function(options, callback) {

		console.log('sent device list: ' + me._devices.length + ' devices');
		callback(me._devices);

	}).addTask('set_device_value', function(options, callback) {
		var arguments = options.args;

		var pin = arguments.pin;
		var value = !!arguments.value;
		if (me.clientCanSetPin(options.client, pin)) {

			me.setDeviceStateAndBroadcast(pin, value, function(){
				callback('set ' + pin + ' to ' + value);
			}, function(client) {
				//filter client
				return options.client !== client;
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
			device.cid=options.cid;
			map[pin]=device.pin;
			me._devices.push(device);
			me._deviceHandlers[device.pin]={
				write:function(value, callback){
					console.log('set client');
				}
			}
			me._wsServer.broadcast('notification.deviceupdate', JSON.stringify(device));
		})
		callback(map);

	});
}

DeviceNode.prototype.getWebSocketServer = function(config) {
	var me=this;
	return me._wsServer;
}


DeviceNode.prototype.startWebSocketProxyClient=function(proxy){

	var me=this;
	console.log('Setting up proxy @'+proxy.remote);

	var localDevices=me._devices.slice(0);

	var WebSocketServer = require('tinywebsocketjs');
	new WebSocketServer.Client({
		url: proxy.remote
	}, function(ws){

		me._wsProxy=ws;

		ws.send('list_devices', {}, function(response) {
			console.log('GOT Devices: '+response);

			var prefix='proxy-server-';

			JSON.parse(response).forEach(function(device){
				var pin=device.pin;
				device.pin=prefix+device.pin;
				console.log('Add device: '+device.pin);

				me._devices.push(device);
				console.log(JSON.stringify(me._devices));
				me._deviceHandlers[device.pin]={
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
				me._wsServer.broadcast('notification.deviceupdate', JSON.stringify(device));
			});

			ws.on('notification.statechange', function(response){
				console.log('GOT UPDATE: '+response);
				var data=JSON.parse(response);

				me._devices.forEach(function(d){
					if(d.pin==prefix+data.pin){
						d.state=data.value;
					}
				})

				me._wsServer.broadcast('notification.statechange', JSON.stringify({
					pin: prefix+data.pin,
					value: data.value
				}));
			})


			ws.send('publish_devices', {
				"devices":localDevices
			}, function(response) {
				me._proxyMap=JSON.parse(response);				
			});

		});
	});


}

DeviceNode.prototype.setDeviceState = function(pin, value, callback) {
	var me=this;
	me._deviceHandlers[pin].write(value, callback);
}
DeviceNode.prototype.clientCanSetPin = function(client, pin) {
	var me=this;
	return me.isOutputPin(pin);
};

DeviceNode.prototype.isOutputPin = function(pin) {
	return true;
};


DeviceNode.prototype.setDeviceStateAndBroadcast = function(pin, value, callback, filterClient) {

	var me=this;

	me.setDeviceState(pin, value, function(value) {

		if(callback){
			callback(value);
		}

		console.log('set device: ' + pin + ' to ' + value);

		me._wsServer.broadcast('notification.statechange', JSON.stringify({
			pin: pin,
			value: value
		}), filterClient||null);

	});


	if(me._wsProxy&&me._proxyMap[pin]){

		me._wsProxy.send('set_device_value', {
			pin: me._proxyMap[pin],
			value: value
		}, function(response) {
			console.log('forwarded on');
		});

	}

};


module.exports = DeviceNode;