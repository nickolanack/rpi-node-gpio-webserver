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


var devices=[{
		name:'GPI Pin 7',
		pin:7,
		direction:'out',
		type:'bool',
		state:false
}],
	
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
	
	

(function(){

	// Simple websocket server
	
	var port = 8080;
	var clients = [];

	(new (require('ws').Server)({
		port: port
	})).on('connection', function(wsclient){
	
		clients.push(wsclient);

		wsclient.on('message',function(data){

			var request=JSON.parse(data);
			var id=request.id;
			var tast=request.task;
			var arguments=request.json;
			
			
			
			
		
		}).on('close',function(code, message){
			var i = clients.indexOf(wsclient);
			console.log('ws:'+i+' client closed: '+code+' '+message);
			clients.splice(i, 1);
		});

	}).on('error', function(error){
		
		console.log('error: '+error);
	
	});

	console.log('websocket listening on: '+port);

})();




