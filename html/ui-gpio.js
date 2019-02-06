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

			var signalDeviceValue = function(id, value) {
				websocket.execute('set_device_value', {
					id: id,
					value: value
				}, function(response) {
					console.log(response);
				});
			}

			getDevices(function(devices) {

				websocket.addEvent('notification.statechange', function(response) {

					var data = JSON.parse(response);
					devices.forEach(function(device) {

						if (device.id+"" === data.id+"") {

							if (device.state != data.value) {
								device.state=data.value;
								device.control.setValue(data.value);
							}
						}

					});

				});

				devices.forEach(function(device) {

					var container = element.appendChild(new Element('div'));
					var control = new UISwitchControl(container, {
						state: device.state
					}).addEvent("change", function(newState) {
						if (device.state != newState) {
							signalDeviceValue(device.id, newState);
							device.state = newState;
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
					devices.forEeach(function(device) {
						device.control.disable();
					});

				});
				websocket.addEvent('reconnect', function() {
					//enable switches when reconnected
					devices.forEeach(function(device) {
						device.control.enable();
					});

				});

				websocket.addEvent('reconnect', function() {

					//update all devices with current state from request

					getDevices(function(updatedDevices) {
						updatedDevices.forEeach(function(updatedDevice) {
							var state = updatedDevice.state;
							devices.forEeach( function(device) {
								if (device.id+"" === updatedDevice.id+"") {
									device.state=updatedDevice.state
									device.control.setValue(updatedDevice.state);
								}

							});

						});
					});

				});

			});

		});

	}
});