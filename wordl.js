var word_length = 5;
var guesses = 6;

const correct_color = "rgb(83, 141, 78)";
const wrong_spots_color = "rgb(181, 159, 59)";
const incorrect_color = "rgb(58, 58, 60)"
const ignore_color = "rgb(255, 255, 255)";
const colors = [incorrect_color, correct_color, wrong_spots_color, ignore_color];
const clr = {"G": correct_color, "Y": wrong_spots_color, "B": incorrect_color };

var pairings = [];

$(document).ready(function() {
    localStorage.clear();

    setLength();
    makeTables();
    update(true);
    $("#guess-word").focus();

    $("#refresh").click(function() {
        $("#patterns").html("");
        removeTest();
        update(true);
        $(".submission").focus();
        // precomputeDifferences();
    });

    $("#num_letters").on('input', function() {
        setLength();
        removeTest();
        makeTables();
        update(true);
        $("#guess-word").focus();
    });
    
    $("#guess-word").on('input', function(e) {
        var val = $("#guess-word").val();
        if (words.includes(val)) {
            $("#guess-word").blur();
            
            removeTest();
            makeTables(val);
            
            if (word_length == 11) {
                $(".tile").css('font-size', '1rem');
            }
        } 
    });

    $(document).on('click', 'button.tile', function() {
        let color = $(this).css("background-color");
        let new_color;

        $(this).css("color", "white");

        if (color == colors[3]) new_color = colors[0];
        else if (color == colors[0]) new_color = colors[1];
        else if (color == colors[1]) new_color = colors[2];
        else {
            new_color = colors[3];
            $(this).css("color", "black");
        }
        $(this).css("background-color", new_color);
    });

    $(document).on('click', 'button.filter', function() {
        update();
    });

    $(document).on('click', '.remove', function() {
        $(".guess:last").remove();

        var initial = false;
        if (!$(".tile").length) {
            $(".guess-buttons").remove();
            initial = true;
        }

        update(initial);
    });

    $(document).on('click', 'button.test', function() {
        var val = getWord();
        setupTest(val);
    });


});

function getWord() {
    let tiles = document.getElementsByClassName("tile");
    var guess = "";

    for (let i = 0; i < word_length; i++) {
        guess += tiles[i].innerHTML;
    }

    return guess;
}

function precomputeDifferences() {
    for (let i = 0; i < common_words.length; i++) {
        if (!big_list.includes(common_words[i])) {
            console.log(common_words[i]);
            common_words.splice(i, 1);
            i--;
        }
    }

    console.log(common_words);
}

function removeTest() {
    document.getElementById("results").classList.remove("testing");
    document.getElementById("words").classList.remove("testing");
    document.getElementById("words-left").classList.remove("testing");
    document.getElementById("best-guesses").classList.remove("testing");
    if (document.getElementById("summary")) document.getElementById("summary").remove();    
}

function setupTest(word) {
    document.getElementById("results").classList.add("testing");
    document.getElementById("words").classList.add("testing");
    document.getElementById("words-left").classList.add("testing");
    document.getElementById("best-guesses").classList.add("testing");

    let guess_letters = document.getElementsByClassName("tile");

    document.getElementsByClassName("current")[0].appendChild(
        document.getElementById("patterns")
    );

    document.getElementsByClassName("guess-buttons")[0].remove();

    var count = document.getElementsByClassName("count");
    for (let i = 0; i < count.length; i++) {
        count[i].innerHTML = "0";
        document.getElementsByClassName("bar")[i].style.height = "1rem";
    }

    var tiles = document.getElementsByClassName("tile");
    for (let i = 0; i < tiles.length; i++) {
        tiles[i].classList.add("testing");
    }

    let new_form = document.createElement("div");
    new_form.setAttribute("id", "test-settings");

    var remembers = "<div><input type='checkbox' id='remembers' name='remembers'>"
    remembers += "<label for='remembers'>Bot remembers previous answers</label><br>"
    var hard = "<input type='checkbox' id='hard-mode' name='hard-mode'>"
    hard += "<label for='hard-mode'>Bot plays hard mode</label></div>"
    var submit_button = "<button class = 'bot'>Start WordleBot</button>"

    new_form.innerHTML = remembers + hard + submit_button;

    document.getElementById("results").appendChild(new_form);

    document.getElementsByClassName("bot")[0].addEventListener("click", function() {

        hard_mode = document.getElementById("hard-mode").checked;
        remembers_words = document.getElementById("remembers").checked;

        document.getElementById("test-settings").remove();

        runBot(word, hard_mode, remembers_words);
    });
}

