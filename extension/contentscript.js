console.log("contentscript.js invoked");

// declare CSS selectors
var classSelector = ".cssClassContainer";
var daySelector = ".cssTtbleColDay";
var subjectSelector = ".cssTtableSspNavContainer"

// build subject code -> subject name dictionary
var subjectMap = {};
console.log("Building subject code->name map");
$(".cssTtableSspNavContainer").each(function() {
	var cc = $(".cssTtableSspNavMasterSpkInfo2 span", this).text();
	var name =  $(".cssTtableSspNavMasterSpkInfo3 div:first", this).text().trim();
	console.log(cc+" -> "+name);
	subjectMap[cc]=name;
});

// gather page data
var message = {
	"greeting": "pageData",
	"classCount": document.querySelectorAll(classSelector).length,
	"subjectCount": document.querySelectorAll(subjectSelector).length,
	"subjectMap": subjectMap
};

// send page data to the popup
chrome.runtime.sendMessage(message, function(response) {
	console.log(response.farewell);
});

var makeIcs = function(startDate, endDate, weekEvents) {
	// parameter defaults
	if (weekEvents !== true) weekEvents = false;

	// set up semester boundaries
	var startingDate = new Date(startDate);
	var endingDate = new Date(endDate);

	// Note: Semester break is currently handled quite simply and rigidly.
	//
	// Rather than properly exluding all events within the whole break window,
	// the code relies on being passed the Monday date for a single Monday ->
	// Sunday week that will be excluded. This can end up missing a day or two
	// (e.g. the Semester 1 break starts on Good Friday, but then going
	// through till the Sunday the week after that), but is 'good enough' for
	// now until the break handling is refactored and improved.
	//
	// 2018 sem1 notes: the break is actually Friday 30 March to Sunday 8 April,
	// but 2 April is used for reasons listed above.
	var breakStartDate = new Date("24 September, 2018");

	var dateFormat = function(rawtime, day) {
		// date fields on the timetable page don't match dateSting format for JavaScript
		// need to add a space before am/pm and seconds field
		// rawtime is attached to the given day (date) and returned as a string
		var slicePosition = rawtime.length - 2;
		var newdate = rawtime.slice(0,slicePosition)+':00 '+ rawtime.slice(slicePosition,rawtime.length);
		return day.toDateString() + " " + newdate;
	};

	// initialise icalendar library
	var cal = ics();

	// If there is a Sunday in the timetable, it appears first.
	// It's easier to assume Monday is the first day of the week
	// so this lookup table is used to deal with the day order.

	var daysIndex = {
		"Monday": 0,
		"Tuesday": 1,
		"Wednesday": 2,
		"Thursday": 3,
		"Friday": 4,
		"Saturday": 5,
		"Sunday": 6
	};

	$(daySelector).each(function(index, element){
		// iterating over each weekday present in the timetable

		// find out what day we're iterating over
		var day = $(element).find(".cssTtbleColHeaderInner").text().trim();
		var dayIndex = daysIndex[day];

		if (dayIndex == undefined) {
			// something went wrong
			console.log("Error! Invalid day '"+day+"' found in timetable. Skipping");
			return;
		}

		console.log("Processing day #"+dayIndex+" ("+day+")");

		// set up variable for the day of the week
		var weekDay = new Date(startingDate.getTime() + dayIndex*(24 * 60 * 60 * 1000));

		// set up variable for the mid-semester break offset (used for exlusion)
		var exludeDay = new Date(breakStartDate.getTime() + dayIndex*(24 * 60 * 60 * 1000));

		$(classSelector, this).each(function(index){
			// iterating over each subject in a weekday
			// collect data
			var subjectCode = $(".cssTtableHeaderPanel", this).text().replace(/[\n\t\r]/g,"");
			// add subject name if found
			if (subjectMap[subjectCode]!==undefined) subjectCode += " "+subjectMap[subjectCode];
			var name = $(".cssTtableClsSlotWhat", this).text().trim();
			var start = dateFormat($(".cssHiddenStartTm", this).val(),weekDay);
			var end = dateFormat($(".cssHiddenEndTm", this).val(),weekDay);
			var location = $(".cssTtableClsSlotWhere", this).text();
			// determine exlusion date
			var exludeDate = dateFormat($(".cssHiddenStartTm", this).val(),exludeDay);
			// log and process into event
			console.log(subjectCode + " " + name + " @ " + location + " \n" + start + " -> " + end + " except "+exludeDate);
			cal.addEvent(subjectCode+" "+name, name, location, start, end, endingDate, exludeDate);
		});
	});

	if (weekEvents) {
		// create an event for each week #
		var passedBreak = false;

		for(var weeknum=1;weeknum<=13;weeknum++) {
			// break week doesn't count as a week
			// need to adjust if we're past it
			var actualWeekNum = weeknum;
			if (passedBreak) {
				actualWeekNum--;
			}

			var eventName = "Week #"+actualWeekNum.toString();
			var eventDescription = "University calendar week "+actualWeekNum.toString()

			var weekStartDate = new Date(startingDate.toDateString());
			weekStartDate.setDate(weekStartDate.getDate()+7*(weeknum-1));

			if (weekStartDate.toDateString() == breakStartDate.toDateString()) {
				//this week is the break week
				passedBreak = true;
				eventName = "Mid-semester break";
				eventDescription = "University non-teaching period";
			}

			var weekEndDate = new Date(weekStartDate.toDateString());
			weekEndDate.setDate(weekStartDate.getDate()+5);

			cal.addEvent(eventName, eventDescription, "", weekStartDate, weekEndDate);
		}
	}

	// download ics
	cal.download("yourCal");
};


// attach listener from popup
var attached;

if ( typeof(attached) === 'undefined' ) {
	attached = true;
	chrome.runtime.onMessage.addListener(
		function(request, sender, sendResponse) {
			console.log("got message from popup");
			if (request.greeting == "makeIcs") {
				makeIcs(
					request.startDate,
					request.endDate,
					request.weeklyEvents
				);
				sendResponse({farewell: "executed makeIcs()"});
			}
		}
	);
}