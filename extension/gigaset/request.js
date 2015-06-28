var gigaset = gigaset || {};
gigaset.request = gigaset.request || {};

gigaset.request.get = gigaset.request.get || function(url, callback) {

	// send request to the cloud
	var request = new XMLHttpRequest();
	request.open("GET", url, true);
	request.withCredentials = true;
	request.onreadystatechange = function() {
		if (request.readyState == request.DONE) {
			// read status
			var status = request.status;
			
			console.debug("[" + status + "] GET " + url);
			
			// analyze payload
			var payload = undefined;
			try {
				payload = JSON.parse(request.responseText);
			} catch (e) {
				console.error(e);
			}
				
			// forward response to the callback
			try {
				callback(status, payload, url);
			} catch (e) {
				console.error(e);
			}

		}
	};

	// send GET request to the cloud
	request.send();
};