function runBot(guess, hard_mode, remembers_words) {
    const startTime = performance.now();
    const test_size = common.length - 1;
    const increment = 1;
    var sum = 0;
    var i = 0;
    var count = 0;
    var scores = new Array(7).fill(0);

    var iv = setInterval(function() {
        document.getElementById("patterns").innerHTML = "";
        let n = wordleBot(guess, common[i], hard_mode, remembers_words);
        if (n == 7) {
            console.log(common[i]);
            // if (!hard_mode) clearInterval(iv);
        }

        sum += n;
        scores[n-1] += 1;

        let max = Math.max(...scores);

        let points = document.getElementsByClassName("count");
        let bars = document.getElementsByClassName("bar");
        points[n-1].innerHTML = scores[n-1];
        
        for (let x = 0; x < bars.length; x++) {
            bars[x].style.height = "calc(1rem + " + ((scores[x]/max)*100)*.33 + "%)";
        }

        document.getElementsByClassName("average")[0].innerHTML = "Average: " + parseFloat(sum/(count+1)).toFixed(3) + " guesses.";

        if (!remembers_words) i += increment;
        count++;

        if (count > test_size) {
            const endTime = performance.now();   
            console.log((endTime - startTime)/1000 + " seconds");

            document.getElementById("guesses").appendChild(
                document.getElementById("patterns")
            );
            document.getElementById("patterns").innerHTML = "";

            var average = parseFloat(sum/count).toFixed(3);
            document.getElementsByClassName("average")[0].innerHTML = "";

            var summary = guess + " solved all " + (test_size + 1) + " words with an average of " + average + " guesses per solve.";

            document.getElementsByClassName("current")[0].innerHTML = "<div id = 'summary'>" + summary + "</div>";
            clearInterval(iv);
        }
    }, 0);

    let average = sum/test_size;

    return average;
}

function wordleBot(guess, answer, hard_mode, remembers_words) {
    var attempts = 1;
    
    while (attempts <= 6) {
        makeTables(guess, "testing");
        if (document.getElementsByClassName("guess-buttons").length) {
            document.getElementsByClassName("guess-buttons")[0].remove();
        }

        var diff = getDifference(guess, answer);
        var letters = document.getElementsByClassName("tile");
        var pos = 0;
        
        for (let i = Math.max(0, letters.length - word_length); i < letters.length; i++) {
            document.getElementsByClassName("tile")[i].style.backgroundColor = clr[diff[pos]];;
            pos++;
        }
        
        if (guess == answer || attempts == 6) {
            if (remembers_words) common.splice(common.indexOf(answer), 1); // removes answer from list of possiblities
            if (guess != answer) attempts++;
            break;
        }
        
        attempts++;
        
        var letters = document.getElementsByClassName("tile");
        var list  = filterList(common.slice(), letters);
        var full_list = words.slice();

        if (hard_mode) {
            full_list = filterList(full_list, letters);
        } 
        else {
            if (list.length > 5) { 
                var wrong_letters = getWrongLetters(letters);
                full_list = removeWorthless(full_list, wrong_letters);
            } 
        }

        const max_size = 300000
        if (list.length * full_list.length > max_size) {
            let small_size = max_size/full_list.length;
            let big_size = max_size/list.length;

            var alphabet = bestLetters(list);
            
            list = sortList(list, alphabet);
            list = list.slice(0, small_size);
            list = list.map(a => a.word);
            
            full_list = sortList(full_list, alphabet, list);
            full_list = full_list.slice(0, big_size);
            full_list = full_list.map(a => a.word);
        }

        full_list = useTop(list, full_list);

        guess = full_list[0].word;    
    }

    return attempts;
}

function removeWorthless(list, wrong_letters) {
    if (!list.length) return [];

    outer:
    for (let i = 0; i < list.length; i++) {
        var word = list[i];

        for (let j = 0; j < wrong_letters.length; j++) {
            if (list[i].includes(wrong_letters[j])) {
                list.splice(i, 1);
                i--;
                continue outer;
            }
        }
    }

    return list;
}

function getWrongLetters(all_letters) {
    var wrong_letters = [];
    var doubles = [];

    for (let i = 0; i < all_letters.length; i++) {
        var hash = parseInt(i/word_length) + " " + all_letters[i].innerHTML;
        
        if (all_letters[i].style.backgroundColor == wrong_spots_color || all_letters[i].style.backgroundColor == correct_color) {
            if (doubles[hash] == null) {
                doubles[hash] = 1;
            } else {
                doubles[hash]++;
            }
        }
    }
    
    for (let i = 0; i < all_letters.length; i++) {
        var hash = parseInt(i/word_length) + " " + all_letters[i].innerHTML;

        if (all_letters[i].style.backgroundColor == incorrect_color) {
            if (doubles[hash] == null) {
                wrong_letters.push(all_letters[i].innerHTML);
            }
        }
    }

    return wrong_letters;
}

