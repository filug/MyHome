var myHome = myHome || {};
myHome.status = {};


/**
 * Append issue to the list.
 */
myHome.status.appendIssue = function(list, device, issue) {
	// clone device info because we original one can be reused for other issues
	var details = JSON.parse(JSON.stringify(device));
	details.issue = issue;
	list.push(details);
};


/**
 * /api/v2/me/health callback.
 *
 * Endpoint is showing status in very inconvenient way i.e.:
 *  - only one "failure" is presented,
 *  - information about camera are not presented at all,
 * 
 * The only one sensible thing presented here is "intrusion status state".
 */
myHome.status.onHealth = function(status, payload, url) {

	// read previous "intrusion state"
	chrome.storage.local.get("health.intrusion", function(storage) {
		var intrusion = storage["health.intrusion"] || {};
		
		// re-initialize with default value
		intrusion.cloud = [];
		
		// when "system_health" is not "green" information about 
		// failure reason is defined by "status_msg_id"
		if (payload.hasOwnProperty("status_msg_id")) {
			// extract info about cloud status
			var message = payload.status_msg_id;
			
			switch (true) {
			case (message == "system_intrusion"):
				intrusion.cloud.push(message);
				break;

			default:
				break;
			};
		};
		
		// publish collected information 
		chrome.storage.local.set({"health.intrusion": intrusion});
	});
};


/**
 * api/v1/me/cameras callback
 * 
 * Check all cameras and detect:
 *  - offline status,
 *  - outdated (any other) firmware.
 */
myHome.status.onCameras = function(status, payload, url) {

	// read previous details
	chrome.storage.local.get(["health.offline", "health.firmware"], function(storage) {
		var offline = storage["health.offline"] || {};
		var firmware = storage["health.firmware"] || {};
		
		// re-initialize with default value
		offline.cameras = [];
		firmware.cameras = [];

		// response here is an array with info about all cameras
		for (var i = 0; i < payload.length; i++) {
			try {
				var camera = payload[i];
				
				// extract basic information about camera
				var device = {
						id: camera.id,
						name: camera.friendly_name
				};
				
				// detect connection problems
				if (camera.status != "online") {
					myHome.status.appendIssue(offline.cameras, device, camera.status);
				};
				
				// detect outdated firmware
				if (camera.firmware_status != "up_to_date") {
					myHome.status.appendIssue(firmware.cameras, device, camera.firmware_status); 
				};
			} catch (e) {
				console.error(e);
			};
		};
		
		// publish collected information 
		chrome.storage.local.set({"health.offline": offline});
		chrome.storage.local.set({"health.firmware": firmware});
	});
};


/**
 * /api/v1/me/basestations callback
 * 
 * 
 */
myHome.status.onBasestations = function(status, payload, url) {
	
	// read previous details
	chrome.storage.local.get(["health.offline", "health.firmware",
	                          "health.battery", "health.position"], function(storage) {
		
		var offline = storage["health.offline"] || {};
		var firmware = storage["health.firmware"] || {};
		var battery = storage["health.battery"] || {};
		var position = storage["health.position"] || {};
		
		// re-initialize with default value
		offline.basestations = [];
		offline.sensors = [];
		firmware.basestations = [];
		firmware.sensors = [];
		battery.sensors = [];
		position.sensors = [];
	
		// right now only one Gigaset elements basestation can be connected
		// to the single account - but API seems to support many basestations
		for (var i = 0; i < payload.length; i++) {
			var basestation = payload[i];

			// minimal information about this basestation
			var device = {
				id: basestation.id,
				name: basestation.friendly_name,
			};
			
			// find basestation issues
			try {
				// detect connection problems
				if (basestation.status != "online") {
					myHome.status.appendIssue(offline.basestations, device, basestation.status);
				}
				
				// detect outdated firmware
				if (basestation.firmware_status != "up_to_date") {
					myHome.status.appendIssue(firmware.basestations, device, basestation.firmware_status);
				};
			} catch (e) {
				console.error(e);
			};
		
			// find sensors issues
			for (var j = 0; j < basestation.sensors.length; j++) {
				var sensor = basestation.sensors[j];
				
				// minimal information about this sensor
				var device = {
					id: sensor.id,
					name: sensor.friendly_name,
					type: sensor.type
				};
				
				// detect connection problems, 
				// can't be != "online" because of uncalibrated door sensor where status 
				// is "not_calibrated" 
				if (sensor.status == "offline") {	
					myHome.status.appendIssue(offline.sensors, device, sensor.status);
				};
				
				// detect outdated firmware
				if (sensor.firmware_status != "up_to_date") {
					myHome.status.appendIssue(firmware.sensors, device, sensor.firmware_status);
				};
				
				// detect problems with battery
				if (sensor.hasOwnProperty("battery") && sensor.battery.state != "ok") {
					myHome.status.appendIssue(battery.sensors, device, sensor.battery.state);
				};
				
				// detect problems with the position
				if (sensor.hasOwnProperty("position_status")) {
					switch (true) {
						case (sensor.position_status == "open"):
						case (sensor.position_status == "closed"):
							// ignore correct positions
							break;
	
						default:
							myHome.status.appendIssue(position.sensors, device, sensor.position_status);
							break;
					}
				}
			}
		}
		
		// publish collected information 
		chrome.storage.local.set({"health.offline": offline});
		chrome.storage.local.set({"health.firmware": firmware});
		chrome.storage.local.set({"health.battery": battery});
		chrome.storage.local.set({"health.position": position});
	});
};


// synchronize status
myHome.status.sync = function(request, sender, response){
	
	// filter events
	if (request.name != "myHome.status.sync") {
		return
	}

	// synchronize with health endpoint
	gigaset.request.get(gigaset.health(), function(status, payload, url) {
		myHome.status.onHealth(status, payload, url);
	});
			
	// synchronize basestatio & sensors
	gigaset.request.get(gigaset.basestations.info(), function(status, payload, url) {
		myHome.status.onBasestations(status, payload, url);
	});
	
	// synchronize camera
	gigaset.request.get(gigaset.cameras.info(), function(status, payload, url) {
		myHome.status.onCameras(status, payload, url);
	});
};


// "myHome.status.sync" request handler 
chrome.runtime.onMessage.addListener(myHome.status.sync);
