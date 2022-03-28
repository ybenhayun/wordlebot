var word_length = 5;
var pairings = [];

const CORRECT = "G", INCORRECT = "B", WRONG_SPOT = "Y"; 
const NORMAL = 0, HARD = 1;
const NO_WORDS = "<div id = 'nowords'>it doesn't look like we have this word. double check to make sure you all the clues you entered are correct.</div>"
const STARTING_WORDS = "these are your best possible starting words:";
const BEST_GUESSES = "these are your best possible guesses:";
const LIST_SIZE = 10;
const GUESSES_ALLOWED = 6;

$(document).ready(function() {

    if (localStorage.getItem("word length")) {
        word_length = localStorage.getItem("word length");
        $("select#num_letters").val(word_length);
    }

    if (localStorage.getItem("difficulty")) {
        $("#mode").prop('checked', true);

        $(".best-guesses.hard").addClass("front");
        $(".best-guesses.hard").removeClass("back");
            
        $(".best-guesses.normal").removeClass("front");
        $(".best-guesses.normal").addClass("back");
    }
    
    setLength();
    makeTables();
    update();

    $("#refresh").click(function() {
        $("#grid").html("");
        update();
    });

    $("#wordlebot").click(function() {
        testStartingWords();
    });

    $("#num_letters").on('input', function() {
        setLength();
        removeTest();
        makeTables();
        update();

        localStorage.setItem("word length", word_length);
    });

    $("#wordbank").on('input', function() {
        setWordbank();
        update();
    });

    $("#mode").on('input', function() {
        if ($(this).is(':checked')) {
            $(".best-guesses.hard").addClass("front");
            $(".best-guesses.hard").removeClass("back");
            
            $(".best-guesses.normal").removeClass("front");
            $(".best-guesses.normal").addClass("back");
            localStorage.setItem("difficulty", true);
        } else {
            $(".best-guesses.normal").addClass("front");
            $(".best-guesses.normal").removeClass("back");
            
            $(".best-guesses.hard").removeClass("front");
            $(".best-guesses.hard").addClass("back");
            localStorage.removeItem("difficulty");
        }
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

    $(document).on('click', '.tile', function(e) {
        e.preventDefault();
        changeTileColor($(this));
    });

    $(document).on('click', 'button.filter', function() {
        update();
    });

    $(document).on('click', '.undo', function() {
        $(".row:last").remove();

        if (!$(".tile").length) {
            $(".buttons").remove();
        }
        update();
    });

    $(document).on('click', 'button.test', function() {
        let val = getWord();
        setupTest(val);
    });

    $(document).on('click', '.showlist', function() {
        if ($(this).children().hasClass("visible")) {
            ($(this).children().removeClass("visible"));
        } else {
            $(this).children().addClass("visible");
        }

    });
});

function makeTables(val, c) {
    if (c == null) c = "normal";
    
    if (!words.includes(val)) return;
    
    let buttons = document.getElementsByClassName("buttons");
    if (buttons.length > 0) buttons[0].remove();
    
    if (val) {
        let row = "<div class = 'row'>"
        
        for (let i = 0; i < word_length; i++) {
            row += "<button class = 'B tile " + c + "'>" + val[i] + "</button>"
        }
        
        row += "</div><div class = 'buttons'><button class = 'filter'>Filter list</button>"
        row += "<button class = 'undo'>Go Back</button>"
        row += "<button class = 'test'>Test</button>"
        
        row += "</div>"
        document.getElementById("grid").innerHTML += row;
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

    setWordbank();
    words = big_list.filter((element) => {return element.length == word_length; });
}

function setWordbank() {
    wordbank = document.getElementById("wordbank").value;

    if (wordbank == 'restricted') {
        if (word_length == 5) {
            common = common_words.filter(a => {return a.game == 'official' || a.game == 'quordle'});
        } else {
            common = common_words.filter(a => {return a.game != 'unlimited' });
        }
    } else {
        common = common_words.slice();
    }

    common = common.map(a => a.word);
    common = common.filter(a => {return a.length == word_length});
    common = [...new Set(common)];
    common = common.sort();

    for (let i = 0; i < easy.length; i++) {
        if (easy[i][wordbank] != null) {
            easy[i].average = easy[i][wordbank].average;
            easy[i].wrong = easy[i][wordbank].wrong;
        } else {
            easy[i].average = null;
            easy[i].wrong = null;
        }
    }

    for (let i = 0; i < hard.length; i++) {
        if (hard[i][wordbank] != null) {
            hard[i].average = hard[i][wordbank].average;
            hard[i].wrong = hard[i][wordbank].wrong;
        } else {
            hard[i].average = null;
            hard[i].wrong = null;
        }
    }
}

function filterList(list, letters) {
    if (!letters.length) return list;
    let restrictions = determineLetterPositions(letters);

    outer:
    for (let i = 0; i < list.length; i++) {
        for (char in restrictions) {
            let freq = count(list[i], char);
            if (freq > restrictions[char].max || freq < restrictions[char].min) {
                list.splice(i, 1);
                i--;
                continue outer;
            }

            let correct_positions = restrictions[char][CORRECT];
            for (let j = 0; j < correct_positions.length; j++) {
                if (list[i].charAt(correct_positions[j]) != char) {
                    list.splice(i, 1);
                    i--;
                    continue outer;
                }
            }

            let wrong_positions = restrictions[char][WRONG_SPOT];
            for (let j = 0; j < wrong_positions.length; j++) {
                if (list[i].charAt(wrong_positions[j]) == char) {
                    list.splice(i, 1);
                    i--;
                    continue outer;
                }
            }
        }
    }

    return list;
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

    heading.innerHTML = words_left.length + " possible word" + ((words_left.length > 1) ? "s" : "");
    subheading.innerHTML = "<span class = 'showlist'><div></div>" + likely_answers.length + " probable answer" + ((likely_answers.length != 1) ? "s" : "") + "</span>, " 
                        + "<span class = 'showlist'><div></div>" + unlikely_answers.length + " unlikely possibilit" + ((unlikely_answers.length != 1) ? "ies" : "y") + "</span>.";
}

function getTileColors() {
    let tiles = document.getElementsByClassName("tile");
    let coloring = "";

    for (let i = Math.max(0, tiles.length - word_length); i < tiles.length; i++) {
        coloring += Array.from(tiles[i].classList)[0];
    }

    return coloring;
}

function findBestGuesses(difficulty) {
    if (isFirstGuess()) {
        let diff = getTileColors();
        let word = getWord();
        let hash = wordbank + "/" + difficulty + "/" + diff;

        if (seconds[word] != null) {
            if (seconds[word][hash] != null) {
                return seconds[word][hash];
            }
        } else seconds[word] = {};
    }

    return 0;
}

function setBestGuesses(best_guesses, difficulty) {
    let diff = getTileColors();
    let word = getWord();
    let hash = wordbank + "/" + difficulty + "/" + diff;

    seconds[word][hash] = best_guesses.slice(0, LIST_SIZE);
}

function isFirstGuess() {
    return document.getElementsByClassName("tile").length == word_length;
}

function determineBestGuesses(answers_left, possible_guesses, difficulty, isBot) {
    let best_guesses = findBestGuesses(difficulty);
    if (best_guesses) {
        return best_guesses;
    }

    if (answers_left.length == common.length) {
        if (difficulty == NORMAL) {
            best_guesses = easy.filter(a => a.word.length == word_length).sort((a, b) => a.wrong >= b.wrong ? 1 : -1);
        } 
        else best_guesses = hard.filter(a => a.word.length == word_length).sort((a, b) => a.wrong >= b.wrong ? 1 : -1);
    } else {
        best_guesses = bestNextGuesses(answers_left, possible_guesses, isBot, difficulty);
    }
    
    best_guesses = sortGroupsByAverage(best_guesses);

    if (isFirstGuess()) {
        setBestGuesses(best_guesses, difficulty);
        console.log(seconds);
    }

    return best_guesses;
}

function writeList(guesses, list_length) {
    let data, list = "";
    for (let i = 0; i < list_length; i++) {
        if (guesses[i].wrong > 0) {
            data = guesses[i].average.toFixed(3) + " guesses, "
            + ((1 - guesses[i].wrong)*100).toFixed(2) + "% solve rate.";
        } else if (guesses[i].wrong == null) {
            data = "needs to be tested ";
        }
        else data = guesses[i].average.toFixed(3) + " guesses per solve.";

        let word = "<div class = 'suggestion'>" + guesses[i].word + ": </div>";
        let score = "<div class = 'score'>" + data + "</div>";
        list += "<li>" + word + score + "</li>";
    }

    return list;
}

function isHardMode(difficulty) {
    return difficulty == HARD;
}

function updateLists(words_left, likely_answers, unlikely_answers, normal_guesses, hard_guesses) {
    let list_length = Math.min(likely_answers.length, LIST_SIZE);
    let normal_list = writeList(normal_guesses, list_length, NORMAL);
    let hard_list = writeList(hard_guesses, list_length, HARD);
    
    updateHeaders(words_left, likely_answers, unlikely_answers);
    addToSlides(BEST_GUESSES, normal_list, hard_list)
    createAnswerDropdown(likely_answers.map(a => a.word), unlikely_answers);
    
    if (likely_answers.length <= 2) {
        return showFinalOptions(likely_answers, unlikely_answers);
    }
}

function createAnswerDropdown(likely_answers, unlikely_answers) {
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

function update() {
    let uncommon = false;
    let letters = document.getElementsByClassName("tile");
    let answer_list = filterList(common.slice(), letters);
    let all_possible_words = filterList(words.slice(), letters);
    let unlikely_answers = all_possible_words.filter(a => !answer_list.some(b => b == a));

    if (!answer_list.length) {
        answer_list = filterList(words.slice(), letters);
        uncommon = true;
    }

    if (!answer_list.length) {
        return showFinalOptions([], [])
    }

    let alphabet = bestLetters(answer_list);
    
    let sorted_answer_list = sortList(answer_list, alphabet);
    let sorted_guess_list = sortList(words.slice(), alphabet, sorted_answer_list);
    let normal_guesses = determineBestGuesses(sorted_answer_list.map(a => a.word), sorted_guess_list.map(a => a.word), NORMAL);
    let hard_guesses = determineBestGuesses(sorted_answer_list.map(a => a.word), all_possible_words, HARD);

    if (uncommon) {
        sorted_answer_list = [];
    }
    
    updateLetterList(alphabet, answer_list.length);
    updateLists(all_possible_words, sorted_answer_list, unlikely_answers, normal_guesses, hard_guesses);
}

function addToSlides(heading, normal_suggestions, hard_suggestions) {
    document.getElementsByClassName("best_options")[0].innerHTML = heading;
    document.getElementsByClassName("best-guesses normal")[0].getElementsByTagName("ul")[0].innerHTML = normal_suggestions;
    document.getElementsByClassName("best-guesses hard")[0].getElementsByTagName("ul")[0].innerHTML = hard_suggestions;
}

function showFinalOptions(sorted, less_likely) {
    if (!sorted.length && !less_likely.length) {
        return addToSlides("", NO_WORDS, NO_WORDS);
    }   

    let final_words = "";
    if (sorted.length) {
        final_words += "<li class = 'likely'>the word is almost certainly ";

        if (sorted.length == 2) {
            final_words += "<span class = 'final'>" + sorted[0].word + "</span> or <span class = 'final'>" + sorted[1].word + "<span></li>";
        }

        else {
            final_words += "<span class = 'final'>" + sorted[0].word + "</span></li>";
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

        if (freq == 0) {
            break;
        } else document.getElementsByClassName('best-letters')[0].innerHTML += "<li>" + letter + score + "</li>";
        
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

    return newranks;
}

function reduceListSize(guesses, answers) {
    if (answers.length > 10) { 
        let letters = document.getElementsByClassName("tile");
        letter_restrictions = determineLetterPositions(letters);
        guesses = removeUselessGuesses(guesses, letter_restrictions);
    } 

    guesses = sortList(guesses, bestLetters(answers), answers).map(a => a.word);
    return guesses;
}

function removeUselessGuesses(list, restrictions) {
    if (!list.length) return [];

    outer:
    for (let i = 0; i < list.length; i++) {
        for (key in restrictions) {
            if (count(list[i], key) > restrictions[key].max && restrictions[key].max == 0) {
                list.splice(i, 1);
                i--;
                continue outer;
            }
        }
    }

    return list;
}

function bestNextGuesses(filtered, full_list, isBot, difficulty) {
    if (!isHardMode(difficulty)) {
        full_list = reduceListSize(full_list, filtered);
    }

    let check_list = filtered.concat(full_list);
    check_list = [...new Set(check_list)]; 
    check_list = calculateGuessList(filtered, check_list, isBot, difficulty);

    return check_list;
}

function calculateGuessList(answers, guesses, isBot, difficulty) {
    const check_size = 50;
    let best_words = reducesListMost(answers, guesses, isBot);
    best_words = best_words.slice(0, check_size);

    guesses_left = GUESSES_ALLOWED - (document.getElementsByClassName("tile").length/word_length);

    for (let i = 0; i < check_size && i < best_words.length; i++) {
        let remaining = best_words[i].differences;
        let results = new Array(guesses_left).fill(0);
        results.push(answers.length);
        
        
        Object.keys(remaining).forEach(function(key) {
            countResults(best_words[i], remaining[key], guesses, results, 0, difficulty, key)
        });

        best_words[i].wrong = best_words[i].results.at(-1)/answers.length;
    }

    best_words.sort((a, b) => a.wrong >= b.wrong ? 1 : -1);
    return best_words;
}

function sortGroupsByAverage(guesses) {
    let best = [];

    for (let i = 0; i < guesses.length; i++) {
        let wrong = guesses[i].wrong;
        if (best[wrong] == null) {
            best[wrong] = [];
        }

        best[wrong].push(guesses[i]);
    }

    let final = [];
    Object.keys(best).forEach(function(key) {
        let subgroup = best[key].sort((a, b) => a.average >= b.average ? 1 : -1);
        final = final.concat(subgroup)
    });

    return final;
}

function createLetterTiles(word, coloring) {
    let board = document.getElementsByClassName("tile");
    let letters = [];

    for (let i = 0; i < board.length; i++) {
        letters.push(board[i]);
    }

    for (let i = 0; i < word.length; i++) {
        let tile = document.createElement("div");
        tile.classList.add(coloring.charAt(i));
        tile.innerHTML = word.charAt(i);

        letters.push(tile);
    }

    return letters;
}

function countResults(best, answers, guesses, results, attempt, difficulty, differences) {
    if (answers.length <= 2) {
        if (answers.length == 0) {
            results[attempt]++;
            results[results.length-1]--;
        }  
        
        if (answers.length <= 2 && answers.length != 0 && attempt < results.length - 1) {
            results[attempt+1]++;
            results[results.length-1]--;
        }

        if (answers.length == 2 && attempt < results.length - 2) {
            results[attempt+2]++;
            results[results.length-1]--;
        } 
    } else if (attempt <= 3) {
        let new_guesses = answers.concat(guesses);
        new_guesses = [...new Set(new_guesses)];

        let letters = createLetterTiles(best.word, differences);

        if (isHardMode(difficulty)) {
            new_guesses = filterList(new_guesses, letters);
        }

        let best_words = reducesListMost(answers, new_guesses, true, true);
        let remaining = best_words[0].differences;

        Object.keys(remaining).forEach(function(key) {
            countResults(best_words[0], remaining[key], new_guesses, results, attempt+1, difficulty, key);
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

function reducesListMost(answers, guesses, isBot, futureGuess) {
    let best_words = [];
    let list_size = answers.length;

    for (let pos = 0; pos < guesses.length; pos++) {
        let differences = [];
        let compare = guesses[pos];
        let weighted = 0;

        for (let i = 0; i < answers.length; i++) {
            let s = answers[i];
            let diff = getDifference(compare, s); 

            if (differences[diff] == null) {
                differences[diff] = [];
            }

            if (diff != CORRECT.repeat(word_length)) {
                differences[diff].push(s);
            }

            let freq = differences[diff].length;
            
            if (freq > 0) {
                weighted += (freq/list_size)*freq - ((freq-1)/list_size)*(freq-1);
            }
        }

        let threes = 0;
        Object.keys(differences).forEach(function(key) {
            if (differences[key].length == 0) {
                threes += 1/answers.length;
            } else {
                threes += 1/answers.length*1/differences[key].length;
            }
        });

        threes = Math.min(1, threes);
        let adjusted = (1-threes)*weighted;

        best_words.push({word: compare, words_left: weighted, threes: threes, adjusted: adjusted, 
                        differences: differences, results: null, average: -1, wrong: -1});
        
        if (weighted < 1 && futureGuess) break;
        if (weighted == 1 && pos >= answers.length && futureGuess) break;
    }

    best_words.sort((a, b) => a.adjusted >= b.adjusted ? 1 : -1);
    return best_words;
}

function getDifference(word1, word2) {
    if (pairings[word1] != null) {
        if (pairings[word1][word2] != null) {
            return pairings[word1][word2];
        }
    }

    let diff = ""

    for (let j = 0; j < word_length; j++) {
        if (word1.charAt(j) == word2.charAt(j)) {
            diff += CORRECT;
        } else if (!word2.includes(word1.charAt(j))) {
            diff += INCORRECT;
        } else {
            let c = word1.charAt(j);

            if (count(word1, c) <= count(word2, c)) {
                diff += WRONG_SPOT;
            } else {
                diff += compareDoubles(word1, word2, c, j);
            }
        }
    }

    if (pairings[word1] != null) {
        pairings[word1][word2] = diff;
    } else {
        pairings[word1] = [];
        pairings[word1][word2] = diff;
    }

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

        if (b_list.length == 0) return "B";
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