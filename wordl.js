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
    words = big_list.filter((element) => {return element.length == word_length; });
    words = words.filter((v, i, a) => a.indexOf(v) === i);
}

function filterList() {
    let list_size = 25;
    var filtered = words.slice();
    filtered = filtered.map(function(x){ return x.toUpperCase(); })

    wrongSpots(filtered);
    correctLetters(filtered);
    wrongLetters(filtered);

    var sorted = sortList(filtered);

    document.getElementById("count").innerHTML = sorted.length + " possible word" + (sorted.length != 1 ? "s" : "") + "."
    document.getElementById("list").innerHTML = "";
    
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
}

function sortList(list) {
    document.getElementById('best').innerHTML = "";
    if (!list.length) return [];

    var alphabet = [];
    var sorted = [];
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
            alphabet[list[i].charAt(j)][j]++;

            if (checked[list[i].charAt(j)] != true) alphabet[list[i].charAt(j)][word_length]++;  // only counts letters once per word
            checked[list[i].charAt(j)] = true;
        }

        sorted.push({word:list[i], rank:0});
    }



    for (var i = 0; i < 26; i++) {
        letters_ranked.push({letter:String.fromCharCode(i+65), score:alphabet[String.fromCharCode(i+65)][word_length]});
    }

    letters_ranked.sort((a, b) => (a.score <= b.score) ? 1 : -1);

    for (var c = 0; c < 26; c++) {
        document.getElementById('best').innerHTML += "<li>" + letters_ranked[c].letter + ":   " + parseFloat(letters_ranked[c].score/list.length*100).toFixed(1) + "%</li>";
    }

    checked = [];

    if (sorted.length > 10) {    
        for (var i = 0; i < sorted.length; i++) {
            for (var j = 0; j < word_length; j++) {
                if (checked[i + " " + sorted[i].word.charAt(j)] == true) continue;  //no extra credit to letters with doubles
                sorted[i].rank += alphabet[sorted[i].word.charAt(j)][word_length];
                // sorted[i].rank += alphabet[sorted[i].word.charAt(j)][j];    // makes TARES top word
                checked[i + " " + sorted[i].word.charAt(j)] = true;
            }
        }
    }
        
    sorted.sort((a, b) => (a.rank <= b.rank) ? 1 : -1);

    var sub_list = [];
    var place = 0;
    var current = sorted[place].rank;

    for (var i = 0; i < sorted.length; i++) {
        if (sorted[i].rank == current && i < sorted.length - 1) { 
            sub_list.push(sorted[i]);
        } else {
            if (i == sorted.length - 1) sub_list.push(sorted[i]);
            for (var j = 0; j < sub_list.length; j++) {
                for (var k = 0; k < word_length; k++) {
                    sub_list[j].rank += alphabet[sub_list[j].word.charAt(k)][k];
                }
            } 

            sub_list.sort((a, b) => (a.rank <= b.rank) ? 1 : -1);

            for (var j = 0; j < sub_list.length; j++) {
                sorted[j+place] = sub_list[j];
            }

            current = sorted[i].rank;
            place = i;
            sub_list = [];
            sub_list.push(sorted[i]);
        }
    }

    bestGuess(alphabet, sorted);

    return sorted;
}

function bestGuess(alphabet, sorted) {
    if (sorted.length == words.length) return document.getElementById("newlist").innerHTML = "";
    if (sorted.length <= 2) return document.getElementById("newlist").innerHTML = "all words equally likely"

    var newlist = words.slice();
    newlist.sort((a, b) => a >= b ? 1 : -1);

    newranks = [];

    newlist.forEach(function(w) {
        newranks.push({word: w.toUpperCase(), rank: 0});
    });

    var checked = [];

    newranks.forEach(function(w) {
        for (var j = 0; j < word_length; j++) {
            if (alphabet[w.word.charAt(j)][word_length] == sorted.length) continue;
            if (checked[w.word + " " + w.word.charAt(j)] == true) {
                continue;  //no extra credit to letters with doubles
            }
            w.rank += alphabet[w.word.charAt(j)][word_length];
            checked[w.word + " " + w.word.charAt(j)] = true;
        }
    });

    newranks.sort((a, b) => (a.rank <= b.rank) ? 1 : -1)

    var best_word = newranks[0].rank;

    document.getElementById("newlist").innerHTML = "";
    for (var i = 0; i < newranks.length && i < 20; i++) { 
        if (newranks[i].rank == best_word) document.getElementById("newlist").innerHTML += "<span class = 'best_word'>" + newranks[i].word + "</span>";
        else break;
        
        if (i < newranks.length - 1) document.getElementById("newlist").innerHTML += ", ";
    }
    
    for (var j = i; j < newranks.length && j < 20; j++) {
        document.getElementById("newlist").innerHTML += newranks[j].word; 
        if (j < newranks.length - 1) document.getElementById("newlist").innerHTML += ", ";
    }

    if (newranks.length > 20) document.getElementById("newlist").innerHTML += "..."
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