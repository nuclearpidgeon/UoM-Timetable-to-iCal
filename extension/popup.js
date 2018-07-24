// constants
//==========

// URL to fetch Semester dates from
var uniPDatesURL = "http://www.unimelb.edu.au/dates";

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
	$('#startDate').on('change', function() {
		var sel = $(this);
		validateDateField(sel, $('#startDateValidity'));
	});
	$('#endDate').on('change', function() {
		var sel = $(this);
		validateDateField(sel, $('#endDateValidity'));
	});
	
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
	// use jquery's .load() to get the HTML from the unimelb principal dates
	// page parsed and inserted into results element, so that it can be locally
	// searched with jQuery
	results.load(
		uniPDatesURL + " #main-content",
		"",
		function(responseText, textStatus, jqXHR) {
			if (textStatus == "notmodified" || textStatus == "success") {
				// whoohoo we got a page

				// As of August 2017:
				//
				// * The dates page is now 'unimelb.edu.au/dates'
				// * This page returns the full set of dates for the CURRENT YEAR
				// * Sets of dates for future/past years are accessible through
				//   navigation links at the top of the page
				// * Dates for each year are stored in a single table on each of
				//   these pages.

				var year;

				var useFallbackYear = function(reason) {
					// fall back on current year from Javascipt
					var rightAboutNow = new Date();
					// the funk soul brother
					checkItOutNow = rightAboutNow.getFullYear();
					// the funk soul brother
					year = checkItOutNow;
					console.log("Year detection: " + reason + " - Falling back on current time's year (" + year + ")");
				}

				var $currentYearOnPage = results.find('ul.search-pagination.center li.act');
				if ($currentYearOnPage.length > 0) {
					// use year found on page
					var currentYearOnPage = $currentYearOnPage[0].innerText.trim();
					if (currentYearOnPage.length > 0) {
						year = currentYearOnPage;
						console.log("Year detection: - Found year '" + year + "' on UoM dates page");
					}
					else {
						useFallbackYear('Found blank/empty year on UoM dates page');
					}
				}
				else {
					useFallbackYear("Couldn't find year on UoM dats page");
				}

				// Setup array for holding any found dates
				var foundSemesters = [];

				// Grab the table of dates for the current year
				var datesTable = results.find('table');

				// Setup a function for trying to find dates in a given row
				var getData = function(i, rowElem) {
					var $rowElem = $(rowElem);

					var dateRangeText = $rowElem.find('td')[0].innerText;
					var sanitizedDateRange = sanitizeDateRangeText(dateRangeText, year);
					var semesterDescription = $rowElem.find('td')[1].innerText.trim();

					foundSemesters.push({
						"year": year,
						"semester": semesterDescription,
						"dateRange": sanitizedDateRange
					});
				};

				// Apply this function to any row that has a td cell matching
				// the keywords 'Semester' or 'Term'

				datesTable.find('td:contains("Semester")').parent().each(getData);
				datesTable.find('td:contains("Term")').parent().each(getData);

				// Report information about fetched data to the user

				var resultString = "";
				if (foundSemesters.length > 1) {
					resultString = '<p class="success">Successfully retrieved '+foundSemesters.length.toString()+' date sets from UoM</p>';
					resultString +='<select id="semesterDates">';
					for (var i = 0; i < foundSemesters.length; i++ ) {
						var date = foundSemesters[i];
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
					console.log("Could not find any dates on "+uniPDatesURL);
				}
			} else {
				console.log("Error fetching dates from "+uniPDatesURL);
				console.log("Response text: "+responseText);
				console.log("Response status: "+textStatus);
				pageStatus.innerHTML = '<p class="error">There was an error retrieving dates from UoM. Please enter dates manually below</p>';
			}
	});
}

// sanitizeDateRangeText()
//
// function for splitting fuzzy date ranges from the UoM page into seperate,
// distinct dates
//
// Returns:
//     a string with two sanitized dates that are comma-separated
//
var sanitizeDateRangeText = function(dateRange, year) {
	// Trim a bunch of whitespace first.
	//
	// 'dateRange' is usually the result of calling innerText on a HTML node,
	// which may have a bunch of structure under it or arbitrary whitespace
	// from pretty-printed/indented HTML tags.
	//
	// Because of this, whitespace and newlines are aggressively trimmed, to
	// prevent them from causing issues when the individual dates are later
	// parsed

	// Trim trailing whitespace
	dateRange = dateRange.trim()
	// Replace any newlines with spaces
	dateRange = dateRange.replace(/\r?\n|\r/g, " ")
	// Replace any groups of whitespace with a single space
	dateRange = dateRange.replace(/\s+/g, " ")

	// Setup sanitizer for cleaning up the individual dates that are in
	// a given date range
	var sanitize = function(string, delimiter) {
		return string.split(delimiter)
			.map(function(splitStr) {
				// Trim whitespace and also add the year to the end of the
				// string, as all the dates on the UoM page are scoped by year
				return splitStr.trim() + " " + year
			}).join(',');
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

// event handler for validating date strings by parsing them with Date
//
// dateSel: jQuery selector of field to get date string from
// validSel: jQuery selector of field to write validated date to
//
var validateDateField = function(dateSel, validSel) {
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