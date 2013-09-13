/*
---
description: LightFace

license: MIT-style

authors:
- David Walsh (http://davidwalsh.name)

requires:
- core/1.2.1: '*'

provides: [LightFace]

...
*/
var zIndex = 100;
var LightFace = new Class({
    
    Implements: [Options,Events],
    
    options: {
        width: 'auto',
        height: 'auto',
        draggable: false,
        title: '',
        buttons: [],
        fadeDelay: 400,
        fadeDuration: 400,
        keys: { 
            esc: function() { this.close(); } 
        },
        content: '<p>Message not specified.</p>',
        zIndex: 'global',
        pad: 100,
        overlay: false,
        overlayAll: false,
        constrain: false,
        resetOnScroll: true,
        baseClass: 'lightface',
        errorMessage: '<p>The requested file could not be found.</p>',
        onClose: function(){this.destroy();}
        /*,
        onOpen: $empty,
        onClose: $empty,
        onFade: $empty,
        onUnfade: $empty,
        onComplete: $empty,
        onRequest: $empty,
        onSuccess: $empty,
        onFailure: $empty,
        onDestroy: $empty
        */
    },
    
    
    initialize: function(options) {
        this.setOptions(options);
        this.state = false;
        this.buttons = {};
        this.resizeOnOpen = true;
        this.ie6 = typeof document.body.style.maxHeight == "undefined";
        this.draw();
    },
    
    draw: function() {
        
        //create main box
        zIndex++;
        this.box = new Element('table',{
            'class': this.options.baseClass,
            styles: {
                'z-index': this.options.zIndex=='global'?++zIndex:this.options.zIndex,
                opacity: 0
            },
            tween: {
                duration: this.options.fadeDuration,
                onComplete: function() {
                    if(this.box && $(this.box).getStyle('opacity') == 0) {
                        $(this.box).setStyles({ top: -9000, left: -9000 });
                    }
                }.bind(this)
            }
        }).inject(document.body,'bottom');

        //draw rows and cells;  use native JS to avoid IE7 and I6 offsetWidth and offsetHeight issues
        var verts = ['top','center','bottom'], hors = ['Left','Center','Right'], len = verts.length;
        for(var x = 0; x < len; x++) {
            var row = this.box.insertRow(x);
            for(var y = 0; y < len; y++) {
                var cssClass = verts[x] + hors[y], cell = row.insertCell(y);
                cell.className = cssClass;
                if (cssClass == 'centerCenter') {
                    this.contentBox = new Element('div',{
                        'class': 'lightfaceContent',
                        styles: {
                            width: this.options.width
                        }
                    });
                    cell.appendChild(this.contentBox);
                }
                else {
                    //document.id(cell).setStyle('opacity',0.4);
                }
            }
        }
        
        //draw title
        if(this.options.title) {
            this.title = new Element('h2',{
                'class': 'lightfaceTitle',
                html: this.options.title
            }).inject(this.contentBox);
            if(this.options.draggable && window['Drag'] != null) {
                this.draggable = true;
                new Drag(this.box,{ handle: this.title });
                this.title.addClass('lightfaceDraggable');
            }
        }
        
        //draw message box
        this.messageBox = new Element('div',{
            'class': 'lightfaceMessageBox',
            styles: {
                height: this.options.height
            }
        }).inject(this.contentBox);
        switch(typeOf(this.options.content)) {
            case 'string': this.messageBox.set('html', this.options.content); break;
            case 'element':
            case 'textnode': this.messageBox.adopt(this.options.content.show()); break;
        }
        
        //button container
        this.footer = new Element('div',{
            'class': 'lightfaceFooter',
            styles: {
                display: 'none'
            }
        }).inject(this.contentBox);

        //draw overlay
        if(this.options.overlay) {
            this.overlay = new Element('div',{
                html: '&nbsp;',
                styles: {
                    opacity: 0
                },
                'class': 'lightfaceOverlay',
                tween: {
                    link: 'chain',
                    duration: this.options.fadeDuration,
                    onComplete: function() {
                        if(this.overlay.getStyle('opacity') == 0) this.box.focus();
                    }.bind(this)
                }
            }).inject(this.contentBox);
            if(!this.options.overlayAll) {
                this.overlay.setStyle('top',(this.title ? this.title.getSize().y - 1: 0));
            }
        }
        
        //create initial buttons
        this.buttons = [];
        if(this.options.buttons.length) {
            this.options.buttons.each(function(button) {
                this.addButton(button.title,button.event,button.color);
            },this);
        }
        
        //focus node
        this.focusNode = this.box;
        
        return this;
    },
    
    // Manage buttons
    addButton: function(title,clickEvent,color) {
        this.footer.setStyle('display','block');
        var focusClass = 'lightfacefocus' + color;
        var label = new Element('label',{
            'class': color ? 'lightface' + color : '',
            events: {
                mousedown: function() {
                    if(color) {
                        label.addClass(focusClass);
                        var ev = function() {
                            label.removeClass(focusClass);
                            document.id(document.body).removeEvent('mouseup',ev);
                        };
                        document.id(document.body).addEvent('mouseup',ev);
                    }
                }
            }
        });
        this.buttons[title] = (new Element('input',{
            type: 'button',
            value: title,
            events: {
                click: (clickEvent || this.close).bind(this)
            }
        }).inject(label));
        label.inject(this.footer);
        return this;
    },
    showButton: function(title) {
        if(this.buttons[title]) this.buttons[title].removeClass('hiddenButton');
        return this.buttons[title];
    },
    hideButton: function(title) {
        if(this.buttons[title]) this.buttons[title].addClass('hiddenButton');
        return this.buttons[title];
    },
    
    // Open and close box
    close: function(fast) {
        if(this.isOpen && this.box) {
            this.box[fast ? 'setStyle' : 'tween']('opacity',0);
            this.fireEvent('close');
            this._detachEvents();
            this.isOpen = false;
        }
        return this;
    },
    
    open: function(fast) {
        if(!this.isOpen) {
            this.box[fast ? 'setStyle' : 'tween']('opacity',1);
            if(this.resizeOnOpen) this._resize();
            this.fireEvent('open');
            this._attachEvents();
            (function() {
                this._setFocus();
            }).bind(this).delay(this.options.fadeDuration + 10);
            this.isOpen = true;
        }
        return this;
    },
    
    _setFocus: function() {
        this.focusNode.setAttribute('tabIndex',0);
        this.focusNode.focus();
    },
    
    // Show and hide overlay
    fade: function(fade,delay) {
        this._ie6Size();
        (function() {
            this.overlay.setStyle('opacity',fade || 1);
        }.bind(this)).delay(delay || 0);
        this.fireEvent('fade');
        return this;
    },
    unfade: function(delay) {
        (function() {
            this.overlay.fade(0);
        }.bind(this)).delay(delay || this.options.fadeDelay);
        this.fireEvent('unfade');
        return this;
    },
    _ie6Size: function() {
        if(this.ie6) {
            var size = this.contentBox.getSize();
            var titleHeight = (this.options.overlayAll || !this.title) ? 0 : this.title.getSize().y;
            this.overlay.setStyles({
                height: size.y - titleHeight,
                width: size.x
            });
        }
    },
    
    // Loads content
    load: function(content,title) {
        if(content) this.messageBox.set('html',content);
        if(title && this.title) this.title.set('html',title);
        this.fireEvent('complete');
        return this;
    },
    
    // Attaches events when opened
    _attachEvents: function() {
        this.keyEvent = function(e){
            if(this.options.keys[e.key]) this.options.keys[e.key].call(this);
        }.bind(this);
        this.focusNode.addEvent('keyup',this.keyEvent);
        
        this.resizeEvent = this.options.constrain ? function(e) { 
            this._resize(); 
        }.bind(this) : function() { 
            this._position(); 
        }.bind(this);
        window.addEvent('resize',this.resizeEvent);
        
        if(this.options.resetOnScroll) {
            this.scrollEvent = function() {
                this._position();
            }.bind(this);
            window.addEvent('scroll',this.scrollEvent);
        }
        
        return this;
    },
    
    // Detaches events upon close
    _detachEvents: function() {
        this.focusNode.removeEvent('keyup',this.keyEvent);
        window.removeEvent('resize',this.resizeEvent);
        if(this.scrollEvent) window.removeEvent('scroll',this.scrollEvent);
        return this;
    },
    
    // Repositions the box
    _position: function() {
        var windowSize = window.getSize(), 
            scrollSize = window.getScroll(), 
            boxSize = this.box.getSize();
        var styles = {
            left: scrollSize.x + ((windowSize.x - boxSize.x) / 2),
            top: scrollSize.y + ((windowSize.y - boxSize.y) / 2)
        }
        if (scrollSize.y>styles.top) styles.top=scrollSize.y+5;
        this.box.setStyles(styles);
        this._ie6Size();
        return this;
    },
    
    // Resizes the box, then positions it
    _resize: function() {
        var height = this.options.height;
        if(height == 'auto') {
            //get the height of the content box
            var max = window.getSize().y - this.options.pad;
            if(this.contentBox.getSize().y > max) height = max;
        }
        this.messageBox.setStyle('height',height);
        this._position();
    },
    
    // Expose message box
    toElement: function () {
        return this.messageBox;
    },
    
    // Expose entire modal box
    getBox: function() {
        return this.box;
    },
    
    // Cleanup
    destroy: function() {
        this.fireEvent('destroy');
        this._detachEvents();
        this.buttons.each(function(button) {
            button.removeEvents('click');
        });
        if (this.box) this.box.dispose();
        delete this.box;
    }
});/*
---
description:     LightFace.IFrame

authors:
  - David Walsh (http://davidwalsh.name)

license:
  - MIT-style license

requires:
  core/1.2.1:   '*'

provides:
  - LightFace.IFrame
...
*/
LightFace.IFrame = new Class({
    Extends: LightFace,
    options: {
        url: ''
    },
    initialize: function(options) {
        this.parent(options);
        if(this.options.url) this.load();
    },
    load: function(url,title) {
        this.fade();
        if(!this.iframe) {
            this.messageBox.set('html','');
            this.iframe = new IFrame({
                styles: {
                    width: '100%',
                    height: '100%'
                },
                events: {
                    load: function() {
                        this.unfade();
                        this.fireEvent('complete');
                    }.bind(this)
                },
                border: 0
            }).inject(this.messageBox);
            this.messageBox.setStyles({ padding:0, overflow:'hidden' });
        }
        if(title) this.title.set('html',title);
        this.iframe.src = url || this.options.url;
        this.fireEvent('request');
        return this;
    }
});/*
---
description:     LightFace.Image

authors:
  - David Walsh (http://davidwalsh.name)

license:
  - MIT-style license   

requires:
  core/1.2.1:   '*'

provides:
  - LightFace.Image
...
*/
LightFace.Image = new Class({
    Extends: LightFace,
    options: {
        constrain: true,
        url: ''
    },
    initialize: function(options) {
        this.parent(options);
        this.url = '';
        this.resizeOnOpen = false;
        if(this.options.url) this.load();
    },
    _resize: function() {
        //get the largest possible height
        var maxHeight = window.getSize().y - this.options.pad;
        
        //get the image size
        var imageDimensions = document.id(this.image).retrieve('dimensions');
        
        //if image is taller than window...
        if(imageDimensions.y > maxHeight) {
            this.image.height = maxHeight;
            this.image.width = (imageDimensions.x * (maxHeight / imageDimensions.y));
            this.image.setStyles({
                height: maxHeight,
                width: (imageDimensions.x * (maxHeight / imageDimensions.y)).toInt()
            });
        }
        
        //get rid of styles
        this.messageBox.setStyles({ height: '', width: '' });
        
        //position the box
        this._position();
    },
    load: function(url,title) {
        //keep current height/width
        var currentDimensions = { x: '', y: '' };
        if(this.image) currentDimensions = this.image.getSize();
        ///empty the content, show the indicator
        this.messageBox.set('html','').addClass('lightFaceMessageBoxImage').setStyles({
            width: currentDimensions.x,
            height: currentDimensions.y
        });
        this._position();
        this.fade();
        this.image = new Element('img',{
            events: {
                load: function() {
                    (function() {
                        var setSize = function() { this.image.inject(this.messageBox).store('dimensions',this.image.getSize()); }.bind(this);
                        setSize();
                        this._resize();
                        setSize(); //stupid ie
                        this.unfade();
                        this.fireEvent('complete');
                    }).bind(this).delay(10);
                }.bind(this),
                error: function() {
                    this.fireEvent('error');
                    this.image.destroy();
                    delete this.image;
                    this.messageBox.set('html',this.options.errorMessage).removeClass('lightFaceMessageBoxImage');
                }.bind(this),
                click: function() {
                    this.close();
                }.bind(this)
            },
            styles: {
                width: 'auto',
                height: 'auto'
            }
        });
        this.image.src = url || this.options.url;
        if(title && this.title) this.title.set('html',title);   
        return this;
    }
});/*
---
description:     LightFace.Request

authors:
  - David Walsh (http://davidwalsh.name)

license:
  - MIT-style license

requires:
  core/1.2.1:   '*'

provides:
  - LightFace.Request
...
*/
LightFace.Request = new Class({
    Extends: LightFace,
    options: {
        url: '',
        request: {
            url: false
        }
    },
    initialize: function(options) {
        this.parent(options);
        if(this.options.url) this.load();
    },
    load: function(url,title) {
        var props = (Object.append || $extend)({
            onRequest: function() {
                this.fade();
                this.fireEvent('request');
            }.bind(this),
            onSuccess: function(response) {
                this.messageBox.set('html',response);
                this.fireEvent('success');
            }.bind(this),
            onFailure: function() {
                this.messageBox.set('html',this.options.errorMessage);
                this.fireEvent('failure');
            }.bind(this),
            onComplete: function() {
                this._resize();
                this._ie6Size();
                this.messageBox.setStyle('opacity',1);
                this.unfade();
                this.fireEvent('complete');
            }.bind(this)
        },this.options.request);
        
        if(title && this.title) this.title.set('html',title);
        if(!props.url) props.url = url || this.options.url;
        
        new Request(props).send();
        return this;
    }
});/*
---
description:     LightFace.Static

authors:
  - David Walsh (http://davidwalsh.name)

license:
  - MIT-style license

requires:
  core/1.2.1:   '*'

provides:
  - LightFace.Static
...
*/
LightFace.Static = new Class({
    Extends: LightFace,
    options: {
        offsets: {
            x: 20,
            y: 20
        }
    },
    open: function(fast,x,y) {
        this.parent(fast);
        this._position(x,y);

    },
    _position: function(x,y) {
        this.parent();
        if (x) this.box.setStyle('left', x - this.options.offsets.x);
        if (y) this.box.setStyle('top', y - this.options.offsets.y);
    },

    _position2: function(x,y) {
        this.parent();
//        if(x == null) return;
        var p = this.box.getStyles(['left', 'top']);    
        this.box.setStyles({
            top: p.top.toInt() + this.options.offsets.y,
            left: p.left.toInt() + this.options.offsets.x
        });
    }
});/*
---
description:     LightFace.Static

authors:
  - David Walsh (http://davidwalsh.name)

license:
  - MIT-style license

requires:
  core/1.2.1:   '*'

provides:
  - LightFace.Static
...
*/
LightFace.Mask = new Class({
    Extends: LightFace.Static,
    options: {
        maskClass: 'lfMask',
        maskClose: true,
        inWindow: false,
        pos: {x: null, y:null}
    },

    draw: function(){
        this.parent();
        if(this.options.title && this.options.maskClose) {
            var self = this;
            this.closer = new Element('div',{
                'class': 'lightfaceCloser',
                html: '&nbsp;',
                events: {'click': function(){self.close();}}
            }).inject(this.title);
        }
        this.win=this.box;
        this.fireEvent('draw');
        return this;
    },

    _resize: function() {
        this.parent();
        var height = this.options.height;
        if(height == 'auto' && this.options.inWindow) {
            //get the height of the content box
            var max = window.getSize().y - this.options.pad;
            if(this.contentBox.getSize().y > max) height = max;
        }
        this.messageBox.setStyle('height',height);
        this._position();
    },

    open: function(fast, x, y) {
        if (x && y) this.options.pos = {x: x, y: y};
        this.parent(fast, this.options.pos.x, this.options.pos.y);
        var self = this;
        $(document.body).mask({
            'class': this.options.maskClass,
            'style': {'z-index': zIndex-1},
            hideOnClick: this.options.maskClose,
            onHide: function(){
                self.close();
            }
        });
        this.fireEvent('display');
        return this;
    },

    close: function(fast) {
        this.parent(fast);
        $(document.body).unmask();
        return this;
    },

    hide: function(){
        this.close();
        return this;
    },

    show: function(){
        this.open();
        return this;
    },

    destroy: function(){
        $(document.body).unmask();
        this.parent();
        return this;
    }

});
popups = {};

