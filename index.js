/**
 * 
 */

(function(){
	
	//Simple webserver

	var fs=require('fs');
	var http=require('http');
	var async=require('async');
	var port=80;
	var documentRoot='./html/';

	var server=http.createServer(function(req, res) {

		var file=req.url.split('/').pop();
		if(file===''){
			file='index.html';
		}
		if(file.indexOf('.')>=0){
	
			fs.exists(documentRoot+file, function(exists){
			
				if(exists){
					var contentTypes={
						js:'text/javascript',
						css:'text/css',
						html:'text/html'
					};
					
					var type=file.split('.').pop();
					res.writeHead(200, {
						'Content-Type': contentTypes[type]
					});
		
					fs.readFile(documentRoot+file, function (err, data) {
						res.write(data);
						res.end();
					});
			
				}else{
						
					res.writeHead(404);
					res.end('File not found: '+file);
					
				}

			});
		}else{
			
			res.writeHead(500);
			res.end('resuest: '+file);
			
		}
		
	});
	
	server.listen(port);
	console.log('webserver listening on: '+port);

})();


var devices=require('./devices.json');
	
var gpio = require('rpi-gpio');
devices.forEach(function(dconf){
	
	var direction=dconf.direction==='in'?gpio.DIR_IN:gpio.DIR_OUT;
	
	gpio.setup(dconf.pin, direction, function(err){
		
		 gpio.read(dconf.pin, function(err, value) {
		        console.log('The value is ' + value);
		        dconf.state=value?true:false;
		 });
		 
	});
	 
	
	
});

gpio.on('change', function(pin, value) {
    devices.forEach(function(device){
    	if(device.pin===pin){
    		device.state=value;
    	}
    });
});
	
	
var setDeviceState=function(pin, value, callback){
	
    gpio.write(pin, value, function(err) {
        if (err) throw err;
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
	
	var port = 8080;
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
	
	
	gpio.on('change', function(pin, value) {
	    console.log('notify device: '+pin+' state change: '+value);
	    clients.forEach(function(wsclient){
	    	wsclient.send('statechange:'+JSON.stringify({pin:pin, value:value}));
	    });
	});

	
	console.log('websocket listening on: '+port);

})();




