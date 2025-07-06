$(document).ready(function() {
    getPreferences();
    createPage();

    $("#bot-type").change(function() {
        let val = $(this).val();
        localStorage.setItem('bot_type', val);
        setBotMode(val);
        resetPage();
        // createPage();
    });

    $(document).on('input', '.warmle-selector', function() {
        let val = $(this).val();
        localStorage.setItem('warmle_dist', val);
        update();
    });

    $("#word-length").on('input', function() {
        localStorage.setItem('word_length' + bot.type, $(this).val());
        createPage();
    });

    $("#max-guesses").on('input', function() {
        localStorage.setItem('guesses' + bot.type, $(this).val());
        createPage();
    });

    $(".wordbank").on('input', function() {
        if (!$(this).is(':checked')) {
            $(this).prop('checked', true);
            return;
        }

        localStorage.setItem('wordbank', $(this).attr('id'));
        $("#" + otherWordbank($(this).attr('id'))).prop('checked', false);
        setWordbank();
        update();
    });

    
    $("#word-entered").on('input', function(e) {
        let val = $("#word-entered").val();
        if (val.length == word_length) {
            if (!words.includes(val) && guessesMadeSoFar() > 0) {
                return;
            }

            $("#word-entered").blur();
            
            makeTables(val);
            
            if (word_length == 11) {
                $(".tile").css('font-size', '1rem');
            }
        } 
    });

    $(document).on('click', '.click', function() {
        makeTables($(this).html());
    })

    $(document).on('click', '.showlist', function() {
        if ($(this).children().hasClass("visible")) {
            ($(this).children().removeClass("visible"));
        } else {
            $(this).children().addClass("visible");
        }
    });

    $(document).on('click', '.polygonle-tile', function() {
        let changeTable = [
            ["A", "B"],
            ["B", "C"],
            ["C", "D"],
            ["D", "E"],
            ["E", "F"],
            ["F", "G"],
            ["G", "A"]
        ];
        let tiles = [
            ["A", '<div aria-label="yellow bottom-right triangle" tabindex="0" role="listitem" class="w-12 h-12 sm:w-14 sm:h-14 flex items-center justify-center mx-0.5 text-5xl text-center font-bold font-mono rounded dark:brightness-150"><svg width="2.25rem" height="2.25rem" viewBox="0 0 59.8 59.8" xmlns="http://www.w3.org/2000/svg"><g id="svgGroup" stroke-linecap="round" fill-rule="evenodd" font-size="9pt" stroke="#FEC04F" stroke-width="0.25mm" fill="#FEC04F" style="stroke: rgb(254, 192, 79); stroke-width: 0.25mm; fill: rgb(254, 192, 79);"><path d="M 59.8 59.8 L 0 59.8 L 59.8 0 L 59.8 59.8 Z" vector-effect="non-scaling-stroke"></path></g><text x="50%" y="50%" text-anchor="middle" alignment-baseline="central" dominant-baseline="central" font-size="9rem" fill-opacity="0">◢</text></svg></div>'],
            ["B", '<div aria-label="magenta bottom-left triangle" tabindex="0" role="listitem" class="w-12 h-12 sm:w-14 sm:h-14 flex items-center justify-center mx-0.5 text-5xl text-center font-bold font-mono rounded dark:brightness-200"><svg width="2.25rem" height="2.25rem" viewBox="0 0 59.8 59.8" xmlns="http://www.w3.org/2000/svg"><g id="svgGroup" stroke-linecap="round" fill-rule="evenodd" font-size="9pt" stroke="#3F1F56" stroke-width="0.25mm" fill="#3F1F56" style="stroke: rgb(63, 31, 86); stroke-width: 0.25mm; fill: rgb(63, 31, 86);"><path d="M 0 59.8 L 0 0 L 59.8 59.8 L 0 59.8 Z" vector-effect="non-scaling-stroke"></path></g><text x="50%" y="50%" text-anchor="middle" alignment-baseline="central" dominant-baseline="central" font-size="9rem" fill-opacity="0">◣</text></svg></div>'],
            ["C", '<div aria-label="cyan diamond" tabindex="0" role="listitem" class="w-12 h-12 sm:w-14 sm:h-14 flex items-center justify-center mx-0.5 text-5xl text-center font-bold font-mono rounded dark:brightness-150"><svg width="2.25rem" height="2.25rem" viewBox="0 0 100.7 100.7" xmlns="http://www.w3.org/2000/svg"><g id="svgGroup" stroke-linecap="round" fill-rule="evenodd" font-size="9pt" stroke="#2DA4A8" stroke-width="0.25mm" fill="#2DA4A8" style="stroke: rgb(45, 164, 168); stroke-width: 0.25mm; fill: rgb(45, 164, 168);"><path d="M 100.7 50.4 L 50.4 100.7 L 0 50.4 L 50.4 0 L 100.7 50.4 Z" vector-effect="non-scaling-stroke"></path></g><text x="50%" y="50%" text-anchor="middle" alignment-baseline="central" dominant-baseline="central" font-size="9rem" fill-opacity="0">◆</text></svg></div>'],
            ["D", '<div aria-label="red upper-left triangle" tabindex="0" role="listitem" class="w-12 h-12 sm:w-14 sm:h-14 flex items-center justify-center mx-0.5 text-5xl text-center font-bold font-mono rounded dark:brightness-150"><svg width="2.25rem" height="2.25rem" viewBox="0 0 59.8 59.8" xmlns="http://www.w3.org/2000/svg"><g id="svgGroup" stroke-linecap="round" fill-rule="evenodd" font-size="9pt" stroke="#CF2B52" stroke-width="0.25mm" fill="#CF2B52" style="stroke: rgb(207, 43, 82); stroke-width: 0.25mm; fill: rgb(207, 43, 82);"><path d="M 0 0 L 59.8 0 L 0 59.8 L 0 0 Z" vector-effect="non-scaling-stroke"></path></g><text x="50%" y="50%" text-anchor="middle" alignment-baseline="central" dominant-baseline="central" font-size="9rem" fill-opacity="0">◤</text></svg></div>'],
            ["E", '<div aria-label="blue upper-right triangle" tabindex="0" role="listitem" class="w-12 h-12 sm:w-14 sm:h-14 flex items-center justify-center mx-0.5 text-5xl text-center font-bold font-mono rounded dark:brightness-150"><svg width="2.25rem" height="2.25rem" viewBox="0 0 59.8 59.8" xmlns="http://www.w3.org/2000/svg"><g id="svgGroup" stroke-linecap="round" fill-rule="evenodd" font-size="9pt" stroke="#296094" stroke-width="0.25mm" fill="#296094" style="stroke: rgb(41, 96, 148); stroke-width: 0.25mm; fill: rgb(41, 96, 148);"><path d="M 59.8 0 L 59.8 59.8 L 0 0 L 59.8 0 Z" vector-effect="non-scaling-stroke"></path></g><text x="50%" y="50%" text-anchor="middle" alignment-baseline="central" dominant-baseline="central" font-size="9rem" fill-opacity="0">◥</text></svg></div>'],
            ["F", '<div aria-label="magenta diamond" tabindex="0" role="listitem" class="w-12 h-12 sm:w-14 sm:h-14 flex items-center justify-center mx-0.5 text-5xl text-center font-bold font-mono rounded dark:brightness-200"><svg width="2.25rem" height="2.25rem" viewBox="0 0 100.7 100.7" xmlns="http://www.w3.org/2000/svg"><g id="svgGroup" stroke-linecap="round" fill-rule="evenodd" font-size="9pt" stroke="#3F1F56" stroke-width="0.25mm" fill="#3F1F56" style="stroke: rgb(63, 31, 86); stroke-width: 0.25mm; fill: rgb(63, 31, 86);"><path d="M 100.7 50.4 L 50.4 100.7 L 0 50.4 L 50.4 0 L 100.7 50.4 Z" vector-effect="non-scaling-stroke"></path></g><text x="50%" y="50%" text-anchor="middle" alignment-baseline="central" dominant-baseline="central" font-size="9rem" fill-opacity="0">◆</text></svg></div>'],
            ["G", '<div aria-label="cyan square" tabindex="0" role="listitem" class="w-12 h-12 sm:w-14 sm:h-14 flex items-center justify-center mx-0.5 text-5xl text-center font-bold font-mono rounded dark:brightness-150"><svg width="2.25rem" height="2.25rem" viewBox="0 0 60.8 60.8" xmlns="http://www.w3.org/2000/svg"><g id="svgGroup" stroke-linecap="round" fill-rule="evenodd" font-size="9pt" stroke="#2DA4A8" stroke-width="0.25mm" fill="#2DA4A8" style="stroke: rgb(45, 164, 168); stroke-width: 0.25mm; fill: rgb(45, 164, 168);"><path d="M 60.8 60.8 L 0 60.8 L 0 0 L 60.8 0 L 60.8 60.8 Z" vector-effect="non-scaling-stroke"></path></g><text x="50%" y="50%" text-anchor="middle" alignment-baseline="central" dominant-baseline="central" font-size="9rem" fill-opacity="0">◼</text></svg></div>'],
        ];
        let next = "A";
        let current = this.classList[1];
        for (let i of changeTable) {
            if (i[0] == current) {
                next = i[1];
                break;
            }
        }
        this.classList.replace(current, next);
        for (let i of tiles) {
            if (i[0] == next) {
                $(this).html(i[1]);
                break;
            }
        }
    });

});