function showPopup(editid, divid, params){
  
    if ($(editid)) {
      var position = $(editid).getPosition();
      var size = $(editid).getSize();
      position.y += size.y;
    } else var position = {};
    params = params || {};

    var el = $(divid);
    if (el) {
      if (params.clone) {
        content = el.show().get('outerHtml')||el.get('html');
        el.hide();
      } else content = el;
    } else content = divid;

    var params = $merge({
        width: 600, 
        title:'',
        offsets: {x:10, y:10},
        content: content,
        draggable: true,
        resetOnScroll: false,
        overlayAll: false
//        onOpen: function(){if ($('container')) $('container').addClass('blur')},
//        onClose: function(){if ($('container')) $('container').removeClass('blur')}
        }, params||{});


    if (params.destroyOld && popups["_last_"]) popups["_last_"].destroy();
    //Position Corrector;
    var bodySize=$(document.body).getSize();
    if((position.x+params.width+params.offsets.x)>$(document.body).getSize().x){
        minus=(position.x+params.width+params.offsets.x)-$(document.body).getSize().x;
        position.x-=minus+2;
    }
    var stickywin = new LightFace.Mask(params).open(false, position.x, position.y);

    popups["_last_"] = stickywin;
    //var delta = window.getScroll()['y']-win.getCoordinates()['top'];
    //if (delta>0) win.setStyle('top', window.getScroll()['y']+10);
    return popups["_last_"];
}

function popupImg(el, src, params){
  if (!(params instanceof Object))
    params ={title: src};
  var img = new Asset.image(src, {onload: function(){
    params['width']=this.get('width').toInt()+50;
    showPopup(el, img, params);
  }});
}

window.addEvent('domready', function(){
    Asset.css('/static/ext/LightFace/LightFace.css');
    Asset.images(['/static/ext/LightFace/b.png', '/static/ext/LightFace/bl.png', '/static/ext/LightFace/br.png', 
    '/static/ext/LightFace/tl.png', '/static/ext/LightFace/tr.png', '/static/ext/LightFace/x.png', '/static/ext/LightFace/button.png', 
    '/static/css/moo/spinner.gif']);
});
