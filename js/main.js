function setLength() {
    word_length = document.getElementById("num_letters").value;

    document.getElementById('word_entered').setAttribute('maxlength', word_length); 
    document.getElementById('word_entered').value = "";
    document.getElementById('grid').innerHTML = "";
    document.getElementById('calculate').innerHTML = "";

    words = big_list.filter((a) =>  a.length == word_length);
    // words = official_guesses.slice(); // uncomment to use original wordle guess list
    setWordbank();
}

function setWordbank() {
    wordbank = document.getElementById("wordbank").value;

    if (wordbank == 'restricted') {
        if (word_length == 5) {
            common = common_words.filter(a => a.game == 'official' || a.game == 'quordle');
        } else {
            common = common_words.filter(a => a.game != 'unlimited');
        }
    } else {
        common = common_words.slice();
    }

    common = common.map(a => a.word);
    common = common.filter(a => a.length == word_length);
    common = [...new Set(common)];
    common = common.sort();
    // common = officical_answers.slice(); // uncomment to use original wordle answer list 

    for (let i = 0; i < easy.length; i++) {
        if (easy[i][wordbank] != null) {
            easy[i].average = easy[i][wordbank].average;
            easy[i].wrong = easy[i][wordbank].wrong;
        } else {
            easy[i].average = null;
            easy[i].wrong = NOT_YET_TESTED;
        }
    }

    for (let i = 0; i < hard.length; i++) {
        if (hard[i][wordbank] != null) {
            hard[i].average = hard[i][wordbank].average;
            hard[i].wrong = hard[i][wordbank].wrong;
        } else {
            hard[i].average = null;
            hard[i].wrong = NOT_YET_TESTED;
        }
    }
}

// gets all possible likely and unlikely answers left
// sorts the answer & potential guess list based on the most common letters
// gets the best guesses for normal and hard mode
// passes the data to update the list of suggestions and letters in the HTML
function update(woodle) {
    let uncommon = false;
    let answer_list = filterList(common.slice());
    let all_possible_words = filterList(words.slice());
    let unlikely_answers = all_possible_words.filter(a => !answer_list.some(b => b == a));

    if (!answer_list.length) {
        answer_list = all_possible_words.slice();
        uncommon = true;
    }

    if (!answer_list.length) {
        return showFinalOptions([], [])
    }

    let alphabet = bestLetters(answer_list);
    let sorted_answer_list = sortList(answer_list, alphabet);
    let sorted_guess_list = sortList(words.slice(), alphabet, sorted_answer_list);
    let normal_guesses, hard_guesses;

    if (!woodle) {
        normal_guesses = getBestGuesses(sorted_answer_list, sorted_guess_list, NORMAL);
        hard_guesses = getBestGuesses(sorted_answer_list, all_possible_words, HARD);  
    } else {
        if (guessesSoFar() == 1) sorted_guess_list = all_possible_words.slice();
        normal_guesses = getBestGuesses(sorted_answer_list, sorted_guess_list, NORMAL);
    }

    if (uncommon) {
        sorted_answer_list = [];
    }
    
    updateLetterList(alphabet, answer_list.length);
    updateLists(all_possible_words, sorted_answer_list, unlikely_answers, normal_guesses, hard_guesses);
}

// creates the suggetsions for both normal and hard mode
// updates the headers to reflect how many words are left
// adds those suggestions to the respective slides
// creates a dropdown list showing all possible words
function updateLists(words_left, likely_answers, unlikely_answers, normal_guesses, hard_guesses) {
    let list_length = Math.min(likely_answers.length, TOP_TEN_LENGTH);
    let normal_list = hard_list = "";

    if (normal_guesses) {
        normal_list = writeBestGuessList(normal_guesses, list_length, NORMAL);
    }
    
    if (hard_guesses) {
        hard_list = writeBestGuessList(hard_guesses, list_length, HARD);
    }

    updateHeaders(words_left, likely_answers, unlikely_answers);
    addToSlides(BEST_GUESSES, normal_list, hard_list)
    createAnswerDropdown(likely_answers, unlikely_answers);
    
    if (likely_answers.length <= 2) {
        // will only show the final two options as suggestions
        // ie: 'its either 'THIS' or 'THAT'
        return showFinalOptions(likely_answers, unlikely_answers);
    }
}