function createPage() {
    drawPage();
    setLength();
    setWordbank();
    update();
}

function resetPage() {
    spotle = false;

    clearPolygonle();
    clearGrids();
    clearHTML(document.getElementById('next-previous-buttons'));
    drawPage();
    update();
}

function clearGrids() {
    let grids = document.getElementsByClassName('grid');

    for (let i = 0; i < grids.length; i++) {
        clearHTML(grids[i]);
    }
    
    let full_grid = document.getElementById('hints');
    full_grid.classList.add('empty');

    drawPage();
    update();
}

function getPreferences() {
    if (localStorage.getItem('bot_type')) {
        let bot_type = localStorage.getItem('bot_type');
        setBotMode(bot_type);
        document.getElementById('bot-type').value = bot_type;
    } else {
        setBotMode(WORDLE);
    }

    if (localStorage.getItem('wordbank')) {
        let bank = localStorage.getItem('wordbank');
        document.getElementById(bank).checked = true;
        document.getElementById(otherWordbank(bank)).checked = false;
        setWordbank()
    }

    // if (bot.isFor(WARMLE) && localStorage.getItem('warmle_dist')) {
    //     let dist = localStorage.getItem('warmle_dist');
    //     document.getElementsByClassName('warmle-selector')[0].value = dist;
    // }
}

