var averages = [];
var newlist = [];

function reduceTestList(list) {
    for (let i = 0; i < list.length; i++) {
        if (count(list[i], 'A') + count(list[i], 'E') + count(list[i], 'I') + count(list[i], 'O') + count(list[i], 'U') + count(list[i], 'Y') > 2) {
            list.splice(i, 1);
            i--;
        }
    }
    return list;
}

function getStartingWords(difficulty) {
    let starting_words;
    if (isDifficulty(HARD, difficulty) && bot.hasHardMode()) {
        starting_words = hard; 
    } else {
        starting_words = easy;
    }

    starting_words = starting_words[bot.type];
    starting_words = starting_words.map(a => a.word).filter(a => a.length == word_length);

    console.log(starting_words);
    return starting_words;
}

function testStartingWords() {
    console.log("testing");
    
    // const difficulty = Number(document.getElementById("mode").checked);
    difficulty = HARD;
    // difficulty = NORMAL;
    
    let check_list = getStartingWords(difficulty);

    const diff = INCORRECT.repeat(word_length);
    const hash_key = diff + "-" + wordbank + "-" + difficulty;

    let i = 0;
    let current = -1;

    if (isDifficulty(HARD, difficulty) && bot.hasHardMode()) newlist = hard;
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
            i++;
        }
        
        if (i >= check_list.length-1) {
            clearInterval(iv);
        }
    }, 1);
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
    document.getElementById("word-entered").disabled = false;
    document.getElementById("word-entered").disabled = false;
    document.getElementsByClassName("info")[0].disabled = false;
    document.getElementsByClassName("test")[0].disabled = false;
    document.getElementById('suggestions').classList.remove('testing');
}

function createBarGraphs() {
    if (document.getElementById("results")) {
        document.getElementById("results").remove();
    } 

    let test_center = document.createElement("div");
    test_center.setAttribute("id", "results");
    test_center.setAttribute("class", "testing");
    test_center.innerHTML = "<div class = 'average'></div><div class = 'current'></div>";
    
    for (let i = 0; i < bot.guessesAllowed(); i++) {
        test_center.innerHTML += "<div class = 'bar'><span class = 'num-guesses'>" + (i+1) + "/" + bot.guessesAllowed() + "</span><span class = 'count'></span></div>";
    }

    test_center.innerHTML += "<div class = 'bar x'><span class = 'num-guesses'>X/" + bot.guessesAllowed() + "</span><span class = 'count'></span></div>";
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
    document.getElementById("word-entered").disabled = true;
    document.getElementsByClassName("info")[0].disabled = true;
    document.getElementsByClassName("test")[0].disabled = true;
    document.getElementById("grid").innerHTML = "";

    document.getElementsByClassName("current")[0].appendChild(
        document.getElementById("grid")
    );

    document.getElementById("next-previous-buttons").innerHTML = "";
}

function createBotMenu() {
    let menu = document.createElement("div");
    menu.setAttribute("id", "test-settings");

    let hard = "<div class = 'disclaimer'>If the bot starts out slow, don't worry. It will get increasingly faster as it plays more games.</div>";
    let submit_button = "<button class = 'bot'>Start WordleBot</button>";
    let input = "<input type = 'text' id = 'testword' placeholder='your starting word'"
                + "input onkeypress = 'return /[a-z]/i.test(event.key)' oninput= 'this.value = this.value.toUpperCase()'>"

    let info = "<div class = 'info'> The " + bot.type + "Bot will test " + input + " against " + TEST_SIZE + " randomly selected answers on hard mode.</div>";
    menu.innerHTML = info + hard + submit_button;

    return menu;
}

function resetGuessRows() {
    document.getElementById("guesses").appendChild(
        document.getElementById("grid")
    );    
    let rows = document.getElementById("grid");
    let buttons = document.getElementById("next-previous-buttons");
    swapDiv(buttons, rows);
    document.getElementById("grid").innerHTML = "";
}

function swapDiv(event, elem) {
    elem.parentNode.insertBefore(elem, event);
}

function setupTest(word, difficulty) {
    TEST_SIZE = 500;
    // TEST_SIZE = common.length;

    let test_center = createBarGraphs();
    let menu = createBotMenu(word);
    test_center.appendChild(menu);

    let input = document.getElementById('testword');
    input.focus();
    input.select();

    removeNonBotElements(word);
    document.getElementById('suggestions').classList.add('testing');

    let num = document.getElementsByClassName('close').length-1;
    document.getElementsByClassName("close")[num].addEventListener('click', function() {            
        pairings = {};
        resetGuessRows();
        removeTest();
    });

    document.getElementsByClassName("bot")[0].addEventListener("click", function() {
        let word = document.getElementById('testword').value;
        if (word.length >= 4 && word.length <= 11) {
            document.getElementById("word-length").value = word.length;
            setLength();
            setWordbank();

            if (words.includes(word)) {
                difficulty = HARD;
                // difficulty = NORMAL;
                document.getElementById("test-settings").remove();
                update();
                runBot(word, difficulty);
            }
        }
    });
}

function placeTestRows(word) {
    makeTables(word, 'testing');
    document.getElementsByClassName("next-previous-buttons").innerHTML = "";
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
    let scores = new Array(bot.guessesAllowed()+1).fill(0);
    let testing_sample = getTestAnswers(TEST_SIZE, []);

    let iv = setInterval(function() {
        document.getElementById("grid").innerHTML = "";
        let points = wordleBot(guess, testing_sample[count], difficulty);

        if (points > bot.guessesAllowed()) {
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
        if (isDifficulty(HARD, difficulty) && bot.hasHardMode()) newlist = hard;
        else newlist = easy;
    }

    averages.push({word: guess, average: average, wrong: wrong});
    averages.sort((a, b) => a.average >= b.average ? 1 : -1);

    let index = newlist[bot.type].map(a => a.word).indexOf(guess);
    let data = {average: average, wrong: wrong};

    if (index == -1) {
        newlist[bot.type].push({word: guess});
        index = newlist[bot.type].length - 1;
    } 
            
    newlist[bot.type][index][wordbank] = data;
}

function printData(all_words, guess, average, time) {
    console.log(all_words);
    console.log(averages.map(a => a.word).indexOf(guess) + ": " + guess + " --> " + average + " --> " + time + " seconds");
    console.log(averages);
    console.log(seconds);
}

function wordleBot(guess, answer, difficulty) {
    let attempts = 1;

    while (attempts <= bot.guessesAllowed()) {
        makeTables(guess, "testing");

        let diff = bot.getDifference(guess, answer);
        bot.setRowColor(diff, document.getElementsByClassName('row')[attempts-1]);

        if (guess == answer || attempts == 6) {
            if (guess != answer) attempts++;
            break;
        }
        
        attempts++;

        let answer_list = filterList(common.slice());
        let possible_guesses = words.slice();
        if (isDifficulty(HARD, difficulty)) possible_guesses = filterList(possible_guesses);

        final_guesses = getBestGuesses(answer_list, possible_guesses, difficulty);
        guess = final_guesses[0].word;  

    }

    return attempts;
}