var classSelector = ".cssClassContainer";

var message = {
	greeting: "pageData",
	classCount: document.querySelectorAll(classSelector).length
};

chrome.runtime.sendMessage(message, function(response) {
	console.log(response.farewell);
});

var makeIcs = function() {
	var startingDate = new Date("28 July, 2014");
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
		console.log("DAY "+dayIndex);
		var weekDay = new Date(startingDate.getTime() + dayIndex*(24 * 60 * 60 * 1000));
		$(classSelector, this).each(function(index){
			//iterating over each subject in a weekday
			var subjectCode = $(".cssTtableHeaderPanel", this).text().replace(/[\n\t\r]/g,"");
			var name = $(".cssTtableClsSlotWhat", this).text().replace(/[\n\t\r]/g,"");	
			var start = dateFormat($(".cssHiddenStartTm", this).val(),weekDay);
			var end = dateFormat($(".cssHiddenEndTm", this).val(),weekDay);
			var location = $(".cssTtableClsSlotWhere", this).text();
			console.log(subjectCode + " " + name + " " + start + " -> " + end + " @ " + location);
			cal.addEvent(subjectCode+" "+name, name, location, start, end);
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