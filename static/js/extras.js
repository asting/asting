String.prototype.Format = function() {
    var formatted = this;
    for (var i = 0; i < arguments.length; i++) {
        var regexp = new RegExp('\\{'+i+'\\}', 'gi');
        formatted = formatted.replace(regexp, arguments[i]);
    }
    return formatted;
};

Number.implement({
    slice: function(start, end){
      return this.toString().slice(start, end);
    }
});


String.implement({
  stripStyles: function(option){
    var styles = '';
    var text = this.replace(/<style[^>]*>([\s\S]*?)<\/style>/gi, function(){
      styles += arguments[1] + '\n';
      return '';
    });
    if (option === true && styles && StyleWriter) new StyleWriter().createStyle(styles);
    else if ($type(option) == 'function') option(styles, text);
    return text;
  },

  updateUrlValue: function(name, value){
    return this.toURI().setData(name, value).toString();
  },

  updateUrlValues: function(params){
    return this.toURI().setData(params, true).toString();
  },

  getUrlValue: function(name, part){
    return this.toURI().getData(name, part);
  },
  
  trim: function(chars){
    if (!chars) chars = '\\s+';
    var reg = new RegExp('^'+chars+'|'+chars+'$', 'g');
    return this.replace(reg, '');
  }

});

Array.implement({
  diff: function(a){
     return this.filter(function(i) {return !(a.indexOf(i) > -1);});
  },
  toInt: function(){
     for (var i = 0, l = this.length >>> 0; i < l; i++){
        if (i in this) this[i]=('0'+this[i]).toInt();
     }
     return this;
  },
  toFloat: function(){
     for (var i = 0, l = this.length >>> 0; i < l; i++){
        if (i in this) this[i]=('0'+this[i]).toFloat();
     }
     return this;
  },
  hyphenate: function(){
     for (var i = 0, l = this.length >>> 0; i < l; i++){
        if (i in this) this[i]=this[i].toString().hyphenate();
     }
     return this;
  },
  toObject: function() {
     var Obj={};
     for(var i in this) 
         if(typeof this[i] != "function")  
             Obj[i]=this[i];
     return Obj;
  }

});

var mergeOne = function(source, key, current){
    switch (typeOf(current)){
        case 'object':
            if (typeOf(source[key]) == 'array') source[key] = source[key].toObject();
            if (typeOf(source[key]) == 'object') Object.merge(source[key], current);
            else source[key] = Object.clone(current);
        break;
        case 'array': source[key] = current.clone(); break;
        default: source[key] = current;
    }
    return source;
};

Object.extend({
    merge: function(source, k, v){
        if (typeOf(k) == 'string') return mergeOne(source, k, v);
        for (var i = 1, l = arguments.length; i < l; i++){
            var object = arguments[i];
            for (var key in object) mergeOne(source, key, object[key]);
        }
        return source;
    }
});


Window.implement({
  isLoaded: window.loaded,
  qs: {}
});
//window.qs = window.getQueryStringValues();

