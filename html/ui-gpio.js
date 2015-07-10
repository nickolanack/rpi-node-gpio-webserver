/**
 * 
 */

var UIGeneralPurposeIOPanel=new Class({
	Implements:Events,


	initialize:function(element, options){
		
		var me=this;
		me.options=Object.append({
			websocket:'ws://'+window.location.hostname+':8080'
		},options);


		var websocket=new WebsocketControlQuery(me.options.websocket).addEvent('connect',function(){


			var getDevices=function(callback){
				websocket.execute('list_devices', {}, function(response){
					callback(JSON.parse(response));
				});
			};


			var signalDeviceValue=function(pin, value){
				websocket.execute('set_device_value', {pin:pin, value:value}, function(response){
					console.log(response);
				});

			}




			getDevices(function(devices){

				websocket.addEvent('notification.statechange', function(response){

					var data=JSON.parse(response);
					Array.each(devices,function(device){

						if(device.pin===data.pin){

							// control is added to device on initialization below.	
							device._suppressEventSignal=true;
							device.control.setValue(data.value);	
							// TODO: the event for this setValue task, should be suppressed, otherwise
							// a notification will be sent to the server, and strange race conditions 
							// could occur.
						}

					});

				});


				Array.each(devices,function(device){
					var state=device.state;
					var container=element.appendChild(new Element('div'));
					var control=new UISwitchControl(container, {state:state}).addEvent("change",function(newState){
						if(state!=newState){
							if(!device._suppressEventSignal){
								signalDeviceValue(device.pin, newState);
							}else{
								delete device._suppressEventSignal;
							}

							state=newState;
						}
					});
					container.appendChild(new Element('label', {html:device.name}));
					if(device.direction==='in'){
						control.disable(); //read display only device
					}

					device.control=control; 

				});

			});

		});




	}
});