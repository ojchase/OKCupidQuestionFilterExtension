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
let x = Papa.parse(text);
console.log(x);
//var results = Papa.parse(csvString, config);
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
