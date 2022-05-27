var word_length = 5;
var wordbank = 'restricted';
var pairings = [];
var seconds = {};

// word length constants
const SMALLEST_WORD = 4, LARGEST_WORD = 11, DEFAULT_LENGTH = 5;
// class constants to assign colors to tiles
const CORRECT = "G", INCORRECT = "B", WRONG_SPOT = "Y", EMPTY = "X"; 
// difficulty constants
const NORMAL = 0, HARD = 1;
// list size constants
const CHECK_SIZE = 50, TOP_TEN_LENGTH = 10, MAX_TIME = 2000;
// misc constants
const NOT_YET_TESTED = .999, SIZE_FACTOR = 5;

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

    pairings = [];
}

function setLength() {
    word_length = document.getElementById("word-length").value;

    document.getElementById('word-entered').setAttribute('maxlength', word_length); 
    document.getElementById('word-entered').value = "";
    document.getElementById('grid').innerHTML = "";
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

    if (lists.answers.length) {
        best_guesses = getBestGuesses(lists.answers, lists.guesses, difficulty);
    }

    updateLists(lists.all, lists.answers, lists.unlikely, best_guesses);
}

function getPotentialGuessesAndAnswers(difficulty) {
    let answer_list = filterList(common.slice(), 0);
    let all_possible_words = filterList(words.slice(), 0);
    let unlikely_answers = all_possible_words.filter(a => !answer_list.some(b => b == a));

    if (!answer_list.length) {
        return {guesses: all_possible_words, answers: [], all: all_possible_words, unlikely: all_possible_words};
    }

    let alphabet = bot.getBestLetters(answer_list);
    let sorted_answer_list = sortList(answer_list, alphabet);
    let sorted_guess_list = words.slice();

    if (isDifficulty(HARD, difficulty)) {
        sorted_guess_list = all_possible_words;
    } else if (bot.isFor(ANTI)) {
        sorted_guess_list = filterList(sorted_guess_list, 0, true);
    }

    sorted_guess_list = sortList(sorted_guess_list, alphabet, sorted_answer_list);

    return {guesses: sorted_guess_list, answers: sorted_answer_list, all: all_possible_words, unlikely: unlikely_answers};
}

