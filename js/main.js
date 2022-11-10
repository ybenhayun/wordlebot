var word_length = 5;
var wordbank = 'restricted';
var pairings = [];
var seconds = {};

// word length constants
const SMALLEST_WORD = 3, LARGEST_WORD = 11, DEFAULT_LENGTH = 5;
// class constants to assign colors to tiles
const CORRECT = "G", INCORRECT = "B", WRONG_SPOT = "Y", EMPTY = "X"; 
// difficulty constants
const NORMAL = 0, HARD = 1;
// list size constants
const CHECK_SIZE = 50, TOP_TEN_LENGTH = 10, MAX_TIME = 1000;
// misc constants
const NOT_YET_TESTED = .999, SIZE_FACTOR = 5, INFINITY = 9999999;

function setBotMode(type) {
    bot = new Bot(type);
    let bots = document.getElementsByClassName('bot-type');

    for (let i = 0; i < bots.length; i++) {
        if (bots[i].id == type) {
            bots[i].checked = true;
        } else {
            bots[i].checked = false;
        }
    }

    if (!localStorage.getItem('guesses' + bot.type)) {
        if (bot.isFor(DORDLE)) {
            localStorage.setItem('guesses' + bot.type, 7);
        } else if (bot.isFor(WOODLE) || bot.isFor(HARDLE)) {
            localStorage.setItem('guesses' + bot.type, 8);
        } else if (bot.isFor(XORDLE) || bot.isFor(FIBBLE) || bot.isFor(QUORDLE)) {
            localStorage.setItem('guesses' + bot.type, 9);
        } else if (bot.isFor(OCTORDLE)) {
            localStorage.setItem('guesses' + bot.type, 13);
        }
    }


    pairings = [];
}

function setLength() {
    word_length = document.getElementById("word-length").value;

    document.getElementById('word-entered').setAttribute('maxlength', word_length); 
    document.getElementById('word-entered').value = "";
    // document.getElementById('hints').innerHTML = "";
    clearGrids();
    document.getElementById('next-previous-buttons').innerHTML = "";

    words = big_list.filter((a) =>  a.length == word_length);
    // words = official_guesses.slice(); // uncomment to use original wordle guess list
    setWordbank();
}

function setWordbank() {
    let banks = document.getElementsByClassName('wordbank');

    for (let i = 0; i < banks.length; i++) {
        if (banks[i].checked == true) {
            wordbank = banks[i].id;
            break;
        }

        if (i == banks.length - 1) {
            banks[0].checked = true;
        }
    }

    if (wordbank == 'restricted') {
        common = common_words.slice();
    } else {
        common = all_common_words.slice();
    }

    common = common.filter(a => a.length == word_length).sort();
    common = [...new Set(common)];
    common = common.sort();
    // common = officical_answers.slice(); // uncomment to use original wordle answer list 
}

function getBestOf(list) {
    let best_list;
    if (list[bot.type]) {
        best_list = list[bot.type];
        best_list = best_list.filter(a => a[wordbank] != null);
        best_list = best_list.map(a => Object.assign({}, {word: a.word, average: a[wordbank].average, wrong: a[wordbank].wrong}));
        return best_list;
    }

    list[bot.type] = [];
    return list[bot.type];
}

// gets all possible likely and unlikely answers left
// sorts the answer & potential guess list based on the most common letters
// gets the best guesses for normal and hard mode
// passes the data to update the list of suggestions and letters in the HTML
function update() {
    let difficulty = NORMAL;

    if (bot.hasHardMode()) {
        difficulty = Number(document.getElementById("mode").checked);
    }

    let lists = getPotentialGuessesAndAnswers(difficulty);
    let best_guesses = [];

    if (lists.answers.length > 2 || bot.isFor(ANTI)) {
        best_guesses = getBestGuesses(lists.answers, lists.guesses, difficulty, lists.pairs);
    }

    for (let i = 0; i < guessesSoFar(); i++) {
        best_guesses = best_guesses.filter(function(e) {return e.word !== getWord(i);});
    }

    updateLists(lists.all, lists.answers, lists.unlikely, best_guesses, lists.reduced);
}

