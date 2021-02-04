readQuestionConfig().then(function(headerAndQuestions){
	let questionCategories = headerAndQuestions.questionCategories;
	let questions = headerAndQuestions.questions;
	let newQuestion = createQuestion("This is a test question", "Spiritual", "FALSE");
	questions.push(newQuestion);
	saveQuestions(questionCategories, questions);
});


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
