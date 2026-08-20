# PROGRAMMING LANGUAGE JAM No. 2

## OVERVIEW

The #language-makers programming language jam is a fun and casual opportunity to
get creative and make a new programming language in 1 week!

## HOW IT WORKS

You get 1 week to design and implement a programming language that fits the
jam's theme. After the jam closes, the organizing committee will highlight our
favorite submissions and award one a modest but special prize.

### THEME

<strike>This year's theme will be announced on July 31st, noon EDT!</strike>

This year's jam theme is

<details>
  <summary><strong>Corecursion</strong></summary>
  <blockquote>
  Don't let Wikipedia get you confused -- you're probably already familiar with corecursion without realizing it.
  Structural recursion is when you consume one layer of a data-structure at a time to build up a result; whereas, corecursion is when you iteratively apply a step function until some condition is met.

<br/>

<i>Hint: if you can't figure out how to write a recursive function with
reduce/fold, it's probably corecursive!<i>

</details>

Feel free to interpret the theme as literally or figuratively as you want. Get
creative and have fun!

### SUBMISSIONS

Fork this repo and create a PR that adds your language to the `/submissions`
directory. Put your language into a repo named after your language:

    ├─ submissions
       ├─ <pl-name>
           ├─ README.md
           ├─ src

In your README, include at least 1 sample program with an explanation of how it
works.

While not required, including clear instruction on how to run example programs
in a **sandbox** dramatically increase the chances we will try to run your
language. This could be a dockerfile, a web playground, or something else.

## RULES & GUIDELINES

- PL must adhere to theme
  - include an explanation of how your PL fits the theme in your README
- PL must be original
  - please do not submit a PL that existed in any form before the jam starts
- You may work in teams!
- Your language must not require paying any money or sharing any personal
  information to compile or use.
  - e.g. 3rd party service, API, or subscription
- Your PL <u>may not exceed 1000 LOC</u> (see FAQ for details)
- Submission must include at least 1 sample program with an explanation of how
  it works.

### AI POLICY

You may use AI however you like; however, your README must fully document how AI
was used, or not used, in your submission. The final submitted language must not
require AI to compile or run. Failure to disclose AI usage may result in
disqualification from the jam.

### SCHEDULE

Kickoff on Fri July 31st. Submission deadline Sun Aug 9th (end of day).

## FAQ

<details>
  <summary>What counts as a PL?</summary>
    A programming language can be many things: a runtime, interpreter,
    compiler, or transpiler. Compilers can take decades to write so nobody is
    expecting the next python -- even getting a single contrived program to run
    is a huge accomplishment. Look in <i>/examples</i> for some super simple
    examples for inspiration.
</details>
<details>
  <summary>How does judging work?</summary>
  The organizing committee has no official rubric for judging. This is just for
  fun. The real reward is having people engage with your language, so be
  generous about checking out other submissions after the jam closes.
</details>
<details>
  <summary>LOC limit</summary>
  We will be reading source code so we need the submissions to be digestable. Dependencies, tests, configs, and build files do not count towards LOC limit.
  Please don't put all your code on 1 line or commit project logic into dependencies. We reserve the right to disqualify submissions that violate the spirit of the rules.
</details>
<details>
  <summary>Questions and comments</summary>
  Please use github <a href="https://github.com/jzwood/langjam2/issues">issues</a> for additional questions, comments, and clarifications.
</details>

# AWARDS

- **Top pick**: [Kudzu](/submissions/kudzu/README.md) by [hellerve](https://github.com/hellerve)
- **Runner up**: [Fox](/submissions/fox/README.md) by [demaere-oiie](https://github.com/demaere-oiie)
- **Honorable mention**: [Hieros](/submissions/hieros/README.md) by [tobynorth](https://github.com/tobynorth)

## SUPPORTERS

1. [CoRecursive](https://corecursive.com/) podcast

> Each episode someone shares the fascinating story behind a piece of software
> being built.
