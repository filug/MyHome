// My Home settings
var myHome = myHome || {};
myHome.notifications = {};


/**
 * New events handler.
 * 
 * Show notification if needed.
 */
myHome.notifications.onNewEvents = function(request, sender, response) {

	if (request.name != "myHome.events.new") {
		return
	}
	
	// extract new events from the notification 
	var counter = request.newEvents.count;
	
	// list of events which should be presented to the user
	var notifyAbout = [];
	
	// find how many new events from NOT blacklisted sensors we have
	chrome.storage.local.get("notify_blacklist_id", function(storage) {
		var blacklist = storage.notify_blacklist_id || [];
	
		// extract all new events
		var events = request.newEvents.events;
		
		// check each received event
		for (var i = 0; i < counter; i++) {
			// extract event
			var event = events[i];
			
			try {
				// source of the event (sensor) id
				var id = event.o.id;
				var type = event.type;
				
				// notification item
				var item = {
					// time of event as a title of item
					title: (new Date(parseInt(event.ts))).toLocaleTimeString()
				};
				
				// customization for different types of events
				switch (type) {
				case "homecoming":
					// for homecoming, friendly name of sensor (always motion sensor) is not available
					item.message = type;
					break;

				default:
					if( event.o.hasOwnProperty("friendly_name") ) {
						item.message = event.type + " (" + event.o.friendly_name + ")";	
					} else {
						item.message = event.type + " (" + event.o.id + ")";
					}
					break;
				}
				
				// check if this sensor is blacklisted or not
				if( blacklist.indexOf(id) >= 0 ) {
					console.debug("Element %s is blacklisted", id);
				} else {
					notifyAbout.push(item);
				};
			} catch (e) {
				console.error(event);
				console.error(e);
			};
		}

		// if there is something what should be displayed
		if (notifyAbout.length > 0) {			
			// create notification details 
			var popup = {
					type: "list",
					title: "My Home",
					message: notifyAbout.length + " events",
					contextMessage: notifyAbout.length + " events",
					iconUrl: myHome.icons.getNotificationIcon(),
					items: notifyAbout
			};
				
			// show notification
			chrome.notifications.create("MyHome", popup);
		}
	});
};

/**
 * Notification popup is closed
 */
myHome.notifications.onClosed = function(notificationId, byUser) {
	// notification closed by the user 
	if (byUser) {
		// clear "unread events" counter
		chrome.storage.local.set({"unread_events": 0});
	}
};

/**
 * Notification popup was clicked by the user.
 */
myHome.notifications.onClicked= function(notificationId) {
	// notification clicked by the user is not closed,
	// here such behavior is implemented

	// clicked by user, so there is no new events
	chrome.storage.local.set({"unread_events": 0});
	
	// close notification popup
	chrome.notifications.clear(notificationId);
};


// new events callback
chrome.runtime.onMessage.addListener(myHome.notifications.onNewEvents);

// reactions for notifications
chrome.notifications.onClosed.addListener(myHome.notifications.onClosed);
chrome.notifications.onClicked.addListener(myHome.notifications.onClicked);
