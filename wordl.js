var word_length = 5;
var guesses = 6;

$(document).ready(function() {
    setLength();
    makeTables();
    filterList();

    $("#clear").click(function() {
        $('input').not("#myRange").val('');
        filterList();
    });

    $("#myRange").click(function() {
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
    var correct_tbl = "<table id = 'corr'><tr>";

    for(var i = 0; i < word_length; i++){
        correct_tbl += "<td><input onkeypress = 'return /[a-z]/i.test(event.key)' oninput= 'this.value = this.value.toUpperCase()' type = 'letter' maxlength = '1 size = '1'></td>";
    }

    correct_tbl +=  '</tr></table>';
    document.getElementById("correct").getElementsByClassName("table")[0].innerHTML = correct_tbl;

    var wrong_spots_tbl = "<table id = 'wrong'>";

    for (var i = 0; i < guesses; i++) {
        wrong_spots_tbl += '<tr>';
        for (var j = 0; j < word_length; j++) {
            wrong_spots_tbl += "<td><input onkeypress = 'return /[a-z]/i.test(event.key)' oninput= 'this.value = this.value.toUpperCase()' type = 'letter' maxlength = '1 size = '1'></td>";
        }
        wrong_spots_tbl += '</tr>';
    }
    wrong_spots_tbl += '</table>';

    document.getElementById("wrong_spots").getElementsByClassName("table")[0].innerHTML = wrong_spots_tbl;
    document.getElementById("exclude").getElementsByClassName("table")[0].innerHTML = 
    "<table id = 'excl'><tr><td><input onkeypress = 'return /[a-z]/i.test(event.key)' oninput= 'this.value = this.value.toUpperCase()' type = 'letter' size = '1'></td></tr></table>";

    document.querySelectorAll("table").forEach(function(t) { t.style.width = word_length*3 + "rem"; });
}

function changeLength() {
    word_length = document.getElementById("myRange").value;
}

function setLength() {
    words = big_list.filter((element) => {return element.length == word_length; });
    words = words.filter((v, i, a) => a.indexOf(v) === i);
}

function filterList() {
    let list_size = 89;
    var filtered = words.slice();
    filtered = filtered.map(function(x){ return x.toUpperCase(); })

    wrongSpots(filtered);
    correctLetters(filtered);
    wrongLetters(filtered);
    var sorted = sortList(filtered);

    document.getElementById("count").innerHTML = sorted.length + " possible " + word_length + " letter word" + (sorted.length != 1 ? "s" : "") + "."
    document.getElementById("list").innerHTML = "";
    
    var best = sorted[0].rank;

    for (var i = 0; i < sorted.length && i < list_size; i++) { 
        if (sorted[i].rank == best) document.getElementById("list").innerHTML += "<span class = 'best'>" + sorted[i].word + "</span>";
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

    var alpha = [];
    var sorted = [];
    var top_letters = [];

    for (var c = 65; c <= 90; c++) {
        alpha[String.fromCharCode(c)] = [];
        for (var i = 0; i < word_length+1; i++) {
            alpha[String.fromCharCode(c)].push(0);
        }
    }

    var checked;
    for (var i = 0; i < list.length; i++) {
        checked = [];
        for (var j = 0; j < word_length; j++) {
            alpha[list[i].charAt(j)][j]++;

            if (checked[list[i].charAt(j)] != true) alpha[list[i].charAt(j)][word_length]++;
            checked[list[i].charAt(j)] = true;
        }

        sorted.push({word:list[i], rank:0});
    }

    for (var i = 0; i < 26; i++) {
        top_letters.push({letter:String.fromCharCode(i+65), score:alpha[String.fromCharCode(i+65)][word_length]});
    }

    top_letters.sort((a, b) => (a.score <= b.score) ? 1 : -1);

    for (var c = 0; c < 26; c++) {
        document.getElementById('best').innerHTML += "<li>" + top_letters[c].letter + " " + parseFloat(top_letters[c].score/list.length*100).toFixed(2) + "%</li>";
    }

    checked = [];

    if (sorted.length > 25) {    
        for (var i = 0; i < sorted.length; i++) {
            for (var j = 0; j < word_length; j++) {
                if (checked[i + " " + sorted[i].word.charAt(j)] == true) continue;  //no extra credit to letters with doubles
                sorted[i].rank += alpha[sorted[i].word.charAt(j)][word_length];
                // sorted[i].rank += alpha[sorted[i].word.charAt(j)][j];    // makes TARES top word
                checked[i + " " + sorted[i].word.charAt(j)] = true;
            }
        }
    }
        

    sorted.sort((a, b) => (a.rank <= b.rank) ? 1 : -1);

    var small_list = [];
    var place = 0;
    var current = sorted[place].rank;

    for (var i = 0; i < sorted.length; i++) {
        if (sorted[i].rank == current && i < sorted.length - 1) { 
            small_list.push(sorted[i]);
        } else {
            if (i == sorted.length - 1) small_list.push(sorted[i]);
            for (var j = 0; j < small_list.length; j++) {
                for (var k = 0; k < word_length; k++) {
                    small_list[j].rank += alpha[small_list[j].word.charAt(k)][k];
                }
            } 

            small_list.sort((a, b) => (a.rank <= b.rank) ? 1 : -1);

            for (var j = 0; j < small_list.length; j++) {
                sorted[j+place] = small_list[j];
            }

            current = sorted[i].rank;
            place = i;
            small_list = [];
            small_list.push(sorted[i]);
        }
    }

    return sorted;
}

function wrongLetters(list) {
    var letters = document.getElementById("excl").rows[0].cells[0].children[0].value;
    
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
    var table = document.getElementById("wrong");
    var includes = [];

    for (var i = 0; i < guesses; i++) {
        for (var j = 0; j < word_length; j++) {
            var char = table.rows[i].cells[j].children[0].value;
            if (char != '') includes.push({letter:char, place:j});
        }
    }

    if (includes.length) {
        for (var i = 0; i < list.length; i++) {
            for (var j = 0; j < includes.length; j++) {
                if (!list[i].includes(includes[j].letter)) {
                    list.splice(i, 1);
                    i--;
                    break;
                }

                if (list[i].charAt(includes[j].place) == includes[j].letter) {
                    list.splice(i, 1);
                    i--;
                    break;
                }
            }        
        }
    }
}

function correctLetters(list) {
    var table = document.getElementById('corr');
    var includes = [];

    for (var i = 0; i < word_length; i++) {
        includes.push(table.rows[0].cells[i].children[0].value); //first column
    }

    if (includes.some(element => element != '')) {
        for (var i = 0; i < list.length; i++) {
            for (var j = 0; j < word_length; j++) {
                if (includes[j] != '') {
                    if (includes[j] != list[i].charAt(j)) { 
                        list.splice(i, 1);
                        i--;
                        break;
                    }
                }
            }
        }
    }
}