(function() {
	function getFilePath(fileName){
		return browser.extension.getURL(fileName);
	}

	/**
	 * Applies the given filter
	 */
	function applyFilter(selectedFilter) {
		if(selectedFilter === "Test File Read"){
			// Do stuff
			filePath = getFilePath("question_data.csv");
fetch(filePath)
  .then(response => response.text())
  .then(text => doStuff(text))
//  .then(text => alert(text))
  // outputs the content of the text file
			return;
		}
		alert(`Applying filter: ${selectedFilter}`);
	}

function doStuff(text){
	let x = Papa.parse(text, {header: true, skipEmptyLines: true});
	console.log(x);
	console.log(`There are ${x.data.length} items in the question set`);
	let headers = x.meta.fields;
	for(question of x.data){
		console.log(`${headers[1]} question?: ${question[headers[1]]} (${question.QuestionText}`);
	}
	
	
	let newQuestionText = "this is a test question";
	let newQuestionSpiritual = "FALSE";
	let newQuestion = {
		
	}
	newQuestion[headers[0]] = newQuestionText;
	newQuestion[headers[1]] = newQuestionSpiritual;
	x.data.push(newQuestion);
	
	let y = Papa.unparse({
		fields: headers,
		data: x.data
	},{headers: true});
	console.log("New file:")
	console.log(y);
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