function getAllPossibleAnswersFrom(list) {
    // if (bot.isFor(DORDLE) && guessesSoFar() > 0) {
    //     let answers = dordleFilter(list);
    //     list = answers.left.concat(answers.right);
    // }

    list = filterList(list, 0, 0, bot.getCount() > 1);
    if (bot.isFor(XORDLE)) {
        while (true) {
            let list_length = uniqueWordsFrom(list).length;
            list = xordleFilter(uniqueWordsFrom(list));

            if (uniqueWordsFrom(list).length == list_length) break;
        }
    }
    return list;
}

function uniqueWordsFrom(list) {
    if (!list.length) return [];

    if (typeof list[0] == 'object') {
        let unique = [];
        for (let i = 0; i  < list.length; i++) {
            unique = unique.concat(Object.values(list[i]));
        }

        return [... new Set(unique)];
    } else return list;
}

function dontNeedToCheck(answers, unique_answers) {
    return (answers.length <=2 && !bot.isFor(ANTI) && bot.getCount() == 1)
            || unique_answers.length <= 2 || numberOfGuessesSoFar(0);
}

function getPotentialGuessesAndAnswers(difficulty) {
    let answer_list = getAllPossibleAnswersFrom(common.slice());
    let unique_answers = uniqueWordsFrom(answer_list);
    let all_possible_words = filterList(words.slice(), 0);
    let unlikely_answers = all_possible_words.filter(a => !unique_answers.some(b => b == a));

    // if (answer_list.length <= 2 && !bot.isFor(ANTI) || numberOfGuessesSoFar(0)) {
    if (dontNeedToCheck(answer_list, unique_answers)) {
        if (!bot.isFor(XORDLE)) answer_list = unique_answers;

        return {guesses: unique_answers, 
                answers: answer_list, 
                all: all_possible_words, 
                unlikely: unlikely_answers, 
                pairs: answer_list, 
                unique: unique_answers};
    }

    let alphabet = bot.getBestLetters(unique_answers);
    let sorted_answer_list = sortList(unique_answers, alphabet);
    let sorted_guess_list = words.slice();

    if (bot.isFor(THIRDLE)) sorted_guess_list = allCombinations("", []);
    
    if (answer_list.length <= 2 && !bot.isFor(ANTI)) {
        sorted_guess_list = unique_answers;
    } else if (isDifficulty(HARD, difficulty)){
        sorted_guess_list = all_possible_words.slice();
    } else if (bot.isFor(ANTI)) {
        sorted_guess_list = filterList(sorted_guess_list, 0, true);
    }

    sorted_guess_list = sortList(sorted_guess_list, alphabet);
    sorted_guess_list = [...new Set(unique_answers.concat(sorted_guess_list))];
    
    new_lists = reduceListSize(sorted_guess_list, sorted_answer_list, answer_list.length);
    sorted_guess_list = new_lists.guesses;

    // if (bot.isFor(DORDLE)) {
        // sorted_guess_list = dordleCheck(sorted_guess_list, unique_answers);
    // }
    if (bot.getCount() > 1) {
        sorted_guess_list = answerAlreadyFound(sorted_guess_list, answer_list);
        answer_list = uniqueWordsFrom(answer_list);
    }
    
    return {guesses: sorted_guess_list, 
            answers: sorted_answer_list, 
            all: all_possible_words, 
            unlikely: unlikely_answers, 
            pairs: answer_list,
            unique: unique_answers,
            reduced: new_lists.reduced};
}

function answerAlreadyFound(guesses, answer_lists) {
    for (let i = 0; i < answer_lists.length; i++) {
        if (answer_lists[i].length == 1) {
            return answer_lists[i];
        }
    }

    return guesses;
}

function dordleCheck(guesses, answers) {
    // let left = answers.slice();
    // let right = answers.slice();

    // for (let i = 0; i < guessesSoFar(); i++) {
    //     let color = getDordleDiffs(bot.getRowColor(i));
    //     left = filterList(answers, {word: getWord(i), colors: color[0]});
    //     right = filterList(answers, {word: getWord(i), colors: color[1]});
    // }

    let lists = dordleFilter(answers);

    if (lists.left.length == 1) return lists.left;
    if (lists.right.length == 1) return lists.right;
    return guesses;
}

function dordleFilter(answers) {
    let left = right = answers.slice();

    for (let i = 0; i < guessesSoFar(); i++) {
        let color = getDordleDiffs(bot.getRowColor(i));
        left = filterList(left, {word: getWord(i), colors: color[0]});
        right = filterList(right, {word: getWord(i), colors: color[1]});
    }

    return ({left: left, right: right});
}

