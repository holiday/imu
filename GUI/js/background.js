chrome.app.runtime.onLaunched.addListener(function() {

	chrome.app.window.create('index.html', {
		'bounds': {
			'width': 870,
			'height': 830
		}
	});
});