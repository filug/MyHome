// My Home settings
var myHome = myHome || {};

myHome.settings = {
		syncInterval: 1,		// how often (in minutes) we should synchronize with Gigaset elements cloud
		syncEventsLimit: 60		// how many events we should download for synchronization purposes
};


myHome.onEvents = function(status, payload, url) {

	// forward response to the event handler
	myHome.events.onEvents(status, payload, url);
};



//synchronize with Gigaset elements cloud
function synchronize(alarm) {
	// skip when it is not called by the dedicated alarm
	if (alarm === undefined || alarm.name == "myhome.synchronization") {
		// synchronize again after 1 minute
		chrome.alarms.create("myhome.synchronization", {delayInMinutes: 1});

		// create url to synchronize events
		var url = gigaset.events.last(myHome.settings.syncEventsLimit);

		// download latest events from the cloud
		gigaset.request.get(url, myHome.onEvents);
	}
}


document.addEventListener("DOMContentLoaded", function() {
	
	// register callback to synchronize extension with the Gigaset elements cloud
	chrome.alarms.onAlarm.addListener(synchronize);
	
	// synchronize extension with the cloud
	synchronize();
});