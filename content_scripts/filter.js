(function() {
if (window.hasRunOKCupidQuestionFilterExtensionFilter) {
	return;
}
window.hasRunOKCupidQuestionFilterExtensionFilter = true;
  
console.log("Script is running");
let currentFilter = undefined;
let currentQuestionsInFilter = undefined;
let currentQuestionsNotInFilter = undefined;

let questionCategoryPromise = browser.runtime.sendMessage({
	"queryType": "GetQuestionCategories"
});
questionCategoryPromise.then(logSuccessResponse).catch(logFailureResponse);
var jq = jQuery.noConflict();
jq(document).ready(() => {manipulatePage(questionCategoryPromise);});

function logSuccessResponse(response){
	console.log("Content script got a response!");
	console.log(response);
	return response;
}
function logFailureResponse(response){
	console.log("Content script got a bad response!");
	console.log(response);
}

function manipulatePage(questionCategoryPromise){
	document.body.style.border = "5px solid red";
	waitForPageToLoad('.page-loading, .isLoading').then(() => {
		listenForQuestionListUpdates();
		createFilterButtons(questionCategoryPromise);
		manipulateQuestionElements();
	}).catch((e) => {
		console.log("It's not loaded!")
		console.log(e);
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
	if(!currentFilter){
		manipulateDefaultBehaviorQuestion(jq(`div.profile-question`));
		return;
	}
	Promise.all([currentQuestionsInFilter, currentQuestionsNotInFilter]).then(function([questionsInCategory, questionsNotInCategory]){
		jq('div.profile-question').each(function(index){
			const thisQuestion = jq(this) // when jq.each is run, it calls the callback and sets the 'this' context when running to the DOM item
			const isLoaded = !thisQuestion.hasClass('isLoading');
			if(!isLoaded){
				manipulateLoadingQuestion(thisQuestion);
				return;
			}
			
			const questionText = thisQuestion.find('h3').text();
			const isUnwantedQuestion = questionsNotInCategory.includes(questionText);
			const isWantedQuestion = questionsInCategory.includes(questionText);
			if(isWantedQuestion){
				manipulateDesiredQuestion(thisQuestion);
			}
			else if(isUnwantedQuestion){
				manipulateUndesiredQuestion(thisQuestion);
			}
			else{ // isUndecidedQuestion
				manipulateUndecidedQuestion(thisQuestion);
			}
		});
	});
}

function manipulateDefaultBehaviorQuestion(questionElement){
	questionElement.show();
	addBorder(questionElement, 'black');
}

function manipulateLoadingQuestion(questionElement){
	questionElement.show();
	addBorder(questionElement, 'green');
}

function manipulateDesiredQuestion(questionElement){
	questionElement.show();
	addBorder(questionElement, 'blue');
}

function manipulateUndesiredQuestion(questionElement){
	questionElement.hide();
}

function manipulateUndecidedQuestion(questionElement){
	questionElement.show();
	addBorder(questionElement, 'red');
	addCategorizationButtons(questionElement);
}

function addBorder(questionElement, color){
	questionElement.css('border', `3px solid ${color}`)
}

function addCategorizationButtons(questionElement){
	const instructions = `Is this a ${currentFilter} question?`;
	const instructionsElement = `<span><h4>${instructions}</h4></span>`;
	
	const showClass = 'showButton';
	const hideClass = 'hideButton';
	const inFilterButton = `<button class="${showClass}"><span>Show</span></button>`;
	const notInFilterButton = `<button class="${hideClass}"><span>Hide</span></button>`;
	
	questionElement.append(instructionsElement);
	questionElement.append(inFilterButton);
	questionElement.append(notInFilterButton);
	
	const inFilterButtonElement = questionElement.children(`.${showClass}`);
	const notInFilterButtonElement = questionElement.children(`.${hideClass}`);
	
	inFilterButtonElement.click(() => {
		questionBelongsInFilter(questionElement);
	});
	notInFilterButtonElement.click(() => {
		questionDoesNotBelongInFilter(questionElement);
	});
}

function questionBelongsInFilter(thisQuestion){
	const questionText = thisQuestion.find('h3').text();
	alert(`This question (${questionText}) will be shown with this filter`);
}

function questionDoesNotBelongInFilter(thisQuestion){
	const questionText = thisQuestion.find('h3').text();
	alert(`This question (${questionText}) will be hidden with this filter`);
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

function createFilterButtons(questionCategoryPromise) {
	questionCategoryPromise.then(function(categories){
		for(const category of categories){
			let newButton = jq('button.profile-questions-filter')
				.not('button.profile-questions-filter--isActive')
				.first()
				.clone();
			newButton.children(`.profile-questions-filter-title`).text(category);
			newButton.children(`.profile-questions-filter-icon`).remove();
			newButton.children(`.profile-questions-filter-count`).text("123");
			newButton.click(() => {
				applyFilter(category);
			});
			newButton.appendTo('div.profile-questions-filters-inner');
		}
	});
}

function applyFilter(category){
	alert(`Applying filter ${category}`);
	currentFilter = category;
	currentQuestionsInFilter = getQuestionsInCategory(category);
	currentQuestionsNotInFilter = getQuestionsNotInCategory(category);
	
	manipulateQuestionElements();
}

function getQuestionsInCategory(category){
	let questionsInCategoryPromise = browser.runtime.sendMessage({
		"queryType": "GetQuestionsInCategory",
		"category": category
	});
	return questionsInCategoryPromise.catch(logFailureResponse).then(logSuccessResponse);
}

function getQuestionsNotInCategory(category){
	let questionsInCategoryPromise = browser.runtime.sendMessage({
		"queryType": "GetQuestionsNotInCategory",
		"category": category
	});
	return questionsInCategoryPromise.catch(logFailureResponse).then(logSuccessResponse);
}


})();