function otherWordbank(bank) {
    if (bank == 'restricted') return 'complete';
    return 'restricted';
}

function drawPage() {
    let container = document.getElementById('container');
    let header = document.getElementById('top-of-screen');
    let hints = document.getElementById('hints');

    addGrid(hints);
    
    createMainHeader(header);
    createWordLengthSelector();
    
    createGuessInput(container);
    createAnswerSuggestions(container);
    
    updateSettings();

    if (bot.isFor(POLYGONLE)) {
        createPolygonleInput();
    }
}

function createPolygonleInput() {
    $(".polygonle-grid").remove();
    let ele = createElement('div', '', 'polygonle-grid');
    let grid = $(ele).insertAfter("#word-entered");
    for (let i = 0; i < word_length; i++) {
        ele = createElement('button', '<div aria-label="yellow bottom-right triangle" tabindex="0" role="listitem" class="w-12 h-12 sm:w-14 sm:h-14 flex items-center justify-center mx-0.5 text-5xl text-center font-bold font-mono rounded dark:brightness-150"><svg width="2.25rem" height="2.25rem" viewBox="0 0 59.8 59.8" xmlns="http://www.w3.org/2000/svg"><g id="svgGroup" stroke-linecap="round" fill-rule="evenodd" font-size="9pt" stroke="#FEC04F" stroke-width="0.25mm" fill="#FEC04F" style="stroke: rgb(254, 192, 79); stroke-width: 0.25mm; fill: rgb(254, 192, 79);"><path d="M 59.8 59.8 L 0 59.8 L 59.8 0 L 59.8 59.8 Z" vector-effect="non-scaling-stroke"></path></g><text x="50%" y="50%" text-anchor="middle" alignment-baseline="central" dominant-baseline="central" font-size="9rem" fill-opacity="0">◢</text></svg></div>', 'polygonle-tile A');
        $(grid).append(ele);
    }
    $(".polygonle-filter").remove();
    let filter = createElement('button', 'set polygonle options', 'polygonle-filter');
    filter.addEventListener('click', function() {
        update();
    });
    $(filter).insertAfter(".polygonle-grid");
}