Element.implement({
  getFormElements: function(enabled){
    if (enabled)  return this.getElements('input:enabled, textarea:enabled, select:enabled');
    else return this.getElements('input, textarea, select');
  },

  getFormHash: function(elements, enabled){
    var formHash = {};
    if (!elements) elements = document.id(this).getFormElements(enabled);
    elements.each(function(el){
      if (!el.name || formHash[el.name]) return;
      var value = el.get("inputValue");
      if (value == el.get('placeholder')) value=null;
      if (value) formHash[el.name] = encodeURIComponent(value);
    });
    return formHash;
  },
  getFormChanges: function(optionsasarray){
    var formHash = {};
    document.id(this).getFormElements().each(function(el){
      if (!el.name) return;
      var val;
        switch (el.type) {
                    case 'text' :
                    case 'textarea' :
                    case 'hidden' :
                            if (!/^\s*$/.test(el.value) && el.value != el.defaultValue && el.value!=el.get('placeholder')) formHash[el.name] = el.value;
                            break;
                    case 'checkbox' :
                    case 'radio' :
                            if (el.checked != el.defaultChecked) formHash[el.name] = el.checked?el.value:'';
                            break;
                    case 'select' :
                    case 'select-one' :
                    case 'select-multiple' :
                            j = 0, hasDefault = false;
                            var o = {};
                            while (opt = el.options[j++]) {
                               if (opt.selected != opt.defaultSelected) o[opt.value]= opt.selected?opt.value:'';
                               if (opt.defaultSelected) hasDefault = 1;

                            }
                            if (!hasDefault && el.type!='select-multiple' && el.options.length>1 && el.selectedIndex==0) {
                               delete o[el.options[0].value];
                            }

                            if (o) {
                              if (!optionsasarray) o = Object.values(o).erase('').join(',');
                              if (o) formHash[el.name] = o;
                            }                             
                            break;
        }
    });
    return formHash;
  },

  
  setFormHash: function(formHash){
    formHash = new Hash(formHash);
    document.id(this).getFormElements().each(function(el){
      if (!el.name || !formHash[el.name]) return;
      el.set("inputValue", decodeURIComponent(formHash[el.name]));
    });
    return formHash;
  },

  clearValue: function(){
    switch(this.get('tag')){
      case 'select':
        $each(this.options, function(option){
          if (option.selected) option.selected = false;
        });
      case 'input':
        if (['text', 'hidden' /*, 'submit', 'button'*/].contains(this.type)) this.value = '';
        if (this.checked || ['checkbox', 'radio'].contains(this.type)) this.checked = false;
        break;
      case 'textarea': this.value = '';
    }
    return this;
  },

  clearFormElements: function(){
    this.getFormElements().each(function(el){ el.clearValue() });
    return this;
  },


  effect: function(property, options){
    return new Fx.Tween(this, $extend({property: property}, options));
  },

  disable: function(){
    document.id(this).getFormElements().each(function(el){
      el.set('disabled', true);
    });
    return this;
  },

  enable: function(){
    document.id(this).getFormElements().each(function(el){
      el.set('disabled', false);
    });
    return this;
  },

  show: function(display) {
    original = this.retrieve('originalDisplay')?this.retrieve('originalDisplay'):this.get('originalDisplay');
    if (Browser.Engine.name=='unknown' || Browser.Engine.gecko || Browser.Engine.webkit) orig = {table: 'table', tbody: 'table-row-group', tr: 'table-row', td: 'table-cell'}[this.get('tag')];
      else orig='';
    this.setStyle('display',(display || original || orig || 'block'));
    return this;
  },
  inViewport : function(axis){
        if(!axis){
            return this.inViewport('x') && this.inViewport('y');
        };
        var position = this.getPosition();
        var size = this.getSize();
        var viewport = document.id(window).getSize();
        var offset = position[axis] + size[axis];
        return (offset < viewport[axis]);
  },
  inWindow : function(axis){
        if(!axis){
            return this.inWindow('x') && this.inWindow('y');
        };
        var position = this.getPosition();
        var scroll = document.id(window).getScroll();
        return (position[axis] > scroll[axis]);
  }


})

/*Element.alias('$', 'getElement');
Element.alias('$$', 'getElements');
*/

Element.Properties.values = {

    get: function(){
	if (this.get('tag')=='select') {
	   return this.getElements('option').get('value');
        }

	if (this.get('tag')=='input') {
          var result = [];
          switch(this.get('type')) {
            case 'checkbox':
            case 'radio':
              document.id(this.getParent('form')||document.body).getElements('input').each(function(input){
                if (input.get('name') == this.get('name')) result.push(input.get('value'));
              }, this);
              break;
          }
          return result;
 	}
    }
}
Element.Properties.inputValue = {

    get: function(){
       switch(this.get('tag')) {
        case 'select':
          vals = this.getSelected().map(function(op){
            var v = $pick(op.get('value'),op.get('text'));
            return (v=="")?op.get('text'):v;
          });
          return this.get('multiple')?vals:vals[0];
        case 'input':
          switch(this.get('type')) {
            case 'checkbox':
              return this.get('checked')?this.get('value'):false;
            case 'radio':
              var checked;
              if (this.get('checked')) return this.get('value');
              document.id(this.getParent('form')||document.body).getElements('input').each(function(input){
                if (input.get('name') == this.get('name') && input.get('checked')) checked = input.get('value');
              }, this);
              return checked||null;
          }
        default:
          return this.get('value');
       }
    },

    set: function(value){
       switch(this.get('tag')){
         case 'select':
           this.getElements('option').each(function(op){
             var v = $pick(op.get('value'), op.get('text'));
             if (v=="") v = op.get('text');
             op.set('selected', $splat(value).contains(v));
           });
           break;
         case 'input':
            switch(this.get('type')) {
               case 'radio':
                 if (this.get('values').contains(value)) {
                    document.id(this.getParent('form')||document.body).getElements('input').each(function(input){
                        if (input.get('name') == this.get('name')) input.set('checked', input.get('value')==value);
                    }, this);
                 }
		 break;
               case 'checkbox':
		 this.set('checked', $type(value)=="boolean"?value:$splat(value).contains(this.get('value')));
		 break;
	       default:
		 this.set('value', value);
	    }
            break;
         default:
            this.set('value', value);
       }
      return this;
    },
    erase: function() {
      switch(this.get('tag')) {
        case 'select':
          this.getElements('option').each(function(op) {
            op.erase('selected');
          });
          break;
        case 'input':
          if (['radio','checkbox'].contains(this.get('type'))) {
            this.set('checked', false);
            break;
          }
        default:
          this.set('value', '');
      }
      return this;
    }
};

