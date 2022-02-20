var word_length = 5;
var guesses = 6;

const correct_color = "rgb(83, 141, 78)";
const wrong_spots_color = "rgb(181, 159, 59)";
const incorrect_color = "rgb(58, 58, 60)"
const ignore_color = "rgb(255, 255, 255)";
const colors = [incorrect_color, correct_color, wrong_spots_color, ignore_color];

$(document).ready(function() {
    setLength();
    makeTables();
    filterList();
    $("#guess-word").focus();


    $("#refresh").click(function() {
        $(".guess").remove();
        $(".guess-buttons").remove();
        filterList();
        $("#guess-word").focus();
    });

    $("#num_letters").on('input', function() {
        setLength();
        makeTables();
        filterList();
        $("#guess-word").focus();
    });

    $("#enter-guesses").submit(function(e) {
        e.preventDefault();
    });
    
    $("#enter-guesses").on('input', function(e) {
        e.preventDefault();
        var val = $("#guess-word").val();
        makeTables(val);
        if (val.length == word_length) $("#guess-word").blur();

        if (word_length == 11) {
            $(".guess-letter").css('font-size', '1rem');
        }
    });

    $(document).on('click', 'button.guess-letter', function() {
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
        filterList();
        $("#guess-word").focus();
    });

    $(document).on('click', '.remove', function() {
        $(".guess:last").remove();

        if ($(".guess").length == 0) {
            $(".guess-buttons").remove();
        }

        filterList();
        $("#guess-word").focus();
    });
});

function makeTables(val) {
    
    if (!words.includes(val)) return;
    
    let buttons = document.getElementsByClassName("guess-buttons");
    if (buttons.length > 0) buttons[0].remove();
    
    if (val) {
        var guess = "<div class = guess>"
        
        for (let i = 0; i < word_length; i++) {
            guess += "<button class = guess-letter>" + val[i] + "</button>"
        }
        
        guess += "</div><div class = 'guess-buttons'><button class = 'filter'>Filter list</button>"
        guess += "<button class = 'remove'>Go Back</button>"
        
        guess += "</div>"
        document.getElementById("patterns").innerHTML += guess;
    }

    document.getElementById("guess-word").value = "";


    var letters = document.getElementsByClassName("guess-letter");
    for (let i = Math.max(0, letters.length - word_length); i < letters.length; i++) {
        document.getElementsByClassName("guess-letter")[i].style.backgroundColor = incorrect_color;
    }
}

function setLength() {
    word_length = document.getElementById("num_letters").value;

    document.getElementById('guess-word').setAttribute('maxlength', word_length); 
    document.getElementById('guess-word').value = "";
    document.getElementById('patterns').innerHTML = "";

    common = common_words.filter((element) => {return element.length == word_length});
    words = big_list.filter((element) => {return element.length == word_length; });

    document.getElementById('word-length').innerHTML = "currently solving " + word_length + " letter words.";
}

function filterList() {
    if (document.getElementById("no-words") != null) {
        document.getElementById("no-words").remove();
    }

    var letters = document.getElementsByClassName("guess-letter");
    var filtered = common.slice();

    correctLetters(filtered, letters);
    wrongSpots(filtered, letters);
    wrongLetters(filtered, letters);

    if (filtered.length) {

        var alphabet = bestLetters(filtered);

        var sorted = sortList(filtered, alphabet);
        var newlist = words.slice();
        var full_list = sortList(newlist, alphabet, sorted);

        full_list = useTop(sorted, full_list);
        
        updateLists(sorted, full_list);
    } else {
            var no_words = document.createElement("div");
            no_words.setAttribute("id", "no-words");

            no_words.innerHTML = "whatever word this is, we don't have it."

            document.getElementById("words").appendChild(no_words);
    }
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
    var letters_ranked = [];

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

    for (var i = 0; i < 26; i++) {
        letters_ranked.push({letter:String.fromCharCode(i+65), score:alphabet[String.fromCharCode(i+65)][word_length]});
    }

    letters_ranked.sort((a, b) => (a.score <= b.score) ? 1 : -1);
    document.getElementsByClassName('best-letters')[0].innerHTML = "";
    var most_frequent = 0;

    for (var c = 0; c < 26; c++) {
        let freq = parseFloat(letters_ranked[c].score/list.length*100).toFixed(2);
        let letter = "<div class = 'letter-ranking'><div class = 'letter'>" + letters_ranked[c].letter + "</div>";
        let score = "<div class = 'frequency'>" + freq + "%</div></div>";

        if (freq == 0) {
            break;
        } else document.getElementsByClassName('best-letters')[0].innerHTML += "<li>" + letter + score + "</li>";
        
        if (freq != 100) {
            var red = 0 * (freq/100 / (letters_ranked[most_frequent].score/list.length));
            var green = 0 * (freq/100 / (letters_ranked[most_frequent].score/list.length));
            var blue = 200 * (freq/100 / (letters_ranked[most_frequent].score/list.length));
            
            document.getElementsByClassName('letter-ranking')[c].style.backgroundColor = "rgb(" + red + ", " + green + ", " + blue + ")";
        } else {
            most_frequent++;
        }        
    }

    return alphabet;
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
            // newranks[i].rank += alphabet[newranks[i].word.charAt(j)][j];    // makes TARES top word
            checked[i + " " + newranks[i].word.charAt(j)] = true;
        }
    }
        
    newranks.sort((a, b) => (a.rank <= b.rank) ? 1 : -1);

    return newranks;
}

