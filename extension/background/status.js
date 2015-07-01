var myHome = myHome || {};

myHome.status = {
		// all detected issues
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

		// sensitivity for each type of issues
		sensitivity: {
			errors: ["intrusion", "connection"],
			warnings: ["position", "battery"],
			infos: ["firmware"]
		},
		
		// My Home health status
		health: {
			errors: [],
			warnings: [],
			infos: []
		},
		
		refreshDelay: 1000	// because we are using several endpoint to determine state we are
							// delaying (since last response) "refresh" time by this value (in ms)
							// because of that we can prevent many updates with incomplete data
};



// get My Home health status
myHome.status.getHealth = function(issues, sensitivity) {
	
	var health = {};
	
	// find all sensitivity levels
	var levels = Object.keys(sensitivity);
	
	// check all issues for all levels
	for (var i = 0; i < levels.length; i++) {
		var level = levels[i];
		
		// initialize health object
		health[level] = [];
		
		// check all issues types defined by this level 
		for (var j = 0; j < sensitivity[level].length; j++) {
			var issueType = sensitivity[level][j];
			
			// find all components in this issue
			var elements = Object.keys(issues[issueType]);

			// check if component contains issue inside
			for (var k = 0; k < elements.length; k++) {
				var element = elements[k];
				
				for (var l = 0; l < issues[issueType][element].length; l++) {
					var issue = issues[issueType][element][l];
					
					issue.issueSource = issueType;
					issue.element = element;
					
					health[level].push(issue);
				}
			}
		}
	}
	
	return health;
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
				myHome.status.issues.intrusion.cloud.push(message);
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

// refresh My Home health status
myHome.status.refresh = function() {
	// evaluate issues
	var health = myHome.status.getHealth(myHome.status.issues, myHome.status.sensitivity);
	
	// update cached status
	myHome.status.health = health;
	
	var icon = "green";
	
	// show health via My Home icon
	if (health.errors.length > 0) {
		icon = "red";
	} else if (health.warnings.length > 0) {
		icon = "yellow";
	} else if (health.infos.length > 0) {
		icon = "blue";
	};

	// set correct My Home icon
	myHome.icons.setExtensionIcon(icon);
};

// synchronize status
myHome.status.sync = function(){

	// timer for delayed refresh
	var timer = undefined;
	// refresh status with some delay
	function delayedRefresh() {
		// clear previous timer if any
		if (timer !== undefined) {
			window.clearTimeout(timer);
		}
		// restart refresh timer
		timer = window.setTimeout(myHome.status.refresh, myHome.status.refreshDelay);
	};
	
	// synchronize with health endpoint
	gigaset.request.get(gigaset.health(), function(status, payload, url) {
		myHome.status.onHealth(status, payload, url);
		delayedRefresh();
	});
			
	// synchronize basestatio & sensors
	gigaset.request.get(gigaset.basestations.info(), function(status, payload, url) {
		myHome.status.onBasestations(status, payload, url);
		delayedRefresh();
	});
	
	// synchronize camera
	gigaset.request.get(gigaset.cameras.info(), function(status, payload, url) {
		myHome.status.onCameras(status, payload, url);
		delayedRefresh();
	});
};


