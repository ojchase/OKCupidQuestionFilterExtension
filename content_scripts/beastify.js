(function() {
	var jq = jQuery.noConflict();
	function getFilePath(fileName){
		return browser.extension.getURL(fileName);
	}

	/**
	 * Applies the given filter
	 */
	function applyFilter(selectedFilter) {
		if(selectedFilter === "Test File Read"){
			// Do stuff
			readQuestionConfig().then(function(headerAndQuestions){
				console.log(headerAndQuestions);
				let questionCategories = headerAndQuestions.questionCategories;
				let questions = headerAndQuestions.questions;
				console.log(questionCategories);
				console.log(questions);
				for(question of questions){
					console.log(`${questionCategories[1]} question?: [${question[questionCategories[1]]}] [${question.QuestionText}]`);
				}
				let newQuestion = createQuestion("This is a test question", "Spiritual", "FALSE");
				questions.push(newQuestion);
				saveQuestions(questionCategories, questions);
			});
			return;
		}
		if(selectedFilter === "Spiritual"){
			readQuestionConfig().then(function(headerAndQuestions){
				console.log(headerAndQuestions);
				let questionCategories = headerAndQuestions.questionCategories;
				let questions = headerAndQuestions.questions;
				let desiredQuestions = getQuestionTextsByCategoryAndValue(questions, "Spiritual", "TRUE");
				jq(`div.profile-question`).hide();
				for (var q of desiredQuestions){
					jq(`div.profile-question:has(button.profile-question-content:has(h3:contains("${q}")))`).show();
				}
			});
			return;
		}
		alert(`Applying filter: ${selectedFilter}`);
	}

	// Returns a Promise<{questionCategories: string[], questions: object[]}>
	function readQuestionConfig(){
		let filePath = getFilePath("question_data.csv");
		return fetch(filePath)
			.then(response => response.text())
			.then((text) => {
				console.log("starting to parse text");
				let papaParsedObject = Papa.parse(text, {header: true, skipEmptyLines: true});
				let headers = papaParsedObject.meta.fields;
				console.log(papaParsedObject);
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

  /**
   * Remove every beast from the page.
   */
  function removeExistingBeasts() {
    let existingBeasts = document.querySelectorAll(".beastify-image");
    for (let beast of existingBeasts) {
      beast.remove();
    }
  }

  /**
   * Listen for messages from the background script.
   * Call "beastify()" or "reset()".
  */
  browser.runtime.onMessage.addListener((message) => {
    if (message.command === "beastify") {
      applyFilter(message.beastURL);
    } else if (message.command === "reset") {
      removeExistingBeasts();
    }
  });

})();
