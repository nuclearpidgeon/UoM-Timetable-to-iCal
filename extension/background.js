
// Update the declarative rules on install or upgrade.
chrome.runtime.onInstalled.addListener(function() {
	chrome.declarativeContent.onPageChanged.removeRules(undefined, function() {
		chrome.declarativeContent.onPageChanged.addRules([{
			conditions: [
				// Match on timetable URL
				new chrome.declarativeContent.PageStateMatcher({
					pageUrl: {urlContains: "prod.ss.unimelb.edu.au/student/SM/StudentTtable10.aspx"}
				})
			],
			// Show the page action on this condition
			actions: [new chrome.declarativeContent.ShowPageAction() ]
		}]);
	});
});