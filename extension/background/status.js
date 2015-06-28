var myHome = myHome || {};

myHome.status = {
		issues: {
			intrusion: {
				cloud: []
			},
			connection: {
				basestations: [],
				sensors: [],
				cameras: []
			},
			firmware: {
				basestations: [],
				sensors: [],
				cameras: []
			},
			position: {
				sensors: []
			},
			battery: {
				sensors: []
			},
		},
};

myHome.status.clearIssues = function(component) {
	// find all keys in "issues"
	var keys = Object.keys(myHome.status.issues);
	
	// check all issues
	for (var i = 0; i < keys.length; i++) {
		// issue node
		var issue = myHome.status.issues[keys[i]];
		// if requested component is available 
		if (issue.hasOwnProperty(component)) {
			// clear all issues available here
			issue[component] = [];
		}
	}
};

// /api/v2/me/health callback
myHome.status.onHealth = function(status, payload, url) {
	// There is a lot of issues with this endpoint:
	// - information about camera are not displayed,
	// - only one "failure" is displayed.
	//
	// That's the reason why only few of information from this endpoint are used
	
	// only response 200 contains valid data 
	if (status != 200) {
		return;
	}
	
	
	// cleanup previous cloud issues
	myHome.status.clearIssues("cloud");
	
	try {
		// most of the issues are detected in the other way, here only information about "intrusion"
		// is useful
		if (payload.hasOwnProperty("status_msg_id")) {
			// extract info about cloud status
			var message = payload.status_msg_id;
			
			switch (true) {
			case (message == "system_intrusion"):
				myHome.status.issues.intrusion.cloud.push(message)
				break;

			default:
				break;
			}
		}
	} catch (e) {
		console.error(e);
	}
};


// api/v1/me/cameras callback
myHome.status.onCameras = function(status, payload, url) {
	// drop invalid response
	if (status != 200) {
		return;
	}
	
	// drop previous issues
	myHome.status.clearIssues("cameras");
	
	// response here is an array with info about all cameras
	for (var i = 0; i < payload.length; i++) {
		try {
			var camera = payload[i];
			// extract basic information about camera
			
			// detect connection problems
			if (camera.status != "online") {
				myHome.status.issues.connection.cameras.push({
					id: camera.id,
					name: camera.friendly_name,
					status: camera.status
				});
			};
			
			// detect outdated firmware
			if (camera.firmware_status != "up_to_date") {
				myHome.status.issues.firmware.cameras.push({
					id: camera.id,
					name: camera.friendly_name,
					status: camera.firmware_status
				});
			}
		} catch (e) {
			console.error(e);
		}
	}
};

// /api/v1/me/basestations handler 
myHome.status.onBasestations = function(status, payload, url) {
	// ignore invalid response
	if (status != 200) {
		return;
	}
	
	// drop all previous issues
	myHome.status.clearIssues("basestations");
	myHome.status.clearIssues("sensors");
	
	// right now only one Gigaset elements basestation can be connected
	// to the single account - but API seems to support many basestations
	for (var i = 0; i < payload.length; i++) {
		var basestation = payload[i];
		
		// find basestation issues
		try {
			// detect connection problems
			if (basestation.status != "online") {
				myHome.status.issues.connection.basestations.push({
					id: basestation.id,
					name: basestation.friendly_name,
					status: basestation.status
				});
			};
			
			// detect outdated firmware
			if (basestation.firmware_status != "up_to_date") {
				myHome.status.issues.connection.basestations.push({
					id: basestation.id,
					name: basestation.friendly_name,
					status: basestation.firmware_status
				});
			}
		} catch (e) {
			console.error(e);
		}
		
		// find sensors issues
		for (var j = 0; j < basestation.sensors.length; j++) {
			var sensor = basestation.sensors[j];
			
			// detect connection problems
			if (sensor.status != "online") {
				myHome.status.issues.connection.sensors.push({
					id: sensor.id,
					name: sensor.friendly_name,
					type: sensor.type,
					status: sensor.status
				});
			};
			
			// detect outdated firmware
			if (sensor.firmware_status != "up_to_date") {
				myHome.status.issues.firmware.sensors.push({
					id: sensor.id,
					name: sensor.friendly_name,
					type: sensor.type,
					status: sensor.firmware_status
				});
			}
			
			// detect problems with be battery
			if (sensor.hasOwnProperty("battery") && sensor.battery.state != "ok") {
				myHome.status.issues.battery.sensors.push({
					id: sensor.id,
					name: sensor.friendly_name,
					type: sensor.type,
					status: sensor.battery.state
				});
			}
			
			// detect problems with the position
			if (sensor.hasOwnProperty("position_status")) {
				switch (true) {
				case (sensor.position_status == "open"):
				case (sensor.position_status == "closed"):
					// ignore correct positions
					break;

				default:
					myHome.status.issues.position.sensors.push({
						id: sensor.id,
						name: sensor.friendly_name,
						type: sensor.type,
						status: sensor.position_status
					});	
					break;
				}
			}
		}
	}
};

// synchronize status
myHome.status.sync = function(){
	// synchronize with health endpoint
	gigaset.request.get(gigaset.health(), myHome.status.onHealth);
	// synchronize basestatio & sensors
	gigaset.request.get(gigaset.basestations.info(), myHome.status.onBasestations);
	// synchronize camera
	gigaset.request.get(gigaset.cameras.info(), myHome.status.onCameras);
	
};