// changes the percentage underneath each of the letters in the 
// 'MOST COMMON LETTERS' section
function updateLetterList(alphabet, list_size) {
    let letters_ranked = [];

    for (let i = 0; i < 26; i++) {
        letters_ranked.push({letter:String.fromCharCode(i+65), score:alphabet[String.fromCharCode(i+65)][word_length]});
    }

    letters_ranked.sort((a, b) => (a.score <= b.score) ? 1 : -1);

    document.getElementsByClassName('best-letters')[0].innerHTML = "";
    let most_frequent = 0;

    for (let c = 0; c < 26; c++) {
        let freq = parseFloat(letters_ranked[c].score/list_size*100).toFixed(2);
        let letter = "<div class = 'letter-ranking'><div class = 'letter'>" + letters_ranked[c].letter + "</div>";
        let score = "<div class = 'frequency'>" + freq + "%</div></div>";

        if (freq == 0) { // don't add letters that don't appear in any words
            break;
        } else document.getElementsByClassName('best-letters')[0].innerHTML += "<li>" + letter + score + "</li>";
        
        // if the letter doesn't appear in all words, display a gradient
        // if it does appear in all words, the default color is green (in the CSS)
        if (freq != 100) {
            let red = 0 * (freq/100 / (letters_ranked[most_frequent].score/list_size));
            let green = 0 * (freq/100 / (letters_ranked[most_frequent].score/list_size));
            let blue = 200 * (freq/100 / (letters_ranked[most_frequent].score/list_size));
            
            document.getElementsByClassName('letter-ranking')[c].style.backgroundColor = "rgb(" + red + ", " + green + ", " + blue + ")";
        } else {
            most_frequent++;
        }        
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

        if (guesses[i].wrong > 0 && guesses[i].wrong != NOT_YET_TESTED) {
            data = num_guesses + " guesses, "
            + num_wrong + "% solve rate.";
        } else if (guesses[i].wrong == NOT_YET_TESTED) {
            data = "not yet tested ";
        }
        else data = num_guesses + " guesses remaining.";

        let word = "<div class = 'suggestion'>" + guesses[i].word + ": </div>";
        let score = "<div class = 'score'>" + data + "</div>";
        list += "<li>" + word + score + "</li>";
    }

    return list;
}

function updateHeaders(words_left, likely_answers, unlikely_answers) {
    let heading = document.getElementsByClassName("num_options")[0];
    let subheading = document.getElementsByClassName("by_likelihood")[0];

    let class_name = "class = 'showlist'><div></div>";
    if (words_left.length == words.length) class_name = ">";

    heading.innerHTML = words_left.length + " possible word" + ((words_left.length > 1) ? "s" : "");
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
}

// only called if there are less than two likely answers left
// shows: almost certainly 'THIS' or 'THAT'
// unlikely but it could be: 'SOMETHING', 'ELSE'
function showFinalOptions(sorted, less_likely) {
    if (!sorted.length && !less_likely.length) {
        return addToSlides("", NO_WORDS, NO_WORDS);
    }   

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

    addToSlides("", final_words, final_words);
}

// adds the heading, normal suggestsions, and hard suggestions
// to the respective HTML element
function addToSlides(heading, normal_suggestions, hard_suggestions) {
    let header = document.getElementsByClassName("best_options")[0];
    let normal = document.getElementsByClassName("best-guesses normal")[0]
    let hard = document.getElementsByClassName("best-guesses hard")[0]
    
    header.innerHTML = heading;
    if (normal) normal.getElementsByTagName("ul")[0].innerHTML = normal_suggestions;
    if (hard) hard.getElementsByTagName("ul")[0].innerHTML = hard_suggestions;

    if (!normal && !hard) {
        document.getElementsByClassName("best-guesses only")[0].getElementsByTagName("ul")[0].innerHTML = normal_suggestions;
    }
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
    return (document.getElementsByClassName("tile").length/word_length);
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
        let row = "<div class = 'row'>"
        
        for (let i = 0; i < word_length; i++) {
            row += "<button class = 'B tile " + c + "'>" + val[i] + "</button>";
        }
        row += TRACKER_BUTTONS + "</div>";
        document.getElementById("grid").innerHTML += row;
    }

    if (numberOfGuessesSoFar(1) && c == 'normal') {
        addButtons();
    }

    document.getElementById("word_entered").value = "";
}

function addButtons() {
    let buttons = "<button class = 'filter'>calculate next guess</button>"
        buttons += "<button class = 'undo'>remove last guess</button>"

    document.getElementById("calculate").innerHTML += buttons;
}

function changeTileColor(tile) {
    let old_color = getTileColor(tile[0]);
    let new_color = nextColor(old_color);
    tile[0].classList.replace(old_color, new_color);
}

function nextColor(color) {
    return color == CORRECT ? WRONG_SPOT : (color == WRONG_SPOT ? INCORRECT : CORRECT)
}

function getTileColor(tile) {
    return Array.from(tile.classList).filter(a => a == CORRECT || a == INCORRECT || a == WRONG_SPOT);
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
    if (numberOfGuessesSoFar(1)) {
        let diff = getTileColors(0);
        let word = getWord(0);
        let hash = makeHash(wordbank, difficulty, diff)

        if (seconds[word] != null) {
            if (seconds[word][hash] != null) {
                return JSON.parse(seconds[word][hash]);
            }
        } else seconds[word] = {};
    }

    return 0;
}

