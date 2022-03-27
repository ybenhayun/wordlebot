var word_length = 5;
var pairings = [];

const CORRECT = "G", INCORRECT = "B", WRONG_SPOT = "Y"; 

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
    initialList();

    $("#refresh").click(function() {
        $("#grid").html("");
        initialList();
    });

    $("#wordlebot").click(function() {
        testStartingWords();
    });

    $("select#num_letters").on('input', function() {
        setLength();
        removeTest();
        makeTables();
        initialList();

        localStorage.setItem("word length", word_length);
    });

    $("select#wordbank").on('input', function() {
        setWordbank();
        if ($(".tile").length) update();
        else initialList();

        // localStorage.setItem("word length", word_length);
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
        var val = $("#word_entered").val();
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
            initialList();
        }
    });

    $(document).on('click', 'button.test', function() {
        var val = getWord();
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
        var row = "<div class = 'row'>"
        
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
    let new_color, old_color; 

    if (tile[0].classList.contains(INCORRECT)) {
        old_color = INCORRECT;
        new_color = CORRECT;
    } 

    else if (tile[0].classList.contains(CORRECT)) {
        old_color = CORRECT;
        new_color = WRONG_SPOT;
    }

    else if (tile[0].classList.contains(WRONG_SPOT)) {
        old_color = WRONG_SPOT;
        new_color = INCORRECT;
    }

    tile[0].classList.replace(old_color, new_color);
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
            easy[i].average = 100;
            easy[i].wrong = 10000;
        }
    }

    for (let i = 0; i < hard.length; i++) {
        if (hard[i][wordbank] != null) {
            hard[i].average = hard[i][wordbank].average;
            hard[i].wrong = hard[i][wordbank].wrong;
        } else {
            hard[i].average = 100;
            hard[i].wrong = 10000;
        }
    }
}

function update(initial) {
    if (document.getElementById("no-words") != null) {
        document.getElementById("no-words").remove();
    }

    var uncommon = false;
    var letters = document.getElementsByClassName("tile");
    var list = common.slice();

    list = filterList(list, letters);

    if (!list.length) {
        list = words.slice();
        list = filterList(list, letters);
        uncommon = true;
    }

    if (!list.length) {
        finalOptions([], []);
        return;
    }

    var alphabet = bestLetters(list);
    updateLetterList(alphabet, list.length);

    var sorted = sortList(list, alphabet);
    var newlist = words.slice();
    var full_list = sortList(newlist, alphabet, sorted);
    full_list = useTop(sorted.map(a => a.word), full_list.map(a => a.word), initial, false);
    // full_list = useTop(sorted.map(a => a.word), reduceList(full_list.map(a => a.word)), initial, false);

    full_list = full_list.filter((value, index, self) =>
        index === self.findIndex((t) => (
        t.word === value.word && t.rank === value.rank
        ))
    );

    if (uncommon) sorted = [];

    updateLists(sorted, full_list);

    return full_list;
}

