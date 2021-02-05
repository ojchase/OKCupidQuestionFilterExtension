/**
 * Listen for clicks on the buttons, and send the appropriate message to
 * the content script in the page.
 */
function listenForClicks() {
  document.addEventListener("click", (e) => {

	function getFilePath(fileName){
		return browser.extension.getURL(fileName);
	}

    /**
     * Insert the page-hiding CSS into the active tab,
     * then get the beast URL and
     * send a "beastify" message to the content script in the active tab.
     */
    function beastify(tabs) {
      let selectedFilter = e.target.textContent;
      alert(`Category selected: ${selectedFilter}`);
      // kept as a how-to reminder. I might want add/remove categories to affect the page.
      /*browser.tabs.sendMessage(tabs[0].id, {
        command: "beastify",
        beastURL: selectedFilter
      });*/
    }

    /**
     * Remove the page-hiding CSS from the active tab,
     * send a "reset" message to the content script in the active tab.
     */
    function reset(tabs) {
      /*browser.tabs.sendMessage(tabs[0].id, {
        command: "reset",
      });*/
	  alert("No op");
    }

    /**
     * Just log the error to the console.
     */
    function reportError(error) {
      console.error(`Could not beastify: ${error}`);
    }

    /**
     * Get the active tab,
     * then call "beastify()" or "reset()" as appropriate.
     * The script is already loaded with the page from the manifest.
     */
    if (e.target.classList.contains("beast")) {
      browser.tabs.query({active: true, currentWindow: true})
        .then(beastify)
        .catch(reportError);
    }
    else if (e.target.classList.contains("reset")) {
      browser.tabs.query({active: true, currentWindow: true})
        .then(reset)
        .catch(reportError);
    }
  });
}

listener = function(message){
	console.log("Popup script got a message!");
	console.log(message);
}
good = function(response){
	console.log("Popup script got a response!");
	console.log(response);
}
bad = function(response){
	console.log("Popup script got a bad response!");
	console.log(response);
}
listenForClicks();
browser.runtime.onMessage.addListener(listener);
let sent = browser.runtime.sendMessage("GetQuestionCategories");
sent.then(good, bad);
