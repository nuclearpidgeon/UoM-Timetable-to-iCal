var icsMSG = "BEGIN:VCALENDAR\nVERSION:2.0\nBEGIN:VEVENT\nUID:me@google.com\nDTSTAMP:20120315T170000Z\nATTENDEE;CN=My Self ;RSVP=TRUE:MAILTO:me@gmail.com\nORGANIZER;CN=Me:MAILTO::me@gmail.com\nDTSTART:" + msgData1 +"\nDTEND:" + msgData2 +"\nLOCATION:" + msgData3 + "\nSUMMARY:Our Meeting Office\nEND:VEVENT\nEND:VCALENDAR";

var timetable = [];

$('#ctl00_Content_ctlTimetableMain_DayGrp .cssClassContainer').each(function(index){
	var entry = {
		subjectCode: $(".cssTtableHeaderPanel", this).text().replace(/[\n\t\r]/g,""),
		name: $(".cssTtableClsSlotWhat", this).text().replace(/[\n\t\r]/g,"")
	}
	timetable.push(entry);
});

alert(JSON.stringify(timetable));

