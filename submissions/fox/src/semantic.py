from dataclasses import dataclass

@dataclass(frozen=True)
class Eps:
    pass

@dataclass(frozen=True)
class Ret:
    p: any
    n: str

@dataclass(frozen=True)
class Mut:
    p: any
    ns: tuple[str]
    xs: tuple[any]
 
@dataclass(frozen=True)
class Alt:
    x: any
    y: any

@dataclass(frozen=True)
class Seq:
    x: any
    y: any

@dataclass(frozen=True)
class Rep:
    x: any

# # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # 

@dataclass(frozen=True)
class Statements:
    x: any
    y: any

@dataclass(frozen=True)
class Confirm:
    x: any
    y: any

@dataclass(frozen=True)
class Defn:
    x: any
    y: any

@dataclass(frozen=True)
class Tru:
    pass

@dataclass(frozen=True)
class Val:
    v: int

@dataclass(frozen=True)
class Var:
    n: str

@dataclass(frozen=True)
class Sub:
    x: any
    y: any

@dataclass(frozen=True)
class Mul:
    x: any
    y: any

@dataclass(frozen=True)
class Leq:
    x: any
    y: any

@dataclass(frozen=True)
class Eql:
    x: any
    y: any

@dataclass(frozen=True)
class App:
    x: any
    y: any

@dataclass(frozen=True)
class Comma:
    x: any
    y: any

@dataclass(frozen=True)
class Lam:
    ns: any
    x: any

################################################################################

def seq(x,y):
    if x == Eps(): return y
    return Seq(x,y)

def run(f,d):
    v = frozenset(d.items())
    old, new = set(), {(f,v)}
    while frozenset(old) != frozenset(new):
        old = new
        new = {(g,w) for f,v in old for g,w in f.step(v)}
        for f,v in new:
             if f.nullable():
                  d = dfromfs(v)
                  if "_retval" in d:
                       return d["_retval"]
    return None

Eps.nullable = lambda self: True
Ret.nullable = lambda self: False
Mut.nullable = lambda self: False
Alt.nullable = lambda self: self.x.nullable() or self.y.nullable()
Seq.nullable = lambda self: self.x.nullable() and self.y.nullable()
Rep.nullable = lambda self: True

Eps.step = lambda self,v: set()
Ret.step = lambda self,v: stepret(self,v)
Mut.step = lambda self,v: stepmut(self,v)
Alt.step = lambda self,v: {(self.x,v),(self.y,v)}
Seq.step = lambda self,v: stepseq(self,v)
Rep.step = lambda self,v: {(seq(self.x,self),v),(Eps(),v)}

def dfromfs(v):
    return {k:v for (k,v) in v}

def stepret(f,v):
    if not f.p.eval(v): return set()
    d = dfromfs(v)
    d["_retval"] = f.n.eval(v)
    return {(Eps(),frozenset(d.items()))}

def stepmut(f,v):
    if not f.p.eval(v): return set()
    d = dfromfs(v)
    for n,x in zip(f.ns,f.xs):
        d[n] = x.eval(v)
    return {(Eps(),frozenset(d.items()))}

def stepseq(f,v):
    return ({(seq(h,f.y),w) for h,w in f.x.step(v)}  |
            (set() if not f.x.nullable() else f.y.step(v)))
  
# # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # 

Tru.eval = lambda self,v: True
Val.eval = lambda self,v: self.v
Var.eval = lambda self,v: dfromfs(v)[self.n]
Sub.eval = lambda self,v: self.x.eval(v) - self.y.eval(v)
Mul.eval = lambda self,v: self.x.eval(v) * self.y.eval(v)
Leq.eval = lambda self,v: self.x.eval(v) <= self.y.eval(v)
Eql.eval = lambda self,v: self.x.eval(v) == self.y.eval(v)

def evalstate(st,v):
    w = st.x.eval(v)
    if st.y:
        x = st.y.eval(w)
    return None

def vars(x):
    if isinstance(x,Comma): return vars(x.x)+vars(x.y)
    elif isinstance(x,Var): return (x.n,)
    else:                   return tuple()

def evaldefn(df,v):
    key = df.x.x.n
    val = Lam(vars(df.x.y),df.y)
    return v|{(key,val)}

def evalconf(cf,v):
    x = cf.x.eval(v)
    y = cf.y.eval(v)
    if x==y:
        print(f"confirmed {x}")
    else:
        print(f"ERROR: {x} != {y}")
    return v

def evalapp(ap,v):
    lam = dfromfs(v)[ap.x.n]
    yy = ap.y.eval(v)
    if isinstance(yy,Comma): vv={lam.ns[0]:yy.x, lam.ns[1]:yy.y}
    else:                    vv={lam.ns[0]:yy}
    return run(lam.x,vv)

App.eval = evalapp
Defn.eval = evaldefn
Confirm.eval = evalconf
Statements.eval = evalstate

Comma.eval = lambda self,v: Comma(self.x.eval(v),self.y.eval(v))

################################################################################

def exprMutPat(pred,xpr):
    if isinstance(xpr,Var):
        return Mut(pred,("_retval",),(xpr,))
    return Mut(pred,xpr.ns,xpr.xs)

def exprMut(x,y):
    if isinstance(x,Comma):
        return Mut(Tru(),(x.x.n,x.y.n),(y.x,y.y))
    return Mut(Tru(),(x.n,),(y,))

def exprId(p):
    s = p.getstr()
    if s[0] in "0123456789": return Val(int(s))
    return Var(s)

def mkStatements(x,y=None):
    return Statements(x,y)
