var word_length = 5;
var pairings = [];
var seconds = {};

const CORRECT = "G", INCORRECT = "B", WRONG_SPOT = "Y"; 
const NOT_CORRECT_AMOUNT = 0, NO_GREENS = 1, YELLOWS_IN_WRONG_SPOT = 2, NOT_IN_WORD = 3;
const NORMAL = 0, HARD = 1, BOTH = 2;
const CHECK_SIZE = 50, TOP_TEN_LENGTH = 10;
const GUESSES_ALLOWED = 6;
const NOT_YET_TESTED = .999;
const MAX_TIME = 2000;
const SIZE_FACTOR = 1.7;
const NO_WORDS = "<div id = 'nowords'>it doesn't look like we have this word. double check to make sure you all the clues you entered are correct.</div>"
const BEST_GUESSES = "these are your best possible guesses:";

$(document).ready(function() {
    if (!localStorage.getItem('not first')) {
        $("#info").removeClass('hide');
        $("#info").addClass('display');
        localStorage.setItem('not first', true);
    }

    if (localStorage.getItem("word length")) {
        word_length = localStorage.getItem("word length");
        $("#num_letters").val(word_length);
    }

    if (localStorage.getItem("difficulty")) {
        $("#mode").prop('checked', true);
        swapSlides($('.best-guesses.normal'), $('.best-guesses.hard'), true)
    }
    
    setLength();
    update();

    $("#refresh").click(function() {
        $("#grid").empty();
        $("#calculate").empty();
        update();
    });

    $("#wordlebot").click(function() {
        testStartingWords();
    });

    $("#num_letters").on('input', function() {
        setLength();
        update();

        localStorage.setItem("word length", word_length);
    });

    $("#wordbank").on('input', function() {
        setWordbank();
        update();
    });

    $("#mode").on('input', function() {
        swapSlides($(".best-guesses.normal"), $(".best-guesses.hard"), $(this).is(':checked'));
    });
    
    $("#word_entered").on('input', function(e) {
        let val = $("#word_entered").val();
        if (words.includes(val)) {
            $("#word_entered").blur();
            
            makeTables(val);
            
            if (word_length == 11) {
                $(".tile").css('font-size', '1rem');
            }
        } 
    });

    $(".info").click(function() {
        $("#info").removeClass('hide');
        $("#info").addClass('display');
    });

    $("#info > .close").click(function() {
        $("#info").removeClass('display');
        $("#info").addClass('hide');
    });

    $(document).on('click', '.tile', function(e) {
        e.preventDefault();
        changeTileColor($(this));
    });

    $(document).on('click', '.filter', function() {
        update();
    });

    $(document).on('click', '.undo', function() {
        $(".row:last").remove();

        if (!$(".tile").length) {
            $("#calculate").empty();
        }
        update();
    });

    $(document).on('click', '.test', function() {
        setupTest();
    });

    $(document).on('click', '.showlist', function() {
        if ($(this).children().hasClass("visible")) {
            ($(this).children().removeClass("visible"));
        } else {
            $(this).children().addClass("visible");
        }

    });
});

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

function addButtons() {
    let buttons = "<button class = 'filter'>calculate next guess</button>"
        buttons += "<button class = 'undo'>remove last guess</button>"

    document.getElementById("calculate").innerHTML += buttons;
}

function makeTables(val, c) {
    if (c == null) c = "normal";
    if (!words.includes(val)) return;

    if (val) {
        let row = "<div class = 'row'>"
        
        for (let i = 0; i < word_length; i++) {
            row += "<button class = 'B tile " + c + "'>" + val[i] + "</button>"
        }
        row += "</div>"
        document.getElementById("grid").innerHTML += row;
    }

    if (numberOfGuessesSoFar(1) && c == 'normal') {
        addButtons();
    }

    document.getElementById("word_entered").value = "";
}

function changeTileColor(tile) {
    let old_color = getTileColor(tile);
    let new_color = nextColor(old_color);
    tile[0].classList.replace(old_color, new_color);
}

function getTileColor(tile) {
    return Array.from(tile[0].classList).filter(a => a == CORRECT || a == INCORRECT || a == WRONG_SPOT);
}

function nextColor(color) {
    return color == CORRECT ? WRONG_SPOT : (color == WRONG_SPOT ? INCORRECT : CORRECT)
}

