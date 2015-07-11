var myHome = myHome || {};

myHome.icons = {};

// set My Home extension icon
myHome.icons.setExtensionIcon = function(color) {
	
	// path to "icons" directory
	var path = chrome.extension.getURL("icons");
	
	// default icons
	var icons = {
			"19": (path + "/home/19/" + color + ".png"),
			"38": (path + "/home/38/" + color + ".png"),
	};
	
	try {
		chrome.browserAction.setIcon({path: icons});
	} catch (e) {
		console.error(e);
	}
};

myHome.icons.getNotificationIcon = function() {
	return chrome.extension.getURL("icons") + "/home/48/green.png";
};
