/**
 * 
 */

var UIGeneralPurposeIOPanel = new Class({
	Implements: Events,

	initialize: function(element, options) {

		var me = this;
		me.options = Object.append({
			websocket: 'ws://' + window.location.hostname + ':8080'
		}, options);

		var websocket = new WebsocketControlQuery(me.options.websocket).addEvent('connect', function() {

			var getDevices = function(callback) {
				websocket.execute('list_devices', {}, function(response) {
					callback(JSON.parse(response));
				});
			};

			var signalDeviceValue = function(pin, value) {
				websocket.execute('set_device_value', {
					pin: pin,
					value: value
				}, function(response) {
					console.log(response);
				});
			}

			getDevices(function(devices) {

				websocket.addEvent('notification.statechange', function(response) {

					var data = JSON.parse(response);
					Array.each(devices, function(device) {

						if (device.pin === data.pin) {

							device._suppressEventSignal = true;
							device.control.setValue(data.value);

						}

					});

				});

				Array.each(devices, function(device) {

					var state = device.state;
					var container = element.appendChild(new Element('div'));
					var control = new UISwitchControl(container, {
						state: state
					}).addEvent("change", function(newState) {
						if (state != newState) {
							if (!device._suppressEventSignal) {
								signalDeviceValue(device.pin, newState);
							}

							state = newState;
						}

						if (device._suppressEventSignal) {
							// state was set on a notification from server. 
							// it is not necessary to re-signal the state back 
							// to the server and could cause an infinite loop 
							delete device._suppressEventSignal;
						}
					});
					container.appendChild(new Element('label', {
						html: device.name
					}));

					if (device.direction === 'in') {
						control.disable(); //read display only device
					}
					device.control = control;

				});



				websocket.addEvent('disconnect', function() {
					//disable switches while disconnected
					Array.each(devices, function(device) {
						device.control.disable();
					});

				});
				websocket.addEvent('reconnect', function() {
					//enable switches when reconnected
					Array.each(devices, function(device) {
						device.control.enable();
					});

				});

				websocket.addEvent('reconnect', function() {

					//update all devices with current state from request

					getDevices(function(updatedDevices) {
						Array.each(updatedDevices, function(updatedDevice) {
							var state = updatedDevice.state;
							Array.each(devices, function(device) {
								if (device.pin === updatedDevice.pin) {
									device._suppressEventSignal = true;
									device.control.setValue(state);
								}

							});

						});
					});

				});

			});

		});

	}
});