function allCombinations(string, list) {
    if (string.length == word_length) {
        list.push(string);
    } else {
        for (let c = 65; c <= 90; c++) {
            allCombinations(string + String.fromCharCode(c), list);
        }
    }

    return list;
}

// creates the suggetsions for both normal and hard mode
// updates the headers to reflect how many words are left
// adds those suggestions to the respective slides
// creates a dropdown list showing all possible words
function updateLists(words_left, likely_answers, unlikely_answers, best_guesses, reduced) {
    let list_length = Math.min(likely_answers.length, TOP_TEN_LENGTH);
    let guess_list = writeBestGuessList(best_guesses, list_length, reduced);

    if (bot.isFor(XORDLE)) {
        unlikely_answers = xordleFilter(unlikely_answers);
        unlikely_answers = uniqueWordsFrom(unlikely_answers);
        // updateHeaders(words_left, likely_answers, unlikely_answers);
    }

    updateHeaders(words_left, likely_answers, unlikely_answers);
    addToSlides("Your best possible guesses are:", guess_list);
    createAnswerDropdown(likely_answers, unlikely_answers);
    
    if (likely_answers.length == 0 && unlikely_answers.length == 0) {
        return addToSlides("", noWordsLeftMessage());
    }

    if (likely_answers.length <= 2 && !bot.isFor(ANTI)) {
        // will only show the final two options as suggestions
        // ie: 'its either 'THIS' or 'THAT'

        return showFinalOptions(likely_answers, unlikely_answers);
    } 
}

// creates and returns the top 10 list of suggestions
// suggestions will then be added to the HTLM of either the suggestions
// for hard mode or normal mode
function writeBestGuessList(guesses, list_length, reduced) {
    let data, list = "";

    for (let i = 0; i < list_length && i < guesses.length; i++) {
        let num_guesses = (guesses[i].average - guessesSoFar()).toFixed(3);
        let num_wrong = ((1-guesses[i].wrong)*100).toFixed(2);

        if (guesses[i].wrong == NOT_YET_TESTED) {
            data = "not fully tested";
        } else if (guesses[i].wrong > 0 && guesses[i].wrong != NOT_YET_TESTED) {
            data = num_wrong + "% solve rate";
        } else if (!guessesSoFar(0)) {
            data = num_guesses + " guesses"
        } else data = num_guesses + " guesses left";

        list += createListItem(guesses[i].word, data, i+1);
    }

    return list;
}

function createListItem(word, data, rank) {
    let name = "<div class = 'suggestion click' onclick='enterGuess("+JSON.stringify(word)+")'>" + rank + ". " + word + ": </div>";
    let score = "<div class = 'score'>" + data + "</div>";
    return "<li>" + name + score + "</li>";    
}

function enterGuess(word) {
    makeTables(word);
}

function updateHeaders(words_left, likely_answers, unlikely_answers) {
    let heading = document.getElementsByClassName("possibilities total")[0];
    let subheading = document.getElementsByClassName("possibilities separated")[0];

    let class_name = "class = 'showlist'><div></div>";
    if (words_left.length == words.length) class_name = ">";

    heading.innerHTML = words_left.length + " possibilit" + ((words_left.length != 1) ? "ies" : "y");
    subheading.innerHTML = "<span " + class_name + likely_answers.length + " probable answer" + ((likely_answers.length != 1) ? "s" : "") + "</span>, " 
                        + "<span " + class_name + unlikely_answers.length + " unlikely possibilit" + ((unlikely_answers.length != 1) ? "ies" : "y") + "</span>.";
}

// creates a dropdown of all possible words left
// dropdown is viewable if you click on the section that lists 
// how many likely/unlikely answers are remaining
function createAnswerDropdown(likely_answers, unlikely_answers) {
    if (numberOfGuessesSoFar(0)) return;
    
    let word_lists = document.getElementsByClassName("showlist");
    let potential_answers = word_lists[0].getElementsByTagName("div")[0];
    let technically_words = word_lists[1].getElementsByTagName("div")[0];
    let likely_list = unlikely_list = "";

    for (let i = 0; i < likely_answers.length; i++) {
        likely_list += printAnswer(likely_answers[i]) + "<br>";
    }
    potential_answers.innerHTML = "<p>" + likely_list + "</p>";

    for (let i = 0; i < unlikely_answers.length; i++) {
        unlikely_list += printAnswer(unlikely_answers[i]) + "<br>";
    }
    technically_words.innerHTML = "<p>" + unlikely_list + "</p>";

    if (likely_answers.length < 1) {
        potential_answers.innerHTML = "";
    }

    if (unlikely_answers.length < 1) {
        technically_words.innerHTML = "";
    }
}

