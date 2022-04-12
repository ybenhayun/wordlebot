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
const SIZE_FACTOR = 5;
const NO_WORDS = "<div id = 'nowords'>it doesn't look like we have this word. double check to make sure you all the clues you entered are correct.</div>"
const BEST_GUESSES = "these are your best possible guesses:";

const TRACKER_BUTTONS = "";

$(document).ready(function() {
    if (localStorage.getItem("word length")) {
        word_length = localStorage.getItem("word length");
        $("#num_letters").val(word_length);
    }

    if (localStorage.getItem("difficulty")) {
        $("#mode").prop('checked', true);
        swapSlides($('.best-guesses.normal'), $('.best-guesses.hard'), true)
    }
    
    setLength();
    setWordbank();
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
        setWordbank();
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

    $(".test").click(function() {
        setupTest();
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

    $(document).on('click', '.showlist', function() {
        if ($(this).children().hasClass("visible")) {
            ($(this).children().removeClass("visible"));
        } else {
            $(this).children().addClass("visible");
        }

    });
});

// returns the color patterns that would appear if 
// word 1 was your guess and word2 was the answer
function getDifference(word1, word2) {
    if (word1.length != word_length) debugger;

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
                // coloring is more complicated if your guess word has double letters
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

function getTileColors(row_number) {
    let row = document.getElementsByClassName("row")[row_number];
    let coloring = "";

    for (let i = 0; i < word_length; i++) {
        coloring += getTileColor(row.getElementsByClassName("tile")[i]);
    }

    return coloring;
}

// reduces list of possibilities when list is too large to check efficiently
// function reduceListSize(guesses, answers, letters) {
//     // if you have <10 words left, removeUselessGuesses will actually remove some ideal guesses
//     if (answers.length > 10) { 
//         removeUselessGuesses(guesses, letters);
//     }
    
//     if (answers.length > 500) {
//         guesses = guesses.slice(0, 250);
//     }

//     return guesses;
// }

// function removeUselessGuesses(list, letters) {
//     let newlist = list.slice();

//     if (letters) {
//         let word = letters.word;
//         let coloring = letters.colors;

//         for (let i = 0; i < coloring.length; i++) {
//             if (coloring[i] == CORRECT || coloring[i] == WRONG_SPOT) {
//                 coloring = coloring.slice(0, i) + coloring.slice(i+1);
//                 word = word.slice(0, i) + word.slice(i+1);
//             }
//         }

//         for (let i = 0; i < newlist.length; i++) {
//             for (let j = 0; j < word.length; j++) {
//                 if (newlist[i].includes(word.charAt(j))) {
//                     newlist.splice(i, 1);
//                     i--;
//                     break;
//                 }
//             }
//         }
//         return newlist;
//     }

//     for (let guess = 0; guess < guessesSoFar(); guess++) {
//         let coloring = getTileColors(guess);
//         let word = getWord(guess);

//         for (let i = 0; i < coloring.length; i++) {
//             if (coloring[i] == CORRECT || coloring[i] == WRONG_SPOT) {
//                 coloring = coloring.slice(0, i) + coloring.slice(i+1);
//                 word = word.slice(0, i) + word.slice(i+1);
//             }
//         }

//         for (let i = 0; i < newlist.length; i++) {
//             for (let j = 0; j < word.length; j++) {
//                 if (newlist[i].includes(word.charAt(j))) {
//                     newlist.splice(i, 1);
//                     i--;
//                     break;
//                 }
//             }
//         }
//     }
//     console.log(newlist);
//     return newlist;
// }