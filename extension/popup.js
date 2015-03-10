// declare variables
var uniPDatesURL = "http://www.unimelb.edu.au/unisec/PDates/";

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
			sendResponse({farewell: "Popup successfully retrieved page data"});
		}
	}
);


document.addEventListener('DOMContentLoaded', function() {
	// add script trigger to page button
	document.getElementById("scriptStarter").addEventListener('click',startScript);
	
	// date source options logic
	$("#dateSourceFields").find('input[name="dateSource"]').on('change', function() {
		if ($('#dateSourceFields input[name="dateSource"]:checked').val() == "custom") {
			$('#semesterDates').attr("disabled", "disabled");
			$('#dateFields').removeAttr("disabled");
		} else {
			$('#dateFields').attr("disabled", "disabled");
			$('#semesterDates').removeAttr("disabled");
		}
	});
	$('#dateFields').find('input').on('change', function() {
		var sel = $(this);
		validateDateField(sel);
	})
	
	// attach principle dates URL (keeps URL definition in the one place, here)
	$('#principleDatesURL').attr('href', uniPDatesURL);
	
	// run page script
	chrome.tabs.executeScript(null, {file: "libs/jquery-2.1.1.min.js"});
	chrome.tabs.executeScript(null, {file: "libs/ics.deps.min.js"});
	chrome.tabs.executeScript(null, {file: "libs/ics.js"});
	chrome.tabs.executeScript(null, {file: "contentscript.js"});

	// fetch dates from UoM
	getSemesterDates();
});


var startScript = function() {
	console.log("Starting script...");
	
	message = {
		greeting: "makeIcs", 
		weeklyEvents: document.getElementById("weeklyYN").checked,
		startDate: document.getElementById("startDate").value,
		endDate: document.getElementById("endDate").value

	}
	chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
		chrome.tabs.sendMessage(tabs[0].id, message, function(response) {
			console.log(response.farewell);
		});
	});
};

var getSemesterDates = function() {
	var pageStatus = document.getElementById("semesterDatesFetchStatus");
	var results = $('<div id=results></div>');

	pageStatus.innerHTML = "<p class=\"fetching\">Attempting to fetch semester dates...</p>";
	results.load(
		uniPDatesURL + " #content",
		"",
		function(responseText, textStatus, jqXHR) {
			if ( textStatus == "notmodified" || textStatus == "success") {
				// whoohoo we got a page
				// try and find year
				var year = results.find('h2:contains("Principal Dates")').text().match('[0-9]{4}');
				if (typeof(year) == "object") {
					// assume regex matched
					year = year[0];
				}
				else {
					year = new Date().getFullYear().toString()
				}
				// try and find semester dates
				var dates = [];
				var datesTable = results.find('table')

				var getData = function(i, e) {
					var dateRange = sanitizeDateRange($(e).find('td')[0].innerText, year);
					var semester = $(e).find('td')[1].innerText;
					dates.push({"semester":semester,"dateRange":dateRange});
				};

				datesTable.find('td:contains("Semester")').parent().each(getData);
				datesTable.find('td:contains("Term")').parent().each(getData);
				var resultString = "";
				if (dates.length > 1) {
					resultString = '<p class="success">Successfully retrieved '+dates.length.toString()+' date sets from UoM</p>';
					resultString +='<select id="semesterDates">';
					for (var i = 0; i < dates.length; i++ ) {
						console.log("Found semester: "+JSON.stringify(dates[i]));
						resultString += "<option value=\""+dates[i]["dateRange"]+"\" >";
						resultString += dates[i]["semester"];
						resultString += "</option>";
					};
					//console.log(dates);
					resultString += "</select>";
					pageStatus.innerHTML = resultString;
					// update date fields
					updateFetchedDate();
					// set event handler for future updates on selection change
					$('#semesterDates').on('change', updateFetchedDate);

				} else {
					// must not have found any dates
					pageStatus.innerHTML = '<p class="notfound">Could not find any dates on the UoM principle dates pages. Please enter dates manually below</p>';
				}
			} else {
				console.log("Error fetching dates from "+uniPDatesURL);
				console.log("Response text: "+responseText);
				console.log("Response status: "+textStatus);
				pageStatus.innerHTML = '<p class="error">There was an error retrieving dates from UoM. Please enter dates manually below</p>';
			}
	});
}

var sanitizeDateRange = function(dateRange, year) {
	var sanitize = function(string, delimiter) {
		return string.split(delimiter).map(function(splitStr){return splitStr.trim()+" "+year}).join(',');
	}
	if (dateRange.indexOf(' to ') > -1) {
		// 'to' is the delimiter, swap to comma
		return sanitize(dateRange,' to ');
	} else {
		// something's funky
		console.log("Can't find a ' to ' divider in date range '"+dateRange+"'... trying to find non-alphanumeric divider character");
		for (var i=0; i<dateRange.length; i++)
		{
			//console.log("char ["+dateRange[i]+"] code #"+dateRange.charCodeAt(i));
			if (dateRange.charCodeAt(i) > 255) {
				console.log("Assuming character '"+dateRange[i]+"' at position "+i+" is the divider (character code "+dateRange.charCodeAt(i).toString()+")");
				return sanitize(dateRange, dateRange[i]);
			}
		}
		console.log("Could not find a divider. ABANDON SHIP (returning unsplit date)");
		return dateRange;
	}
}

var validateDateField = function(sel) {
	console.log('validating');
	console.log(sel);
	var date = sel.val();
	if ( isValidDate ( new Date(date) ) ) {
		sel.removeClass('error').addClass('success');
	} else {
		sel.removeClass('success').addClass('error');
	}
}

var isValidDate = function (d) {
	if ( Object.prototype.toString.call(d) !== "[object Date]" ) return false;
	return !isNaN(d.getTime());
}

var updateFetchedDate = function() {
	var dates = $('#semesterDates :selected').val().split(',');
	var startDate = dates[0];
	var startDateSel = $('#startDate');
	var endDate = dates[1];
	var endDateSel = $('#endDate');

	startDateSel.val(startDate);
	validateDateField(startDateSel);
	endDateSel.val(endDate);
	validateDateField(endDateSel);
}