var word_length = 5;
var guesses = 6;

$(document).ready(function() {
    setLength();
    makeTables();
    filterList();

    $("#reset").click(function() {
        $('input').not("#myRange").val('');
        filterList();
    });

    $("#num_letters").change(function() {
        changeLength();
        setLength();
        makeTables();
        filterList();
    });

    $(document).on('keyup', 'input', function(e) {
        if (e.which == 37 || e.which == 38 || e.which == 39 || e.which == 40) return; 
        if (this.value.length == this.maxLength) {   //entered input
            $(this).parent().next("td").find("input").focus();      
        }

        filterList();
    });

    $(document).on('keydown', 'input', function(e) {
        if (e.which == 8) {   //backspace
            if (this.value.length == 0) $(this).parent().prev("td").find("input").focus();
            else { 
                if (this.value.length == this.maxLength) this.value = '';
                filterList();
            }
        } else if (e.which == 39) {   //right
            $(this).parent().next("td").find("input").focus();      
        } else if (e.which == 37) {   //left
            $(this).parent().prev("td").find("input").focus();      
        } else if (e.which == 38) {   //up
            var col = $(this).parent().index();
            $(this).parent().parent().prev("tr").children().eq(col).find("input").focus();      
        } else if (e.which == 40) {   //down
            var col = $(this).parent().index();
            $(this).parent().parent().next("tr").children().eq(col).find("input").focus();      
        } 
    });

});

function makeTables() {
    var correct_letters = "<table><tr>";

    for(var i = 0; i < word_length; i++){
        correct_letters += "<td><input onkeypress = 'return /[a-z]/i.test(event.key)' oninput= 'this.value = this.value.toUpperCase()' type = 'letter' maxlength = '1 size = '1'></td>";
    }

    correct_letters +=  '</tr></table>';
    document.getElementById("correct").getElementsByTagName("table")[0].innerHTML = correct_letters;

    var wrong_spots = "<table>";

    for (var i = 0; i < guesses; i++) {
        wrong_spots += '<tr>';
        for (var j = 0; j < word_length; j++) {
            wrong_spots += "<td><input onkeypress = 'return /[a-z]/i.test(event.key)' oninput= 'this.value = this.value.toUpperCase()' type = 'letter' maxlength = '1 size = '1'></td>";
        }
        wrong_spots += '</tr>';
    }
    wrong_spots += '</table>';

    document.getElementById("wrong_spots").getElementsByTagName("table")[0].innerHTML = wrong_spots;
    document.getElementById("incorrect").getElementsByTagName("table")[0].innerHTML = 
    "<table><tr><td><input onkeypress = 'return /[a-z]/i.test(event.key)' oninput= 'this.value = this.value.toUpperCase()' type = 'letter' size = '1'></td></tr>";
}

function changeLength() {
    word_length = document.getElementById("num_letters").value;
}


function setLength() {
    common = common_words.filter((element) => {return element.length == word_length});
    words = big_list.filter((element) => {return element.length == word_length; });
}

function filterList() {
    // let list_size = 25;
    var filtered = common.slice();
    filtered = filtered.map(function(x){ return x; })

    wrongSpots(filtered);
    correctLetters(filtered);
    wrongLetters(filtered);

    var alphabet = bestLetters(filtered);

    var sorted = sortList(filtered, alphabet);
    var newlist = words.slice();
    var full_list = sortList(newlist, alphabet, sorted);

    full_list = useTop(sorted, full_list);

    updateLists(sorted, full_list);
}

function updateLists(sorted, full_list) {
    var list_size = 25;

    document.getElementById("count").innerHTML = sorted.length + " possible word" + (sorted.length != 1 ? "s" : "") + "."
    document.getElementById("list").innerHTML = "";

    var fully_sorted = [];
    for (let i = 0; i < full_list.length; i++) {
        if (sorted.filter(e => e.word == full_list[i].word).length > 0) {
            fully_sorted.push(full_list[i]);
        }
    }

    sorted = fully_sorted;
    
    var best_word = sorted[0].rank;

    for (var i = 0; i < sorted.length && i < list_size; i++) { 
        if (sorted[i].rank == best_word) document.getElementById("list").innerHTML += "<span class = 'best_word'>" + sorted[i].word + "</span>";
        else break;
        
        if (i < sorted.length - 1) document.getElementById("list").innerHTML += ", ";
    }
    
    for (var j = i; j < sorted.length && j < list_size; j++) {
        document.getElementById("list").innerHTML += sorted[j].word; 
        if (j < sorted.length - 1) document.getElementById("list").innerHTML += ", ";
    }

    if (sorted.length > list_size) document.getElementById("list").innerHTML += "..."

    var best_word = full_list[0].rank;

    document.getElementById("newlist").innerHTML = "";
    for (var i = 0; i < full_list.length && i < 20; i++) { 
        if (full_list[i].rank == best_word) document.getElementById("newlist").innerHTML += "<span class = 'best_word'>" + full_list[i].word + "</span>";
        else break;
        
        if (i < full_list.length - 1) document.getElementById("newlist").innerHTML += ", ";
    }
    
    for (var j = i; j < full_list.length && j < 20; j++) {
        document.getElementById("newlist").innerHTML += full_list[j].word; 
        if (j < full_list.length - 1) document.getElementById("newlist").innerHTML += ", ";
    }

    if (full_list.length > 20) document.getElementById("newlist").innerHTML += "..."
}

