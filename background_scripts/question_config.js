listener = listenForRequests;
browser.runtime.onMessage.addListener(listener);
let allQuestionData = readQuestionConfig();
let questionCategories = allQuestionData.then(function(headerAndQuestions){
	return headerAndQuestions.questionCategories;
});
let questions = allQuestionData.then(function(headerAndQuestions){
	return headerAndQuestions.questions;
});
//let newQuestion = createQuestion("This is a test question", "Spiritual", "FALSE");
Promise.all([questionCategories, questions]).then(function([questionCategories, questions]){
	//questions.push(newQuestion);
	//saveQuestions(questionCategories, questions);
});

function listenForRequests(request, sender, sendResponse){
	if(request.queryType === "GetQuestionCategories"){
		return questionCategories.then((categories) => categories.slice(1)); // async responses are supposed to be a promise for the data in question
	}
	else if(request.queryType === "GetQuestionsInCategory"){
		return questions.then(function(questions){
			return getQuestionTextsByCategoryAndValue(questions, request.category, "TRUE");
		});
	}
	else if(request.queryType === "GetQuestionsNotInCategory"){
		return questions.then(function(questions){
			return getQuestionTextsByCategoryAndValue(questions, request.category, "FALSE");
		});
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
	let filePath = getFilePath("question_data.csv");
	return fetch(filePath)
		.then(response => response.text())
		.then((text) => {
			let papaParsedObject = Papa.parse(text, {header: true, skipEmptyLines: true});
			let headers = papaParsedObject.meta.fields;
			return {
				questionCategories: headers,
				questions: papaParsedObject.data
			}
		});
}

function getQuestionByText(questions, text){
	return questions.find(q => q.QuestionText === text);
}

function getQuestionTextsByCategoryAndValue(questions, category, value){
	return questions.filter(q => q[category] === value)
		.map(q => q.QuestionText);
}

function createQuestion(question, category, value){
	let newQuestion = {};
	newQuestion["QuestionText"] = question;
	newQuestion[category] = value;
	return newQuestion;
}

function saveQuestions(questionCategories, questions){
	let csvString = Papa.unparse({
		fields: questionCategories,
		data: questions
	},{headers: true});
	console.log("New file:")
	console.log(csvString);
}
