from rply import LexerGenerator, Token

rsvd = {t:t.upper() for t in """
Iter when then confirm is
""".split()}

Tab = lambda s: [l.split() for l in s.split('\n') if ' ' in l]

oper = dict(Tab('''
    *   MUL
    -   SUB
    <=  LE
    ==  EQ
    ,   COMMA
    <>  ALT
    ;   SEQ
    :=  DEF
    .   DOT
'''))

lg = LexerGenerator()

for typ,pat in Tab(r'''
    CMT //[^\n]*
    CMT ^#![^\n]*
    LPN \(
    RPN \)
    OPR [!?$&+*-/,:;<=>|@#%^~]+
    NAM [_\w]+
'''):
    lg.add(typ,pat)

lg.ignore('\\s+')
lexer = lg.build()

def cook(s):
    for t in lexer.lex(s):
        if   t.name == 'NAM': t.name = rsvd.get(t.value,'NAM')
        elif t.name == 'OPR': t.name = oper.get(t.value,'OPR')
        yield t