Element.Properties.outerHtml = {
    get: function(){
        var copy = this.clone(); 
        var Outer = new Element('div').adopt(copy); 
        var theHtml = Outer.get('html'); 
        Outer.destroy(); 
        return theHtml;
    }
};


function $f(name, form){
  form = document.id(document.id(form)||document.body);
  var el = null;
  form.getElements('input,select,textarea').each(function(input){
    if (!el && input.get('name') == name) el = document.id(input);
  });
  return el || form.getElement('#'+name);
}


function updateFields(vars, form){
  form = document.id(document.id(form)||document.body);
  $H(vars).each(function(v, k){
    var el = $f(k, form);
    if(el){
      if (el.form) el.set('inputValue', v);
      else if(el.get('tag')=="span") el.set('html', v);
    }
  });
}


function is_true(value){
  if ("string" == typeof(value)) {
    if (value=="0" || value.toLowerCase()=="no" || value.toLowerCase()=="false" || value.length==0) return false;
      else return true;
  }
  if ("number" == typeof(value))
    if (value>0) return true;
      else return false;
  if ("boolean" == typeof(value)) return value;
  if ("undefined" == typeof(value)) return false;
  if ("function" == typeof(value)) return true;
  if ("object" == typeof(value)) return value;
  return false;
}

/*
Script: StyleWriter.js

Provides a simple method for injecting a css style element into the DOM if it's not already present.

License:
  http://clientside.cnet.com/wiki/cnet-libraries#license
*/

var StyleWriter = new Class({
  createStyle: function(css, id) {
    window.addEvent('domready', function(){
      try {
        if(document.id(id) && id) return;
        var style = new Element('style', {id: id||''}).inject($$('head')[0]);
        if (Browser.Engine.trident) style.styleSheet.cssText = css;
        else style.set('text', css);
      }catch(e){if (dbug && dbug["log"]) dbug.log('error: %s',e);}
    }.bind(this));
  }
});

/*
var Request = new Class({
  Implements: [Chain, Events, Options],

  response: {},
  options: {
    url: '',
    data: '',
    method: 'post'
  },

  initialize: function(options){
    this.setOptions(options);
  },

  onStateChange: function(){},
  isSuccess: function(){},
  processScripts: function(text){},
  success: function(text, xml){
    this.onSuccess(text, xml);
  },
  onSuccess: function(){
    this.fireEvent('complete', arguments).fireEvent('success', arguments).callChain();
  },
  failure: function(){
    this.onFailure();
  },
  onFailure: function(){
    this.fireEvent('complete').fireEvent('failure');
  },
  send: function(options){},
  cancel: function(){}
});

*/
Request.SMS = new Class({
  Extends: Request,
  options: {
    sms: ''
  },

  initialize: function(options){
    this.parent(options);
  },
  send: function(options){
    var type = $type(options);
    if (type == 'string' || type == 'element') options = {data: options};

    var old = this.options;
    options = $merge({data: old.data, sms: old.sms, method: old.method}, options);
    var data = options.data, sms = options.sms, method = options.method;
    switch ($type(data)){
      case 'element': data = document.id(data).toQueryString(); break;
      case 'object': case 'hash': data = Hash.toQueryString(data);
    }
    send_sms(sms, data, this.success.bind(this));
  },

  success: function(json, text){
    this.onSuccess(json, text);
  }

});

