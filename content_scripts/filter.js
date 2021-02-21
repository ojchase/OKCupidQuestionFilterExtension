(function() {
if (window.hasRunOKCupidQuestionFilterExtensionFilter) {
	return;
}
window.hasRunOKCupidQuestionFilterExtensionFilter = true;
  
console.log("Script is running");
let currentFilter = undefined;
let questions;
let questionCategories;
var jq = jQuery.noConflict();
jq(document).ready(() => {
	manipulatePage();
});

function logSuccessResponse(response){
	console.log("Content script got a response!");
	console.log(response);
	return response;
}
function logFailureResponse(response){
	console.log("Content script got a bad response!");
	console.log(response);
}

function manipulatePage(){
	document.body.style.border = "5px solid red";
	
	let questionsPromise = getQuestions();
	let questionCategoryPromise = browser.runtime.sendMessage({
		"queryType": "GetQuestionCategories"
	});
	questionCategoryPromise.then(logSuccessResponse).catch(logFailureResponse);
	let pageLoadedPromise = waitForPageToLoad('.page-loading, .isLoading');
	
	Promise.all([questionsPromise, questionCategoryPromise, pageLoadedPromise]).then(function([theQuestions, theCategories]){
		questions = theQuestions;
		questionCategories = theCategories;
		
		document.body.style.border = "5px solid blue";
		listenForQuestionListUpdates();
		createFilterButtons();
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
	updateFilterCounts();
	if(!currentFilter){
		manipulateDefaultBehaviorQuestion(jq(`div.profile-question`));
		return;
	}
	
	let questionsInCategory = getQuestionsInCategory(currentFilter);
	let questionsNotInCategory = getQuestionsNotInCategory(currentFilter);
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
	
	const questionText = questionElement.find('h3').text();
	if(!isQuestionDefined(questions, questionText)){
		addQuestion(questions, questionText);
		saveQuestions(questions);
	}
}

function addBorder(questionElement, color){
	questionElement.css('border', `3px solid ${color}`)
}

function addCategorizationButtons(questionElement){
	questionElement.find('.questionCategorization').remove();
	
	const instructions = `Is this a ${currentFilter} question?`;
	const instructionsElement = `<span class="filterInstructions"><h4>${instructions}</h4></span>`;
	
	const showClass = 'showButton';
	const hideClass = 'hideButton';
	const inFilterButton = `<button class="${showClass}"><span>Show</span></button>`;
	const notInFilterButton = `<button class="${hideClass}"><span>Hide</span></button>`;
	
	const categorizationDiv = `<div class="questionCategorization">${instructionsElement}${inFilterButton}${notInFilterButton}</div>`;
	questionElement.append(categorizationDiv);
	
	const inFilterButtonElement = questionElement.find(`.${showClass}`);
	const notInFilterButtonElement = questionElement.find(`.${hideClass}`);
	
	inFilterButtonElement.click(() => {
		questionBelongsInFilter(questionElement);
	});
	notInFilterButtonElement.click(() => {
		questionDoesNotBelongInFilter(questionElement);
	});
}

function questionBelongsInFilter(thisQuestion){
	const questionText = thisQuestion.find('h3').text();
	questionObject = getQuestionByText(questions, questionText);
	questionObject[currentFilter] = "TRUE";
	saveQuestions(questions);
	thisQuestion.find('.questionCategorization').remove();
	manipulateQuestionElements();
}

function questionDoesNotBelongInFilter(thisQuestion){
	const questionText = thisQuestion.find('h3').text();
	questionObject = getQuestionByText(questions, questionText);
	questionObject[currentFilter] = "FALSE";
	saveQuestions(questions);
	manipulateQuestionElements();
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
	for(const category of questionCategories){
		addFilterButton(category);
	}
	addNewFilterButton();
}

function addFilterButton(category){
	let newButton = createButton(category);
	newButton.click(() => {
		applyFilter(category);
	});
	addButton(newButton);
}

function createButton(title){
	let newButton = jq('button.profile-questions-filter')
		.not('button.profile-questions-filter--isActive')
		.first()
		.clone();
	newButton.addClass('user-defined-filter');
	newButton.children(`.profile-questions-filter-title`).text(title);
	newButton.children(`.profile-questions-filter-icon`).remove();
	newButton.children(`.profile-questions-filter-count`).text("");
	return newButton;
}

function updateFilterCounts(){
	jq('button.profile-questions-filter.user-defined-filter').each(function(index){
		const thisFilter = jq(this);
		const filterName = thisFilter.children('span.profile-questions-filter-title').first().text();
		const questionsInCategory = getQuestionsInCategory(filterName);
		const questionsThatCurrentlyMatch = getNumberOfLoadedQuestionsInCategory(questionsInCategory);
		const questionsUndecidedInCategory = getQuestionsWithCategoryUndecided(filterName);
		const questionsThatCurrentlyMightMatch = getNumberOfLoadedQuestionsInCategory(questionsUndecidedInCategory);
		const numUnloaded = getNumberOfUnloadedQuestionsFromUser();
		
		let possible = questionsThatCurrentlyMatch + questionsThatCurrentlyMightMatch;
		let result;
		if(numUnloaded === -1){
			result = `${questionsThatCurrentlyMatch}+`;
		}
		else {
			possible += numUnloaded;
			if(questionsThatCurrentlyMatch === possible){
				result = `${questionsThatCurrentlyMatch}`;
			}
			else{
				result = `${questionsThatCurrentlyMatch}-${possible}`;
			}
		}
		thisFilter.children(`.profile-questions-filter-count`).text(`${result}`);
	});
}

function addButton(button){
	button.appendTo('div.profile-questions-filters-inner');
}

function addNewFilterButton(){
	let newFilterButton = createButton("Add new filter");
	newFilterButton.click(() => {
		 var newFilterName = prompt("Enter the name of the new filter");
		 if(newFilterName){
			addFilterButton(newFilterName);
			manipulateQuestionElements();
		 }
	});
	addButton(newFilterButton);
}

function applyFilter(category){
	alert(`Applying filter ${category}`);
	currentFilter = category;
	deselectCategoriesVisually();
	selectCategoryVisually(currentFilter);
	
	manipulateQuestionElements();
}

function deselectCategoriesVisually(){
	jq('button.profile-questions-filter.user-defined-filter').removeClass('profile-questions-filter--isActive');
}

function selectCategoryVisually(category){
	let selectedButton = jq('button.profile-questions-filter').filter(function() {
		return jq(this).children(`.profile-questions-filter-title`).first().text() == category;
	})
	selectedButton.addClass('profile-questions-filter--isActive');
}

// Agree/Disagree/Find Out - whichever is selected. If none are selected, -1. 
// (This is probably because the url was changed to have a filter_id that's not 9, 10, or 11. We don't know how many questions are coming.
function getNumberOfQuestionsInSelectedDefaultFilter(){
	let countElements = jq('button.profile-questions-filter--isActive')
		.not('button.user-defined-filter')
		.children('span.profile-questions-filter-count');
	if(countElements.length > 0){
		return countElements.first().text();
	}
	else{
		return -1;
	}
}

// Number of questions that would be on screen if the extension weren't present
function getNumberOfLoadedQuestionsFromUser(){
	return jq('div.profile-question').length;
}

// Number of questions that are still offscreen. -1 if we don't know the size of the current default filter.
function getNumberOfUnloadedQuestionsFromUser(){
	let totalOnPage = getNumberOfQuestionsInSelectedDefaultFilter();
	if(totalOnPage === -1){
		return -1;
	}
	return totalOnPage - getNumberOfLoadedQuestionsFromUser();
}

function getNumberOfLoadedQuestionsInCategory(questionsInCategory){
	let count = 0;
	jq('div.profile-question').each(function(index){
		const thisQuestion = jq(this);
		const questionText = thisQuestion.find('h3').text();
		if(questionsInCategory.includes(questionText)){
			count += 1;
		}
	});
	return count;
}

function getQuestions(){
	let questionsPromise = browser.runtime.sendMessage({
		"queryType": "GetQuestions"
	});
	return questionsPromise.catch(logFailureResponse).then(logSuccessResponse);
}

function getQuestionByText(questions, text){
	return questions.find(q => q.QuestionText === text);
}

function getQuestionsInCategory(category){
	return getQuestionTextsByCategoryAndValue(questions, category, "TRUE");
}

function getQuestionsNotInCategory(category){
	return getQuestionTextsByCategoryAndValue(questions, category, "FALSE");
}

function getQuestionTextsByCategoryAndValue(questions, category, value){
	return questions.filter(q => q[category] === value)
		.map(q => q.QuestionText);
}

function getQuestionsWithCategoryUndecided(category){
	return questions.filter(function(q){
		return !(category in q);
	}).map(q => q.QuestionText);
}

function isQuestionDefined(questions, questionText){
	return getQuestionByText(questions, questionText) !== undefined;
}

function addQuestion(questions, questionText){
	let newQuestion = {};
	newQuestion["QuestionText"] = questionText;
	questions.push(newQuestion);
}

const saveQuestions = _.debounce(function(questions) {
	let savePromise = browser.runtime.sendMessage({
		"queryType": "SaveQuestions",
		"updatedQuestions": questions
	});
	return savePromise.catch(logFailureResponse).then(logSuccessResponse);
}, 5000);

})();
