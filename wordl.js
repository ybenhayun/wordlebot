var word_length = 5;
var guesses = 6;

var style = window.getComputedStyle(document.documentElement);

const correct_color = style.getPropertyValue('--correct-color');
const wrong_spots_color = style.getPropertyValue('--wrong-spots-color');
const incorrect_color = style.getPropertyValue('--incorrect-color');
const ignore_color = style.getPropertyValue('--ignore-color');

const colors = [incorrect_color, correct_color, wrong_spots_color, ignore_color];
const clr = {"G": correct_color, "Y": wrong_spots_color, "B": incorrect_color };

$(document).ready(function() {
    pairings = [];

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
    $("#word_entered").focus();

    $("#refresh").click(function() {
        // testStartingWords();
        $("#grid").html("");
        initialList();
        $(".submission").focus();
    });

    $("select#num_letters").on('input', function() {
        setLength();
        removeTest();
        makeTables();
        initialList();
        $("#word_entered").focus();

        localStorage.setItem("word length", word_length);
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

        // if (color == colors[3]) new_color = colors[0];
        // else if (color == colors[0]) new_color = colors[1];
        // else if (color == colors[1]) new_color = colors[2];
        // else {
        //     new_color = colors[3];
        //     $(this).css("color", "black");
        // }

        if (color == incorrect_color) new_color = correct_color;
        else if (color == correct_color) new_color = wrong_spots_color;
        else if (color == ignore_color) new_color = incorrect_color;
        else {
            new_color = ignore_color;
            $(this).css("color", "black");
        }

        $(this).css("background-color", new_color);
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
        else update();
    });

    $(document).on('click', 'button.test', function() {
        var val = getWord();
        setupTest(val);
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
            row += "<button class = 'tile " + c + "'>" + val[i] + "</button>"
        }
        
        row += "</div><div class = 'buttons'><button class = 'filter'>Filter list</button>"
        row += "<button class = 'undo'>Go Back</button>"
        row += "<button class = 'test'>Test</button>"
        
        row += "</div>"
        document.getElementById("grid").innerHTML += row;
    }

    document.getElementById("word_entered").value = "";


    var letters = document.getElementsByClassName("tile");
    for (let i = Math.max(0, letters.length - word_length); i < letters.length; i++) {
        document.getElementsByClassName("tile")[i].style.backgroundColor = incorrect_color;
    }
}

function setLength() {
    word_length = document.getElementById("num_letters").value;

    document.getElementById('word_entered').setAttribute('maxlength', word_length); 
    document.getElementById('word_entered').value = "";
    document.getElementById('grid').innerHTML = "";

    common = common_words.filter((element) => {return element.length == word_length});
    words = big_list.filter((element) => {return element.length == word_length; });
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
    correctLetters(list, letters);
    wrongSpots(list, letters);
    wrongLetters(list, letters);

    return list;
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
        let score = "<div class = 'score'>" + (((common.length-fewest_wrong[i].wrong)/common.length)*100).toFixed(2) + "% of words solved.</div>";
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
    var words_left = filterList(full_list.map(a => a.word), document.getElementsByClassName("tile"));
    var hard_guesses = full_list.filter(a => words_left.includes(a.word));
    var less_likely = hard_guesses.filter(a => !sorted.some(b => b.word == a.word));

    var easy_suggestions = "";
    for (let i = 0; i < sorted.length && i < list_size; i++) {
        let suggestion = "<div class = 'suggestion'>" + full_list[i].word + ":</div> <div class = 'score'> reduces list to " + full_list[i].rank.toFixed(2) + " words.</div>";
        easy_suggestions += "<li>" + suggestion + "</li>";
    }

    hard_suggestions = "";
    for (let i = 0; i < sorted.length && i < list_size; i++) {
        let suggestion = "<div class = 'suggestion'>" + hard_guesses[i].word + ":</div> <div class = 'score'> reduces list to " + hard_guesses[i].rank.toFixed(2) + " words.</div> ";
        hard_suggestions += "<li>" + suggestion + "</li>";
    }

    var heading = document.getElementsByClassName("num_options")[0];
    var subheading = document.getElementsByClassName("by_likelihood")[0];
    var normal_list = document.getElementsByClassName("best-guesses normal")[0].getElementsByTagName("ul")[0];
    var guess_heading = document.createElement("h3");
    var hard_list = document.createElement("ul");  

    const unlikely = hard_guesses.length - sorted.length;

    heading.innerHTML = words_left.length + " possible word" + ((words_left.length != 1) ? "s" : "");
    subheading.innerHTML = sorted.length + " probable answer" + ((sorted.length != 1) ? "s" : "") + ", " + unlikely + " unlikely possibilit" + ((unlikely != 1) ? "ies" : "y") + ".";
    normal_list.innerHTML = easy_suggestions;
    hard_list.innerHTML = hard_suggestions;

    document.getElementsByClassName("best-guesses hard")[0].innerHTML = "";
    document.getElementsByClassName("best-guesses hard")[0].append(hard_list);
    document.getElementsByClassName("best_options")[0].innerHTML = "these are your best possible guesses:";

    if (sorted.length <= 2) {
        finalOptions(sorted, less_likely);
    }
}

function finalOptions(sorted, less_likely) {
    if (sorted.length) {
        let final_words = "<li class = 'likely'>the word is almost certainly ";

        if (sorted.length == 2) {
            final_words += "<span class = 'final'>" + sorted[0].word + "</span> or <span class = 'final'>" + sorted[1].word + "<span></li>";
        }

        else {
            final_words += "<span class = 'final'>" + sorted[0].word + "</span></li>";
        }

        document.getElementsByClassName("best_options")[0].innerHTML = "";

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

function useTop(filtered, full_list, initial, isBot) {
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
            if (weighted > min && isBot) continue outer;
        }

        min = Math.min(weighted, min);

        best_words.push({word: compare, rank: weighted});
        
        if (weighted == 1 && isBot) {
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