var averages = [];
var newlist = [];

// const test_size = common.length;
const test_size = 300;

function reduceTestList(list) {
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
    
    if (isDifficulty(HARD, difficulty)) words = hard;
    else words = easy;

    return words.sort((a, b) => a.average >= b.average ? 1 : -1).map(a => a.word).filter(a => a.length == word_length);
}

function testStartingWords() {
    console.log("testing");
    const difficulty = Number(document.getElementById("mode").checked);
    
    let check_list = getStartingWords(difficulty);
    console.log(check_list);

    const diff = INCORRECT.repeat(word_length);
    const hash_key = diff + "-" + wordbank + "-" + difficulty;

    let i = findStart(0, check_list, hash_key);
    let test_size = check_list.length;
    let current = -1;

    if (isDifficulty(HARD, difficulty)) newlist = hard;
    else newlist = easy;

    let iv = setInterval(function() {
        if (averages.length > current) {
            current = averages.length;

            makeTables(check_list[i], 'testing');
            setupTest(check_list[i], difficulty);

            if (document.getElementById("summary")) {
                document.getElementById("summary").remove();
            }

            if (document.getElementById("test-settings")) {
                document.getElementById("test-settings").remove();
            }
            
            runBot(check_list[i], difficulty);
            i = findStart(i+1, check_list, hash_key);
        }
        
        if (i >= test_size) {
            clearInterval(iv);
        }
    }, 1);
}

function getWord(number) {
    let row = document.getElementsByClassName("row")[number-1];
    let tiles = row.getElementsByClassName("tile");

    let guess = "";

    for (let i = 0; i < word_length; i++) {
        guess += tiles[i].innerHTML;
    }

    return guess;
}

function removeTest(animating) {
    if (animating) {
        clearInterval(animating);
    }

    if (document.getElementById("results")) {
        document.getElementById("results").remove();
    } 

    document.getElementById("grid").innerHTML = "";
    document.getElementById("word_entered").disabled = false;
}

function createBarGraphs() {
    if (document.getElementById("results")) {
        document.getElementById("results").remove();
    } 

    let test_center = document.createElement("div");
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

    let count = document.getElementsByClassName("count");
    for (let i = 0; i < count.length; i++) {
        count[i].innerHTML = "0";
        document.getElementsByClassName("bar")[i].style.height = "1.125rem";
    }

    return test_center;
}

function removeNonBotElements() {
    document.getElementById("word_entered").disabled = true;
    document.getElementById("grid").innerHTML = "";

    document.getElementsByClassName("current")[0].appendChild(
        document.getElementById("grid")
    );

    document.getElementById("calculate").innerHTML = "";
}

function createBotMenu(word) {
    let menu = document.createElement("div");
    menu.setAttribute("id", "test-settings");

    let hard = "<div><input type='checkbox' id='hard-mode' name='hard-mode'>";
    hard += "<label for='hard-mode'>Bot plays hard mode</label></div>";
    let submit_button = "<button class = 'bot'>Start WordleBot</button>";
    let input = "<input type = 'text' id = 'testword' placeholder='your starting word'"
                + "input onkeypress = 'return /[a-z]/i.test(event.key)' oninput= 'this.value = this.value.toUpperCase()'>"

    let info = "<div class = 'info'> The Wordle Bot will test " + input + " against " + test_size + " randomly selected answers.</div>";

    menu.innerHTML = info + hard + submit_button;

    return menu;
}

function resetGuessRows() {
    document.getElementById("guesses").appendChild(
        document.getElementById("grid")
    );    
    let rows = document.getElementById("grid");
    let buttons = document.getElementById("calculate");
    swapDiv(buttons, rows);
    document.getElementById("grid").innerHTML = "";
}

function swapDiv(event, elem) {
    elem.parentNode.insertBefore(elem, event);
}

function setupTest(word, difficulty) {
    let test_center = createBarGraphs();
    let menu = createBotMenu(word);
    test_center.appendChild(menu);
    
    removeNonBotElements(word);

    document.getElementById("cancel").addEventListener('click', function() {            
        pairings = {};
        resetGuessRows();
        removeTest();
    });

    document.getElementsByClassName("bot")[0].addEventListener("click", function() {
        let word = document.getElementById('testword').value;
        if (word.length >= 4 && word.length <= 11) {
            document.getElementById("num_letters").value = word.length;
            setLength();

            difficulty = Number(document.getElementById("hard-mode").checked);
            document.getElementById("test-settings").remove();

            runBot(word, difficulty);
        }
    });
}

function placeTestRows(word) {
    makeTables(word, 'testing');
    document.getElementsByClassName("calculate").innerHTML = "";
}

