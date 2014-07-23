var startingDate = "28-7-2014";
var dateFormat = function(rawdate, dayOffset) {
	//date fields on page don't match dateSting format for JavaScript
	//need to add a space before am/pm and seconds field
	var slicePosition = rawdate.length - 2;
	var newdate = rawdate.slice(0,slicePosition)+':00 '+ rawdate.slice(slicePosition,rawdate.length);
	return startingDate + " " + newdate;
};

var cal = ics();

$(".cssTtbleColDay").each(function(dayIndex){
	console.log("DAY "+dayIndex);
	$('.cssClassContainer', this).each(function(index){
		var subjectCode = $(".cssTtableHeaderPanel", this).text().replace(/[\n\t\r]/g,"");
		var name = $(".cssTtableClsSlotWhat", this).text().replace(/[\n\t\r]/g,"");	
		var start = dateFormat($(".cssHiddenStartTm", this).val());
		var end = dateFormat($(".cssHiddenEndTm", this).val());
		console.log(subjectCode + " " + name + " " + start + " -> " + end);
	});
});

alert(JSON.stringify(timetable));

// stuff from jsfiddle
// var date = new Date( "July 28, 2014" );
// document.write( date.toString() );
// var curr_date = date.getDate();
// var curr_month = date.getMonth() + 1; //Months are zero based
// var curr_year = date.getFullYear();
// alert(curr_date + "-" + curr_month + "-" + curr_year);
