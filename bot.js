var averages = [];
var newlist = [];

function reduceList(list) {
    for (let i = 0; i < list.length; i++) {
        if (!list[i].includes('S')) {
            list.splice(i, 1);
            i--;
        }
    }
    return list;
}

function findStart(index, list, key) {
    if (index >= list.length) return index;

    if (seconds[list[index]] != null) {
        if (seconds[list[index]][key] != null) {
            return findStart(index+1, list, key);
        }
    }

    return index;
}

function getStartingWords(difficulty) {
    let words;
    
    if (isHardMode(difficulty)) words = hard;
    else words = easy;

    return words.sort((a, b) => a.average >= b.average ? 1 : -1).map(a => a.word).filter(a => a.length == word_length);
}

function testStartingWords() {
    console.log("testing");
    const difficulty = Number(document.getElementById("mode").checked);
    const list_type = document.getElementById("wordbank").value;
    
    let check_list = getStartingWords(difficulty);
    console.log(check_list);

    const diff = INCORRECT.repeat(word_length);
    const hash_key = diff + "-" + list_type + "-" + difficulty;

    let i = findStart(0, check_list, hash_key);
    let test_size = check_list.length;
    let current = -1;

    if (isHardMode(difficulty)) newlist = hard.slice();
    else newlist = easy.slice();

    var iv = setInterval(function() {
        if (averages.length > current) {
            current = averages.length;

            makeTables(check_list[i]);
            setupTest(check_list[i], difficulty);

            if (document.getElementById("summary")) {
                document.getElementById("summary").remove();
            }

            if (document.getElementById("test-settings")) {
                document.getElementById("test-settings").remove();
            }
            
            runBot(check_list[i], difficulty, list_type);
            i = findStart(i+1, check_list, hash_key);
        }
        
        if (i >= test_size) {
            clearInterval(iv);
        }
    }, 1);
}

function getWord() {
    let tiles = document.getElementsByClassName("tile");
    var guess = "";

    for (let i = 0; i < word_length; i++) {
        guess += tiles[i].innerHTML;
    }

    return guess;
}

function removeTest() {
    if (document.getElementById("results")) {
        document.getElementById("results").remove();
    } 

    document.getElementById("grid").innerHTML = "";
    document.getElementById("word_entered").disabled = false;
}

function setupTest(word, difficulty) {
    if (document.getElementById("results")) {
        document.getElementById("results").remove();
    } 

    document.getElementById("word_entered").disabled = true;

    var test_center = document.createElement("div");
    test_center.setAttribute("id", "results");
    test_center.setAttribute("class", "testing");

    test_center.innerHTML = "<div class = 'average'></div><div class = 'current'></div>";
    test_center.innerHTML += "<div class = 'bar one'><span class = 'num-guesses'>1/6</span><span class = 'count'></span></div>";
    test_center.innerHTML += "<div class = 'bar two'><span class = 'num-guesses'>2/6</span><span class = 'count'></span></div>";
    test_center.innerHTML += "<div class = 'bar three'><span class = 'num-guesses'>3/6</span><span class = 'count'></span></div>";
    test_center.innerHTML += "<div class = 'bar four'><span class = 'num-guesses'>4/6</span><span class = 'count'></span></div>";
    test_center.innerHTML += "<div class = 'bar five'><span class = 'num-guesses'>5/6</span><span class = 'count'></span></div>";
    test_center.innerHTML += "<div class = 'bar sixe'><span class = 'num-guesses'>6/6</span><span class = 'count'></span></div>";
    test_center.innerHTML += "<div class = 'bar x'><span class = 'num-guesses'>X/6</span><span class = 'count'></span></div>";
    test_center.innerHTML += "<button id = 'cancel'>&#10006</button>";

    document.getElementById("suggestions").appendChild(test_center);

    let guess_letters = document.getElementsByClassName("tile");

    document.getElementsByClassName("current")[0].appendChild(
        document.getElementById("grid")
    );

    document.getElementsByClassName("buttons")[0].remove();

    var count = document.getElementsByClassName("count");
    for (let i = 0; i < count.length; i++) {
        count[i].innerHTML = "0";
        document.getElementsByClassName("bar")[i].style.height = "1.125rem";
    }

    
    var tiles = document.getElementsByClassName("tile");
    for (let i = 0; i < tiles.length; i++) {
        tiles[i].classList.add("testing");
    }

    let new_form = document.createElement("div");
    new_form.setAttribute("id", "test-settings");

    var hard = "<div><input type='checkbox' id='hard-mode' name='hard-mode'>";
    hard += "<label for='hard-mode'>Bot plays hard mode</label></div>";
    var submit_button = "<button class = 'bot'>Start WordleBot</button>";

    var info = "<div class = 'info'> The Wordle Bot will test " + word + " against 300 randomly selected answers.</div>";

    new_form.innerHTML = hard + info + submit_button;

    test_center.appendChild(new_form);

    document.getElementById("cancel").addEventListener('click', function() {            
        pairings = [];
        document.getElementById("guesses").appendChild(
            document.getElementById("grid")
        );

        removeTest();
    });

    document.getElementsByClassName("bot")[0].addEventListener("click", function() {
        difficulty = Number(document.getElementById("hard-mode").checked);
        console.log(difficulty);
        document.getElementById("test-settings").remove();

        let list_type = document.getElementById("wordbank").value;
        runBot(word, difficulty, list_type);
    });
}

