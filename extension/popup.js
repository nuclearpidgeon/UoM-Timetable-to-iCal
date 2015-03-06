// add event listener for incoming messages from the contentscript
chrome.runtime.onMessage.addListener(
	function(request, sender, sendResponse) {
		if (request.greeting == "pageData") {
			// content script has sent through class and subject counts
			document.getElementById("classCount").innerHTML=request.classCount.toString();
			document.getElementById("subjectCount").innerHTML=request.subjectCount.toString();
			sendResponse({farewell: "goodbye"});
		}
	}
);

var eventListener;

document.addEventListener('DOMContentLoaded', function() {
	// add script trigger to page button
	eventListener = document.getElementById("scriptStarter").addEventListener('click',startScript);
	$("#dateSourceFields").find('input[name="dateSource"]').on('change', function() {
		if ($('#dateSourceFields input[name="dateSource"]:checked').val() == "custom") {
			$('#dateFields').removeAttr("disabled");
		} else {
			$('#dateFields').attr("disabled", "disabled");
		}
	});
	// run page script
	chrome.tabs.executeScript(null, {file: "libs/jquery-2.1.1.min.js"});
	chrome.tabs.executeScript(null, {file: "libs/ics.deps.min.js"});
	chrome.tabs.executeScript(null, {file: "libs/ics.js"});
	chrome.tabs.executeScript(null, {file: "contentscript.js"});

	getSemesterDates();
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

var getSemesterDates = function() {
	var pageStatus = document.getElementById("semesterDatesFetchStatus");
	pageStatus.innerText = "Attempting to fetch semester dates...";
	var xhr = new XMLHttpRequest();
	xhr.open("GET", "http://www.unimelb.edu.au/unisec/PDates/");
}