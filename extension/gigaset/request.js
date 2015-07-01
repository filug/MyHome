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
			
			// deliver response only on success
			if (status != 200) {
				console.debug("response not delivered to the callback");
				return;
			}
			
			try {
				// analyze payload
				var payload = JSON.parse(request.responseText);
				// forward response to the callback
				callback(status, payload, url);
			} catch (e) {
				console.error(e);
			}
		}
	};

	// send GET request to the cloud
	request.send();
};