function noWordsLeftMessage() {
    let message = document.createElement('div');
    message.setAttribute('id', 'nowords');
    message.innerHTML = "it doesn't look like we have this word. double check to make sure you all the clues you entered are correct.";
    
    return message.outerHTML;
}

// only called if there are less than two likely answers left
// shows: almost certainly 'THIS' or 'THAT'
// unlikely but it could be: 'SOMETHING', 'ELSE'
function showFinalOptions(sorted, less_likely) {
    let final_words = "";

    // if (bot.isFor(XORDLE)) {
    //     sorted[0] = sorted[0].word1 + "/" + sorted[0].word2;
    //     if (sorted.length == 2) {
    //         sorted[1] = sorted[1].word1 + "/" + sorted[1].word2;
    //     }

    //     less_likely = xordleFilter(less_likely);
    //     less_likely = uniqueWordsFrom(less_likely);
    // }

    if (sorted.length) {
        final_words += "<li class = 'likely'>the word is almost certainly ";

        if (sorted.length == 2) {
            final_words += "<span class = 'final'>" + printAnswer(sorted[0]) + "</span> or <span class = 'final'>" + printAnswer(sorted[1]) + "<span></li>";
        }

        else {
            final_words += "<span class = 'final'>" + printAnswer(sorted[0]) + "</span></li>";
        }
    }

    if (less_likely.length) {
        final_words += "<li class = 'others'>Unlikely, but it might be ";

        for (let i = 0; i < less_likely.length; i++) {
            final_words += "<span class = 'final'>" + printAnswer(less_likely[i]) + "</span>";

            if (i < less_likely.length - 1) final_words += ", ";
            else final_words += "."
        } 

        final_words += "</li>";
    }

    addToSlides("", final_words);
}

function printAnswer(answer) {
    if (typeof answer == 'string') return answer;
    if (Array.isArray(answer)) return answer[0];

    return answer.word1 + "/" + answer.word2;
}

// adds the heading, normal suggestsions, and hard suggestions
// to the respective HTML element
function addToSlides(heading, suggestions) {
    let header = document.getElementsByClassName("mini-title")[0];
    let list = document.getElementsByClassName('best-guesses')[0];
    
    header.innerHTML = heading;
    list.getElementsByTagName('ul')[0].innerHTML = suggestions;
}

function swapSlides(normal_slides, hard_slides, hard_mode) {
    let norm_pos = getSlidePosition(normal_slides);
    let hard_pos = norm_pos == 'front' ? 'back' : 'front';

    normal_slides[0].classList.replace(norm_pos, hard_pos);
    hard_slides[0].classList.replace(hard_pos, norm_pos);

    hard_mode ? localStorage.setItem('difficulty', true) : localStorage.removeItem('difficulty');
}

function getSlidePosition(slide) {
    return Array.from(slide[0].classList).filter(a => a == 'back' || a == 'front');
}

// returns the number of guesses made to far
function guessesSoFar() {
    return document.getElementsByClassName("row").length/bot.getCount();
}

// checks if the number of guesses so far equals number
function numberOfGuessesSoFar(number) {
    return guessesSoFar() == number;
}

// checks if we're playing on hard mode or normal mode
// mode --> the mode we want to see if we're playing
// check --> the mode we are currently playing on
function isDifficulty(mode, check) {
    return mode == check;
}

/* 
    TABLE FUNCTIONS
    creates the rows of guesses & buttons
    modifies the tiles/buttons when clicked
    accesses information about the guesses/current state
*/

function makeTables(val, c) {
    if (c == null) c = "normal";
    if (!words.includes(val) && !bot.isFor(THIRDLE)) return;

    if (val) {
        for (let i = 0; i < bot.getCount(); i++) {
            let row = createRow(val, c);
            document.getElementsByClassName("grid")[i].append(row);
            bot.setChangeEvents(row);
        }
    }

    if (numberOfGuessesSoFar(1) && c == 'normal') {
        addButtons();
    }

    document.getElementById("word-entered").value = "";
}