function makeTables(val, c) {
    if (c == null) c = "normal";
    
    if (!words.includes(val)) return;
    
    let buttons = document.getElementsByClassName("guess-buttons");
    if (buttons.length > 0) buttons[0].remove();
    
    if (val) {
        var guess = "<div class = guess>"
        
        for (let i = 0; i < word_length; i++) {
            guess += "<button class = 'tile " + c + "'>" + val[i] + "</button>"
        }
        
        guess += "</div><div class = 'guess-buttons'><button class = 'filter'>Filter list</button>"
        guess += "<button class = 'remove'>Go Back</button>"
        guess += "<button class = 'test'>Test</button>"
        
        guess += "</div>"
        document.getElementById("patterns").innerHTML += guess;
    }

    document.getElementById("guess-word").value = "";


    var letters = document.getElementsByClassName("tile");
    for (let i = Math.max(0, letters.length - word_length); i < letters.length; i++) {
        document.getElementsByClassName("tile")[i].style.backgroundColor = incorrect_color;
    }
}

function setLength() {
    word_length = document.getElementById("num_letters").value;

    document.getElementById('guess-word').setAttribute('maxlength', word_length); 
    document.getElementById('guess-word').value = "";
    document.getElementById('patterns').innerHTML = "";

    common = common_words.filter((element) => {return element.length == word_length});
    words = big_list.filter((element) => {return element.length == word_length; });
}

function update(initial) {
    if (document.getElementById("no-words") != null) {
        document.getElementById("no-words").remove();
    }

    var letters = document.getElementsByClassName("tile");
    var list = common.slice();

    list = filterList(list, letters);

    if (list.length) {
        var alphabet = bestLetters(list);
        updateLetterList(alphabet, list.length);

        var sorted = sortList(list, alphabet);
        var newlist = words.slice();
        var full_list = sortList(newlist, alphabet, sorted);

        full_list = useTop(sorted.map(a => a.word), full_list.map(a => a.word), initial);
        
        updateLists(sorted, full_list);
    } else {
            var no_words = document.createElement("div");
            no_words.setAttribute("id", "no-words");

            no_words.innerHTML = "whatever word this is, we don't have it."

            document.getElementById("words").appendChild(no_words);
    }

    return full_list;
}

function filterList(list, letters) {
    correctLetters(list, letters);
    wrongSpots(list, letters);
    wrongLetters(list, letters);

    return list;
}