// creates the suggetsions for both normal and hard mode
// updates the headers to reflect how many words are left
// adds those suggestions to the respective slides
// creates a dropdown list showing all possible words
function updateLists(words_left, likely_answers, unlikely_answers, best_guesses) {
    let list_length = Math.min(likely_answers.length, TOP_TEN_LENGTH);
    let guess_list = writeBestGuessList(best_guesses, list_length);

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
function writeBestGuessList(guesses, list_length) {
    let data, list = "";

    for (let i = 0; i < list_length && i < guesses.length; i++) {
        let num_guesses = (guesses[i].average - guessesSoFar()).toFixed(3);
        let num_wrong = ((1-guesses[i].wrong)*100).toFixed(2);

        if (guesses[i].wrong > 0 && guesses[i].wrong != NOT_YET_TESTED && !bot.isFor(ANTI)) {
            data = num_wrong + "% solve rate";
        } else if (guesses[i].wrong == NOT_YET_TESTED) {
            data = "not fully tested ";
        } else if (!guessesSoFar(0)) {
            data = num_guesses + " guesses"
        } else data = num_guesses + " guesses left";

        list += createListItem(guesses[i].word, data, i+1);
    }

    return list;
}

function createListItem(word, data, rank) {
    let name = "<div class = 'suggestion'>" + rank + ". " + word + ": </div>";
    let score = "<div class = 'score'>" + data + "</div>";
    return "<li>" + name + score + "</li>";    
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
        likely_list += likely_answers[i] + "<br>";
    }
    potential_answers.innerHTML = "<p>" + likely_list + "</p>";

    for (let i = 0; i < unlikely_answers.length; i++) {
        unlikely_list += unlikely_answers[i] + "<br>";
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
    if (sorted.length) {
        final_words += "<li class = 'likely'>the word is almost certainly ";

        if (sorted.length == 2) {
            final_words += "<span class = 'final'>" + sorted[0] + "</span> or <span class = 'final'>" + sorted[1] + "<span></li>";
        }

        else {
            final_words += "<span class = 'final'>" + sorted[0] + "</span></li>";
        }
    }

    if (less_likely.length) {
        final_words += "<li class = 'others'>Unlikely, but it might be ";

        for (let i = 0; i < less_likely.length; i++) {
            final_words += "<span class = 'final'>" + less_likely[i] + "</span>";

            if (i < less_likely.length - 1) final_words += ", ";
            else final_words += "."
        } 

        final_words += "</li>";
    }

    addToSlides("", final_words);
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
    return document.getElementsByClassName("row").length;
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
    if (!words.includes(val)) return;

    if (val) {
        let row = createRow(val, c);

        document.getElementById("grid").append(row);
        bot.setChangeEvents(row);
    }

    if (numberOfGuessesSoFar(1) && c == 'normal') {
        addButtons();
    }

    document.getElementById("word-entered").value = "";
}

function createRow(word, mode) {
    let row = document.createElement('div'), text = "";
    row.setAttribute('class', 'row ' + mode);
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
        let rows = document.getElementsByClassName('row');
        rows[rows.length-1].remove();

        if (!rows.length) {
            document.getElementById('next-previous-buttons').innerHTML = "";
        }
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

    let hash = makeHash(bot.type, wordbank, difficulty, diff);

    if (seconds[word] != null) {
        if (seconds[word][hash] != null) {
            return JSON.parse(seconds[word][hash]);
        }
    } else seconds[word] = {};

    return 0;
}

function makeHash(game, list_type, difficulty, string) {
    return game + "/" + list_type + "/" + difficulty + "/" + string;
}

function setBestGuesses(best_guesses, difficulty) {
    let diff = "";
    let word = "";
    for (let i = 0; i < guessesSoFar(); i++) {
        diff += bot.getRowColor(i);
        word += getWord(i);
    }

    let hash = makeHash(bot.type, wordbank, difficulty, diff);

    seconds[word][hash] = JSON.stringify(best_guesses.slice(0, TOP_TEN_LENGTH));
}

function getBestGuesses(answer_list, guess_list, difficulty) {
    let best_guesses = guessesArePrecomputed(difficulty);
    
    if (best_guesses) { 
        return twoSort(best_guesses);
    }

    if (numberOfGuessesSoFar(0)) return getFirstGuesses(difficulty);
    if (answer_list.length > 1000) return getTempList(guess_list, answer_list);

    let initial_guesses = bot.reducesListBest(answer_list, guess_list);
    best_guesses = calculateGuessList(answer_list, guess_list, initial_guesses, difficulty);

    setBestGuesses(best_guesses, difficulty);
    return best_guesses;
}

// reduces list of possibilities when list is too large to check efficiently
function reduceListSize(guesses, answers) {
    // if you have <10 words left, removeUselessGuesses will actually remove some ideal guesses
    if (answers.length > 10) { 
        guesses = removeUselessGuesses(guesses, answers);
    }
    
    if (answers.length > 500) {
        guesses = guesses.slice(0, 250);
    }
    return guesses;
}

// remove words that have letters already grayed out
// remove words that have yellow letters in the wrong spot
function removeUselessGuesses(list, possibilities) {
    let alphabet = bot.getBestLetters(possibilities);

    for (let i = 0; i < list.length; i++) {
        for (let j = 0; j < word_length; j++) {
            let c = list[i].charAt(j);

            if (alphabet[c][word_length] == 0) {
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
    // let guesses = words.slice();
    // let letters = bot.getBestLetters(common.slice());
    let letters = bot.getBestLetters(answers.slice());
    guesses = sortList(guesses.slice(), letters);
    
    guesses = bot.reducesListBest(answers.slice(), guesses.slice(0, 50));
    guesses = guesses.map(a => Object.assign ({}, {word: a.word, average: a.adjusted, wrong: NOT_YET_TESTED}));
    return guesses;
}

function getWordsToCheck(answers, guesses) {
    guesses = reduceListSize(guesses, answers);
    let words_to_check = answers.concat(guesses);
    words_to_check = [...new Set(words_to_check)]; 
    words_to_check = sortList(words_to_check, bot.getBestLetters(answers), answers);

    return words_to_check;
}

function calculateGuessList(answers, guesses, best_words, difficulty) {
    const start_time = performance.now();
    let can_finish = false;

    for (let i = 0; i < best_words.length; i++) {
        let remaining = best_words[i].differences;
        let results = Array.apply(null, Array(bot.guessesAllowed(difficulty)));
        results.forEach(function(a, index) { results[index] = []});
        results['wrong'] = [];
        
        Object.keys(remaining).forEach(function(key) {
            countResults(best_words[i], remaining[key], guesses, results, guessesSoFar(), difficulty, key);
        });

        best_words[i].wrong = best_words[i].results['wrong'].length/answers.length;

        if (best_words[i].wrong == 0) {
            can_finish = true;
        }

        if (performance.now() - start_time > MAX_TIME || (can_finish && i >= CHECK_SIZE)) {
            console.log("only calculated " + (i+1) + " words");
            best_words = best_words.slice(0, i+1);
            break;
        }
    }
    best_words = best_words.slice(0, CHECK_SIZE);

    twoSort(best_words);
    return best_words.map(a => Object.assign({}, {word: a.word, average: a.average, wrong: a.wrong})).slice(0, TOP_TEN_LENGTH);
}

function countResults(best, answers, guesses, results, attempt, difficulty, differences) {
    let new_guesses = answers.concat(guesses);
    new_guesses = [...new Set(new_guesses)];
        
    if (isDifficulty(HARD, difficulty)) {
        new_guesses = filterList(new_guesses, {word: best.word, colors: differences});
    } else if (!bot.isFor(ANTI)) {
        new_guesses = reduceListSize(new_guesses, answers);
    } else {
        new_guesses = filterList(new_guesses, {word: best.word, colors: differences}, true);
    }
    
    if (answers.length <= 2 && (!bot.isFor(ANTI) || new_guesses.length == answers.length || !answers.length)) {
        addToResults(results, answers, attempt, best.word, bot.guessesAllowed(difficulty)); 

    } else if (attempt < bot.guessesAllowed(difficulty)-1) {
        if (attempt == bot.guessesAllowed(difficulty)-2 && !bot.isFor(ANTI)) {
            new_guesses = answers.slice();
        }

        let best_words = bot.reducesListBest(answers, new_guesses, true);
        let remaining = best_words[0].differences;

        Object.keys(remaining).forEach(function(key) {
            countResults(best_words[0], remaining[key], new_guesses, results, attempt+1, difficulty, key);
        });
    }

    if (attempt >= bot.guessesAllowed(difficulty)-1) {
        if (!bot.isFor(ANTI)) {
            results['wrong'] = results['wrong'].concat(answers);
        } else {
            results[bot.guessesAllowed(difficulty)-1].concat(answers);
        }
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
            index = 'wrong';
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

function filterList(list, letters, reduced_filter) {
    if (letters) {
        return createFilteredList(list, letters.word, letters.colors, reduced_filter);
    }

    for (let guess = 0; guess < guessesSoFar(); guess++) {
        list = createFilteredList(list, getWord(guess), bot.getRowColor(guess), reduced_filter);
    }

    return list;
}

function createFilteredList(old_list, guess, difference, reduced_filter) {
    let new_list = [];

    if (reduced_filter) {
        difference = getAllDifferences(guess, difference);
    } else difference = [difference];

    for (let i = 0; i < old_list.length; i++) {
        if (differencesMatch(guess, old_list[i], difference, reduced_filter)) {
            new_list.push(old_list[i]);
        }
    }
    
    if (new_list.length > 1) new_list = new_list.filter(a => a != guess);

    return new_list;
}

function differencesMatch(guess, answer, all_diffs, reduced_filter) {
    let correct_diff = bot.getDifference(guess, answer);

    for (let i = 0; i < all_diffs.length; i++) {
        if (correct_diff == all_diffs[i]) return true;
    }

    return false;
}

// MILLS --> YBBBB
// MOONY --> GBBBB
// QAJAQ --> BYBBB - BGBBB - BGBGB - BGBYB - BYBYB
function getAllDifferences(word, difference) {
    let chars = [];

    for (let i = 0; i < difference.length; i++) {
        if (difference.charAt(i) == WRONG_SPOT || difference.charAt(i) == CORRECT) {
            chars.push(word.charAt(i)); 
        }
    }

    all_diffs = createDiffsRecursive(word, difference, 0, chars, [difference]);
    return all_diffs;
}

// BYBBB --> kayak
// BGBBB
// BGBYB
// BGBGB
// BYBYB
// BYBGB
// BBBGB
function createDiffsRecursive(word, difference, index, char_list, diff_list) {
    if (index == difference.length) return [...new Set(diff_list)];
    
    if (char_list.includes(word.charAt(index)) && difference.charAt(index) != CORRECT) {
        let yellow = replaceAt(difference, WRONG_SPOT, index);
        let green = replaceAt(difference, CORRECT, index);
        let black = replaceAt(difference, INCORRECT, index);

        diff_list.push(yellow);
        diff_list.push(green);
        diff_list.push(difference);
        
        createDiffsRecursive(word, yellow, index+1, char_list, diff_list);
        createDiffsRecursive(word, green, index+1, char_list, diff_list);
        
        let c = word.charAt(index);
        if (index != word.indexOf(c)) {
            diff_list.push(black);
            createDiffsRecursive(word, black, index+1, char_list, diff_list);
        }
    } 

    return createDiffsRecursive(word, difference, index+1, char_list, diff_list);
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
function sortList(list, alphabet, sorted_list) {
    if (!list.length) return [];

    let newranks = [];

    list.forEach(function(w) {
        newranks.push({word: w, average: 0});
    });

    checked = [];

    for (let i = 0; i < newranks.length; i++) {
        for (let j = 0; j < word_length; j++) {
            if (sorted_list != null) {
                if (alphabet[newranks[i].word.charAt(j)][word_length] == sorted_list.length) continue;
            }

            if (checked[i + " " + newranks[i].word.charAt(j)] == true) continue;  //no extra credit to letters with doubles
            newranks[i].average += alphabet[newranks[i].word.charAt(j)][word_length];
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
    // guesses.sort(function(a,b) {
    //     if(a.wrong > b.wrong) {return  1;}
    //     if(a.wrong < b.wrong) {return -1;}
    //     if(a.average > b.average) {return  1;}
    //     if(a.average < b.average) {return -1;}
    //     return 0;
    // });
    if (bot.isFor(ANTI)) {
        guesses = sortWorst(guesses);
    } else {
        guesses = sortBest(guesses);
    }
    return guesses;
}

function sortBest(guesses) {
    guesses.sort(function(a,b) {
        if(a.wrong > b.wrong) {return  1;}
        if(a.wrong < b.wrong) {return -1;}
        if(a.average > b.average) {return  1;}
        if(a.average < b.average) {return -1;}
        return 0;
    });
    return guesses;
}

function sortWorst(guesses) {
    guesses.sort(function(a,b) {
        if(a.average < b.average) {return  1;}
        if(a.average > b.average) {return -1;}
        if(a.wrong > b.wrong) {return  1;}
        if(a.wrong < b.wrong) {return -1;}
        return 0;
    });
    return guesses;
}