function useTop(sorted, full_list) {
    var list_size = sorted.length;

    var check_list = sorted.slice(0, 250);

    if (list_size <= 250) {
        check_list = check_list.concat(full_list);
    } else {
        check_list = check_list.concat(full_list.slice(0, 250));
    }

    var checked = [];
    for (let i = 0; i < check_list.length; i++) {
        if (checked[check_list[i].word]) {
            check_list.splice(i, 1);
            i--;
        } else {
            checked[check_list[i].word] = true;
        }
    }

    var best_words = [];

    for (let pos = 0; pos < check_list.length; pos++) {
        var differences = [];
        var compare = check_list[pos].word;
        var max = 0;
        for (let i = 0; i < sorted.length; i++) {
            var diff = "";
            for (let j = 0; j < word_length; j++) {
                if (compare.charAt(j) == sorted[i].word.charAt(j)) {
                    diff += "G";
                } else if (!sorted[i].word.includes(compare.charAt(j))) {
                    diff += "B";
                } else {
                    var c = compare.charAt(j);
                    var w = sorted[i].word;

                    if (count(compare, c) == 1) {
                        diff += "Y";
                    } else if (count(compare, c) <= count(w, c)) {
                        diff += "Y";
                    } else {
                        diff += compareDoubles(compare, w, c, j);
                    }
                }
            }

            if (differences[diff] != null) {
                differences[diff]++;
            } else {
                differences[diff] = 1;
            }
        }

        var weighted = 0;

        Object.keys(differences).forEach(function (key) { 
            let probability = (differences[key]/list_size)*differences[key];
            weighted += probability;

            // max = Math.max(differences[key], max);
        });

        best_words.push({word: check_list[pos].word, rank: weighted});
        // best_words.push({word: check_list[pos].word, rank: max});
    }

    best_words.sort((a, b) => a.rank >= b.rank ? 1 : -1);

    return best_words;
}

// pos is the position in the word the character is (ie: pos is 2 for 'a' and trap)
// place = is the spot in the indicies list that position is (ie: place = 1 for 'a' and 'aroma', a_list = [0, 4], and pos == 4)
function compareDoubles(a, b, char, pos) {
    var a_list = getSpots(a, char);
    var b_list = getSpots(b, char);

    for (let i = 0; i < a_list.length; i++) {
        if (b_list.includes(a_list[i])) {
            a_list.splice(i, 1);
            i--;

            let index = b_list.indexOf(a_list[i]);
            b_list.splice(index, 1);
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

        if (b_list.length == 0) break;
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
}

function wrongSpots(list, all_letters) {
    var wrong_spots = [];
    var char_repeating = [];

    for (let i = 0; i < all_letters.length; i++) {
        if (i % word_length == 0) var repeated = [];

        if (all_letters[i].style.backgroundColor == wrong_spots_color) {
            wrong_spots.push({char: all_letters[i].innerHTML, index: i%word_length});

            if (repeated[all_letters[i].innerHTML]) {
                char_repeating[all_letters[i].innerHTML]++;
            } else {
                char_repeating[all_letters[i].innerHTML] = 1;
                repeated[all_letters[i].innerHTML] = true;
            }      
        }

        else if (all_letters[i].style.backgroundColor == correct_color) {
            if (repeated[all_letters[i].innerHTML]) {
                char_repeating[all_letters[i].innerHTML]++;
            } else {
                char_repeating[all_letters[i].innerHTML] = 1;
                repeated[all_letters[i].innerHTML] = true;
            }
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
}

function correctLetters(list, all_letters) {
    var correct_letters = [];

    for (let i = 0; i < all_letters.length; i++) {
        if (all_letters[i].style.backgroundColor == correct_color) {
            correct_letters.push({char: all_letters[i].innerHTML, index: i%word_length});
        }
    }    

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
}