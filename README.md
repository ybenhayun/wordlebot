# Wordle Bot
This is both a Wordle solver and a fully functional Wordle bot, based on the rules of [Wordle](https://www.nytimes.com/games/wordle/index.html) by Josh Wardle. You can either:

- Enter in your guess, and see what the next best guess would be based on the color of your tiles.
- Enter in a starting word, and run the Wordle bot to see the average score the bot would receive over 300 games, if it started with that word.

This bot has settings for both normal and hard mode (on hard mode you are forced to use all previously given hints). The suggestions for future guesses can be entirely different across these two settings, as they result in entirely different games.

# Wordbank

You have two choices for which wordbanks the wordlebot will consider as potential answers. Either:
- 'Most Likely Answers', based on the answerbanks from [Wordle](https://www.nytimes.com/games/wordle/index.html), [Quordle](https://www.quordle.com/#/), and [hellowordl](https://hellowordl.net/).
- 'Wordle + all variants', includes all possible answers from Wordle Unlimited (no longer active).
Since WordleUnlimited was taken down I will have to update the larger list. The starting words the bot suggests is different for 'Wordle + all variants', but I haven't fully tested all words under that setting.

# Performance

The algorithm for this bot is fully optimized for normal mode (3.4212 using SALET as an opening guess), and has a 100% success rate on hard mode (3.5119 using SALET). In terms of lowering the overall average, there is still room for further optimization on hard mode.

# Algorithm
The bot starts by looking at all possible guesses after a first (or second/third etc.) guess. It compares those possible guesses to all words that it thinks could be the answer, and groups them into buckets based on the colors you would see, for that specific guess and that specifc answer. For example:

    Guess word: AROSE
    ----------------------
    Potential Answer: ABACK
    Colors: GBBBB (the 'A' in AROSE is correct, nothing else is).
    ----------------------
    Potential Answer: BEARD
    Colors: YYBBY ('A', 'R', and 'E' are all in the word, but in different places).
    ----------------------
    Potential Answer: ALARM
    Colors: GBBBB (notice this is the same pattern as ABACK).

So in this example, the bucket GBBBB would be size 2, and the bucket YYBBY, would be size one.
After going through all the potential answers, and calculating all the expected differences, the bot:

- takes a weighted average of the size of each bucket (in the above example it would be 1.67)
- determines the approximate likelihood you should expect to land on the answer by the next guess. If you saw YYBBY, there is a 100% chance as there's only one word left, if you saw GBBBB you would have a 50% chance of guesses the correct word on the next guesses, as you'd still have two possibilities. This averages to 66.67% chance of ending the game on the next guess.
- Calculates a rough 'adjusted score' to sort by, by letting 
    
    adjusted = (1 - 'odds game ends on the next turn')*'average size of each bucket'

From there, the bot takes the top 50 words from that metric, and maps out how each of those words would get to *every possible answer* recursively. As in, if you were considering DRONE as a second guess after SALET:

    SALET --> DRONE --> REIGN (3 guesses to get to REIGN)
    SALET --> DRONE (2 guesses to get to DRONE)
    SALET --> DRONE --> URINE --> BRINE (4 guesses to get to BRINE)
    SALET --> DRONE --> MURRY --> BERRY --> FERRY (5 guesses to get to FERRY)

The word that takes the lowest number of guesses (on average) to get to every answer, is the best possible guess at that point.
Note-- the first metric is only used to reduce the testing size to 50 (as supposed to 12972).

# Progress
The largest thing I'm currently working on, other than minor polishes and bug fixes to the site, is increasing the efficiency of the bot without sacrificing overall average.

# Site
You can play around with the bot yourself [here](https://ybenhayun.github.io/wordlebot/)
