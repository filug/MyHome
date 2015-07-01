// My Home settings
var myHome = myHome || {};

myHome.background = {
		unreadEvents: 0,	// how many new events are unread by the user
		syncInterval: 1		// how often (in minutes) we should synchronize with Gigaset elements cloud
};

//update badge text with information about new events 
myHome.onNewEvents = function(newEvents) {
	
	// check how many new events were received
	var count = newEvents.timestamps.length;
	
	// no change - no action
	if( count == 0 ) {
		return
	}
	
	// add new events to the "unread events"
	myHome.background.unreadEvents += count;
	
	// text to display in badge icon
	var text = "";

	// only 3 digits can be displayed as badge text
	if (myHome.background.unreadEvents > 999) {
		text = "...";
	} else if (myHome.background.unreadEvents > 0){
		text = myHome.background.unreadEvents.toString();
	} 
	
	// show updated counter
	chrome.browserAction.setBadgeText({text: text});
	console.debug("unread events: ", myHome.background.unreadEvents);
};

//synchronize with Gigaset elements cloud
function synchronize(alarm) {
	// skip when it is not called by the dedicated alarm
	if (alarm === undefined || alarm.name == "myHome.synchronization") {
		// synchronize events
		myHome.events.sync(myHome.onNewEvents);
		// synchronize status
		myHome.status.sync();
	}
}

// start My Home background page
document.addEventListener("DOMContentLoaded", function() {
	
	// register callback to synchronize extension with the Gigaset elements cloud
	chrome.alarms.onAlarm.addListener(synchronize);
	
	// synchronize every X minute(s)
	chrome.alarms.create("myHome.synchronization", {periodInMinutes: myHome.background.syncInterval});
	
	// synchronize extension with the cloud
	synchronize();
});