function filterList(list, letters) {
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

function initialList() {

    const list_size = 11;
    var easy_guesses = easy.filter(a => a.word.length == word_length).sort((a, b) => a.average >= b.average ? 1 : -1);

    if (!easy_guesses.length) {
        update(true);
        return true;
    }

    var hard_guesses = hard.filter(a => a.word.length == word_length).sort((a, b) => a.average >= b.average ? 1 : -1);
    var fewest_wrong = hard.filter(a => a.word.length == word_length).sort((a, b) => a.wrong >= b.wrong ? 1 : -1);

    var easy_list = "";
    for (let i = 0; i < list_size && i < easy_guesses.length; i++) {
        let word = "<div class = 'suggestion'>" + easy_guesses[i].word + ": </div>";
        let score = "<div class = 'score'>" + easy_guesses[i].average.toFixed(3) + " guesses per solve.</div>";
        easy_list += "<li>" + word + score + "</li>";
    }   

    var hard_list = "";
    for (let i = 0; i < parseInt(list_size/2) && i < hard_guesses.length; i++) {
        let word = "<div class = 'suggestion'>" + hard_guesses[i].word + ": </div>";
        let score = "<div class = 'score'>" + hard_guesses[i].average.toFixed(3) + " guesses per solve.</div>";
        hard_list += "<li>" + word + score + "</li>";
    }

    var fewest_list = "";
    for (let i = 0; i < parseInt(list_size/2)  && i < fewest_wrong.length; i++) {
        let word = "<div class = 'suggestion'>" + fewest_wrong[i].word + ": </div>";
        let percentage;
        if (fewest_wrong[i].wrong < 1) {
            percentage = (100 - fewest_wrong[i].wrong*100).toFixed(2);
        } else {
            percentage = (((common.length-fewest_wrong[i].wrong)/common.length)*100).toFixed(2);
        }

        let score = "<div class = 'score'>" + percentage + "% of words solved.</div>";
        fewest_list += "<li>" + word + score + "</li>";
    }

    var heading = document.getElementsByClassName("num_options")[0];
    var subheading = document.getElementsByClassName("by_likelihood")[0];
    var normal_suggestions = document.getElementsByClassName("best-guesses normal")[0].getElementsByTagName("ul")[0];
    var hard_suggestions = document.createElement("ul");    
    var fewest_suggestions = document.createElement("ul");
    var hard_heading = document.createElement("h3");
    var fewest_heading = document.createElement("h3");

    heading.innerHTML = words.length + " possible word" + ((words.length > 1) ? "s" : "");
    subheading.innerHTML = common.length + " probable answers, " + (words.length - common.length) + " unlikely possibilities.";
    normal_suggestions.innerHTML = easy_list;
    hard_heading.innerHTML = "by lowest average score";
    hard_suggestions.innerHTML = hard_list;
    fewest_heading.innerHTML = "by fewest misses";
    fewest_suggestions.innerHTML = fewest_list;

    document.getElementsByClassName("best-guesses hard")[0].innerHTML = "";
    document.getElementsByClassName("best-guesses hard")[0].append(hard_heading);
    document.getElementsByClassName("best-guesses hard")[0].append(hard_suggestions);
    document.getElementsByClassName("best-guesses hard")[0].append(fewest_heading);
    document.getElementsByClassName("best-guesses hard")[0].append(fewest_suggestions);

    document.getElementsByClassName("best_options")[0].innerHTML = "these are your best possible starting words:";

    var alphabet = bestLetters(common);
    updateLetterList(alphabet, common.length);
}

function updateLists(sorted, full_list) {
    const list_size = 10;
    var words_left = filterList(words.slice(), document.getElementsByClassName("tile"));
    // var hard_guesses = full_list.filter(a => words_left.includes(a.word));
    var hard_guesses = useTop(sorted.map(a => a.word), words_left, false, false, true);
    var less_likely = hard_guesses.filter(a => !sorted.some(b => b.word == a.word));

    var easy_suggestions = "";
    for (let i = 0; i < sorted.length && i < list_size; i++) {
        let info = full_list[i].guesses_left.toFixed(2) + " guesses remaining.";
        let suggestion = "<div class = 'suggestion'>" + full_list[i].word + ":</div> <div class = 'score'>" + info + "</div>";
        easy_suggestions += "<li>" + suggestion + "</li>";
    }

    hard_suggestions = "";
    for (let i = 0; i < sorted.length && i < list_size; i++) {
        let info = hard_guesses[i].guesses_left.toFixed(2) + " guesses remaining.";
        let suggestion = "<div class = 'suggestion'>" + hard_guesses[i].word + ":</div> <div class = 'score'>" + info + "</div>";
        hard_suggestions += "<li>" + suggestion + "</li>";
    }

    var heading = document.getElementsByClassName("num_options")[0];
    var subheading = document.getElementsByClassName("by_likelihood")[0];
    var normal_list = document.getElementsByClassName("best-guesses normal")[0].getElementsByTagName("ul")[0];
    var guess_heading = document.createElement("h3");
    var hard_list = document.createElement("ul");  

    const unlikely = hard_guesses.length - sorted.length;

    heading.innerHTML = words_left.length + " possible word" + ((words_left.length != 1) ? "s" : "");
    subheading.innerHTML = "<span class = 'showlist'><div></div>" + sorted.length + " probable answer" + ((sorted.length != 1) ? "s" : "") + "</span>, " 
                            + "<span class = 'showlist'><div></div>" + unlikely + " unlikely possibilit" + ((unlikely != 1) ? "ies" : "y") + "</span>.";
    
    normal_list.innerHTML = easy_suggestions;
    hard_list.innerHTML = hard_suggestions;

    document.getElementsByClassName("best-guesses hard")[0].innerHTML = "";
    document.getElementsByClassName("best-guesses hard")[0].append(hard_list);
    document.getElementsByClassName("best_options")[0].innerHTML = "these are your best possible guesses:";

    var word_lists = document.getElementsByClassName("showlist");
    var potential_answers = word_lists[0].getElementsByTagName("div")[0];
    var technically_words = word_lists[1].getElementsByTagName("div")[0];

    potential_answers.innerHTML = "";
    for (let i = 0; i < sorted.length; i++) {
        potential_answers.innerHTML += sorted[i].word + "<br>";
    }
    potential_answers.innerHTML = "<p>" + potential_answers.innerHTML + "</p>";

    technically_words.innerHTML = "";
    for (let i = 0; i < less_likely.length; i++) {
        technically_words.innerHTML += less_likely[i].word + "<br>";
    }
    technically_words.innerHTML = "<p>" + technically_words.innerHTML + "</p>";
    
    if (sorted.length <= 2) {
        finalOptions(sorted, less_likely);
    }
}

function finalOptions(sorted, less_likely) {
    if (!sorted.length && !less_likely.length) {
        const no_words = "<div id = 'nowords'>it doesn't look like we have this word. double check to make sure you all the clues you entered are correct.</div>"

        document.getElementsByClassName("best_options")[0].innerHTML = "";
        document.getElementsByClassName("best-guesses normal")[0].getElementsByTagName("ul")[0].innerHTML = no_words;
        document.getElementsByClassName("best-guesses hard")[0].innerHTML = no_words;
    }

    if (sorted.length) {
        let final_words = "<li class = 'likely'>the word is almost certainly ";

        if (sorted.length == 2) {
            final_words += "<span class = 'final'>" + sorted[0].word + "</span> or <span class = 'final'>" + sorted[1].word + "<span></li>";
        }

        else {
            final_words += "<span class = 'final'>" + sorted[0].word + "</span></li>";
        }


        // normal slide
        document.getElementsByClassName("best-guesses normal")[0].getElementsByTagName("ul")[0].innerHTML = final_words;

        // hard slide
        document.getElementsByClassName("best-guesses hard")[0].getElementsByTagName("ul")[0].innerHTML = final_words;
    }

    if (less_likely.length) {
        let extra = "<li class = 'others'>Unlikely, but it might be ";

        for (let i = 0; i < less_likely.length; i++) {
            extra += "<span class = 'final'>" + less_likely[i].word + "</span>";

            if (i < less_likely.length - 1) extra += ", ";
            else extra += "."
        } 

        extra += "</li>";
    
        document.getElementsByClassName("best-guesses normal")[0].getElementsByTagName("ul")[0].innerHTML += extra;
        document.getElementsByClassName("best-guesses hard")[0].getElementsByTagName("ul")[0].innerHTML += extra;
    }
}

function bestLetters(list) {
    if (!list.length) return [];

    var alphabet = [];

    for (var c = 65; c <= 90; c++) {
        alphabet[String.fromCharCode(c)] = [];
        for (var i = 0; i < word_length+1; i++) {
            alphabet[String.fromCharCode(c)].push(0);
        }
    }

    var checked;

    for (var i = 0; i < list.length; i++) {
        checked = [];
        for (var j = 0; j < word_length; j++) {
            c = list[i].charAt(j);

            alphabet[c][j]++;

            if (checked[c] != true) alphabet[c][word_length]++;  // only counts letters once per word
            checked[c] = true;
        }
    }

    return alphabet;
}

function updateLetterList(alphabet, list_size) {
    var letters_ranked = [];

    for (var i = 0; i < 26; i++) {
        letters_ranked.push({letter:String.fromCharCode(i+65), score:alphabet[String.fromCharCode(i+65)][word_length]});
    }

    letters_ranked.sort((a, b) => (a.score <= b.score) ? 1 : -1);

    document.getElementsByClassName('best-letters')[0].innerHTML = "";
    var most_frequent = 0;

    for (var c = 0; c < 26; c++) {
        let freq = parseFloat(letters_ranked[c].score/list_size*100).toFixed(2);
        let letter = "<div class = 'letter-ranking'><div class = 'letter'>" + letters_ranked[c].letter + "</div>";
        let score = "<div class = 'frequency'>" + freq + "%</div></div>";

        if (freq == 0) {
            break;
        } else document.getElementsByClassName('best-letters')[0].innerHTML += "<li>" + letter + score + "</li>";
        
        if (freq != 100) {
            var red = 0 * (freq/100 / (letters_ranked[most_frequent].score/list_size));
            var green = 0 * (freq/100 / (letters_ranked[most_frequent].score/list_size));
            var blue = 200 * (freq/100 / (letters_ranked[most_frequent].score/list_size));
            
            document.getElementsByClassName('letter-ranking')[c].style.backgroundColor = "rgb(" + red + ", " + green + ", " + blue + ")";
        } else {
            most_frequent++;
        }        
    }
}

function sortList(list, alphabet, sorted_list) {
    if (!list.length) return [];

    var newranks = [];

    list.forEach(function(w) {
        newranks.push({word: w, rank: 0});
    });

    checked = [];

    for (var i = 0; i < newranks.length; i++) {
        for (var j = 0; j < word_length; j++) {
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

function useTop(filtered, full_list, initial, isBot, hard_mode) {
    if (initial || !isBot) {
        var check_list = filtered;
        check_list = check_list.concat(full_list.slice(0, 2250));
    } else { 
        var check_list = filtered;
        check_list = check_list.concat(full_list);

        if (!isBot) {
            check_list = filtered.concat(full_list.slice(0, 2250));
        }
    }

    check_list = [...new Set(check_list)]; 

    return calculateBest(filtered, check_list, isBot, hard_mode);
}

const GUESSES_ALLOWED = 6;

function calculateBest(answers, guesses, isBot, hard_mode) {
    var best_words = reducesListMost(answers, guesses, isBot);
    const check_size = 50;

    let guesses_left = GUESSES_ALLOWED - (document.getElementsByClassName("tile").length/word_length);

    for (let i = 0; i < check_size && i < best_words.length; i++) {
        let remaining = best_words[i].differences;
        let results = new Array(guesses_left).fill(0);
        results.push(answers.length);

        Object.keys(remaining).forEach(function(key) {
            countResults(best_words[i], remaining[key], guesses, results, 0, hard_mode)
        });
    }

    best_words.sort((a, b) => a.guesses_left >= b.guesses_left ? 1 : -1);

    return best_words;
}

function createLetterTiles(word, coloring, letters) {
    let board = document.getElementsByClassName("tile");

    if (!letters.length) {
        for (let i = 0; i < board.length; i++) {
            letters.push(board[i]);
        }
    }

    for (let i = 0; i < word.length; i++) {
        let tile = document.createElement("div");
        tile.classList.add(coloring.charAt(i));
        tile.innerHTML = word.charAt(i);

        letters.push(tile);
    }

    return letters;
}

function countResults(best, answers, guesses, results, attempt, hard_mode) {
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

        let best_words = reducesListMost(answers, new_guesses, true);
        let remaining = best_words[0].differences;

        Object.keys(remaining).forEach(function(key) {
            countResults(best_words[0], remaining[key], new_guesses, results, attempt+1, hard_mode);
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
    avg += results.at(-1)*100;

    best.guesses_left = avg;
}

function reducesListMost(answers, guesses, isBot) {
    let best_words = [];
    let list_size = answers.length;

    for (let pos = 0; pos < guesses.length; pos++) {
        var differences = [];
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

        best_words.push({word: compare, rank: weighted, threes: threes, adjusted: adjusted, differences: differences, results: null, guesses_left: 100});
        if (weighted < 1 && isBot) break;
        if (weighted == 1 && pos >= answers.length && isBot) break;
    }

    // best_words.sort((a, b) => a.rank >= b.rank ? 1 : -1);
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
    var a_list = getSpots(a, char);
    var b_list = getSpots(b, char);

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
    var count = 0;

    for (let i = 0; i < string.length; i++) {
        if (string[i] == char) count++;
    }

    return count;
}