function clearPolygonle() {
    $(".polygonle-grid").remove();
    $(".polygonle-filter").remove();
}

function updateSettings() {
    let extra = document.getElementsByClassName('extra-settings')[0];
    
    if (bot.isFor(WARMLE)) {
        let selector = createElement('select', '', 'warmle-selector');

        for (let i = 3; i >= 1; i--) {
            let option = createElement('option', i);
            option.value = i;
            selector.append(option);            
        }

        setHTML(extra, 
                "Yellows are " + selector.outerHTML + " letters away from the correct letter.");

        if (localStorage.getItem('warmle_dist')) {
            document.getElementsByClassName('warmle-selector')[0].value = localStorage.getItem('warmle_dist');
        }
    } else {
        clearHTML(extra);
    }
}

function addGrid(hints) {
    clearHTML(hints);

    for (let i = 0; i < bot.getCount(); i++) {
        let grid = createElement('div', '', 'grid');
        hints.append(grid);
    }

    if (bot.isFor(SPOTLE)) {
        setUpBlankGrid();
    }
}

function setUpBlankGrid() {
    let grid_size = 6;

    for (let i = 0; i < grid_size; i++) {
        makeTables(" ".repeat(word_length));
    }

    addFinalizeGridButton();
}

function addFinalizeGridButton() {
    clearHTML(document.getElementById('next-previous-buttons'));

    let finalize = createElement('button', 'finalize grid', 'finalize');
    let button_container = document.getElementById('next-previous-buttons');

    finalize.addEventListener('click', function () {
        update();
    });

    button_container.append(finalize);
}

function createMainHeader(div) {
    let main_header = document.getElementById('top-of-screen');
    let title = main_header.getElementsByTagName('h1')[0];

    title.innerHTML = bot.type + ' Calcle';
    main_header.append(title);
}

function createWordLengthSelector() {
    let select_length = document.getElementById('word-length');

    let options = "";
    for (let i = SMALLEST_WORD; i <= LARGEST_WORD; i++) {
        let selected = "";
        if (i == 5) selected = "selected = 'selected'";
        options += "<option value='" + i + "' " + selected +">" + i + "</option>";
    }

    if (bot.isFor(THIRDLE)) {
        localStorage.setItem('word_length' + bot.type, 3);
        options = "<option value ='3' selected = 'selected'>3</option>";
    }

    if (bot.isFor(SPOTLE)) {
        localStorage.setItem('word_length' + bot.type, 5);
        options = "<option value ='5' selected = 'selected'>5</option>";
    }

    select_length.innerHTML = options;
    
    if (localStorage.getItem('word_length'+ bot.type) && (localStorage.getItem('word_length'+ bot.type) >= SMALLEST_WORD || bot.isFor(THIRDLE))) {
        select_length.value = localStorage.getItem('word_length'+ bot.type);
    }
}

