// My Home settings
var myHome = myHome || {};

myHome.events = {
		lastEventTimestamp: -1,	// last received event timestamp
		limit: 60				// how many events are downloaded during synchronization
};

// find new events in the cloud response
myHome.events.onEvents = function(payload) {
	
	var newEvents = {
			events: payload,
			timestamps: []
	};
	
	// received events are sorted - first is the latest one
	try {
		// extract events from the cloud
		var events = payload.events;

		if( myHome.events.lastEventTimestamp < 0 ) {
			// initialize last event timestamp if needed
			myHome.events.lastEventTimestamp = events[0].ts;
		} else {
			// find new event
			var length = events.length;

			// check all received events
			for (var i = 0; i < length; i++) {
				var event = events[i];
				// if this is new event add it to the list
				if (event.ts > myHome.events.lastEventTimestamp) {
					newEvents.timestamps.push(event.ts);
				}
			}
		}
		
		console.debug("new events: " + newEvents.timestamps.length);
		
		// update time of the last event
		myHome.events.lastEventTimestamp = events[0].ts;
	} catch (e) {
		console.error(e);
	}
	
	return newEvents;
};

// synchronize events with the cloud
myHome.events.sync = function(callback) {
	
	var url = gigaset.events.last(myHome.events.limit);
	
	// download latest events from the cloud
	gigaset.request.get(url, function(status, payload) {

		// find new events
		var newEvents = myHome.events.onEvents(payload);
	
		// forward them to the callback
		callback(newEvents);
	});
};
