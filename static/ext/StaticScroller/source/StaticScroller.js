/*
---
description: StaticScroller1

license:
  MIT-style

authors:
  - Luke Ehresman (http://luke.ehresman.org)
  - Ryan Florence <rpforence@gmail.com>

requires:
  core/1.2.1: '*'

provides: [StaticScroller]

...
*/
var StaticScroller = new Class({
    
    Implements: Options,
    
        options: {
            offset: {
                x: 20,
                y: -20
            },
            scrollElement: document
        },

    initialize: function(element, options) {
        this.setOptions(options);
        this.element = document.id(element);
        this.scrollElement = document.id(this.options.scrollElement);
        this.originalPosition = this.element.getPosition();
        this.bound = {
            scroll: this.scroll.bind(this),
            resize: this.resize.bind(this)
        };
        this.attachWindow();
        this.checkHeight();
    },
    
    attachScroll: function(){
        this.scrollElement.addEvent('scroll', this.bound.scroll);
        return this;
    },
    
    attachWindow: function(){
        window.addEvent('resize', this.bound.resize);
        return this;
    },
            
    detachScroll: function(){
        this.scrollElement.removeEvent('scroll', this.bound.scroll);
        return this;
    },
    
    detachWindow: function(){
        window.removeEvent('resize', this.bound.resize);
        return this;
    },
    
    checkHeight: function(){
        if(document.getSize().y < this.element.getSize().y) {
            this.detachScroll().reset();
        } else {
            this.attachScroll().scroll();
        }
        return this;
    },
    
    isPinned: function(){
        return (this.element.retrieve('pin:_pinned'));
    },
    
    scroll: function(){
        var collision = (this.scrollElement.getScroll().y >= this.originalPosition.y - this.options.offset.y);
        var isPinned = this.isPinned();
        if(collision) {
            if(!isPinned) {
                var w = this.element.getSize()['x'];
                this.element.store('scroll:_width', w);
                this.element.pin().setStyle('top', this.options.offset.x.toInt()).setStyle('width', w);
            };
        } else {
            if(isPinned) this.reset();
        };
        return this;
    },
    
    resize: function(){
        if(this.isPinned()) this.reset();
        this.checkHeight();
        return this;
    },
    
    reset: function(){
        var w = this.element.retrieve('scroll:_width');
        if(this.isPinned()) this.element.unpin().setStyle('position','').setStyle('width', w);
    }
});