function setLength() {
    word_length = document.getElementById("num_letters").value;

    document.getElementById('word_entered').setAttribute('maxlength', word_length); 
    document.getElementById('word_entered').value = "";
    document.getElementById('grid').innerHTML = "";
    document.getElementById('calculate').innerHTML = "";

    setWordbank();
    words = big_list.filter((a) =>  a.length == word_length);
    // words = official_guesses.slice(); // uncomment to use original wordle guess list
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

function filterList(list, letters) {
    if (!letters.length) return list;
    let restrictions = determineLetterPositions(letters);

    list = removeIf(list, restrictions, NOT_CORRECT_AMOUNT);
    list = removeIf(list, restrictions, NO_GREENS);
    list = removeIf(list, restrictions, YELLOWS_IN_WRONG_SPOT);

    return list;
}

function removeIf(list, restrictions, condition) {
    for (let i = 0; i < list.length; i++) {
        for (char in restrictions) {
            if (isTrue(list[i], restrictions[char], char, condition)) {
                list.splice(i, 1);
                i--;
                break;
            }
        }
    }

    return list;
}

function isTrue(word, restrictions, char, condition) {
    if (condition == NOT_CORRECT_AMOUNT) {
        let freq = count(word, char);
        return freq > restrictions.max || freq < restrictions.min
    }

    if (condition == NO_GREENS) {
        let correct_positions = restrictions[CORRECT];
        return correct_positions.some(a => word.charAt(a) != char);
    }

    if (condition == YELLOWS_IN_WRONG_SPOT) {
        let wrong_positions = restrictions[WRONG_SPOT];
        return wrong_positions.some(a => word.charAt(a) == char);
    }

    if (condition == NOT_IN_WORD) {
        return word.includes(char) && restrictions.max == 0;
    }
}

function determineLetterPositions(letters) {
    let letter_positions = determineCorrectLetters({}, letters, letters[0], letters[0].innerHTML, 0, 0);
    letter_positions = determineIncorrectLetters(letter_positions, letters, letters[0], letters[0].innerHTML, 0, 0, [], []);

    return letter_positions;
}

function determineCorrectLetters(letter_positions, letters, tile, char, position, index) {
    if (letter_positions[char] == null) {
        letter_positions[char] = {[CORRECT]: [], [WRONG_SPOT]: [], min: 0, max: 5};
    }
    
    if (tile.classList.contains(CORRECT)) {
        if (!letter_positions[char][CORRECT].includes(position)) {
            letter_positions[char][CORRECT].push(position);
            letter_positions[char].min++;
        }
    }
    
    if (index >= letters.length - 1) return letter_positions;
    else return determineCorrectLetters(letter_positions, letters, letters[index+1], letters[index+1].innerHTML, (index+1)%word_length, index+1);
}

function determineIncorrectLetters(letter_positions, letters, tile, char, position, index, count, exclude) {
    if (tile.classList.contains(WRONG_SPOT) || tile.classList.contains(INCORRECT)) {
        if (!letter_positions[char][WRONG_SPOT].includes(position)) {
            letter_positions[char][WRONG_SPOT].push(position);
        }

        if (tile.classList.contains(INCORRECT)) exclude[char] = true;
    }

    if (tile.classList.contains(WRONG_SPOT) || tile.classList.contains(CORRECT)) {
        if (count[char]) count[char]++;
        else count[char] = 1;
    }

    if (position == word_length-1) {
        letter_positions = adjustMinAndMax(letter_positions, count, exclude);
        count = [];
        exclude = [];
    }    

    if (index >= letters.length - 1) return letter_positions;
    else return determineIncorrectLetters(letter_positions, letters, letters[index+1], letters[index+1].innerHTML, (index+1)%word_length, index+1, count, exclude);
}

function adjustMinAndMax(letter_positions, count, exclude) {
    Object.keys(count).forEach(function(key) {
        letter_positions[key].min = Math.max(letter_positions[key].min, count[key]);
    });

    Object.keys(exclude).forEach(function(key) {
        if (count[key]) {
            letter_positions[key].max = Math.min(letter_positions[key].max, count[key]);
        } else {
            letter_positions[key].max = 0;
        }
    });

    return letter_positions;
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

function getTileColors() {
    let tiles = document.getElementsByClassName("tile");
    let coloring = "";

    for (let i = Math.max(0, tiles.length - word_length); i < tiles.length; i++) {
        coloring += Array.from(tiles[i].classList)[0];
    }

    return coloring;
}

function guessesArePrecomputed(difficulty) {
    if (numberOfGuessesSoFar(1)) {
        let diff = getTileColors();
        let word = getWord(1);
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
    let diff = getTileColors();
    let word = getWord(1);
    let hash = makeHash(wordbank, difficulty, diff)

    seconds[word][hash] = JSON.stringify(best_guesses.slice(0, TOP_TEN_LENGTH
    ));
    console.log(seconds);
}

// checks if the number of guesses so far equals number
function numberOfGuessesSoFar(number) {
    return guessesSoFar() == number;
}

// creates and returns the top 10 list of suggestions
// suggestions will then be added to the HTLM of either the suggestions
// for hard mode or normal mode
function writeBestGuessList(guesses, list_length) {
    let data, list = "";
    for (let i = 0; i < list_length && i < guesses.length; i++) {
        if (guesses[i].wrong > 0 && guesses[i].wrong != NOT_YET_TESTED) {
            data = guesses[i].average.toFixed(3) + " guesses, "
            + ((1 - guesses[i].wrong)*100).toFixed(2) + "% solve rate.";
        } else if (guesses[i].wrong == NOT_YET_TESTED) {
            data = "not yet tested ";
        }
        else data = (guesses[i].average + guessesSoFar()).toFixed(3) + " total guesses.";

        let word = "<div class = 'suggestion'>" + guesses[i].word + ": </div>";
        let score = "<div class = 'score'>" + data + "</div>";
        list += "<li>" + word + score + "</li>";
    }

    return list;
}

// checks if we're playing on hard mode or normal mode
// mode --> the mode we want to see if we're playing
// check --> the mode we are currently playing on
function isDifficulty(mode, check) {
    return mode == check;
}

// creates the suggetsions for both normal and hard mode
// updates the headers to reflect how many words are left
// adds those suggestions to the respective slides
// creates a dropdown list showing all possible words
function updateLists(words_left, likely_answers, unlikely_answers, normal_guesses, hard_guesses) {
    let list_length = Math.min(likely_answers.length, TOP_TEN_LENGTH
    );
    let normal_list = writeBestGuessList(normal_guesses, list_length, NORMAL);
    let hard_list = writeBestGuessList(hard_guesses, list_length, HARD);
    
    updateHeaders(words_left, likely_answers, unlikely_answers);
    addToSlides(BEST_GUESSES, normal_list, hard_list)
    createAnswerDropdown(likely_answers, unlikely_answers);
    
    if (likely_answers.length <= 2) {
        // will only show the final two options as suggestions
        // ie: 'its either 'THIS' or 'THAT'
        return showFinalOptions(likely_answers, unlikely_answers);
    }
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

// adds the heading, normal suggestsions, and hard suggestions
// to the respective HTML element
function addToSlides(heading, normal_suggestions, hard_suggestions) {
    document.getElementsByClassName("best_options")[0].innerHTML = heading;
    document.getElementsByClassName("best-guesses normal")[0].getElementsByTagName("ul")[0].innerHTML = normal_suggestions;
    document.getElementsByClassName("best-guesses hard")[0].getElementsByTagName("ul")[0].innerHTML = hard_suggestions;
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

// reduces list of possibilities when list is too large to check efficiently
function reduceListSize(guesses, answers, letters) {
    // if you have <10 words left, removeUselessGuesses will actually remove some ideal guesses
    if (answers.length > 10) { 
        if (!letters) letters = document.getElementsByClassName("tile");
        letter_restrictions = determineLetterPositions(letters);
        guesses = removeUselessGuesses(guesses, letter_restrictions);
    }
    
    if (answers.length > 500) {
        guesses = guesses.slice(0, 250);
    }

    return guesses;
}

// remove words that have letters already grayed out
// remove words that have yellow letters in the wrong spot
function removeUselessGuesses(list, restrictions) {
    if (!list.length) return [];

    list = removeIf(list, restrictions, NOT_IN_WORD);
    list = removeIf(list, restrictions, YELLOWS_IN_WRONG_SPOT);
    return list;    
}

// gets all possible likely and unlikely answers left
// sorts the answer & potential guess list based on the most common letters
// gets the best guesses for normal and hard mode
// passes the data to update the list of suggestions and letters in the HTML
function update() {
    let uncommon = false;
    let letters = document.getElementsByClassName("tile");
    let answer_list = filterList(common.slice(), letters);
    let all_possible_words = filterList(words.slice(), letters);
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
    let normal_guesses = getBestGuesses(sorted_answer_list, sorted_guess_list, NORMAL);
    let hard_guesses = getBestGuesses(sorted_answer_list, all_possible_words, HARD);

    if (uncommon) {
        sorted_answer_list = [];
    }
    
    updateLetterList(alphabet, answer_list.length);
    updateLists(all_possible_words, sorted_answer_list, unlikely_answers, normal_guesses, hard_guesses);
}

function getBestGuesses(answer_list, guess_list, difficulty) {
    let best_guesses = guessesArePrecomputed(difficulty);
    
    if (best_guesses) return twoSort(best_guesses);
    if (numberOfGuessesSoFar(0)) return twoSort(getFirstGuesses(difficulty));

    let words_to_check = getWordsToCheck(answer_list, guess_list);
    let initial_guesses = reducesListMost(answer_list, words_to_check);
    best_guesses = calculateGuessList(answer_list, guess_list, initial_guesses.slice(0, CHECK_SIZE), difficulty);

    if (numberOfGuessesSoFar(1)) setBestGuesses(best_guesses, difficulty);

    return best_guesses;
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

// returns the number of guesses made to far
function guessesSoFar() {
    return (document.getElementsByClassName("tile").length/word_length);
}

function calculateGuessList(answers, guesses, best_words, difficulty) {
    guesses_left = GUESSES_ALLOWED - guessesSoFar();

    const start_time = performance.now();
    for (let i = 0; i < CHECK_SIZE && i < best_words.length; i++) {
        let remaining = best_words[i].differences;
        let results = new Array(guesses_left).fill(0);
        results.push(answers.length);
        
        Object.keys(remaining).forEach(function(key) {
            countResults(best_words[i], remaining[key], guesses, results, 0, difficulty, key)
        });

        best_words[i].wrong = best_words[i].results[results.length - 1]/answers.length;
        if (performance.now() - start_time > MAX_TIME) {
            console.log("only calculated " + (i+1) + " words");
            best_words = best_words.slice(0, i+1);
            break;
        }
    }
    twoSort(best_words);
    return best_words.map(a => Object.assign({}, {word: a.word, average: a.average, wrong: a.wrong})).slice(0, TOP_TEN_LENGTH);
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
        results[results.length-1]--;

        if (answers.length == 0) {
            results[attempt]++;
        } else {
            results[Math.min(attempt+1, results.length-1)]++;
        }
        
        if (answers.length == 2) {
            results[Math.min(attempt+2, results.length-1)]++;
            results[results.length-1]--;
        } 
    } else if (attempt <= 3) {
        let startTime = performance.now();

        let new_guesses = answers.concat(guesses);
        new_guesses = [...new Set(new_guesses)];
        
        let letters = createLetterTiles(best.word, differences);
        if (isDifficulty(HARD, difficulty)) {
            new_guesses = filterList(new_guesses, letters);
        } else {
            new_guesses = reduceListSize(new_guesses, answers, letters);
        }

        let best_words = reducesListMost(answers, new_guesses, true);
        let remaining = best_words[0].differences;

        Object.keys(remaining).forEach(function(key) {
            return countResults(best_words[0], remaining[key], new_guesses, results, attempt+1, difficulty, key);
        });
    }

    let avg = 0;
    let sum = 0;
    for (let i = 0; i < results.length; i++) {
        sum += results[i];
        avg += results[i]*(i+1);
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

function getDifference(word1, word2) {
    let start_time = performance.now();
    if (pairings[word1]) {
        if (pairings[word1][word2]) return pairings[word1][word2];
    } else pairings[word1] = [];

    let diff = ""

    for (let j = 0; j < word_length; j++) {
        let word1_c = word1.charAt(j);
        let word2_c = word2.charAt(j);

        if (word1_c == word2_c) {
            diff += CORRECT;
        } else if (!word2.includes(word1_c)) {
            diff += INCORRECT;
        } else {
            if (count(word1, word1_c) <= count(word2, word1_c)) {
                diff += WRONG_SPOT;
            } else {
                diff += compareDoubles(word1, word2, word1_c, j);
            }
        }
    }

    pairings[word1][word2] = diff;

    return diff;
}

// pos is the position in the word the character is (ie: pos is 2 for 'a' and trap)
// place = is the spot in the indicies list that position is (ie: place = 1 for 'a' and 'aroma', a_list = [0, 4], and pos == 4)
function compareDoubles(a, b, char, pos) {
    let a_list = getSpots(a, char);
    let b_list = getSpots(b, char);

    for (let i = 0; i < a_list.length; i++) {
        if (b_list.includes(a_list[i])) {
            let index = b_list.indexOf(a_list[i]);
            b_list.splice(index, 1);

            a_list.splice(i, 1);
            i--;
        }

        if (b_list.length == 0) {
            return INCORRECT;
        }
    }

    for (let i = 0; i < a_list.length; i++) {
        if (pos == a_list[i])  {
            return WRONG_SPOT;
        }

        a_list.splice(i, 1);
        b_list.splice(i, 1);
        i--;

        if (b_list.length == 0) return INCORRECT;
    }

    return INCORRECT;
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