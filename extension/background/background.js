// My Home settings
var myHome = myHome || {};

myHome.settings = {
		syncInterval: 1,	// how often (in minutes) we should synchronize with Gigaset elements cloud
};




//synchronize with Gigaset elements cloud
function synchronize(alarm) {
	// skip when it is not called by the dedicated alarm
	if (alarm === undefined || alarm.name == "myhome.synchronization") {
		// synchronize again after 1 minute
		chrome.alarms.create("myhome.synchronization", {delayInMinutes: myHome.settings.syncInterval});
		
		// synchronize events
		myHome.events.sync();
		// synchronize status
		myHome.status.sync();
	}
}


document.addEventListener("DOMContentLoaded", function() {
	
	// register callback to synchronize extension with the Gigaset elements cloud
	chrome.alarms.onAlarm.addListener(synchronize);
	
	// synchronize extension with the cloud
	synchronize();
});