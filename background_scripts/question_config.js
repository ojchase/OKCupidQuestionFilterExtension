browser.runtime.onMessage.addListener(listenForRequests);
let allQuestionData = readQuestionConfig();
let questionCategories = allQuestionData.then(function(headerAndQuestions){
	return headerAndQuestions.questionCategories;
});
let questions = allQuestionData.then(function(headerAndQuestions){
	return headerAndQuestions.questions;
});

function listenForRequests(request, sender, sendResponse){
	if(request.queryType === "GetQuestionCategories"){
		return questionCategories.then((categories) => categories.slice(1)); // async responses are supposed to be a promise for the data in question
	}
	else if(request.queryType === "GetQuestions"){
		return questions;
	}
	else if(request.queryType === "SaveQuestions"){
		questions = Promise.resolve(request.updatedQuestions);
		saveQuestions();
	}
	else{
		console.warn(`Unrecognized request: ${request}`);
	}
}

function getFilePath(fileName){
	return browser.extension.getURL(fileName);
}

// Returns a Promise<{questionCategories: string[], questions: object[]}>
function readQuestionConfig(){
	return browser.storage.local.get("questionCsv").then(function(questionCsv){
		if(questionCsv && !jQuery.isEmptyObject(questionCsv)){
			return Promise.resolve(questionCsv);
		}
		else{
			let filePath = getFilePath("question_data.csv");
			return fetch(filePath).then(response => response.text());
		}
	}).then((text) => {
		let papaParsedObject = Papa.parse(text, {header: true, skipEmptyLines: true});
		let headers = papaParsedObject.meta.fields;
		return {
			questionCategories: headers,
			questions: papaParsedObject.data
		}
	});
}

function saveQuestions(){
	return Promise.all([questionCategories, questions]).then(function([headers, data]){
		let csvString = Papa.unparse({
			fields: headers,
			data: data
		},{headers: true});
		return csvString;
	}).then(function(output){
		browser.storage.local.set({
			questionCsv: output
		});
	}).then(function(){
		console.log("Question config saved to local storage");
	}).catch(function(err){
		console.log(`Error saving question config to local storage: ${err}`);
	});
}
