## Hieros

Do some exceptionally basic math with Egyptian hieroglyphic numerals in a REPL! Implemented in JS.

### "Corecursion" Theme

Much like how the *Corecursive* podcast notes that there's joy and pain to be found in ["Learning a new language"](https://corecursive.com/051-bruce-tate-language-learning/), you may end up finding joy and pain in learning a little bit of Ancient Egyptian while using this PL. (Perhaps joy in, say, learning that the Egyptian hieroglyph for 100,000 is 𓆐, a tadpole -- surely because there are *so many* tadpoles when they all hatch at once. As well as pain in squinting to try to read a character like 𓂵 (nine fingers, meaning 90,000).)

### Prerequisites

Node.js runtime + if there are any unrendered boxes in this readme, you will need to install a font that supports Egyptian hieroglyphs, and set up your terminal to use it. I recommend [Go Noto Ancient](https://github.com/satbyy/go-noto-universal/releases/download/v7.0/GoNotoAncient.ttf).

### How it works
Read [this](https://en.wikipedia.org/wiki/Egyptian_numerals#Digits_and_numbers) first to learn how Egyptian hieroglyphic numerals work. You can also find the Unicode characters you'll need to use Hieros as image captions: 𓏤 is 1, 𓎆 is 10, etc.

As of writing, you can do exactly three things in Hieros:
# [Addition](https://en.wikipedia.org/wiki/Ancient_Egyptian_mathematics#Notation)
Syntax: <expr> 𓂻 <expr>
# Subtraction
Syntax: <expr> 𓂽 <expr>
# Variable setting/getting (only 1 variable supported)
The single supported "variable name" is 𓊢𓂝𓇤.* Setting it: 𓊢𓂝𓇤 <expr>
* Printing it: 𓊢𓂝𓇤 (by itself)

*This translates as "unknown quantity," and [was actually used in algebra problems](https://en.wikipedia.org/wiki/Egyptian_algebra#Aha_problems,_linear_equations_and_false_position)

### Example program

Set the variable to 20 + 200 - 39:
```
𓊢𓂝𓇤𓎇𓂻𓍢𓍢𓂽𓎈𓐂
```

Set the variable to itself + 1000:
```
𓊢𓂝𓇤𓊢𓂝𓇤𓂻𓆼
```

Print the variable (prints 1181 in hieroglyphs):
```
𓊢𓂝𓇤
```

### AI usage
I used Claude to:
* Ideate a bit on potential language features
* Figure out how to set up my terminal to display hieroglyphs correctly
* Troubleshoot bugs and/or suggest/remind me of the most canonical ways to do a few things related to:
** UTF-16 surrogate pairs
** Nested operator logic in the parser
** Mapping ranges of integers to objects (for converting hieroglyphs to numbers)
** Checking deep equality of arrays
** require/module stuff for moving tests to their own file
* Add the REPL on top of the core tokenizer/parser/transpiler logic
* Conduct a final code review