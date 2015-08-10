/**
 * 
 */

var config=require('./server.json');
if(config.serverPort!==false){

	(function(){

		new require('tinywebjs')({
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

		// Simple websocket server

		var port = config.websocketPort;
		var clients = [];

		(new (require('ws').Server)({
			port: port
		})).on('connection', function(wsclient){

			clients.push(wsclient);
			console.log('client connected: '+wsclient);

			wsclient.on('message',function(data){




				var request=JSON.parse(data);
				//console.log([data, request]);
				var id=request.id;
				var task=request.task;
				var arguments=request.json;


				if(task=='list_devices'){
					wsclient.send(id+':'+JSON.stringify(devices));
					console.log('sent device list: '+devices.length+' devices');

				}


				if(task=='set_device_value'){
					var pin=arguments.pin;
					var value=!!arguments.value;
					if(clientCanSetPin(wsclient, pin)){
						setDeviceState(pin, value, function(value){
							wsclient.send(id+':set '+pin+' to '+ value);
							console.log('set device: '+pin+' to '+ value);



							clients.forEach(function(otherclient){
								if(otherclient!==wsclient){
									otherclient.send('notification.statechange:'+JSON.stringify({pin:pin, value:value}));
								}
							});
						});
					}

				}


			}).on('close',function(code, message){
				var i = clients.indexOf(wsclient);
				console.log('ws:'+i+' client closed: '+code+' '+message);
				clients.splice(i, 1);
			});

		}).on('error', function(error){

			console.log('error: '+error);

		});


		//gpio.on('change', function(pin, value) {
		//   console.log('notify device: '+pin+' state change: '+value);
		//    
		//});


		console.log('websocket listening on: '+port);

	})();

}


