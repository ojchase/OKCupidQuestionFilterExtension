(function() {
if (window.hasRunOKCupidQuestionFilterExtensionFilter) {
	return;
}
window.hasRunOKCupidQuestionFilterExtensionFilter = true;
  
document.body.style.border = "5px solid red";
console.log("Script is running");
var jq = jQuery.noConflict();
jq(document).ready(doStuff);

function doStuff(){
	entry("doStuff");
	
	const jqElement = jq('#root');
	waitForElementToExist(jqElement, "main")
		.then((result) => {
			return waitForElementToExist(result, '.page-section');
		})
		.then((result) => {
			return waitForElementToExist(result, '.questions');
		})
		.then((result) => {
			return waitForElementToExist(result, '.profile-questions-main');
		})
		.then((result) => {
			return waitForElementToExist(result, '.profile-questions-column--filters');
		})
		.then((result) => {
			return waitForElementToExist(result, '.profile-questions-sidebar');
		})
		.then((result) => {
			return waitForElementToExist(result, '.profile-questions-filters');
		})
		.then((result) => {
			return waitForElementToExist(result, '.profile-questions-filters-inner');
		})
		.then((result) => {
			console.log("Promise worked");
			console.log(result);
		})
		.catch((e) => {
			console.log("Promise timed out"); 
			console.log(e);
		});
	exit("doStuff");
}

function getCurrentChildIfPresent(existingJqueryObject, desiredChildElementSelector){
	let result;
					//console.log("about to log element");
					//listJqueryItems(existingJqueryObject);
					//console.log("about to log all children");
					//existingJqueryObject.children().each((index, child) => {
					//	console.log(child);
					//});
					//console.log("about to log children that match selector");
					//existingJqueryObject.children(desiredChildElementSelector).each((index, child) => {
					//	console.log(child);
					//});
	let matchingChildren = existingJqueryObject.children(desiredChildElementSelector);
	if(matchingChildren.length > 0){
		console.log(matchingChildren.first());
		return matchingChildren.first();
	}
	return null;
}

// Returns promise<Jquery>
function waitForElementToExist(existingJqueryObject, desiredChildElementSelector) {
	entry("waitForElementToExist");
	// https://blog.frankmtaylor.com/2017/06/16/promising-a-mutation-using-mutationobserver-and-promises-together/
	const rejectTime = 30000;
	let result = getCurrentChildIfPresent(existingJqueryObject, desiredChildElementSelector);
	if(result){
		exit("waitForElementToExist");
		return Promise.resolve(result);
	}
	exit("waitForElementToExist");
	return new Promise((resolve,reject) => {
		entry("New promise");
		//if exists, resolve
		let hasChanged = false;
		const observerConfig = {
			childList: true,
			subtree: true,
			attributes: true,
			characterData: true
		};       
		const observer = new MutationObserver((mutations) => {
			entry("ObservingMutations");
			mutations.forEach((mutation) => {
				mutation.addedNodes.forEach((addedNode) => {
					console.log(`Found a new element! ${addedNode}`);
					console.dir(addedNode);
				});
				mutation.removedNodes.forEach((removedNode) => {
					console.log(`Found a removed element! ${removedNode}`);
					console.dir(removedNode);
				});
				result = getCurrentChildIfPresent(existingJqueryObject, desiredChildElementSelector);
				//if (mutation.ELEMENT_NAME == desiredChildElementSelector) {
				if (result) {
					hasChanged = true;
					observer.disconnect();
					resolve(result);
				}
			});
			exit("ObservingMutations");
		});
		
		window.setTimeout(()=>{
			if (!hasChanged) {
				reject("Yikes");
			}
		},rejectTime);
		//existingJqueryObject = jq('main');
		existingJqueryObject.each( (index, domObject) => {
			entry("Observing domObject");
			console.log(domObject);
			existingJqueryObject.children().each((index, child) => {console.log(child)});
			observer.observe(domObject, observerConfig);
			exit("Observing domObject");
		});
		//observer.observe(existingElement, observerConfig);
		exit("New promise");
	});
}

function listJqueryItems(jqSelector){
	entry("listJqueryItems");
	jq(jqSelector).each((index, child) => {console.log(child)});
	exit("listJqueryItems");
}

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


})();