function createRow(word, mode) {
    let row = document.createElement('div'), text = "";
    row.setAttribute('class', 'row ' + mode + ' ' + bot.type);
    for (let i = 0; i < word.length; i++) {
        text += "<button class = 'B tile " + bot.type + "'>" + word[i] + "</button>";
    }

    if (bot.isFor(WOODLE)) text += TRACKER_BUTTONS;

    row.innerHTML = text;
    return row;
}

function addButtons() {
    let buttons = "<button class = 'undo'>remove last guess</button>";
    buttons += "<button class = 'filter'>calculate next guess</button>";

    document.getElementById('next-previous-buttons').innerHTML += buttons;

    document.getElementsByClassName('filter')[0].addEventListener('click', function() {
        let difficulty = NORMAL;
        if (bot.hasHardMode()) {
            difficulty = Number(document.getElementById("mode").checked);
        }
        update(difficulty);
    });

    document.getElementsByClassName('undo')[0].addEventListener('click', function() {
        // let rows = document.getElementsByClassName('row');
        // rows[rows.length-1].remove();
        // if (bot.isFor(DORDLE)) rows[rows.length-1].remove();
        let grids = document.getElementsByClassName('grid');

        for (let i = 0; i < grids.length; i++) {
            let rows = grids[i].getElementsByClassName('row');
            rows[rows.length-1].remove();
            if (!rows.length) document.getElementById('next-previous-buttons').innerHTML = "";
        }

        // if (!document.getElementsByClassName('rows').length) {
        //     document.getElementById('next-previous-buttons').innerHTML = "";
        // }

        let difficulty = NORMAL;
        if (bot.hasHardMode()) {
            difficulty = Number(document.getElementById("mode").checked);
        }
        update(difficulty);
    });
}

function getWord(number) {
    let row = document.getElementsByClassName("row")[number];
    let tiles = row.getElementsByClassName("tile");

    let guess = "";

    for (let i = 0; i < word_length; i++) {
        guess += tiles[i].innerHTML;
    }

    return guess;
}


/* 
    GUESS FUNCTIONS
    calculates the best guess at any given turn
    accesses guesses that are predetermined
    sets new guesses to memory
    finds the color difference between two words
*/

function guessesArePrecomputed(difficulty) {
    let diff = "";
    let word = "";
    for (let i = 0; i < guessesSoFar(); i++) {
        diff += bot.getRowColor(i);
        word += getWord(i);
    }

    let hash = makeHash(bot.type, wordbank, difficulty, bot.guessesAllowed(difficulty), diff);

    if (seconds[word] != null) {
        if (seconds[word][hash] != null) {
            return JSON.parse(seconds[word][hash]);
        }
    } else seconds[word] = {};

    return 0;
}

function makeHash(game, list_type, difficulty, guesses, string) {
    return game + "/" + list_type + "/" + difficulty + "/" + guesses + "/" + string;
}

function setBestGuesses(best_guesses, difficulty) {
    let diff = "";
    let word = "";
    for (let i = 0; i < guessesSoFar(); i++) {
        diff += bot.getRowColor(i);
        word += getWord(i);
    }

    let hash = makeHash(bot.type, wordbank, difficulty, bot.guessesAllowed(difficulty), diff);

    seconds[word][hash] = JSON.stringify(best_guesses.slice(0, TOP_TEN_LENGTH));
}

function getBestGuesses(answer_list, guess_list, difficulty, pairs) {
    let best_guesses = guessesArePrecomputed(difficulty);
    
    if (best_guesses) { 
        return twoSort(best_guesses);
    }

    if (numberOfGuessesSoFar(0)) return getFirstGuesses(difficulty);
    // if (answer_list.length > 1000) return getTempList(guess_list, pairs);

    if (guessesSoFar() == bot.guessesAllowed()-1) guess_list = answer_list;

    // let initial_guesses = bot.reducesListBest(answer_list, guess_list);
    let initial_guesses = bot.reducesListBest(pairs, guess_list);
    // if (bot.isFor(DORDLE)) best_guesses = initial_guesses; 
    // else
    best_guesses = calculateGuessList(answer_list, guess_list, initial_guesses, difficulty);

    setBestGuesses(best_guesses, difficulty);
    return best_guesses;
}

