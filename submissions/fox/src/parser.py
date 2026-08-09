from lexer import cook, oper, rsvd
from rply import ParserGenerator
from semantic import mkStatements, Confirm, Defn
from semantic import Alt, Seq, Rep, exprMutPat, exprMut
from semantic import App, Comma, Mul, Sub, Leq, Eql
from semantic import exprId

################################################################################
def gram(s):
    vs = s.split('$$')
    prd = vs[0]
    xs = vs[1].split()
    funsrc = "lambda p: {}({})".format(xs[0],
                ",".join("p[{}]".format(n) for n in xs[1:]))
    pg.production(prd)(eval(funsrc))

def Gram(s):
    [gram(l) for l in s.split('\n') if '$$' in l]
################################################################################

idem = lambda p: p

pg = ParserGenerator(list(rsvd.values()) +
                     list(oper.values()) +
                     "NAM LPN RPN".split(),
    precedence=[
        ('left', ['ALT']),
        ('left', ['SEQ']),
        ('nonassoc', ['WHEN','THEN']),
        ('right', ['DEF']),
        ('left', ['COMMA']),
        ('nonassoc', ['LE', 'EQ']),
        ('left', ['SUB']),
        ('left', ['MUL']),
        ('right', ['LPN']),
    ])

Gram("""
    start : statements                    $$ idem 0

    statements : statement statements     $$ mkStatements 0 1
    statements : statement                $$ mkStatements 0

    ### Top-level statements #################################

    statement : CONFIRM expr IS expr DOT  $$ Confirm 1 3
    statement : expr DEF expr DOT         $$ Defn 0 2

    ### Simple expressions ###################################

    expr : expr ALT expr      $$ Alt 0 2
    expr : expr SEQ expr      $$ Seq 0 2
    expr : ITER LPN expr RPN   $$ Rep 2

    expr : WHEN expr THEN expr $$ exprMutPat 1 3
    expr : expr DEF expr       $$ exprMut 0 2

    expr : expr LPN expr RPN  $$ App 0 2

    expr : expr COMMA expr    $$ Comma 0 2
    expr : expr MUL expr      $$ Mul 0 2
    expr : expr SUB expr      $$ Sub 0 2
    expr : expr LE expr       $$ Leq 0 2
    expr : expr EQ expr       $$ Eql 0 2

    expr : LPN expr RPN       $$ idem 1

    ### Values ###############################################

    expr : NAM                $$ exprId 0
""")

parser = pg.build()

def genAST(src):
    return parser.parse(cook(src))
