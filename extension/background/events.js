// My Home settings
var myHome = myHome || {};
myHome.events = {};


/**
 * myHome.events synchronization callback.
 * 
 * If "request.name" == "myHome.events.sync" last events will be downloaded from
 * the cloud and new events will be detected.
 */
myHome.events.sync = function(request, sender, response) {
	// filter events
	if (request.name != "myHome.events.sync") {
		return
	}

	// find timestamp of the last received event
	chrome.storage.local.get("events_last", function(objects) {
		var from = objects.events_last || (Date.now() - 1000*60*60*6);

		// to now (+ 10 minutes to avoid problems between PC and Cloud time)
		var to = Date.now() + 1000*60*10;

		// last events cloud endpoint)
		var endpoint = gigaset.events.inTimeRange(from, to, 50);

		// download new events from the cloud
		gigaset.request.get(endpoint, function(status, payload) {
			
			// extract events from response
			var events = payload.events;
			
			// if there is something new
			if (events.length) {
				
				// timestamp of the last event (they are sorted)
				var last = events[0].ts;
				
				// save last event timestamp
				chrome.storage.local.set({"events_last": last});
				
				// create message about new events
				var newEvents = {
						count: events.length,
						events: events
				};

				// broadcast new events
				chrome.runtime.sendMessage({
					name: "myHome.events.new",
					newEvents: newEvents
				});
			};
		});
	});
};


/**
 * Configure myHome.events handler.
 */
chrome.runtime.onInstalled.addListener(function(details) {
	// myHome.events.sync callback
	chrome.runtime.onMessage.addListener(myHome.events.sync);

	console.debug("myHome.events installed");
});
