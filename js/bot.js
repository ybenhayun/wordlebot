var averages = [];
var newlist = [];

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
    let testing_words;
    
    if (isDifficulty(HARD, difficulty)) testing_words = hard;
    else testing_words = easy;

    return testing_words.sort((a, b) => a.average >= b.average ? 1 : -1).map(a => a.word).filter(a => a.length == word_length);
}

function testStartingWords() {
    console.log("testing");
    
    const difficulty = Number(document.getElementById("mode").checked);
    
    let check_list = getStartingWords(difficulty);
    console.log(check_list);

    const diff = INCORRECT.repeat(word_length);
    const hash_key = diff + "-" + wordbank + "-" + difficulty;

    let i = findStart(0, check_list, hash_key);
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
        
        if (i >= check_list.length-1) {
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
        animating = false;
    }

    if (document.getElementById("results")) {
        document.getElementById("results").remove();
    } 

    document.getElementById("grid").innerHTML = "";
    document.getElementById("word_entered").disabled = false;
    document.getElementById("word_entered").disabled = false;
    document.getElementsByClassName("info")[0].disabled = false;
    document.getElementsByClassName("test")[0].disabled = false;
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
    test_center.innerHTML += "<button class = 'close'></button>";
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
    document.getElementsByClassName("info")[0].disabled = true;
    document.getElementsByClassName("test")[0].disabled = true;
    document.getElementById("grid").innerHTML = "";

    document.getElementsByClassName("current")[0].appendChild(
        document.getElementById("grid")
    );

    document.getElementById("calculate").innerHTML = "";
}

function createBotMenu() {
    let menu = document.createElement("div");
    menu.setAttribute("id", "test-settings");

    let hard = "<div class = 'disclaimer'>For the time being, the WordleBot will test your word on hard mode for efficiency purposes.</div>"
    // let hard = "<div><input type='checkbox' id='hard-mode' name='hard-mode'>";
    // hard += "<label for='hard-mode'>Bot plays hard mode</label></div>";
    let submit_button = "<button class = 'bot'>Start WordleBot</button>";
    let input = "<input type = 'text' id = 'testword' placeholder='your starting word'"
                + "input onkeypress = 'return /[a-z]/i.test(event.key)' oninput= 'this.value = this.value.toUpperCase()'>"

    let info = "<div class = 'info'> The Wordle Bot will test " + input + " against " + TEST_SIZE + " randomly selected answers.</div>";
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
    TEST_SIZE = 300;
    // TEST_SIZE = common.length;

    let test_center = createBarGraphs();
    let menu = createBotMenu(word);
    test_center.appendChild(menu);

    let input = document.getElementById('testword');
    input.focus();
    input.select();
    
    removeNonBotElements(word);

    document.getElementsByClassName("close")[1].addEventListener('click', function() {            
        pairings = {};
        resetGuessRows();
        removeTest();
    });

    document.getElementsByClassName("bot")[0].addEventListener("click", function() {
        let word = document.getElementById('testword').value;
        if (word.length >= 4 && word.length <= 11) {
            document.getElementById("num_letters").value = word.length;
            setLength();
            if (words.includes(word)) {
                // difficulty = Number(document.getElementById("hard-mode").checked);
                difficulty = HARD;
                document.getElementById("test-settings").remove();
                update();
                runBot(word, difficulty);
            }
        }
    });
}

function placeTestRows(word) {
    makeTables(word, 'testing');
    document.getElementsByClassName("calculate").innerHTML = "";
}

function getTestAnswers(TEST_SIZE, random_answers) {
    if (TEST_SIZE == common.length) return common.slice();
    if (TEST_SIZE == random_answers.length) return random_answers;
    
    let index = Math.round(Math.random()*(common.length-1));
    if (!random_answers.includes(common[index])) random_answers.push(common[index]);
    return getTestAnswers(TEST_SIZE, random_answers);
}

function adjustBarHeight(points, scores, total_sum, games_played) {
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
    const start_time = performance.now();

    let sum = 0;
    let count = 0;
    let missed = [];
    let scores = new Array(7).fill(0);
    let testing_sample = getTestAnswers(TEST_SIZE, []);

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

        document.getElementsByClassName("close")[1].addEventListener('click', function() {
            removeTest(iv);
        });

        if (count >= TEST_SIZE) {
            let average = parseFloat(sum/count);
            let wrong = missed.length/common.length;
            
            showResults(guess, TEST_SIZE - missed.length, TEST_SIZE, average.toFixed(3), missed);
            if (TEST_SIZE == common.length) {
                updateWordData(guess, average, wrong, difficulty);
                printData(newlist, guess, average, (performance.now() - start_time)/1000);
            }
            
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

        let answer_list = filterList(common.slice(), letters);
        let possible_guesses = words.slice();
        if (isDifficulty(HARD, difficulty)) possible_guesses = filterList(possible_guesses, letters);

        final_guesses = getBestGuesses(answer_list, possible_guesses, difficulty);

        guess = final_guesses[0].word;  
    }

    return attempts;
}