function updateLists(sorted, full_list) {
    var list_size = 10;

    document.getElementById("words-left").getElementsByTagName("h2")[0].innerHTML = sorted.length + " possible word" + (sorted.length != 1 ? "s" : "");
    
    var fully_sorted = [];
    for (let i = 0; i < full_list.length; i++) {
        if (sorted.filter(e => e.word == full_list[i].word).length > 0) {
            fully_sorted.push(full_list[i]);
        }
    }
    
    sorted = fully_sorted;
    
    var best_guesses = "";
    for (let i = 0; i < sorted.length && i < list_size; i++) {
        let word = "<div class = 'suggestion'>" + full_list[i].word + ": </div>";
        let score = "<div class = 'score'>" + full_list[i].rank.toFixed(2) + "</div>";
        best_guesses += "<li>" + word + score + "</li>";
    }

    var words_left = "";
    for (let i = 0; i < sorted.length && i < list_size; i++) {
        let word = "<div class = 'suggestion'>" + sorted[i].word + ": </div>";
        let score = "<div class = 'score'>" + sorted[i].rank.toFixed(2) + "</div>";
        words_left += "<li>" + word + score + "</li>";
    }

    document.getElementById("best-guesses").getElementsByTagName("ul")[0].innerHTML = best_guesses;
    document.getElementById("words-left").getElementsByTagName("ul")[0].innerHTML = words_left;
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

function useTop(filtered, full_list, initial) {
    var list_size = filtered.length;

    if (initial) {
        var check_list = filtered.slice(0, 250);
        check_list = check_list.concat(full_list.slice(0, 250));
    } else { 
        var check_list = filtered;
        check_list = check_list.concat(full_list);
    }

    var best_words = [];
    var min = filtered.length;

    outer:
    for (let pos = 0; pos < check_list.length; pos++) {
        var differences = [];
        var compare = check_list[pos];
        var weighted = 0;

        for (let i = 0; i < filtered.length; i++) {
            var s = filtered[i];
            var diff = getDifference(compare, s);

            if (differences[diff] != null) {
                differences[diff]++;
            } else {
                differences[diff] = 1;
            }
            let freq = differences[diff];
            weighted += (freq/list_size)*freq - ((freq-1)/list_size)*(freq-1);
            if (weighted > min) continue outer;
        }

        min = Math.min(weighted, min);

        best_words.push({word: compare, rank: weighted});
        
        if (weighted == 1) {
            if (best_words.length >= filtered.length) break;
        }
    }

    best_words.sort((a, b) => a.rank >= b.rank ? 1 : -1);

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
            diff += "G";
        } else if (!word2.includes(word1.charAt(j))) {
            diff += "B";
        } else {
            let c = word1.charAt(j);

            if (count(word1, c) <= count(word2, c)) {
                diff += "Y";
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
            return "B";
        }
    }

    for (let i = 0; i < a_list.length; i++) {
        if (pos == a_list[i])  {
            return "Y";
        }

        a_list.splice(i, 1);
        b_list.splice(i, 1);
        i--;

        if (b_list.length == 0) return "B";
    }

    return "B";
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

function wrongLetters(list, all_letters) {
    var wrong_letters = [];
    var doubles = [];
    var wrong_spots = [];

    for (let i = 0; i < all_letters.length; i++) {
        var hash = parseInt(i/word_length) + " " + all_letters[i].innerHTML;
        
        if (all_letters[i].style.backgroundColor == wrong_spots_color || all_letters[i].style.backgroundColor == correct_color) {
            if (doubles[hash] == null) {
                doubles[hash] = 1;
            } else {
                doubles[hash]++;
            }
        }
    }
    
    for (let i = 0; i < all_letters.length; i++) {
        var hash = parseInt(i/word_length) + " " + all_letters[i].innerHTML;

        if (all_letters[i].style.backgroundColor == incorrect_color) {
            if (doubles[hash] != null) {
                wrong_spots.push({char: all_letters[i].innerHTML, index: i%word_length, count: doubles[hash]});
            } else {   
                wrong_letters.push(all_letters[i].innerHTML);
            }
        }
    }

    outer:
    for (let i = 0; i < list.length; i++) {
        for (let j = 0; j < wrong_spots.length; j++) {
            let pos = wrong_spots[j].index;
            let c = wrong_spots[j].char;

            if (list[i].charAt(pos) == c || count(list[i], c) > wrong_spots[j].count) {
                list.splice(i, 1);
                i--;
                continue outer;
            }
        }

        if (wrong_letters.some(r => list[i].includes(r))) {
            list.splice(i, 1);
            i--;
        }
    }

    return wrong_letters;
}

function wrongSpots(list, all_letters) {
    var wrong_spots = [];
    var char_repeating = [];
    var repeated = [];

    for (let i = 0; i < all_letters.length; i++) {
        if (all_letters[i].style.backgroundColor == wrong_spots_color) {
            wrong_spots.push({char: all_letters[i].innerHTML, index: i%word_length});

            if (repeated[all_letters[i].innerHTML]) {
                repeated[all_letters[i].innerHTML]++;
            } else {
                repeated[all_letters[i].innerHTML] = 1;
            }      
        }

        else if (all_letters[i].style.backgroundColor == correct_color) {
            if (repeated[all_letters[i].innerHTML]) {
                repeated[all_letters[i].innerHTML]++;
            } else {
                repeated[all_letters[i].innerHTML] = 1;
            }
        }

        if (i % word_length == word_length - 1) {
            Object.keys(repeated).forEach(function(r) {
                if (repeated[r] > char_repeating[r] || char_repeating[r] == null) {
                    char_repeating[r] = repeated[r];
                }
            });
            repeated = [];
        }
    }

    for (let i = 0; i < list.length; i++) {
        for (let j = 0; j < wrong_spots.length; j++) {
            let pos = wrong_spots[j].index;
            let c = wrong_spots[j].char;

            if (count(list[i], c) < char_repeating[c]) {
                list.splice(i, 1);
                i--;
                break;
            }

            if (list[i].charAt(pos) == c) {
                list.splice(i, 1);
                i--;
                break;
            }
        }
    }

    return list;
}

function getCorrectLetters(all_letters) {
    var correct_letters = [];

    for (let i = 0; i < all_letters.length; i++) {
        if (all_letters[i].style.backgroundColor == correct_color) {
            correct_letters.push({char: all_letters[i].innerHTML, index: i%word_length});
        }
    }    

    return correct_letters;
}

function correctLetters(list, all_letters) {
    var correct_letters = getCorrectLetters(all_letters);

    for (let i = 0; i < list.length; i++) {
        for (let j = 0; j < correct_letters.length; j++) {
            let pos = correct_letters[j].index;
            let c = correct_letters[j].char;

            if (list[i].charAt(pos) != c) {
                list.splice(i, 1);
                i--;
                break;
            }
        }
    }

    return list;
}