
function onBasestations(status, payload, url) {
	
	// only the 1st basestation will be displayed 
	var basestation = payload[0];
	
	// set location name in the header
	document.getElementById("name").innerHTML = basestation.friendly_name;
	
	document.getElementById("section_positions").innerHTML = "Current positions";
	
	// table where all known positions should be displayed
	var positionTable = document.getElementById("positions");
	
	// find all sensors with known position
	for (var i = 0; i < basestation.sensors.length; i++) {
		var sensor = basestation.sensors[i];
	
		if (sensor.hasOwnProperty("position_status")) {
			var row = positionTable.insertRow();
			var icon = myHome.icons.getSensorTypeIcon(sensor.type);
			row.insertCell(0).innerHTML = "<img src='" + icon + "'/>";
			row.insertCell(1).innerHTML = sensor.friendly_name;
			row.insertCell(2).innerHTML = sensor.position_status;
		}
	}
}


function mergeEvents(events) {
	// list of merged events
	var merged = [];
	
	// list of concatenated events (with this same sensor id and event type)
	var concatenated = [];
		
	// check each event
	for (var i = 0; i < events.length; i++) {
		var event = events[i];
		
		try {
			// read the previous one event
			var previous = concatenated[0];
			
			// if this is still this same sensor and this same type of event
			if (event.o.id == previous.o.id && event.type == previous.type) {
				// concatenate it
				concatenated.push(event);
			} else {
				// if not, store previous concatenated events
				merged.push(concatenated);
				// and add 1st new item
				concatenated = [];
				concatenated.push(event);
			}
		} catch (e) {
			// there is no previous event in the list - i.e. this is the first event
			concatenated.push(event);
		}
	}
	// append the last concatenated item
	merged.push(concatenated);
	
	return merged;
}

var day_names = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];

function friendlyTime(timestamp) {
	
	friendly_timestamp = {
			time: undefined,
			date: undefined
	};
	
	var now = Date.now();
		
	// time difference in seconds
	var seconds = (now - timestamp)/1000;
	
	if (seconds < 2) {
		friendly_timestamp.time = "1 second ago";
	} else if (seconds < 60) {
		friendly_timestamp.time = Math.round(seconds) + " seconds ago";
	} else if (seconds < 120) {
		friendly_timestamp.time = "1 minute ago";
	} else if (seconds < 3600) {	// one hour
		friendly_timestamp.time = Math.round(seconds/60) + " minutes ago";
	} else if (seconds < 14400) {	// 4 hours
		friendly_timestamp.time = Math.round(seconds/3600) + " hours ago";
	} else {
		var time = new Date(parseInt(timestamp));
		
		friendly_timestamp.time = time.toLocaleTimeString();
		
		var days = ((new Date()).setHours(0, 0, 0, 0) - timestamp)/86400000;
		if (days < 0) {
			friendly_timestamp.date = "today";
		} else if (days < 1) {
			friendly_timestamp.date = "yesterday";
		} else if (days < 6) {
			friendly_timestamp.date = day_names[time.getDay()];
		} else {
			friendly_timestamp.date = time.toLocaleDateString();
		}
	};
	
	return friendly_timestamp;
}

function onEvents(status, payload, url) {

	// set name of the sections
	document.getElementById("section_events").innerHTML = "Events";
	
	// events table
	var table = document.getElementById("events");
	
	// concatenate all events with this same sensor & type
	var merged = mergeEvents(payload.events);
	var toShow = merged.length;
	// show only 20 rows
	if (toShow > 20) {
		toShow = 20;
	}
	
	// show each merged event
	for (var i = 0; i < toShow; i++) {
		
		var events = merged[i];			// all concatenated events
		var count = events.length;		// how many concatenated events we have
		var first = events[0];			// first event
		var last = events[count-1];		// last event
		
		// information about event
		var deviceType = first.o.type;
		var deviceName = first.o.friendly_name;
		var eventType = first.type;
		
		// new table row for the event
		var topRow = table.insertRow();

		var iconCell = topRow.insertCell(0);	// cell with icon
		var eventCell = topRow.insertCell(1);	// cell with the event source description
		var timeCell = topRow.insertCell(2);	// cell with the timestamp info
		
		// show icon for this type of the sensor
		var icon = myHome.icons.getSensorTypeIcon(deviceType);
		iconCell.innerHTML = "<img src='" + icon + "'/>";
		
		// show info about source if the event
		if (deviceName != undefined) {
			eventCell.innerHTML = deviceName + "<br>" + eventType;
		} else {
			eventCell.innerHTML = eventType;
		}
		
		// for more than one event add counter
		if (count > 1) {
			eventCell.innerHTML += " (" + count + " times)";
		}

		// get friendly time for the first event 
		first.timestamp = friendlyTime(first.ts); 
		// and add to the table 
		timeCell.innerHTML = first.timestamp.time;
		
		// when we have only one event
		if (count == 1) {
			// add info about date if needed
			if( first.timestamp.date !== undefined ) {
				timeCell.innerHTML += "<br>" + first.timestamp.date;
			}
		} else {
			// friendly time for the last event
			last.timestamp = friendlyTime(last.ts);
			
			// date was not added for the fist event
			if (first.timestamp.date === undefined) {
				timeCell.innerHTML += "<br>" + last.timestamp.time;
			// date for the first and the last events is this same
			} else if (first.timestamp.date == last.timestamp.date) {
				timeCell.innerHTML += "<br>" + last.timestamp.time;
			// dates are completely different, so everything should be added 
			} else {
				timeCell.innerHTML += "<br>" + first.timestamp.date;
				timeCell.innerHTML += "<br>" + last.timestamp.time;
			}

			// finally add date of the last event (optionally date for the first event as well) 
			if (last.timestamp.date !== undefined) {
				timeCell.innerHTML += "<br>" + last.timestamp.date;
			}
		}
	}
}


function onInit() {
	gigaset.request.get(gigaset.basestations.info(), onBasestations);
	gigaset.request.get(gigaset.events.last(200), onEvents);
}





document.addEventListener('DOMContentLoaded', onInit, false);