// reduces list of possibilities when list is too large to check efficiently
function reduceListSize(guesses, answers, answers_size) {
    // if you have <10 words left, removeUselessGuesses will actually remove some ideal guesses
    if (answers.length > 10) { 
        guesses = removeUselessGuesses(guesses, answers);
    }

    const MAXIMUM = 100000;
    let reduced = false;
    if (answers_size * guesses.length > MAXIMUM) {
        // guesses = sortList(guesses, bot.getBestLetters(answers))
        guesses = [...new Set(answers.concat(sortList(guesses, bot.getBestLetters(answers))))];
        
        let current = answers_size * guesses.length;
        let ratio = current/MAXIMUM;
        
        guesses = guesses.slice(0, guesses.length/ratio);
        reduced = true;
    }

    for (let guess = 0; guess < guessesSoFar(); guess++) {
        guesses = guesses.filter(a => a != getWord(guess));
    }
    
    return {guesses: guesses, answers: answers, reduced: reduced};
}

// remove words that have letters already grayed out
// remove words that have yellow letters in the wrong spot
function removeUselessGuesses(list, possibilities) {
    let alphabet = bot.getBestLetters(possibilities);

    for (let i = 0; i < list.length; i++) {
        for (let j = 0; j < word_length; j++) {
            let c = list[i].charAt(j);

            if (alphabet[c][word_length] == 0 || (alphabet[c][j] == 0 && alphabet[c][word_length] == possibilities.length)) {
                list.splice(i, 1);
                i--;
                break;
            } 
        }
    }

    return list;    
}

function getFirstGuesses(difficulty) {
    let first_guesses = easy;

    if (isDifficulty(HARD, difficulty)) {
        first_guesses = hard;
    }

    first_guesses = getBestOf(first_guesses).filter(a => a.word.length == word_length);

    if (!first_guesses.length) {
        first_guesses = getTempList(words.slice(), common.slice());
    }

    return twoSort(first_guesses);
}

function getTempList(guesses, answers) {
    let letters = bot.getBestLetters(uniqueWordsFrom(answers.slice()));
    guesses = sortList(guesses.slice(), letters);
    
    guesses = bot.reducesListBest(answers.slice(), guesses.slice(0, 100));
    guesses = guesses.map(a => Object.assign ({}, {word: a.word, average: a.adjusted, wrong: NOT_YET_TESTED}));
    return guesses;
}

function calculateGuessList(answers, guesses, best_words, difficulty) {
    const start_time = performance.now();
    let can_finish = false;

    for (let i = 0; i < best_words.length; i++) { 
        let remaining = best_words[i].differences;

        let num_guesses = bot.guessesAllowed();
        if (num_guesses == INFINITY) num_guesses = 6;
        let results = Array.apply(null, Array(num_guesses));
        
        results.forEach(function(a, index) { results[index] = []});
        results['w'] = [];
        best_words[i].results = results;
        
        Object.keys(remaining).forEach(function(key) {
            countResults(best_words[i], remaining[key], guesses, results, guessesSoFar(), difficulty, key);
        });

        best_words[i].wrong = best_words[i].results['w'].length/answers.length;
        // if (bot.isFor(ANTI)) best_words[i].wrong = 1 - best_words[i].results.length/100; //uncomment to for longest path antiwordle

        if (best_words[i].wrong == 0) {
            can_finish = true;
        }

        if (performance.now() - start_time > MAX_TIME || (can_finish && i >= CHECK_SIZE)) {
            console.log("only calculated " + (i+1) + " words in " + ((performance.now()-start_time)/1000).toFixed(3) + " seconds");
            best_words = best_words.slice(0, i+1);
            break;
        }
    }

    twoSort(best_words);
    return best_words.map(a => Object.assign({}, {word: a.word, average: a.average, wrong: a.wrong})).slice(0, TOP_TEN_LENGTH);
}

