# Hylomorphic 
A visual programming language inspired by category theory.
## Author
Annika Rings
## About
Hylomorphic is an interactive, visual programming language that graphically builds and evaluates [Abstract Syntax Trees](https://en.wikipedia.org/wiki/Abstract_syntax_tree) (ASTs). Its syntax, naming, and semantics are explicitly inspired by [category theory](https://en.wikipedia.org/wiki/Category_theory).

## Hylomorphism

In [category theory](https://en.wikipedia.org/wiki/Category_theory), a [hylomorphism](https://en.wikipedia.org/wiki/Hylomorphism_(computer_science)) is an [anamorphism](https://en.wikipedia.org/wiki/Anamorphism) (corecursion) followed by a [catamorphism](https://en.wikipedia.org/wiki/Catamorphism) (recursion). In this sense, unfolding an AST from a seed structure is corecursive, while evaluating that AST down to a single value is recursive. An interpreter**, therefore, is fundamentally a hylomorphism.

**this statement specifically refers to an interpreter which builds an AST from a seed (e.g. source code) and evaluates the tree to a result by traversing it.

## The rest of the weird naming
As you might have guessed, the rest of the weird naming is also inspired by category theory. You'll come across the terms
* [Product](https://en.wikipedia.org/wiki/Product_(category_theory))
* [Coproduct](https://en.wikipedia.org/wiki/Coproduct)
* [Isomorphism/isomorphic](https://en.wikipedia.org/wiki/Isomorphism)
* [Initial object](https://en.wikipedia.org/wiki/Initial_and_terminal_objects)
* [Terminal object](https://en.wikipedia.org/wiki/Initial_and_terminal_objects)
* [Morphism](https://en.wikipedia.org/wiki/Morphism)

The precise meaning of these is not explained in detail here, only insofar it relates to the execution model of Hylomorphic. See the links for details.

## Syntax
As a visual programming language, Hylomorphic doesn't use text-based source code in the usual sense. Instead, it has a UI in which the programmer builds the AST incrementally by entering one token at a time. The interface accepts symbols for nodes and leaves of the tree as well as commands for evaluating or clearing the tree. See below (TUI) for details.

## Building the AST
Hylomorphic has a fundamentally different concept from normal text-based languages. Instead of writing source code, the user builds an AST graphically and evaluates it. The AST can have nodes and terminals (leaves). Each fully saturated node has 2 children.

### Node types
* Product: a product node
* Coproduct: a coproduct (sum) node
* Iso: an isomorphism node

### Leaf types
Hylomorphic supports 2 types of terminals:
* integers
* booleans

The AST is extended when the user enters a node or leaf type they would like to append to the AST. The new node or leaf is always appended to the leftmost empty space. If the tree has only terminals in all final layers, it is fully saturated. Nothing can be added to it. It can only be evaluated. Entering more AST symbols (node or leaf types) does nothing to the AST. Entering anything other than a valid symbol or command has no effect.

## Evaluating the AST
Evaluation happens by depth-first traversal. Only fully saturated nodes can be evaluated. Nodes which aren't fully saturated will remain as-is. The tree can be evaluated to another tree or a terminal, depending on whether it is fully saturated. 

When the AST is being evaluated, the user has different choices for what happens to the AST. They can either clear it and start a new tree, preserve the unevaluated tree after displaying the evaulation result or keep the evaluated AST as the new starting point. Details under the TUI instructions.

### Evaluation rules
A product node with 2 integer children multiplies the integers. A categorical coproduct corresponds to a sum in the sense of "sum types". A coproduct node is therefore a sum node. It sums its integer children.
A product node with 2 boolean children performs AND, as AND is the product in the Bool category*. A coproduct node performs OR on 2 boolean children for the equivalent reason (again, think sum types vs product types if you are familiar with [algebraic data types](https://en.wikipedia.org/wiki/Algebraic_data_type)).

A node with mixed children casts the boolean to an integer as follows:
TRUE corresponds to 1, as TRUE is the terminal object in the Bool category* and 1 (the singleton set) is the terminal object in Set.
FALSE corresponds to 0, as FALSE is the initial object in the Bool category* and 0 (the empty set) is the initial object in Set.

An isomorphism node checks whether its two children are isomorphic. Integers are seen as representing the cardinality of sets. Two finite sets are isomorphic if and only if they have the same cardinality. The isomorphism node therefore checks equality of integers. The boolean literals are only isomorphic to themselves in Bool*, as there isn't a morphism from TRUE to FALSE (in a category in which the morphism represents implication). Therefore, for boolean children, it also checks equality. 

*Here, Bool refers to the category whose objects are the boolean literals TRUE and FALSE and whose morphisms represent logical implication.


## TUI
Although Hylomorphic is intended as a visual programming language, it currently only has a TUI, due to LoC restriction and no-dependencies challenge of the jam. The graphical representation of the tree is an ASCII string in the terminal.

### TUI commands

to evaluate the AST, enter `e`

to clear the AST, enter `c`

to evaluate the AST but preserve it, enter `p`

to evaluate and keep the evaluated AST, enter `E`

to get a short demo, enter `demo`

to quit, enter `quit`

### Symbols for AST extension

you can append nodes or leaves to the AST with these symbols:

#### Nodes

`+`: adds a Coproduct node

`x`: adds a Product node

`i`: adds an Isomorphism node

#### Terminals (leaves)

`t`: adds a true terminal (leaf)

`f`: adds a false terminal (leaf)

any integer: adds an integer terminal (leaf)

### Display of the AST
The AST is displayed sideways. For left and right to make sense in terms of describing the children, the tree needs to be imagined rotated clockwise by 90 degrees. The current state of the AST is displayed after every entry.

## How Hylomorphic fits the lang jam theme (Corecursion)
As outlined above, a Hylomorphism is an anamorphism (corecursion) followed by a catamorphism (recursion). In this sense, building an AST is corecursion. Both the name and the idea of visualizing an AST are related to corecursion.

There is yet another link to corecursion: Hylomorphic is implemented in [Claro](https://docs.clarolang.com/), a language developed by Jason Steving, who was also one of the organizers of the first programming language jam. Although Claro was not developed in the jam, this shows how the jam's languages inspire other languages and therefore corecursively unfold new programming language ideas.

## A note on mathematical soundness

The allusions to category theory are intended mostly as a parody and should not be mathematically scrutinized. Hylomorphic is not intended as a research language for category theorists. That said, if you discover that any of my claims are blatantly wrong, feel free to point this out to me. I am not a category theory expert.

## AI usage

AI was used to help with the MODULE.bazel initial setup, to write the Dockerfile, to set up the GitHub codespace and to sense check my category theory analogies (without actually changing any of them after the check).

## How to run via GitHub Codespaces
1. Click [![Open in GitHub Codespaces](https://github.com/codespaces/badge.svg)](https://codespaces.new/AR2202/langjam2?devcontainer_path=.devcontainer%2Fdevcontainer.json)

2. Once the container finishes loading, open the integrated terminal.

3. Run the following commands:

`cd submissions/Hylomorphic`

`bazel run //example:Hylomorphic_bin`

This may take a while, especially on the first run.

If this is your only usage of GituHub Codespaces, it is unlikely to exceed your free allowance if you use it a reasonable amount of time per month.

If you prefer to run it locally, bazel will be required.

## How to run with docker

1. clone the repo

2. cd to the folder with the Dockerfile

3. `docker build -t hylomorphic . `

this may take a while

4. docker run -it --rm hylomorphic

## Hylomorphic example usage

1. Start the TUI
From the root directory, run 

`bazel run //example:Hylomorphic_bin`

2. Start the AST with a node, e.g. Product by typing:

`x`

3. Enter an integer

`5`

4. Enter another node, e.g. Coproduct:

`+`

5. Enter another integer:

`3`


6. Try evaluating your AST, but preserving it, by entering 

`p`

First, the evaluation result is displayed. It looks the same as your tree because nothing in your AST can be evaluated yet.

Your AST is preserved. 

7. Enter a boolean, eg true by typing: 
`t`


8. Evaluate it: 
`e`

The result is 20, which corresponds to (3+1) * 5

[more examples](https://github.com/AR2202/langjam2/blob/main/submissions/Hylomorphic/example/example.txt)