(function() {
if (window.hasRunOKCupidQuestionFilterExtensionFilter) {
	return;
}
window.hasRunOKCupidQuestionFilterExtensionFilter = true;
  
document.body.style.border = "5px solid red";
var jq = jQuery.noConflict();
function addBorders(){
	entry("addBorders");
	jq(`div.profile-question`).css('border', '3px solid blue')
	exit("addBorders");
}

function listenForQuestionListUpdates(){
	entry("listenForQuestionListUpdates");
	// Thanks to https://stackoverflow.com/a/42805882/1541186 for the approach here
	var target = document.querySelector('div.profile-questions');
	var observer = new MutationObserver(function(mutations) {
		addBorders();
	});
	var config = { childList: true};
	observer.observe(target, config);
	exit("listenForQuestionListUpdates");
}

function addObserverToQuestionList() {
	entry("addObserverToQuestionList");
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
	createFilterButtons();
	addBorders();
	exit("addObserverToQuestionList");
}

function entry(method){
	console.log(`ENTERED ${method}`);
}

function exit(method){
	console.log(`EXITED ${method}`);
}

function createFilterButtons() {
	let newButton = jq('button.profile-questions-filter')
		.not('button.profile-questions-filter--isActive')
		.first()
		.clone();
	newButton.children(`.profile-questions-filter-title`).text("Test Category Filter");
	newButton.children(`.profile-questions-filter-icon`).remove();
	newButton.children(`.profile-questions-filter-count`).text("123");
	newButton.appendTo('div.profile-questions-filters-inner');
}

addObserverToQuestionList();

})();
