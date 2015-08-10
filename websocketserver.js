/**
 * 
 */
var events = require('events');


function WebsocketServer(options){

	// Simple websocket server
	events.EventEmitter.call(me);
	me.clients = [];
	
	me._handlers={};


	var config={
			port:8080
	};

	Object.keys(options).forEach(function (key) {
		config[key]=options[key];
	});

	me.server=(new (require('ws').Server)({
		port: config.port
	})).on('connection', function(wsclient){

		me.clients.push(wsclient);
		console.log('client connected: '+wsclient);

		wsclient.on('message',function(data){




			var request=JSON.parse(data);
			//console.log([data, request]);
			var id=request.id;
			var task=request.task;
			var arguments=request.json;
			arguments.request_id=id;
			arguments.client=wsclient;
			
			
			if((typeof me.handler[task])=='function'){
				
				me.handler[task](arguments, function(response){
					
					if((typeof response)=='object'){
						wsclient.send(id+':'+JSON.stringify(response));
					}
					
					if((['string', 'number']).indexOf(typeof response)>=0){
						wsclient.send(id+':'+response);
					}
					
				});
				
			}


		
		}).on('close',function(code, message){
			var i = me.clients.indexOf(wsclient);
			console.log('ws:'+i+' client closed: '+code+' '+message);
			me.clients.splice(i, 1);
		});
		

		

	}).on('error', function(error){

		console.log('error: '+error);

	});


	//gpio.on('change', function(pin, value) {
	//   console.log('notify device: '+pin+' state change: '+value);
	//    
	//});


	console.log('websocket listening on: '+port);

}


WebsocketServer.prototype.__proto__ = events.EventEmitter.prototype;
WebsocketServer.prototype.stop=function(){
	var me=this;
	console.log('websocker server stopped');
	me.server.close();
}

WebsocketServer.prototype.broadcast=function(name, message, filterClient){
	var me=this;
	me.clients.forEach(function(wsclient){
		
		if((typeof filterClients)=='function'){
			if(filterClient(wsclient)){
				wsclient.send(name+':'+message);
			}	
		}else{
			wsclient.send(name+':'+message);	
		}
			
	});
}

WebsocketServer.prototype.addTask=function(name, callback){
	var me=this;
	if(!me._handlers){
		me._handlers={};
	}
	me._handlers[name]=callback;
	return me;
}



module.exports=WebsocketServer;