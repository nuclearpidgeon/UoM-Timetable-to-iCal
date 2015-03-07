// add event listener for incoming messages from the contentscript
chrome.runtime.onMessage.addListener(
	function(request, sender, sendResponse) {
		if (request.greeting == "pageData") {
			// content script has sent through class and subject info
			// process subjects
			var subjectCountElem = $('#subjectCount');
			if (request.subjectMap) {
				var subjectListString = "<ul>";
				// iterate over subjects
				for (var subjectCode in request.subjectMap ) {
					// check to see if we're looking at a Object property or a subjectMap property
					if (request.subjectMap.hasOwnProperty(subjectCode)) {
						subjectListString+="<li>"+subjectCode+": "+request.subjectMap[subjectCode]+"</li>";
					}
				}
				subjectListString += "</ul>";
				subjectCountElem.after(subjectListString);
			}
			subjectCountElem.find("span").text(request.subjectCount.toString());
			
			// process classes
			$("#classCount span").text(request.classCount.toString());
			// done
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
			$('#semesterDates').attr("disabled", "disabled");
			$('#dateFields').removeAttr("disabled");
		} else {
			$('#dateFields').attr("disabled", "disabled");
			$('#semesterDates').removeAttr("disabled");
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
	pageStatus.innerHTML = "<p>Attempting to fetch semester dates...</p>";
	var results = $('<div id=results></div>');
	results.load("http://www.unimelb.edu.au/unisec/PDates/ #content", "", function() {
		//pageStatus.innerHTML = results.html();
		var dates = [];
		results.find('table td:contains("Semester")').parent().each(function() {
			var daterange = $(this).find('td')[0].innerText;
			var semester = $(this).find('td')[1].innerText;
			dates.push({"semester":semester,"daterange":daterange});
		});
		console.log(dates);
		var resultString='<select id="semesterDates">';
		for (var i = 0; i < dates.length; i++ ) {
			console.log("Found semester: "+JSON.stringify(dates[i]));
			resultString += "<option value=\""+dates[i]["daterange"]+"\" >";
			resultString += dates[i]["semester"];
			resultString += "</option>";
		};
		resultString += "</select>";
		pageStatus.innerHTML = resultString;
	});

}