function createMaxGuesses(div) {
    let max_input = document.getElementById('max-guesses');

    let options = "";
    for (let i = 3; i <= 21; i++) {
        let selected = "";
        if (i == 6) selected = "selected = 'selected'";
        options += "<option value='" + i + "' " + selected +">" + i + "</option>";    
    }

    if (bot.isFor(THIRDLE)) {
        localStorage.setItem('guesses' + bot.type, 3);
        options = "<option value ='3' selected = 'selected'>3</option>";
    }

    if (bot.isFor(SPOTLE)) {
        localStorage.setItem('guesses' + bot.type, 6);
        options = "<option value ='6' selected = 'selected'>6</option>";
    }

    max_input.innerHTML = options;
    
    if (localStorage.getItem('guesses' + bot.type)) {
        max_input.value = localStorage.getItem('guesses' + bot.type);
    }
}

const EXAMPLE_LIST = 
    [
        {word: 'BLOKE', score: '2.188 guesses left', wrong: '96.77% solve rate'}, 
        {word: 'YOLKS', score: '2.250 guesses left'}, 
        {word: 'KOELS', score: '2.250 guesses left'},
        {word: 'KYLOE', score: '2.250 guesses left'}
    ];

function createExample() {
    let example_row = createRow('TRAIN', 'dummy');
    bot.setRowColor('GBYBB', example_row);

    let example_list = createElement('ul', '', 'word-list dummy');
    
    for (let i = 0; i < EXAMPLE_LIST.length; i++) {
        // example_list.innerHTML += createListItem(EXAMPLE_LIST[i].word, EXAMPLE_LIST[i].score, i+1);
        example_list.append(createListItem(EXAMPLE_LIST[i].word, EXAMPLE_LIST[i].score, i+1));
    }

    return {row: example_row, list: example_list};
}

function createWrongExample() {
    let example_wrong = createElement('ul', '', 'word-list dummy');
    // example_wrong.innerHTML = createListItem(EXAMPLE_LIST[0].word, EXAMPLE_LIST[0].wrong, 1);
    example_wrong.append(createListItem(EXAMPLE_LIST[0].word, EXAMPLE_LIST[0].wrong, 1));

    return example_wrong;
}

function makeCloseButton(type) {
    let close_button = createElement('button', '', type + ' close');
    return close_button;
}

function createInfoParagraphs() {
    let p1 = createElement('p', `Simply enter in your last guess, click on the tiles until the colors match, hit calculate, 
                                and the WordleBot will give you the best possible guesses from that point.`);

    let p2 = createElement('p', `This means the best guess from this point would be ` + EXAMPLE_LIST[0].word + `,
                                and that you have an average of ` + EXAMPLE_LIST[0].score + `. If you see:`);

    let p3 = createElement('p', `That means ` + EXAMPLE_LIST[0].word + ` will only solve 96.77% of the remaining possible answers within ` + bot.guessesAllowed() + ` guesses.
                                Generally speaking, you should only see this if you're playing on hard mode.`);

    let p4 = createElement('p', `Want to see how good your starting word is? Click the 
                                <button class = 'test dummy' disabled><i class="gg-bot"></i></button> on the top right to get a good idea.`);

    return [p1, p2, p3, p4]
}

function explainExample() {
    let explanation = createElement('div', '', 'description');

    if (bot.isFor(WORDLE)) {
        explanation.innerHTML = 'T is in the correct position, A is in the word but not in the correct position, and R, I, and N are not in the word.'
    }

    if (bot.isFor(WOODLE)) {
        explanation.innerHTML = 'TRAIN has one letter in the correct position, and one letter in the word, but not in the correct position';
    }

    if (bot.isFor(PEAKS)) {
        explanation.innerHTML = 'The 1st letter of the word is T, the second 2nd letter comes before R in the alphabet, the 3rd comes after A, the 4th before I, and the 5th before N.';
    }

    return explanation;
}

