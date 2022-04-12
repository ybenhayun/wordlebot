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

const TRACKER_BUTTONS = `<div class = 'tracker'>
                            <div class = 'correct'>
                                <button class = 'increment'>+</button>
                                <div class = 'G'>0</div>
                                <button class = 'increment'>-</button>
                            </div>
                            <div class = 'wrong-spots'>
                                <button class = 'increment'>+</button>
                                <div class = 'Y'>0</div>
                                <button class = 'increment'>-</button>
                            </div>
                        </div>`

$(document).ready(function() {
    if (localStorage.getItem("word length")) {
        word_length = localStorage.getItem("word length");
        $("#num_letters").val(word_length);
    }

    setLength();
    setWordbank();
    update(true);

    $("#refresh").click(function() {
        $("#grid").empty();
        $("#calculate").empty();
        update(true);
    });

    $("#num_letters").on('input', function() {
        setLength();
        setWordbank();
        update(true);

        localStorage.setItem("word length", word_length);
    });

    $("#wordbank").on('input', function() {
        setWordbank();
        update(true);
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

    $(document).on('click', '.increment', function() {
        let val = parseInt($(this).next().html());

        if ($(this).html() == '-') {
            val = $(this).prev().html();
            if (val > 0) $(this).prev().html(val - 1);
        
        } else if (val < word_length) {
            $(this).next().html(val + 1);
        }
    });

    $(document).on('click', '.filter', function() {
        update(true);
    });

    $(document).on('click', '.undo', function() {
        $(".row:last").remove();

        if (!$(".tile").length) {
            $("#calculate").empty();
        }
        update(true);
    });

    $(document).on('click', '.showlist', function() {
        if ($(this).children().hasClass("visible")) {
            ($(this).children().removeClass("visible"));
        } else {
            $(this).children().addClass("visible");
        }
    });
});

function getTileColors(row) {
    let num_correct = document.getElementsByClassName('correct')[row].getElementsByTagName('div')[0].innerHTML;
    let num_wrong_spots = document.getElementsByClassName('wrong-spots')[row].getElementsByTagName('div')[0].innerHTML;
    let num_wrong = word_length - num_correct - num_wrong_spots;

    return CORRECT.repeat(num_correct) + WRONG_SPOT.repeat(num_wrong_spots) + INCORRECT.repeat(num_wrong);
}

function getDifference(word1, word2) {
    let temp1 = word1;
    let temp2 = word2;

    if (pairings[word1]) {
        if (pairings[word1][word2]) return pairings[word1][word2];
    } else pairings[word1] = [];

    let correct = "";
    let wrong_spots = "";
    let num_wrong = word_length;

    for (let j = 0; j < temp1.length; j++) {
        if (num_wrong == 0) break;
        
        let word1_c = temp1.charAt(j);
        let word2_c = temp2.charAt(j);

        if (word1_c == word2_c) {
            correct += CORRECT;
            num_wrong--;
            
            temp1 = temp1.slice(0, j) + temp1.slice(j+1);
            temp2 = temp2.slice(0, j) + temp2.slice(j+1);
            j--;
        }
    }

    for (let j = 0; j < temp1.length; j++) {
        if (num_wrong == 0) break;

        let word1_c = temp1.charAt(j);

        if (temp2.includes(word1_c)) {
            wrong_spots += WRONG_SPOT;
            num_wrong--;

            let index = temp2.indexOf(word1_c);
            temp2 = temp2.slice(0, index) + temp2.slice(index+1);
        }
    }

    let diff = correct + wrong_spots + INCORRECT.repeat(num_wrong);
    pairings[word1][word2] = diff;

    return diff;
}