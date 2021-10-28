(function() {
if (window.hasRunOKCupidQuestionFilterExtensionFilter) {
	return;
}
window.hasRunOKCupidQuestionFilterExtensionFilter = true;
  
let currentFilter = undefined;
let questions;
let questionCategories;
let inEditMode = false;
var jq = jQuery.noConflict();
loadQuestionData().then(function(){
	jq(document).ready(() => {
		listenForPageChanges();
		manipulatePage();
	});
});

function loadQuestionData(){
	let questionsPromise = browser.runtime.sendMessage({
		"queryType": "GetQuestions"
	}).catch(logFailureResponse);
	let questionCategoryPromise = browser.runtime.sendMessage({
		"queryType": "GetQuestionCategories"
	});
	questionCategoryPromise.catch(logFailureResponse);
	return Promise.all([questionsPromise, questionCategoryPromise]).then(function([theQuestions, theCategories]){
		questions = theQuestions;
		questionCategories = theCategories;
	});
}

function logFailureResponse(response){
	console.log("Content script got a bad response!");
	console.log(response);
}

// Note that the current design has this script active on all okcupid.com pages.
function manipulatePage(){
	currentFilter = undefined;
	inEditMode = false;
	waitForPageToLoad('.page-loading, .isLoading').then(function(){
		if(isOnAQuestionPage(window.location.href)){
			listenForQuestionUpdates();
			createFilterButtons();
			manipulateQuestionElements();
		}
	});
}

let currentUrl = location.href;
let currentProfile = undefined;
function listenForPageChanges(){
	// Thanks to https://stackoverflow.com/a/1930942
	setInterval(function() {
		if(window.location.href != currentUrl) {
			currentUrl = window.location.href;
			
			if(isOnAQuestionPage(currentUrl)){
				let newProfile = getProfileFromUrl(currentUrl);
				if(newProfile != currentProfile){
					currentProfile = newProfile;
					manipulatePage();
				}
			}
			else{
				currentProfile = undefined;
			}
		}
	}, 3000);
}

function getProfileFromUrl(href){
	let pathnameParts = href.split('/');
	let profileIndex = pathnameParts.indexOf('profile')
	if(profileIndex == -1){
		return null;
	}
	let profileNameIndex = profileIndex + 1;
	return pathnameParts[profileNameIndex];
}

async function waitForPageToLoad(selector){
	return new Promise(async (resolve,reject) => {
		while(!isPageLoaded(selector)){
			await new Promise((resolveSimpleTimeout) => {
				window.setTimeout(() => {
					resolveSimpleTimeout();
				}, 500);
			});
		}
		resolve();
	});
}

function isPageLoaded(selector){
	return jq(selector).length === 0;
}

function verifyAllQuestionsAreDefined($questionElements){
	$questionElements.each(function(index){
		const thisQuestion = jq(this);
		const questionText = thisQuestion.find('h3').text();
		if(getQuestionByText(questions, questionText) === undefined){
			addQuestion(questions, questionText);
		}
	});
}

function manipulateQuestionElements(){
	let $questionElements = jq('.profile-question');
	verifyAllQuestionsAreDefined($questionElements);
	updateFilterCounts();
	
	let questionsInCategory = getQuestionsInCategory(currentFilter);
	let questionsNotInCategory = getQuestionsNotInCategory(currentFilter);
	$questionElements.each(function(index){
		const thisQuestion = jq(this) // when jq.each is run, it calls the callback and sets the 'this' context when running to the DOM item
		manipulateQuestionElement(thisQuestion, questionsInCategory, questionsNotInCategory);
	});
}

function manipulateQuestionElement(thisQuestion, questionsInCategory, questionsNotInCategory){
	resetQuestionDisplay(thisQuestion);
	const isLoaded = !thisQuestion.hasClass('isLoading');
	if(!isLoaded){
		thisQuestion.show();
		return;
	}
	
	const questionText = thisQuestion.find('h3').text();
	const isUnwantedQuestion = questionsNotInCategory.includes(questionText);
	const isWantedQuestion = questionsInCategory.includes(questionText);
	const isUndecidedQuestion = !isUnwantedQuestion && !isWantedQuestion;
	if(inEditMode || isUndecidedQuestion){
		addCategorizationButtons(thisQuestion, isWantedQuestion, isUnwantedQuestion);
		thisQuestion.css('border', `2px dashed gray`)

		thisQuestion.show();
	}
	else if(isUnwantedQuestion){
		thisQuestion.hide();
	}
	else{ // isWantedQuestion
		thisQuestion.show();
	}
}

function resetQuestionDisplay(questionElement){
	questionElement.find('.questionCategorization').remove();
	questionElement.css('border', ``)
}

function addCategorizationButtons(questionElement, wanted, unwanted){
	
	const instructions = `Is this a ${currentFilter} question?`;
	const instructionsElement = `<span class="filterInstructions"><h4>${instructions}</h4></span>`;
	
	const showClass = 'showButton';
	const hideClass = 'hideButton';
	const inFilterButton = `<button class="${showClass}"><span>Yes</span></button>`;
	const notInFilterButton = `<button class="${hideClass}"><span>No</span></button>`;
	
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
	
	if(wanted){
		notInFilterButtonElement.css('opacity', '0.5');
	}
	else if(unwanted){
		inFilterButtonElement.css('opacity', '0.5');
	}
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

function listenForQuestionUpdates(){
	// Thanks to https://stackoverflow.com/a/42805882/1541186 for the approach here
	var target = document.querySelector('div.profile-questions-filters');
	var observer = new MutationObserver(function(mutations) {
		manipulateQuestionElements();
	});
	var config = { childList: true};
	observer.observe(target, config);
	
	target = document.querySelector('.profile-questions');
	observer.observe(target, config);
}

function createFilterButtons() {
	for(const category of questionCategories){
		addFilterButton(category);
	}
	addNewFilterButton();
	addDeleteFilterButton();
	addEditFilterButton();
}

function addFilterButton(category){
	let newButton = createButton(category, true);
	newButton.click(() => {
		applyFilter(category);
	});
	addButton(newButton);
}

function createButton(title, isAFilter){
	let newButton = jq('button.profile-questions-filter')
		.not('button.profile-questions-filter--isActive')
		.first()
		.clone();
	newButton.children(`.profile-questions-filter-title`).text(title);
	newButton.children(`.profile-questions-filter-icon`).remove();
	newButton.children(`.profile-questions-filter-count`).text("");
	if(isAFilter){
		newButton.addClass('user-defined-filter');
	}
	return newButton;
}

function addButton(button){
	button.appendTo('div.profile-questions-filters-inner');
}

function addNewFilterButton(){
	let newFilterButton = createButton("Add new filter", false);
	newFilterButton.click(() => {
		 var newFilterName = prompt("Enter the name of the new filter");
		 if(newFilterName){
			addFilterButton(newFilterName);
			manipulateQuestionElements();
		 }
	});
	addButton(newFilterButton);
}

function addDeleteFilterButton(){
	let deleteFilterButton = createButton("Delete filter", false);
	deleteFilterButton.click(() => {
		var deleteFilterName = prompt("Warning: This cannot be reversed and you will lose your filter's configuration! Enter the name of the filter to delete:");
		if(deleteFilterName){
			let $filterElement = findFilterButtonByName(deleteFilterName);
			if($filterElement.length > 0){
				let correctlyCasedFilterName = $filterElement.children(`.profile-questions-filter-title`).first().text();
				removeFilterButtonFromScreen($filterElement);
				deleteFilterFromQuestions(correctlyCasedFilterName);
				
				if(currentFilter === correctlyCasedFilterName){
					currentFilter = undefined;
					inEditMode = false;
					manipulateQuestionElements();
				}
			}
			else{
				alert(`Unable to find filter named ${deleteFilterName}`);
			}
		}
	});
	addButton(deleteFilterButton);
}

function removeFilterButtonFromScreen($filterElement){
	$filterElement.remove();
}

function deleteFilterFromQuestions(filterName){
	let questionsWithFilterSet = getQuestionObjectsWithCategoryDecided(filterName);
	if(questionsWithFilterSet.length > 0){
		for(question of questionsWithFilterSet){
			delete question[filterName];
		}
		saveQuestions(questions);
		questionCategories.delete(filterName);
		alert(`The '${filterName}' filter has been deleted`);
	}
}

function addEditFilterButton(){
	let editFilterButton = createButton("Edit filter", false);
	editFilterButton.click(() => {
		var editFilterName = prompt("Which filter would you like to reevaluate?");
		if(editFilterName){
			let $filterElement = findFilterButtonByName(editFilterName);
			if($filterElement.length > 0){
				let correctlyCasedFilterName = $filterElement.children(`.profile-questions-filter-title`).first().text();
				editFilter(correctlyCasedFilterName);
			}
			else{
				alert(`Unable to find filter named ${editFilterName}`);
			}
		}
	});
	addButton(editFilterButton);
}

function applyFilter(category){
	inEditMode = false;
	currentFilter = category;
	deselectCategoriesVisually();
	selectCategoryVisually(currentFilter);
	
	manipulateQuestionElements();
}

function editFilter(filterName){
	inEditMode = true;
	currentFilter = filterName;
	deselectCategoriesVisually();
	selectCategoryVisually(currentFilter);
	
	manipulateQuestionElements();
}

function deselectCategoriesVisually(){
	jq('button.profile-questions-filter.user-defined-filter').removeClass('profile-questions-filter--isActive');
}

function selectCategoryVisually(category){
	let selectedButton = findFilterButtonByName(category);
	selectedButton.addClass('profile-questions-filter--isActive');
}

function findFilterButtonByName(filterName){
	let selectedButton = jq('button.user-defined-filter').filter(function() {
		return jq(this).children(`.profile-questions-filter-title`).first().text().toUpperCase() == filterName.toUpperCase();
	})
	return selectedButton;
}

function updateFilterCounts(){
	jq('button.profile-questions-filter.user-defined-filter').each(function(index){
		const thisFilter = jq(this);
		const filterName = thisFilter.children('span.profile-questions-filter-title').first().text();
		const questionsInCategory = getQuestionsInCategory(filterName);
		const countOfQuestionsThatCurrentlyMatch = getNumberOfLoadedQuestionsInCategory(questionsInCategory);
		const questionsUndecidedInCategory = getQuestionsWithCategoryUndecided(filterName);
		const countOfQuestionsThatCurrentlyMightMatch = getNumberOfLoadedQuestionsInCategory(questionsUndecidedInCategory);
		const numUnloaded = getNumberOfUnloadedQuestionsFromUser();
		
		let possible = countOfQuestionsThatCurrentlyMatch + countOfQuestionsThatCurrentlyMightMatch;
		let result;
		if(numUnloaded === -1){
			result = `${countOfQuestionsThatCurrentlyMatch}+`;
		}
		else {
			possible += numUnloaded;
			if(countOfQuestionsThatCurrentlyMatch === possible){
				result = `${countOfQuestionsThatCurrentlyMatch}`;
			}
			else{
				result = `${countOfQuestionsThatCurrentlyMatch}-${possible}`;
			}
		}
		thisFilter.children(`.profile-questions-filter-count`).text(`${result}`);
	});
}

function getTotalNumberOfQuestionsAnsweredByUser(){
	let count = 0;
	let $countElements = jq('button.profile-questions-filter')
		.not('button.user-defined-filter')
		.children('span.profile-questions-filter-count');
	$countElements.each(function(index){
		let countString = jq(this).text();
		countString = countString.replace(/,/g, ''); // remove commas, which OKCupid has. This probably does not internationalize. My locale has commas, e.g. 1,234 questions
		count += Number(countString);
	});
	return count;
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
	return jq('.profile-question').length;
}

// Number of questions that are still offscreen. -1 if we don't know the size of the currently loaded page.
function getNumberOfUnloadedQuestionsFromUser(){
	let totalOnPage = getNumberOfQuestionsInSelectedDefaultFilter();
	if(totalOnPage === -1){
		if(isOnPublicFilter()){
			totalOnPage = getTotalNumberOfQuestionsAnsweredByUser();
		}
		else{
			return -1;
		}
	}
	return totalOnPage - getNumberOfLoadedQuestionsFromUser();
}

function getNumberOfLoadedQuestionsInCategory(questionsInCategory){
	let count = 0;
	jq('.profile-question').each(function(index){
		const thisQuestion = jq(this);
		const questionText = thisQuestion.find('h3').text();
		if(questionsInCategory.includes(questionText)){
			count += 1;
		}
	});
	return count;
}

function getQuestionByText(questions, text){
	return questions.find(q => q.QuestionText === text);
}

function getQuestionsInCategory(category){
	if(!category){
		return questions.map(q => q.QuestionText);
	}
	return getQuestionTextsByCategoryAndValue(questions, category, "TRUE");
}

function getQuestionsNotInCategory(category){
	if(!category){
		return [];
	}
	return getQuestionTextsByCategoryAndValue(questions, category, "FALSE");
}

function getQuestionTextsByCategoryAndValue(questions, category, value){
	return questions.filter(q => q[category] === value)
		.map(q => q.QuestionText);
}

function getQuestionObjectsWithCategoryDecided(category){
	return questions.filter(function(q){
		return (category in q);
	});
}

function getQuestionsWithCategoryUndecided(category){
	return questions.filter(function(q){
		return !(category in q);
	}).map(q => q.QuestionText);
}

function addQuestion(questions, questionText){
	let newQuestion = {};
	newQuestion["QuestionText"] = questionText;
	questions.push(newQuestion);
	saveQuestions(questions);
	return newQuestion;
}

const saveQuestions = _.debounce(function(questions) {
	let savePromise = browser.runtime.sendMessage({
		"queryType": "SaveQuestions",
		"updatedQuestions": questions
	});
	return savePromise.catch(logFailureResponse);
}, 5000);

function isOnPublicFilter(){
	const urlParams = new URLSearchParams(window.location.search);
	const filterId = urlParams.get('filter_id');
	return Number(filterId) === 1;
}

function isOnAQuestionPage(href){
	return href.includes("/questions");
}

})();