function makeHash(list_type, difficulty, string) {
    return list_type + "/" + difficulty + "/" + string;
}

function setBestGuesses(best_guesses, difficulty) {
    let diff = getTileColors(0);
    let word = getWord(0);
    let hash = makeHash(wordbank, difficulty, diff);

    seconds[word][hash] = JSON.stringify(best_guesses.slice(0, TOP_TEN_LENGTH));
}

function getBestGuesses(answer_list, guess_list, difficulty) {
    let best_guesses = guessesArePrecomputed(difficulty);
    
    if (best_guesses) { 
        return twoSort(best_guesses);
    }

    if (numberOfGuessesSoFar(0)) return twoSort(getFirstGuesses(difficulty));

    if (!isDifficulty(HARD, difficulty)) {
        guess_list = getWordsToCheck(answer_list, guess_list);
    }

    let initial_guesses = reducesListMost(answer_list, guess_list);

    best_guesses = calculateGuessList(answer_list, guess_list, initial_guesses, difficulty);

    if (numberOfGuessesSoFar(1)) setBestGuesses(best_guesses, difficulty);

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
    let alphabet = bestLetters(possibilities);

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
    if (isDifficulty(HARD, difficulty)) return hard.filter(a => a.word.length == word_length).sort((a, b) => a.wrong >= b.wrong ? 1 : -1);
    return easy.filter(a => a.word.length == word_length).sort((a, b) => a.wrong >= b.wrong ? 1 : -1);
}

function getWordsToCheck(answers, guesses) {
    guesses = reduceListSize(guesses, answers);
    let words_to_check = answers.concat(guesses);
    words_to_check = [...new Set(words_to_check)]; 

    return words_to_check;
}

function calculateGuessList(answers, guesses, best_words, difficulty) {
    const start_time = performance.now();
    let can_finish = false;

    for (let i = 0; i < best_words.length; i++) {
        let remaining = best_words[i].differences;
        let results = Array.apply(null, Array(GUESSES_ALLOWED+1));
        results.forEach(function(a, index) { results[index] = []});
        
        Object.keys(remaining).forEach(function(key) {
            countResults(best_words[i], remaining[key], guesses, results, guessesSoFar(), difficulty, key);
        });

        best_words[i].wrong = best_words[i].results[GUESSES_ALLOWED].length/answers.length;
        if (best_words[i].wrong == 0) {
            can_finish = true;
        }

        if (performance.now() - start_time > MAX_TIME || (can_finish && i >= CHECK_SIZE)) {
            console.log("only calculated " + (i+1) + " words");
            best_words = best_words.slice(0, i+1);
            break;
        }
    }
    twoSort(best_words);
    return best_words.map(a => Object.assign({}, {word: a.word, average: a.average, wrong: a.wrong})).slice(0, TOP_TEN_LENGTH);
}

function createLetterTiles(word, coloring) {
    let board = document.getElementsByClassName("tile");
    let letters = [];

    for (let i = 0; i < board.length; i++) {
        letters.push(board[i]);
    }

    for (let i = 0; i < word.length; i++) {
        let tile = document.createElement("button");
        tile.classList.add(coloring.charAt(i));
        tile.innerHTML = word.charAt(i);

        letters.push(tile);
    }

    return letters;
}

function countResults(best, answers, guesses, results, attempt, difficulty, differences) {
    if (answers.length <= 2) {
        if (answers.length == 0) {
            results[attempt].push(best.word);
        } else if (attempt < GUESSES_ALLOWED) {
            results[attempt+1].push(answers.pop());
        }
        
        if (answers.length && attempt < GUESSES_ALLOWED-1) {
            results[attempt+2].push(answers.pop());
        } 
    } else if (attempt < GUESSES_ALLOWED-1) {
        let new_guesses = answers.concat(guesses);
        new_guesses = [...new Set(new_guesses)];
        
        if (isDifficulty(HARD, difficulty)) {
            new_guesses = filterList(new_guesses, {word: best.word, colors: differences});
        } else {
            new_guesses = reduceListSize(new_guesses, answers);
        }
        
        if (attempt == GUESSES_ALLOWED-2) {
            new_guesses = answers.slice();
        }

        let best_words = reducesListMost(answers, new_guesses, true);
        if (!best_words.length) debugger;
        let remaining = best_words[0].differences;

        Object.keys(remaining).forEach(function(key) {
            countResults(best_words[0], remaining[key], new_guesses, results, attempt+1, difficulty, key);
        });
    }

    let avg = 0;
    let sum = 0;

    if (attempt >= GUESSES_ALLOWED-1) {
        results[GUESSES_ALLOWED] = results[GUESSES_ALLOWED].concat(answers);
        results[GUESSES_ALLOWED] = [...new Set(results[GUESSES_ALLOWED])];
    }

    for (let i = 0; i < results.length; i++) {
        let count = results[i].length;
        sum += count;
        avg += count*(i+1);
    }

    
    best.results = results;
    
    avg = avg/sum;
    best.average = avg;
}