function createInfoPage() {
    let info = document.getElementsByClassName('info screen')[0];
    if (info.classList.contains('display')) return;

    let close_button = makeCloseButton('info');
    let example = createExample();
    let explanation = explainExample();
    let example_wrong = createWrongExample();
    let paragraphs = createInfoParagraphs();

    let main_header = createElement('h3', 'How does this Work?', 'top-header');
    let sub_header = createElement('h3', 'After each guess you should see something like this:', 'mini');

    info.append(close_button);   // button to close screen
    info.append(main_header);    // 'how does this work' 
    info.append(paragraphs[0]);  // intro paragraph
    info.append(sub_header);     // header to examples
    info.append(example.row);    // example row w/ colors
    info.append(explanation)     // explanation of tiles
    info.append(example.list);   // example answer list 
    info.append(paragraphs[1]);  // explanation of answer list
    info.append(example_wrong);  // example answer list with wrong %
    info.append(paragraphs[2]);  // explanation of wrong %
    info.append(paragraphs[3]);  // bot paragraph

    info.classList.remove('back');
    info.classList.add('display');

    close_button.addEventListener('click', function() {
        info.classList.remove("display");
        info.classList.add("back");
        clearHTML(info);
    });
}

function createSettingsPage() {
    let settings = document.getElementsByClassName('settings screen')[0];

    settings.classList.remove('hide');
    settings.classList.add('display');
    
    let close = settings.getElementsByClassName('close')[0];
    close.addEventListener('click', function() {
        settings.classList.remove("display");
        settings.classList.add("hide");
    });
}

function createGuessInput(div) {
    let input = document.getElementById('word-entered');
    setInputAttributes(input);
}

function setInputAttributes(input) {
    input.setAttribute('autocomplete', 'off');
    input.setAttribute('placeholder', 'enter your guess here');
    input.setAttribute('onkeypress', 'return /[a-z]/i.test(event.key)');
    input.setAttribute('oninput', 'this.value = this.value.toUpperCase()');
}

function createAnswerSuggestions() {
    let suggestions = document.getElementById('suggestions');

    if (bot.hasHardMode() && !document.getElementById('mode')) {
        createHardModeSwitch(suggestions);
    } else if (!bot.hasHardMode() && document.getElementById('mode')) {
        removeHardModeSwitch(suggestions);
    }

    if (bot.hasMax()) {
        createMaxGuesses(suggestions);
    } else {
        let max = document.getElementById('max-guesses');
        localStorage.setItem('guesses' + bot.type, 'infinity');
        max.innerHTML = "<option value ='infinity' selected = 'selected'> &#8734 </option>";    
    }

    createAnswerLists(suggestions);
}

function createAnswerLists(div) {
    if (document.getElementById('answers')) {
        document.getElementById('answers').remove();
    }

    let answer_lists = createElement('div', '', '', 'answers');

    createOptions(answer_lists);
    div.append(answer_lists);
}

function createOptions(div) {
    let best_guesses = createElement('div', '', 'best-guesses');
    let word_list = createElement('ul', '', 'word-list');

    best_guesses.append(word_list);
    div.append(best_guesses);
}

function createHardModeSwitch(div) {
    let switch_label = createElement('div', "Show me the best guesses for 'Hard Mode':", 'hard label');
    let switch_container = createElement('label', '', 'hard switch');
    let switch_slider = createElement('span', '', 'slider round');
    let switch_checkbox = createElement('input', '', '', 'mode');
    switch_checkbox.setAttribute('type', 'checkbox');

    switch_container.append(switch_checkbox);
    switch_container.append(switch_slider);
    
    let header = document.getElementsByClassName('mini-title')[0];
    div.insertBefore(switch_label, header);
    div.insertBefore(switch_container, header);

    switch_checkbox.addEventListener('change', function() {
        update();
    });
}

function removeHardModeSwitch() {
    let label = document.getElementsByClassName('hard label')[0];
    let container = document.getElementsByClassName('hard switch')[0];

    if (label) label.remove();
    if (container) container.remove();
}
