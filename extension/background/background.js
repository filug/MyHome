// My Home settings
var myHome = myHome || {};
myHome.background = {};

/**
 * Set badge text with information how many new events were detected.
 */
myHome.background.setBadgeText = function(unread) {
	// badge text to display
	var text = "";

	// only 3 digits can be displayed as badge text
	if (unread > 999) {
		text = "...";
	} else if (unread > 0){
		text = unread.toString();
	} 
	
	// show updated counter
	chrome.browserAction.setBadgeText({text: text});
};

/**
 * Handle changed in chrome.storage.
 */
myHome.background.onStorageChanges = function(changes, areaName) {
	// get all changed keys
	var keys = Object.keys(changes);
	
	// iterate over all changed keys
	for (var i = 0; i < keys.length; i++) {
		var key = keys[i];
		
		console.debug("key '%s' changed to '%s'", key, changes[key].newValue);

		switch (key) {
		case "unread_events":
			// how many unread events we have
			var unread = changes[key].newValue;
			// set badge text
			myHome.background.setBadgeText(unread);
			break;

		default:
			break;
		}
	}
};

/**
 * New events handler.
 * 
 * Update "unread events" counter.
 */
myHome.background.onNewEvents = function(request, sender, response) {

	if (request.name != "myHome.events.new") {
		return
	}
	
	// extract new events from the notification 
	var counter = request.newEvents.count;
	
	// check how many unread events we have already
	chrome.storage.local.get("unread_events", function(storage) {
		var unread = storage.unread_events || 0;

		// append new events to unread events
		unread += counter;
		
		// update local storage
		// badge text will be updated in reaction for this change
		chrome.storage.local.set({"unread_events": unread});
	});
};

/**
 * Advice all components to execute synchronization with the cloud.
 */
myHome.background.onAlarm = function(alarm) {
	if (alarm === undefined || alarm.name == "myHome.background.sync") {
		chrome.runtime.sendMessage({name : "myHome.events.sync"});
		chrome.runtime.sendMessage({name : "myHome.status.sync"});
	}
};

/**
 * Initialize MyHome extension.
 */
chrome.runtime.onInstalled.addListener(function(details) {
	console.log("My Home started");
	
	// synchronize every 1 minute
	chrome.alarms.create("myHome.background.sync", {periodInMinutes: 1});
	
	// and synchronize now
	myHome.background.onAlarm();
});


// register callback to synchronize extension with the Gigaset elements cloud
chrome.alarms.onAlarm.addListener(myHome.background.onAlarm);

// new events callback
chrome.runtime.onMessage.addListener(myHome.background.onNewEvents);

// react on storage changes
chrome.storage.onChanged.addListener(myHome.background.onStorageChanges);