function getTestAnswers(test_size, random_answers) {
    if (test_size == common.length) return common.slice();
    if (test_size == random_answers.length) return random_answers;
    
    let index = Math.round(Math.random()*(common.length-1));
    if (!random_answers.includes(common[index])) random_answers.push(common[index]);
    return getTestAnswers(test_size, random_answers);
}

function adjustBarHeight(points, scores, total_sum, games_played) {
    console.log(games_played);
    let max = Math.max(...scores);
    let bars = document.getElementsByClassName("bar");
    document.getElementsByClassName("count")[points].innerHTML = scores[points];
        
    for (let x = 0; x < bars.length; x++) {
        bars[x].style.height = "calc(1.125rem + " + ((scores[x]/max)*100)*.4 + "%)";
    }

    document.getElementsByClassName("average")[0].innerHTML = "Average: " + (total_sum/games_played).toFixed(3);
}

function showResults(guess, correct, total_tested, average, words_missed) {
    resetGuessRows();

    document.getElementsByClassName("average")[0].innerHTML = "";
    let summary = guess + " solved " + correct + "/" + total_tested 
    + " words with an average of " + average + " guesses per solve.";   

    if (words_missed.length) {
        summary += showMissedWords(words_missed);
    }

    document.getElementsByClassName("current")[0].innerHTML = "<div id = 'summary'>" + summary + "</div>";
}   

function showMissedWords(words_missed) {
    let missed = "<div id = 'wrongs'>Missed words: ";
        for (let i = 0; i < words_missed.length; i++) {
            missed += words_missed[i];
            if (i < words_missed.length - 1) {
                missed += ", ";
            }
        }
    return missed + "</div>"
}

function runBot(guess, difficulty) {
    const startTime = performance.now();

    let sum = 0;
    let count = 0;
    let missed = [];
    let scores = new Array(7).fill(0);
    let testing_sample = getTestAnswers(test_size, []);


    let iv = setInterval(function() {
        document.getElementById("grid").innerHTML = "";
        let points = wordleBot(guess, testing_sample[count], difficulty);

        if (points == 7) {
            // clearInterval(iv);
            missed.push(testing_sample[count]);
        }

        sum += points;
        scores[points-1] += 1;
        adjustBarHeight(points-1, scores, sum, count+1);
        count++;

        document.getElementById("cancel").addEventListener('click', function() {
            removeTest(iv);
        });

        if (count >= test_size) {
            let average = parseFloat(sum/count);
            let wrong = missed.length/common.length;
            
            showResults(guess, test_size - missed.length, test_size, average.toFixed(3), missed);
            updateWordData(guess, average, wrong, difficulty);
            printData(newlist, guess, average, (performance.now() - startTime)/1000);
            
            pairings = {};
            clearInterval(iv);
        }
    }, 1);
}

function updateWordData(guess, average, wrong, difficulty) {
    if (!newlist.length) {
        if (isDifficulty(HARD, difficulty)) newlist = hard;
        else newlist = easy;
    }

    averages.push({word: guess, average: average, wrong: wrong});
    averages.sort((a, b) => a.average >= b.average ? 1 : -1);

    let index = newlist.map(a => a.word).indexOf(guess);
    let data = {average: average, wrong: wrong};

    if (index == -1) {
        newlist.push({word: guess});
        index = newlist.length - 1;
    } 
            
    newlist[index][wordbank] = data;
}

function printData(all_words, guess, average, time) {
    console.log(all_words.map(a => Object.assign({}, {word: a.word, restricted: a.restricted, complete: a.complete})));
    console.log(guess + " --> " + average + " --> " + time + " seconds");
    console.log(averages);
    console.log(seconds);
}

function wordleBot(guess, answer, difficulty) {
    let attempts = 1;

    while (attempts <= 6) {
        makeTables(guess, "testing");

        let diff = getDifference(guess, answer);
        let letters = document.getElementsByClassName("tile");
        let pos = 0;
        
        for (let i = Math.max(0, letters.length - word_length); i < letters.length; i++) {
            letters[i].classList.replace(INCORRECT, diff[pos]);
            pos++;
        }
        
        if (guess == answer || attempts == 6) {
            if (guess != answer) attempts++;
            break;
        }
        
        attempts++;

        let list = filterList(common.slice(), letters);
        let possible_guesses = words.slice();
        if (isDifficulty(HARD, difficulty)) possible_guesses = filterList(possible_guesses, letters);

        final_guesses = getBestGuesses(list, possible_guesses, difficulty);

        guess = final_guesses[0].word;  
    }

    return attempts;
}