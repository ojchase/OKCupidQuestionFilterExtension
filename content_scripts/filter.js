(function() {
if (window.hasRunOKCupidQuestionFilterExtensionFilter) {
	return;
}
window.hasRunOKCupidQuestionFilterExtensionFilter = true;
  
console.log("Script is running");
var jq = jQuery.noConflict();
jq(document).ready(manipulatePage);

function manipulatePage(){
	document.body.style.border = "5px solid red";
	waitForPageToLoad('.page-loading, .isLoading').then(() => {
		listenForQuestionListUpdates();
		createFilterButtons();
		manipulateQuestionElements();
	}).catch(() => {
		console.log("It's not loaded!")
	});
}


// Promise
//Note that the current design has this script active on all okcupid.com pages,
//not just the questions page, as I can't detect the questions page being up if
//it was launched via okcupid internal links.
//See https://stackoverflow.com/questions/20865581/chrome-extension-content-script-not-loaded-until-page-is-refreshed
async function waitForPageToLoad(selector){
	return new Promise(async (resolve,reject) => {
		let loaded = false;
		let timedOut = false;
		const timeoutId = window.setTimeout(()=>{
			if(loaded){
				return;
			}
			timedOut = true;
			reject();
		},30000);
		while(!isPageLoaded(selector) && !timedOut){
			await new Promise((resolveSimpleTimeout) => {
				window.setTimeout(() => {
					resolveSimpleTimeout();
				}, 500);
			});
		}
		window.clearTimeout(timeoutId);
		loaded = true;
		resolve();
	});
}

function isPageLoaded(selector){
	return jq(selector).length === 0;
}

function manipulateQuestionElements(){
	addBorders();
}

function addBorders(){
	jq(`div.profile-question`).css('border', '3px solid blue')
}

function listenForQuestionListUpdates(){
	// Thanks to https://stackoverflow.com/a/42805882/1541186 for the approach here
	var target = document.querySelector('div.profile-questions');
	var observer = new MutationObserver(function(mutations) {
		manipulateQuestionElements();
	});
	var config = { childList: true};
	observer.observe(target, config);
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


})();