function bestLetters(list) {
    if (!list.length) return [];

    var alphabet = [];
    // var sorted = [];
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
            if (c == "") continue;

            alphabet[c][j]++;

            if (checked[c] != true) alphabet[c][word_length]++;  // only counts letters once per word
            checked[c] = true;
        }
    }

    for (var i = 0; i < 26; i++) {
        letters_ranked.push({letter:String.fromCharCode(i+65), score:alphabet[String.fromCharCode(i+65)][word_length]});
    }

    letters_ranked.sort((a, b) => (a.score <= b.score) ? 1 : -1);
    document.getElementById('best').innerHTML = "";
    for (var c = 0; c < 26; c++) {
        document.getElementById('best').innerHTML += "<li>" + letters_ranked[c].letter + ":   " + parseFloat(letters_ranked[c].score/list.length*100).toFixed(1) + "%</li>";
    }

    return alphabet;
}

function sortList(list, alphabet, sorted_list) {
    if (!list.length) return [];

    newranks = [];

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

    var sub_list = [];
    var place = 0;
    var current = newranks[place].rank;

    for (var i = 0; i < newranks.length; i++) {
        if (newranks[i].rank == current && i < newranks.length - 1) { 
            sub_list.push(newranks[i]);
        } else {
            if (i == newranks.length - 1) sub_list.push(newranks[i]);
            for (var j = 0; j < sub_list.length; j++) {
                for (var k = 0; k < word_length; k++) {
                    sub_list[j].rank += alphabet[sub_list[j].word.charAt(k)][k];
                }
            } 

            sub_list.sort((a, b) => (a.rank <= b.rank) ? 1 : -1);

            for (var j = 0; j < sub_list.length; j++) {
                newranks[j+place] = sub_list[j];
            }

            current = newranks[i].rank;
            place = i;
            sub_list = [];
            sub_list.push(newranks[i]);
        }
    }

    return newranks;
}

function useTop(sorted, full_list) {
    if (sorted.length <= 2) return sorted;

    var check_list = sorted.slice(0, 250);
    check_list = check_list.concat(full_list.slice(0, 250));

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
                        // var places = getSpots(compare, c);
                        // var x = places.indexOf(j);

                        // // places.splice(x, 1);

                        // if (j > places[0]) {
                        //     diff += "B";
                        // } else if (compare.charAt(places[0]) == w.charAt(places[0])) {
                        //     diff += "B";
                        // } else {
                        //     diff += "Y";
                        // }
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
        var list_size = sorted.length;

        Object.keys(differences).forEach(function (key) { 
            let probability = (differences[key]/list_size)*differences[key];
            weighted += probability;
        });

        best_words.push({word: check_list[pos].word, rank: weighted});
    }

    best_words.sort((a, b) => a.rank >= b.rank ? 1 : -1);

    return best_words;
}
// pos is the position in the word the character is (ie: pos is 2 for 'a' and trap)
// place = is the spot in the indicies list that position is (ie: place = 1 for 'a' and 'aroma', a_list = [0, 4], and pos == 4)
function compareDoubles(a, b, char, pos) {
    var a_list = getSpots(a, char);
    var b_list = getSpots(b, char);

    // var place = a_list.findIndex(pos);

    var colors = [];

    for (let i = 0; i < a_list.length; i++) {
        for (let j = 0; j < b_list.lenght; j++) {
            if (a_list[i] == b_list[j]) {
                a_list.splice(i, 1);
                b_list.splice(j, 1);
                i--;
                j--;
            }

            if (b_list.length == 0) {
                return "B";
            }
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

function wrongLetters(list) {
    var letters = document.getElementById("incorrect").getElementsByTagName("table")[0].rows[0].cells[0].children[0].value;
    
    for (var i = 0; i < list.length; i++) {
        for (var j = 0; j < letters.length; j++) {
            if (list[i].includes(letters.charAt(j))) {
                list.splice(i, 1);
                i--;
                break;
            }
        }
    }
}

function wrongSpots(list) {
    var table = document.getElementById("wrong_spots").getElementsByTagName("table")[0];
    var letters = [];

    for (var i = 0; i < guesses; i++) {
        for (var j = 0; j < word_length; j++) {
            var char = table.rows[i].cells[j].children[0].value;
            if (char != '') letters.push({letter:char, place:j});
        }
    }

    if (letters.length) {
        for (var i = 0; i < list.length; i++) {
            for (var j = 0; j < letters.length; j++) {
                if (!list[i].includes(letters[j].letter)) {
                    list.splice(i, 1);
                    i--;
                    break;
                }

                if (list[i].charAt(letters[j].place) == letters[j].letter) {
                    list.splice(i, 1);
                    i--;
                    break;
                }
            }        
        }
    }
}

function correctLetters(list) {
    var table = document.getElementById("correct").getElementsByTagName("table")[0];
    var letters = [];

    for (var i = 0; i < word_length; i++) {
        letters.push(table.rows[0].cells[i].children[0].value); //first column
    }

    if (letters.some(element => element != '')) {
        for (var i = 0; i < list.length; i++) {
            for (var j = 0; j < word_length; j++) {
                if (letters[j] != '') {
                    if (letters[j] != list[i].charAt(j)) { 
                        list.splice(i, 1);
                        i--;
                        break;
                    }
                }
            }
        }
    }
}