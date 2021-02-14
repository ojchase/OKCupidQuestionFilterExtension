browser.runtime.onMessage.addListener(listenForRequests);
let questionsPromise = readQuestionConfig();

function listenForRequests(request, sender, sendResponse){
	if(request.queryType === "GetQuestionCategories"){
		return questionsPromise.then(getCategoriesInQuestions); // async responses are supposed to be a promise for the data in question
	}
	else if(request.queryType === "GetQuestions"){
		return questionsPromise;
	}
	else if(request.queryType === "SaveQuestions"){
		questionsPromise = Promise.resolve(request.updatedQuestions);
		saveQuestions();
	}
	else{
		console.warn(`Unrecognized request: ${request}`);
	}
}

function getCategoriesInQuestions(questions){
	let categories = new Set();
	for(const q of questions){
		for(const category in q){
			categories.add(category);
		}
	}
	categories.delete("QuestionText");
	return categories;
}

function readQuestionConfig(){
	return browser.storage.local.get("questions").then(function(questionObject){
		if(questionObject && !jQuery.isEmptyObject(questionObject)){
			return questionObject.questions;
		}
		else{
			console.log("No saved question filtering information. Creating an empty configuration.");
			return [];
		}
	});
}

function saveQuestions(){
	return questionsPromise.then(function(questions){
		browser.storage.local.set({
			questions
		});
	}).then(function(){
		console.log("Question config saved to local storage");
	}).catch(function(err){
		console.log(`Error saving question config to local storage: ${err}`);
	});
}
