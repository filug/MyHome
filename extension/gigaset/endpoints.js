var gigaset = gigaset || {};
gigaset.events = {};

// get last events from the cloud
gigaset.events.last = function(limit) {
	// by default last 10 events are requested
	if (limit === undefined) {
		return "https://api.gigaset-elements.com/api/v2/me/events";
	} else {
		return "https://api.gigaset-elements.com/api/v2/me/events?limit=" + limit;
	};
};


gigaset.events.inTimeRange = function(from, to, limit) {
	// by default download events up to now
	if (to === undefined) {
		to = Date.now();
	};
	
	// if from is negative, calculate real timestamp value
	if (from < 0) {
		from = to + from;
	};
	
	// 
	if (limit === undefined) {
		return gigaset.events.get() + "?from_ts=" + from + "&to_ts=" + to;
	} else {
		return gigaset.events.get() + "?from_ts=" + from + "&to_ts=" + to + "&limit=" + limit;;
	};
};

// information about system health
gigaset.health = function() {
	return "https://api.gigaset-elements.com/api/v2/me/health";
};


// Gigaset elements cameras
gigaset.cameras = {};

//information about cameras
gigaset.cameras.info = function() {
	return "https://api.gigaset-elements.com/api/v1/me/cameras";
};


// Gigaset elements basestation & sensors
gigaset.basestations = {};

gigaset.basestations.info = function() {
	return "https://api.gigaset-elements.com/api/v1/me/basestations";
};