function reducesListMost(answers, guesses, future_guess) {
    let best_words = [];
    let list_size = answers.length;
    let min = list_size;

    outer:
    for (let pos = 0; pos < guesses.length; pos++) {
        let differences = [];
        let compare = guesses[pos];
        let weighted = adjusted = 0;
        let threes = 1;

        for (let i = 0; i < list_size; i++) {
            let diff = getDifference(compare, answers[i]); 

            if (differences[diff] == null) {
                differences[diff] = [];
            }

            if (diff != CORRECT.repeat(word_length)) {
                differences[diff].push(answers[i]);
            }

            let freq = differences[diff].length;
            
            if (freq > 0) {
                weighted += (freq/list_size)*freq - ((freq-1)/list_size)*(freq-1);
                if (freq > 1) {
                    threes -= 1/list_size;
                }
            }

            adjusted = (1-threes)*weighted;
            if (adjusted >= min && future_guess || adjusted > min*SIZE_FACTOR) {
                continue outer;
            }
        }

        min = Math.min(min, adjusted);
        best_words.push({word: compare, adjusted: adjusted, differences: differences});

        if (weighted < 1 && future_guess) break;
        if (min == 0 && best_words.length >= answers.length && future_guess) break;
    }

    best_words.sort((a, b) => a.adjusted >= b.adjusted ? 1 : -1);
    return best_words;
}

function getSpots(string, char) {
    indicies = [];
    
    for (let i = 0; i < string.length; i++) {
        if (string[i] == char) indicies.push(i);
    }

    return indicies;
}

function count(string, char) {
    let count = 0;

    for (let i = 0; i < string.length; i++) {
        if (string[i] == char) count++;
    }

    return count;
}

/* FILTER FUNCTIONS */ 

function filterList(list, letters) {
    let newlist = [];

    if (letters) {
        let word = letters.word;
        let difference = letters.colors;

        for (let i = 0; i < list.length; i++) {
            if (getDifference(word, list[i]) == difference) {
                newlist.push(list[i]);
            }
        }

        return newlist;
    }

    for (let guess = 0; guess < guessesSoFar(); guess++) {
        newlist = [];
        let difference = getTileColors(guess);
        let word = getWord(guess);

        for (let i = 0; i < list.length; i++) {
            if (getDifference(word, list[i]) == difference) {
                newlist.push(list[i]);
            }
        }

        list = newlist.slice();
    }

    return list;
}

/* SORT FUNCTIONS */

// sorts the list based on which words have the most common letters
// used when the list is too large to check against all possibilities
function sortList(list, alphabet, sorted_list) {
    if (!list.length) return [];

    let newranks = [];

    list.forEach(function(w) {
        newranks.push({word: w, rank: 0});
    });

    checked = [];

    for (let i = 0; i < newranks.length; i++) {
        for (let j = 0; j < word_length; j++) {
            if (sorted_list != null) {
                if (alphabet[newranks[i].word.charAt(j)][word_length] == sorted_list.length) continue;
            }

            if (checked[i + " " + newranks[i].word.charAt(j)] == true) continue;  //no extra credit to letters with doubles
            newranks[i].rank += alphabet[newranks[i].word.charAt(j)][word_length];
            checked[i + " " + newranks[i].word.charAt(j)] = true;
        }
    }
        
    newranks.sort((a, b) => (a.rank <= b.rank) ? 1 : -1);
    return newranks.map(a => a.word);
}

// calculates which letters appear most often throughout the remaining answers
// used to rough sort the list if the entire list is too large to check
// info is also prited underneath 'Most Common Letters' section
function bestLetters(list) {
    if (!list.length) return [];

    let alphabet = [];

    for (let c = 65; c <= 90; c++) {
        alphabet[String.fromCharCode(c)] = [];
        for (let i = 0; i < word_length+1; i++) {
            alphabet[String.fromCharCode(c)].push(0);
        }
    }

    let checked;

    for (let i = 0; i < list.length; i++) {
        checked = [];
        for (let j = 0; j < word_length; j++) {
            c = list[i].charAt(j);

            alphabet[c][j]++;

            if (checked[c] != true) alphabet[c][word_length]++;  // only counts letters once per word
            checked[c] = true;
        }
    }
    return alphabet;
}

function twoSort(guesses) {
    guesses.sort(function(a,b) {
        if(a.wrong > b.wrong) {return  1;}
        if(a.wrong < b.wrong) {return -1;}
        if(a.average > b.average) {return  1;}
        if(a.average < b.average) {return -1;}
        return 0;
    });

    return guesses;
}