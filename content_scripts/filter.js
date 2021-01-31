document.body.style.border = "5px solid red";
var jq = jQuery.noConflict();
function addBorders(){
	jq(`div.profile-question`).css('border', '3px solid blue')
}

function listenForQuestionListUpdates(){
	// Thanks to https://stackoverflow.com/a/42805882/1541186 for the approach here
	var target = document.querySelector('div.profile-questions');
	var observer = new MutationObserver(function(mutations) {
		addBorders();
	});
	var config = { childList: true};
	observer.observe(target, config);
}

function addObserverToQuestionList() {
	// Thanks to https://stackoverflow.com/a/40418394/1541186 for the approach
	var questionList = document.querySelector("div.profile-questions");
	if(!questionList) {
		//The node we need does not exist yet.
		//Wait 2s and try again
		//Note that the current design has this script active on all okcupid.com pages,
		//not just the questions page, as I can't detect the questions page being up if
		//it was launched via okcupid internal links.
		//See https://stackoverflow.com/questions/20865581/chrome-extension-content-script-not-loaded-until-page-is-refreshed
		window.setTimeout(addObserverToQuestionList,2000);
		return;
	}
	listenForQuestionListUpdates();
	addBorders();
}

addObserverToQuestionList();
