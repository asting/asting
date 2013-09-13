function xd(){
  if (typeof(console) != "undefined" && typeof(console.log) != "undefined") console.log($A(arguments));
    else alert(Dump($A(arguments),1,4));
}

// Javascript Console
function axd(){
  if (arguments.length==1) var params = arguments[0];
  else {
    var params = [];
    for (var i = 0; i < arguments.length; i++)
      params[i]=arguments[i]
  }
  alert(Dump(params,1,4));

}
function Dump(d,l,r) {
    if (typeof(l) == "undefined") l = 1;
    if (typeof(r) == "undefined") r = 3;
    if (l>r) return "***Recursed***\n";
    var s = '';
    var c=0;
    if (typeof(d) == "object" || d instanceof Object) {
        if (typeof(d["Dump"]) == "function") return "[window]\n";
        if (typeof(d["location"]) == "object") return "[document]\n";
        s += typeof(d) + " {\n";
        try{
          for (var k in d) {
              //if (l>1 && c++>3) continue;
              try{
                var v = d[k];
                if (v == null || typeof(v)=="function" || ((v.constructor||{}).prototype||{})[k]) continue;
              }catch (e) {}
              for (var i=0; i<l; i++) s += "  ";
              s += k+": " + Dump(v,l+1,r);
          }
        }catch (e) {}
        for (var i=0; i<l-1; i++) s += "  ";
        s += "}\n"
    } else {
        s += "" + d + "\n";
    }
    return s;
}