function countResults(best, answers, guesses, results, attempt, difficulty, differences) {
    let new_guesses = uniqueWordsFrom(answers).concat(guesses);
    new_guesses = [...new Set(new_guesses)];
        
    if (isDifficulty(HARD, difficulty)) {
        new_guesses = filterList(new_guesses, {word: best.word, colors: differences});
    } else if (!bot.isFor(ANTI)) {
        new_guesses = reduceListSize(new_guesses, uniqueWordsFrom(answers), answers.length).guesses;
    } else {
        new_guesses = filterList(new_guesses, {word: best.word, colors: differences}, true);
    }
    
    if (answers.length <= 2 && (!bot.isFor(ANTI) || new_guesses.length == answers.length || !answers.length)) {
        addToResults(results, answers, attempt, best.word, bot.guessesAllowed(difficulty)); 

    } else if (attempt < bot.guessesAllowed(difficulty)-1) {
        if (attempt == bot.guessesAllowed(difficulty)-2) {
            new_guesses = uniqueWordsFrom(answers.slice());
        }

        
        let best_words = bot.reducesListBest(answers, new_guesses, true);
        if (!best_words[0]) return;
        let remaining = best_words[0].differences;

        Object.keys(remaining).forEach(function(key) {
            countResults(best_words[0], remaining[key], new_guesses, results, attempt+1, difficulty, key);
        });
    }

    if (attempt >= bot.guessesAllowed(difficulty)-1) {
            results['w'] = results['w'].concat(answers);
    }
    
    calculateAverageGuesses(best, results);
}

function addToResults(results, answers, attempt, current_answer, max_guesses) {
    if (answers.length == 0) {
        addToSpot(results, current_answer, attempt);

    } else if (attempt < max_guesses) {
        addToSpot(results, answers.pop(), attempt+1);
    }
        
    if (answers.length && attempt < max_guesses-1) {
        addToSpot(results, answers.pop(), attempt+2);
    }
}

function addToSpot(results, answer, index) {
    if (index >= results.length) {
        if (bot.isFor(ANTI)) {
            for (let i = results.length; i <= index; i++) {
                results[i] = [];
            }
        } else {
            index = 'w';
        }
    }

    results[index].push(answer);
}

function calculateAverageGuesses(current_word, results) {
    let avg = 0;
    let sum = 0;

    for (let i = 0; i < results.length; i++) {
        let count = results[i].length;
        sum += count;
        avg += count*(i+1);
    }

    current_word.results = results;
    
    avg = avg/sum;
    current_word.average = avg;
}

function count(string, char) {
    let count = 0;

    for (let i = 0; i < string.length; i++) {
        if (string[i] == char) count++;
    }

    return count;
}

/* FILTER FUNCTIONS */ 

function filterList(list, letters, reduced_filter, split) {
    // if (bot.isFor(DORDLE) && letters) {
    //     if (letters.colors.length == word_length*2) {
    //         let answers = dordleFilter(list);
    //         return answers.left.concat(answers.right);
    //     }
    // }

    if (letters) {
        return createFilteredList(list, letters.word, letters.colors, reduced_filter, split);
    }

    for (let guess = 0; guess < guessesSoFar(); guess++) {
        list = createFilteredList(list, getWord(guess), bot.getRowColor(guess), reduced_filter, split);
    }

    return list;
}

function createFilteredList(old_list, guess, difference, reduced_filter, split) {
    // let new_list = [];
    old_list = uniqueWordsFrom(old_list);

    let new_list = new Array(bot.getCount());
    for (let i = 0; i < new_list.length; i++) {
        new_list[i] = [];
    }

    if (reduced_filter) {
        new_list = [antiwordleList(guess, difference, old_list)];
    } else { 
        difference = bot.getAllDifferences(difference);

        for (let i = 0; i < old_list.length; i++) {
            let list_index = differencesMatch(guess, old_list[i], difference);
            if (list_index != -1) {
                if (bot.getCount() > 1) {
                    new_list[list_index].push(old_list[i]);
                } else {
                    new_list[0].push(old_list[i]);
                }
            }
            // if (differencesMatch(guess, old_list[i], difference)) {
            //     new_list.push(old_list[i]);
            // }
        }
    }

    for (let i = 0; i < new_list.length; i++) {
        if (!bot.isFor(XORDLE)) {
            if (!new_list[i]) debugger;
            new_list[i] = new_list[i].filter(a => a != guess);
        }
    }

    if (!split) new_list = uniqueWordsFrom(new_list);
    return new_list;
}

function differencesMatch(guess, answer, all_diffs) {
    let correct_diff = bot.getDifference(guess, answer);

    for (let i = 0; i < all_diffs.length; i++) {
        if (correct_diff == all_diffs[i]) return i;
    }

    return -1;
}