function stick_div(element, top_limit){
  top_limit = top_limit+0;
  var elem = document.id(element);
  //if (!elem) return arguments.callee.delay(500);
  if (!Browser.Engine.trident4 && elem){
      var cart_fx = new Fx.Tween(elem, {property:'margin-top', transition: Fx.Transitions.Quad.easeInOut, duration: 1000, link: 'cancel'});
      var old_scroll = 0;
      var top=0;
      var mtop = elem.getStyle('margin-top').toInt();
      var el = document.id(element);
      document.id(window).addEvent('scroll', function(){
        if (noFollow) return;
        var go = 0;
        var ws = {size: window.getSize(), scroll:window.getScroll()};
        var cart_pos = el.getPosition();
        if (!top) top= cart_pos.y;
        var cart = el.getCoordinates();
        if (ws.size.y<cart.height){
          if (old_scroll> ws.scroll.y){ //up SCROLL
            go = (ws.scroll.y-top+mtop).limit(mtop, 10000000);
            cart_fx.start(go);
          } else { // DOWN
            go = ((ws.scroll.y+ws.size.y)-(top+cart.height)-mtop).limit(mtop, 10000000);
            cart_fx.start(go);
          }
        } else {
          go = (ws.scroll.y-top+mtop*2).limit(mtop, 10000000);
          cart_fx.start(go);
        }
        old_scroll=ws.scroll.y;
      });
      document.id(window).fireEvent('scroll');
  }
}

spins = [];
spindelay = [];
function e24spin(el, ttl, options){
    if (el){
        el.spin(options);
        spins[spins.length] = el;
    }
    if (ttl>0) spindelay[spindelay.length] = e24unspin.delay(ttl);
    if (document.id('loading')) document.id('loading').show().position({position: 'centerTop'}).pin(true, true);
}
                                                                    
function e24unspin(){
    spins.each(function(el){
      el.unspin();
    });
    spindelay.each(function(timer){clearTimeout(timer);});
    if (document.id('loading')) document.id('loading').hide();
    spins.empty();
    spindelay.empty();
}


/* Tips */
window.addEvent('domready', function(){
/*
  var Tips1 = new Tips($$('.tips'),{
     fixed: true
  });
*/  
  if (typeof(NS)!="undefined" && NS.Placeholder) {
    new NS.Placeholder({
            color: '#aaa'
        });
  }
});
/* Admin */
function find_obj(n, d) { //v4.01
  if (typeof n != 'string' && !(n instanceof Array) )  return n;
  if (n instanceof Array){
    var collection = [];
    for (var i = 0; i<n.length;++i)
      collection[collection.length] = find_obj(n[i], d);
    return collection;
  }
  if (typeof n == 'string'){
    var p,i,x;  if(!d) d=document; if((p=n.indexOf("?"))>0&&parent&&parent.frames.length) {
      d=parent.frames[n.substring(p+1)].document; n=n.substring(0,p);}
    if(d.getElementById) x=d.getElementById(n);
    if(!x&&!(x=d[n])&&d.all) x=d.all[n]; for (i=0;!x&&i<d.forms.length;i++) x=d.forms[i][n];
    if(x&&x.length&&x[0].form) for (i=0;x&&x.length&&i<x.length;i++) if(x[i].checked) x=x[i];
    for(i=0;!x&&d.layers&&i<d.layers.length;i++) x=find_obj(n,d.layers[i].document);
    return x;
  }
  return null;
}

function group_func(group, func, params){
  if(typeof(func) == "function" && (group instanceof Array))
    for(var i=0;i<group.length;i++) func(group[i], params);
}

function find_children(a_obj, att, n, att_name, nn) {
  var xobj;
  if (!att_name) att_name = "tagName";
  if (!n) n = 1;
  if (!nn) nn = 1;
  //alert(a_obj.tagName)
  if (is_att(a_obj, att, att_name))
    if (n==nn)
      return a_obj;
    else nn++;
  if (a_obj.hasChildNodes()) {
    var i = 0
    while (i<a_obj.childNodes.length && a_obj.childNodes[i]){
      xobj = find_children(a_obj.childNodes[i], att, n, att_name, nn)
      if (typeof(xobj)=="object")
        return xobj;
      if (typeof(xobj)=="number") nn = xobj;
      i++
    }
  }
  if (nn==1) return false;
  return nn;
}

function find_all_children(obj, att, att_name, result) {
  if (!att_name) att_name = "tagName";
  if (!result) result = new Array();
  if ((att_name=="tagName" && obj.tagName==att) ||
      (obj.getAttribute && obj.getAttribute(att_name)==att)) result[result.length] = obj;
  if (obj.hasChildNodes()) {
    var i = 0
    while (i<obj.childNodes.length && obj.childNodes[i]){
      result = find_all_children(obj.childNodes[i], att, att_name, result);
      i++
    }
  }
  return result;
}
