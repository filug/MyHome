// My Home settings
var myHome = myHome || {};

myHome.events = {
		lastEventTimestamp: -1,	// last received event timestamp
		newEventsCounter: 0,	// how many new events were received since last visit
};

// update badge text with information about new events 
myHome.events.updateNewEventsCounter = function(newEventsCounter) {
	// append new events if they are defined
	if (newEventsCounter !== undefined) {
		myHome.events.newEventsCounter += newEventsCounter;
	}
	
	var counter = myHome.events.newEventsCounter;	// how many new events (in total) we have?
	var text = "";											// text to display in badge icon

	// only 3 digits can be displayed as badge text
	if (counter > 999) {
		text = "...";
	} else if (counter > 0){
		text = counter.toString();
	} 
	
	// show updated counter
	chrome.browserAction.setBadgeText({text: text});
	console.debug("new events (in total): " + counter);
};

// clear new events counter
myHome.events.clearNewEventsCounter = function() {
	myHome.events.newEventsCounter = 0;
	myHome.events.updateNewEventsCounter();
};

// check new events
myHome.events.onNewEvents = function(events, timestamps) {
	var count = timestamps.length;
	
	// update "new events" counter 
	myHome.events.updateNewEventsCounter(count);
};

// find new events in the cloud response
myHome.events.onEvents = function(status, payload, url) {	
	// don't analyze payload if response code shows some problems
	if( status != 200 ){
		return;
	}
	
	// received events are sorted - first is the latest one
	try {
		// array with timestamps for new events 
		var newEvents = [];
		
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
					newEvents.push(event.ts);
				}
			}
		}
		
		console.debug("new events (from the cloud): " + newEvents.length);

		// check if we have new events
		if (newEvents.length > 0) {
			// if yes forward them
			myHome.events.onNewEvents(events, newEvents);
		};
		
		// update time of the last event
		myHome.events.lastEventTimestamp = events[0].ts;

	} catch (e) {
		console.error(e);
	}
};