function xordleFilter(list) {
    if (list.length > 1000) return list;
    if (numberOfGuessesSoFar(0)) return list;

    let doubles = [];    
    for (let i = 0; i < list.length; i++) {
        for (let j = i+1; j < list.length; j++) {

            if (bot.getDifference(list[i], list[j]) == INCORRECT.repeat(word_length)) {
                for (let guess = 0; guess < guessesSoFar(); guess++) {
                    if (bot.getDifference(getWord(guess), {word1: list[i], word2: list[j]}) != bot.getRowColor(guess)) break;
                        
                    else if (guess == guessesSoFar() - 1) doubles.push({word1: list[i], word2: list[j]});
                }
                    
            }
        }
    }

    return doubles;
}


// MILLS --> YBBBB
// MOONY --> GBBBB
// QAJAQ --> BYBBB - BGBBB - BGBGB - BGBYB - BYBYB
function antiwordleList(word, difference, list) {
    let correct = [];
    let contains = [];
    let incorrect = [];

    for (let i = 0; i < difference.length; i++) {
        if (difference.charAt(i) == CORRECT) {
            correct.push({letter: word.charAt(i), pos: i});
        }

        if (difference.charAt(i) == WRONG_SPOT || difference.charAt(i) == CORRECT) {
            contains.push(word.charAt(i));
        }
    }

    for (let i = 0; i < word.length; i++) {
        if (!contains.includes(word.charAt(i))) {
            incorrect.push(word.charAt(i));
        }
    }

    outer:
    for (let i = 0; i < list.length; i++) {
        for (let j = 0; j < correct.length; j++) {
            let c = correct[j].letter;
            let index = correct[j].pos;

            if (list[i].charAt(index) != c) {
                list.splice(i, 1);
                i--;
                continue outer;
            }
        }

        for (let j = 0; j < contains.length; j++) {
            if (!list[i].includes(contains[j])) {
                list.splice(i, 1);
                i--;
                continue outer;
            }
        }

        for (let j = 0; j < incorrect.length; j++) {
            if (list[i].includes(incorrect[j])) {
                list.splice(i, 1);
                i--;
                continue outer;
            }
        }
    }

    return list;
}

function replace(old_string, old_char, new_char) {
    let regex = new RegExp(old_char,'g'); // correct way
    let new_string = old_string.replace(regex, new_char); // it works

    return new_string;
}

function replaceAt(old_string, char, index) {
    old_string = old_string.slice(0, index) + char + old_string.slice(index+1);
    return old_string;
}
/* SORT FUNCTIONS */

// sorts the list based on which words have the most common letters
// used when the list is too large to check against all possibilities
function sortList(list, alphabet) {
    if (!list.length) return [];
    if (!alphabet) alphabet = bot.getBestLetters(list);

    let newranks = [];

    list.forEach(function(w) {
        newranks.push({word: w, average: 0});
    });

    checked = [];

    for (let i = 0; i < newranks.length; i++) {
        for (let j = 0; j < word_length; j++) {
            if (checked[i + " " + newranks[i].word.charAt(j)] == true) continue;  //no extra credit to letters with doubles
            if (alphabet[newranks[i].word.charAt(j)][word_length] == alphabet[newranks[i].word.charAt(j)][j]) continue;

            newranks[i].average += alphabet[newranks[i].word.charAt(j)][word_length];
            newranks[i].average += alphabet[newranks[i].word.charAt(j)][j];
            checked[i + " " + newranks[i].word.charAt(j)] = true;
        }
        newranks[i].average = 1/newranks[i].average;
    }
        
    newranks = sortListByAverage(newranks);
    return newranks.map(a => a.word);
}

function sortListByAverage(list) {
    if (bot.isFor(ANTI)) 
        return list.sort((a, b) => (a.average <= b.average) ? 1 : -1);

    return list.sort((a, b) => (a.average >= b.average) ? 1 : -1);
}

function twoSort(guesses) {
    guesses.sort(function(a,b) {
        if(a.wrong > b.wrong) {return  1;}
        if(a.wrong < b.wrong) {return -1;}
        if(bot.isBetter(a.average, b.average)) {return  -1;}
        if(!bot.isBetter(a.average, b.average)) {return 1;}
        return 0;
    });

    return guesses;
}