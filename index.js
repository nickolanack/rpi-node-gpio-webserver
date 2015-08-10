/**
 * 
 */

var config=require('./server.json');
if(config.serverPort!==false){

	(function(){

		var Server=require('tinywebjs');
		new Server({
			port:config.serverPort,
			documentRoot:__dirname+'/html/'
		});

	})();
}

if(config.websocketPort!==false){

	var devices=require('./devices.json');

	var gpio = require('rpi-gpio');
	devices.forEach(function(device){

		var direction=device.direction==='in'?gpio.DIR_IN:gpio.DIR_OUT;

		gpio.setup(device.pin, direction, function(err){

			gpio.read(device.pin, function(err, value) {
				console.log('device: '+device.pin+' initial state: ' + value);
				device.state=value?true:false;
			});

		});



	});

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


	var setDeviceState=function(pin, value, callback){

		gpio.write(pin, value, function(err) {
			if (err) throw err;


			devices.forEach(function(device){
				if(device.pin===pin){
					device.state=value;
				}
			});  
			callback(value);
		});


	}
	var clientCanSetPin=function(client, pin){
		return isOutputPin(pin);
	};

	var isOutputPin=function(pin){
		return true;
	};

	
	(function(){

		var WebSocketServer=require('./websocketserver.js');
		var wsserver=new WebSocketServer({
			port:config.websocketPort
		});
		wsserver.addTask('list_devices', function(options, callback){
			
			console.log('sent device list: '+devices.length+' devices');
			callback(devices);
		
		}).addTask('set_device_value', function(options, callback){
			var arguments=options.args;
			
			var pin=arguments.pin;
			var value=!!arguments.value;
			if(clientCanSetPin(options.client, pin)){
				setDeviceState(pin, value, function(value){
					callback('set '+pin+' to '+ value);
					console.log('set device: '+pin+' to '+ value);

					wsserver.broadcast('notification.statechange', JSON.stringify({pin:pin, value:value}),function(client){
						return options.client!==client;
					});
					
				});
			}

		});

	})();
	

}


