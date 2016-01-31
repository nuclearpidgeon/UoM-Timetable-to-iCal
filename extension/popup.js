// constants
//==========

// URL to fetch Semester dates from
var uniPDatesURL = "http://www.unimelb.edu.au/unisec/PDates/acadcale.html";

// plugin setup
//=============

// add event listener for incoming messages from the contentscript
chrome.runtime.onMessage.addListener(
	function(request, sender, sendResponse) {
		if (request.greeting == "pageData") {
			// content script has sent through class and subject info.
			var subjectCountElem = $('#subjectCount');
			// process subjects
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

// page setup
//===========

document.addEventListener('DOMContentLoaded', function() {
	// add script trigger to page button
	$("#timetableScriptTrigger").off().on('click',startScript);
	
	// date source options logic
	$("#dateSourceFields").find('input[name="dateSource"]').on('change', function() {
		var dateSource = $('#dateSourceFields input[name="dateSource"]:checked').val();
		if (dateSource == "custom") {
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

// function for communicating with contentscript.js and triggering calendar file creation
var startScript = function() {
	console.log("Starting script...");
	
	message = {
		greeting: "makeIcs", 
		weeklyEvents: document.getElementById("weeklyYN").checked,
		startDate: document.getElementById("startDate").value,
		endDate: document.getElementById("endDate").value
	};

	chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
		chrome.tabs.sendMessage(tabs[0].id, message, function(response) {
			console.log(response.farewell);
		});
	});
};

// function for fetching dates from the UoM principle dates calendar
var getSemesterDates = function() {
	var pageStatus = document.getElementById("semesterDatesFetchStatus");
	var results = $('<div id=results></div>');

	pageStatus.innerHTML = '<p class="fetching">Attempting to fetch semester dates...</p>';
	results.load(
		uniPDatesURL + " #content",
		"",
		function(responseText, textStatus, jqXHR) {
			if (textStatus == "notmodified" || textStatus == "success") {
				// whoohoo we got a page
				// search for calendar years
				var years = results.find('#content').find(':contains("Academic Calendar for")');

				// try and find semester dates for each year
				var dates = [];
				
				years.each(function(index, element) {
					// iterating over each potential calendar year
					var yearElem = $(element);
					// try and match a year #
					var yearText = yearElem.text();
					var year = yearText.match(/[0-9]{4}/);
					if (year !== null) {
						// regex matched
						year = year[0];
						console.log("Found description for year " + year + " in loop iteration #" + index.toString());
					}
					else {
						// year = new Date().getFullYear().toString()
						console.log("Could not match a year # out of Academic Calendar string: " + yearText);
						return;
					}

					// search the DOM ancestry of the year match element, to find the
					// parent element closest to the root #content node. (The dates are
					// stored in a <table> element that sits at this DOM tree level)
					var current = element;
					var parent = element.parentElement;
					var foundContentNode = false;
					while(parent != null) {
						if (parent.id == "content") {
							foundContentNode = true;
							break;
						}
						else {
							// keep looking
							current = parent;
							parent = parent.parentElement;
						}
					}
					if (foundContentNode == false) {
						console.log("Error trying to find table of dates for year " + year + " - could not find #content node");
						return;
					}

					// look for a <table> sibling element that comes after the matched node
					var sibling = current.nextSibling;
					var foundTableNode = false;
					while(sibling != null) {
						if (sibling.nodeName == "TABLE") {
							foundTableNode = true;
							break;
						}
						else {
							// keep looking...
							sibling = sibling.nextSibling;
						}
					}
					if (foundTableNode == false) {
						console.log("Error trying to find table of dates for year " + year + " - could not find <table> element");
						return;
					}

					// getData out of the table
					var datesTable = $(sibling);
					var getData = function(i, e) {
						var dateRange = sanitizeDateRange($(e).find('td')[0].innerText, year);
						var semesterDescription = $(e).find('td')[1].innerText;
						dates.push({
							"year": year,
							"semester": semesterDescription,
							"dateRange": dateRange
						});
					};
					datesTable.find('td:contains("Semester")').parent().each(getData);
					datesTable.find('td:contains("Term")').parent().each(getData);

				});

				var resultString = "";
				if (dates.length > 1) {
					resultString = '<p class="success">Successfully retrieved '+dates.length.toString()+' date sets from UoM</p>';
					resultString +='<select id="semesterDates">';
					for (var i = 0; i < dates.length; i++ ) {
						var date = dates[i];
						console.log("Found semester: "+JSON.stringify(date));
						resultString += "<option value=\""+date["dateRange"]+"\" >";
						resultString += date["year"] + ": " + date["semester"];
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

// function for splitting fuzzy date ranges from the UoM page into seperate, distinct dates
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

// event handler for validating manually entered dates
var validateDateField = function(dateSel, validSel) {
	console.log('validating');
	console.log(dateSel);
	var date = new Date( dateSel.val() );
	validSel.text(date.toDateString())
	if ( isValidDate ( date ) ) {
		dateSel.removeClass('error').addClass('success');
	} else {
		dateSel.removeClass('success').addClass('error');
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
	var startDateValidSel = $('#startDateValidity');
	var endDate = dates[1];
	var endDateSel = $('#endDate');
	var endDateValidSel = $('#endDateValidity');

	startDateSel.val(startDate);
	validateDateField(startDateSel, startDateValidSel);
	endDateSel.val(endDate);
	validateDateField(endDateSel, endDateValidSel);
}