function getTestAnswers(test_size, random_answers) {
    if (test_size == common.length) return common.slice();
    if (test_size == random_answers.length) return random_answers;
    
    let index = Math.round(Math.random()*(common.length-1));
    if (!random_answers.includes(common[index])) random_answers.push(common[index]);
    return getTestAnswers(test_size, random_answers);
}

function runBot(guess, difficulty, list_type) {
    const startTime = performance.now();
    const test_size = common.length;
    // const test_size = 300;

    let sum = 0;
    let count = 0;
    let missed = [];
    let scores = new Array(7).fill(0);
    let testing_sample = getTestAnswers(test_size, []);

    var iv = setInterval(function() {
        document.getElementById("grid").innerHTML = "";

        let n = wordleBot(guess, testing_sample[count], difficulty, list_type);
        if (n == 7) {
            // clearInterval(iv);
            missed.push(testing_sample[count]);
        }

        sum += n;
        scores[n-1] += 1;

        let max = Math.max(...scores);

        let points = document.getElementsByClassName("count");
        let bars = document.getElementsByClassName("bar");
        points[n-1].innerHTML = scores[n-1];
        
        for (let x = 0; x < bars.length; x++) {
            bars[x].style.height = "calc(1.125rem + " + ((scores[x]/max)*100)*.4 + "%)";
        }

        document.getElementsByClassName("average")[0].innerHTML = "Average: " + parseFloat(sum/(count+1)).toFixed(3);
        count++;

        document.getElementById("cancel").addEventListener('click', function() {
            clearInterval(iv);
            
            pairings = [];
            document.getElementById("guesses").appendChild(
                document.getElementById("grid")
            );
            removeTest();
        });

        if (count >= test_size) {
            document.getElementById("guesses").appendChild(
                document.getElementById("grid")
            );

            document.getElementById("grid").innerHTML = "";

            let average = parseFloat(sum/count);
            let wrong = missed.length/common.length;
            document.getElementsByClassName("average")[0].innerHTML = "";

            let summary = guess + " solved " + (test_size - missed.length) + "/" + test_size + " words with an average of " + average.toFixed(3) + " guesses per solve.";

            if (missed.length) {
                summary += "<div id = 'wrongs'>Missed words: ";
                for (let i = 0; i < missed.length; i++) {
                    summary += missed[i];
                    if (i < missed.length - 1) {
                        summary += ", ";
                    }
                }

                summary += "</div>"
            }
            document.getElementsByClassName("current")[0].innerHTML = "<div id = 'summary'>" + summary + "</div>";
            clearInterval(iv);

            let data = {word: guess, average: average, wrong: wrong};

            averages.push(data);
            averages.sort((a, b) => a.average >= b.average ? 1 : -1);
            // averages.sort((a, b) => a.wrong >= b.wrong ? 1 : -1);

            let index = newlist.map(function(e) { return e.word; }).indexOf(guess);
            // let wordbank = document.getElementById("wordbank").value;
            data = {average: average, wrong: wrong};

            if (index == -1) {
                newlist.push({word: guess, average: null, wrong: null});
                index = newlist.length - 1;
            } 
            
            newlist[index][wordbank] = data;
            console.log(newlist);

            const endTime = performance.now();   
            console.log(guess + " --> " + average + " --> " + (endTime - startTime)/1000 + " seconds");
            console.log(averages);
            console.log(seconds);
            pairings = [];
        }
    }, 1);
}

function wordleBot(guess, answer, difficulty, list_type) {
    var attempts = 1;

    while (attempts <= 6) {
        makeTables(guess, "testing");

        if (document.getElementsByClassName("buttons").length) {
            document.getElementsByClassName("buttons")[0].remove();
        }

        var diff = getDifference(guess, answer);
        var letters = document.getElementsByClassName("tile");
        var pos = 0;
        
        for (let i = Math.max(0, letters.length - word_length); i < letters.length; i++) {
            letters[i].classList.replace(INCORRECT, diff[pos]);
            pos++;
        }
        
        if (guess == answer || attempts == 6) {
            if (guess != answer) attempts++;
            break;
        }
        
        attempts++;
        
        var letters = document.getElementsByClassName("tile");
        var list  = filterList(common.slice(), letters);
        var full_list = words.slice();
        if (isHardMode(difficulty)) {
            full_list = filterList(full_list, letters);
        } 

        full_list = determineBestGuesses(list, full_list, difficulty, true);
        let secondguess = full_list[0].word;  

        guess = secondguess;
    }

    return attempts;
}

function getWrongLetters(all_letters) {
    var wrong_letters = [];
    var doubles = [];

    for (let i = 0; i < all_letters.length; i++) {
        var hash = parseInt(i/word_length) + " " + all_letters[i].innerHTML;
        
        if (all_letters[i].classList.contains(WRONG_SPOT) || all_letters[i].classList.contains(CORRECT)) {
            if (doubles[hash] == null) {
                doubles[hash] = 1;
            } else {
                doubles[hash]++;
            }
        }
    }
    
    for (let i = 0; i < all_letters.length; i++) {
        var hash = parseInt(i/word_length) + " " + all_letters[i].innerHTML;

        if (all_letters[i].classList.contains(INCORRECT)) {
            if (doubles[hash] == null) {
                wrong_letters.push(all_letters[i].innerHTML);
            }
        }
    }

    return wrong_letters;
}