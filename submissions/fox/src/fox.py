from rply import ParsingError
from lexer import cook
from parser import genAST
import os

def Eval(src,env):
    try:
        v = genAST(src).eval(env)
    except ParsingError as err:
        print(err)
        return 1
    return 0

s = os.read(0,2**16).decode("utf8")
Eval(s,frozenset())
