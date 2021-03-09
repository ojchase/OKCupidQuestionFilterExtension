# OkCupid Question Filter #

## Quick Summary ##

Allows filtering of answered questions on OKCupid.com dating profiles according to user-defined categories

## The Problem ##

One of the strengths of the dating site OkCupid over its competitors is that it provides, in addition to the standard profile description and characteristics, a substantial amount of information through a large set of question-and-answers answered by your prospective date. Some are very revealing ("Are you ready to settle down and get married right now?"), while some give you glimpses into personality ("Are you a workaholic?"), and some are just downright amusing ("Do you clap when a plane lands?"). Although they're sorted by importance, some people answer hundreds of questions. And further, different people answer different questions, leaving others unanswered. Between these two factors, finding the information you're looking for can be a bit of a scavenger hunt. The information is all useful (and a strength of OkCupid over other sites), but some grouping and classification would be helpful.

## The Solution ##

That's where this extension comes in. It allows you to create categories and assign questions to them. The question pages are manipulated to add these categories in addition to the standard "Agree", "Disagree", and "Find Out" filters already present. Selecting a custom filter will reduce the page to questions you've put in the category.

Because dating is very personal, and tied to individual priorities, and because OkCupid's question reservoir keeps growing, this extension does not provide any new ready-made filters. Your definition of a "Health" question won't be the same as mine. There is no artificial intelligence here. You have to tell it what you want, and teach it which questions fit. This takes some time. There are thousands of questions on the site, though some are more frequently encountered than others. Each will need your guidance over time, for each filter you create. But once you've taught it that "Do you believe in miracles?" is not a "Money" or "Hobbies" question, it will remember your decisions and make the next person's page that much easier to analyze.

## Usage ##

### Adding a new question category ###

Click "Add New Filter" on a question page and type a category name. The page will add the category to the bottom of the list.

### Viewing only questions in a category ###

Click that category in the filter list on the left. The question list will be redrawn to include only the questions in that category.

It will also show questions that you have not yet assigned to a category. Note that at first, that's all the questions!

### Teaching the extension what questions belong in the category ###

Select a category. All questions will be in one of three types: normal questions that are in the category (no visible change), questions not in the category (hidden), and questions that you've never decided on. These will be shown with a dashed border and some new buttons. They will ask "Is this a YOUR_CATEGORY_HERE question?" and give you two buttons: Yes or No. 

If the question is one that fits in this category, click Yes. The dashed lines and choices will vanish and the question will be back to its normal view. Any time you click this category in the future, this question will be shown if your prospective date has answered it and you've scrolled far enough down for it to be loaded.
	
If the question is one that does not fit in this category, click No. The question will vanish from the screen. Any time you click this category in the future, this question will not be shown.

### Switching to a different category ###

Simply select a different category. The current category will be deactivated, and the full set of questions will be filtered to your new category selection.

### Changing your mind ###

We make mistakes. Training these filters involves clicking "No" a lot, and it's easy to click it one time too many. If you do, click the "Edit Filter" button. Type the name of the category you wish to edit. Capitalization does not matter, but otherwise it must match one of the categories on the screen. If it does not, you'll get an error and nothing will change. If it does, every currently-loaded question will reappear, even those that should be hidden. All will have the dashed border and Yes/No buttons available for you to make a new decision. The current decision is shown as a more-highlighted button. Make new decisions as desired. Click a category on the left to leave edit mode and go back to the normal behavior.

### Deleting a category ###

Click the "Delete Filter" button. You'll be asked which filter should be deleted. Type the name of the category you wish to delete. Capitalization does not matter, but otherwise it much match one of the categories on the screen. If it does not, you'll get an error and nothing will change. If it does, the category will be deleted. WARNING: If you delete a category, all the effort you have previously taken to train the filter will be lost. Be sure you want to do this.

## Important Notes ##

- At its core, this is nothing more than a filter. It hides parts of the page that you've previously specified aren't useful at the moment. It doesn't send OkCupid requests for the next ten "Family" questions. It takes the existing page you have loaded, whether that's ten questions or four hundred, and hides questions that aren't "Family" questions. If there are more questions off-screen, it doesn't know what they are. Scrolling will load the next ten, but will only show those that match "Family". You may wish to scroll all the way down to the very bottom to ensure all questions are loaded before you start using the custom filters. Similarly, you'll only see the questions that are on the current "Agree"/"Disagree"/"Find Out" page. Don't forget to check the others too!

- There is no master list of questions. OkCupid seems to change it regularly. This extension keeps track of questions it sees. If you run into a new question, your categories will each need to be taught what to do with that question.

- The question count displayed next to the category name will likely be a range. This is because the extension does not know how many questions the prospective date has answered in this category. As mentioned, this extension does not load all the questions of a certain category; it only hides questions from the existing screen. If you haven't scrolled down all the way to load all the questions, it has no way of knowing what's off-screen. They could theoretically all be in the category! Further, some of the loaded questions may not have been classified yet. These factors make an exact count impossible in some situations. With time and classification patience, a fully-loaded page will have exact question counts.

- There is one bug that you are likely to encounter. The existing page is built for the default "Agree", "Disagree", and "Find Out" filters and is not expecting more. The buttons and filters added by this extension go to the bottom and are often offscreen. You'll need to scroll to the bottom to find them. The only problem is that as you reach the bottom, OkCupid loads more questions, and then you're not at the bottom any more! You'll want to either scroll to the VERY bottom, or near the bottom of the currently-loaded questions (enough to see the new filter buttons) but not so far as to trigger the loading of more questions. Zooming out helps as well. I would love some technical assistance to make this behavior better.

- No personal data is captured and communicated externally. All memory is limited to the storage in your Firefox browser, and this is only a set of categories for each question. Two permissions are needed: "Active Tab" in order to manipulate the page you're viewing and "storage" to remember your decisions next time you open Firefox.

- This extension is open-source and I'd love feedback. The code and issues can be found at  my Github repository at https://github.com/ojchase/OKCupidQuestionFilterExtension. Comments, suggestions, bugs, and pull requests are welcome.

## External resources used ##

- Icons made by [Freepik](https://www.freepik.com "Freepik") from [www.flaticon.com](https://www.flaticon.com/ "Flaticon")
- jQuery 3.5.1
- Underscore.js 1.12
