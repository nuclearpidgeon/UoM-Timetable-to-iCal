chrome.runtime.onMessage.addListener(
	function(request, sender, sendResponse) {
		if (request.greeting == "pageData") {
			document.getElementById("classCount").innerHTML=request.classCount.toString();
			document.getElementById("subjectCount").innerHTML=request.subjectCount.toString();
			sendResponse({farewell: "goodbye"});
		}
	}
);

var eventListener;

document.addEventListener('DOMContentLoaded', function() {
	eventListener = document.getElementById("scriptStarter").addEventListener('click',startScript);
	chrome.tabs.executeScript(null, {file: "libs/jquery-2.1.1.min.js"});
	chrome.tabs.executeScript(null, {file: "libs/ics.deps.min.js"});
	chrome.tabs.executeScript(null, {file: "libs/ics.js"});
	chrome.tabs.executeScript(null, {file: "contentscript.js"});
});


var startScript = function() {
	console.log("Starting script...");
	console.log(eventListener);
	message = {
		greeting: "makeIcs", 
		weeklyEvents: document.getElementById("weeklyYN").checked
	}
	chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
		chrome.tabs.sendMessage(tabs[0].id, message, function(response) {
			console.log(response.farewell);
		});
	});
};