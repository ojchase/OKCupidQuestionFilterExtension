browser.runtime.onMessage.addListener(listenForRequests);
let questionsPromise = readQuestionConfig();
questionsPromise.then(saveQuestions);

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
	return ["This", "is", "a", "Test"];
}

function readQuestionConfig(){
	console.log("Attempting to read question config");
	return browser.storage.local.get("questions").then(function(questionObject){
		console.log("Got something from browser storage");
		console.log(questionObject);
		console.log(questionObject.questions);
		if(questionObject && !jQuery.isEmptyObject(questionObject)){
			console.log("That will be the answer");
			return questionObject.questions;
		}
		else{
			console.log("Creating new item instead");
			return [{
				QuestionText: "How do you feel about kids?",
				Spiritual: false
			},{
				QuestionText: "What's your deal with harder drugs (stuff beyond pot)?",
				Spiritual: false
			}];
		}
	});
}

function saveQuestions(){
	return questionsPromise.then(function(questions){
		console.log("saving questions");
		console.log(questions);
		browser.storage.local.set({
			questions
		});
	}).then(function(){
		console.log("Question config saved to local storage");
	}).catch(function(err){
		console.log(`Error saving question config to local storage: ${err}`);
	});
}
