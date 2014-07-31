var classSelector = ".cssClassContainer";

var message = {
	greeting: "pageData",
	classCount: document.querySelectorAll(classSelector).length
};

chrome.runtime.sendMessage(message, function(response) {
	console.log(response.farewell);
});

var makeIcs = function() {
	//set up semester boundaries
	var startingDate = new Date("28 July, 2014");
	var endingDate = new Date("26 October, 2014");
	var breakStartDate = new Date("29 September, 2014");

	var dateFormat = function(rawtime, day) {
		//date fields on page don't match dateSting format for JavaScript
		//need to add a space before am/pm and seconds field
		var slicePosition = rawtime.length - 2;
		var newdate = rawtime.slice(0,slicePosition)+':00 '+ rawtime.slice(slicePosition,rawtime.length);
		return day.toDateString() + " " + newdate;
	};

	var cal = ics();

	$(".cssTtbleColDay").each(function(dayIndex){
		//iterating over each weekday
		//set up variable for the day of the week
		var weekDay = new Date(startingDate.getTime() + dayIndex*(24 * 60 * 60 * 1000));
		var exludeDay = new Date(breakStartDate.getTime() + dayIndex*(24 * 60 * 60 * 1000));
		console.log("DAY "+dayIndex);
		$(classSelector, this).each(function(index){
			//iterating over each subject in a weekday
			//collect data
			var subjectCode = $(".cssTtableHeaderPanel", this).text().replace(/[\n\t\r]/g,"");
			var name = $(".cssTtableClsSlotWhat", this).text().replace(/[\n\t\r]/g,"");	
			var start = dateFormat($(".cssHiddenStartTm", this).val(),weekDay);
			var end = dateFormat($(".cssHiddenEndTm", this).val(),weekDay);
			var location = $(".cssTtableClsSlotWhere", this).text();
			//determine exlusion date
			var exludeDate = dateFormat($(".cssHiddenStartTm", this).val(),exludeDay);
			//log and process into event
			console.log(subjectCode + " " + name + " @ " + location + " \n" + start + " -> " + end + " except "+exludeDate);
			cal.addEvent(subjectCode+" "+name, name, location, start, end, endingDate, exludeDate);
		});
	});

	cal.download("yourCal.ics");
};

chrome.runtime.onMessage.addListener(
	function(request, sender, sendResponse) {
		if (request.greeting == "makeIcs") {
			makeIcs();
			sendResponse({farewell: "executed makeIcs()"});
		}
	}
);