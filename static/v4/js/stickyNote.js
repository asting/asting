/*
---
description: UI widget for Sticky note windows: draggable, closable, dynamic content and title.

license: MIT-style

authors:
- John Larson

requires:
- core:1.4.2/Events
- core:1.4.2/Options
- core:1.4.2/Element.Event
- core:1.4.2/Element.Style
- core:1.4.2/Element.Dimensions
- more:1.4.0.1/Drag.Move
- more:1.4.0.1/Element.Position

provides: [PopUpWindow]

...
*/

var PopUpWindow = new Class({
    
    Implements: [Options, Events],
    
    options: {/*
        onClose:            function() {},
        onOpen:             function() {},
        onResize:           function(event), */
        isDraggable:        true,
        isClosable:         true,
        isResizable:        false,
        resizeLimits:       false,
        className:          'stickyNote',
        boxClass:           'stickyBox',
        content:            null,
        footer:             null,
        injectLocation:     null,
        width:              400,
        //height:             100,
        zIndex:             100,
        top:                0,
        left:               0,
        fade:               'short'
    },
    
    initialize: function(title, options) {
        this.setOptions(options);
        this.title = title;
        
        PopUpWindow.topZIndex = Math.max(this.options.zIndex, PopUpWindow.topZIndex, zIndex++);
        
        var windowDiv = new Element('div', { 'class': this.options.boxClass, 'styles': { /*'visibility': 'hidden', */'position': 'absolute' } });
        
        this.isOpen = false;
        windowDiv.setStyle('left', this.options.left);
        windowDiv.setStyle('top',  this.options.top );
        
        windowDiv.closeIcon = new Element('span.closeIcon');
        windowDiv.resizeIcon = new Element('span.resizeIcon');
        windowDiv.titleBar  = new Element('div.titleBar');
        if (typeOf(title)=='element') windowDiv.titleSpan=title;
        else windowDiv.titleSpan = new Element('span', {html: title});
        windowDiv.titleBar.adopt(windowDiv.titleSpan, this.options.isClosable?windowDiv.closeIcon:null);
        windowDiv.contentDivHolder = new Element('div.contentHolder');

        if(typeOf(this.options.content)=='element') windowDiv.contentDiv = this.options.content;
        else if (document.id(this.options.content)) windowDiv.contentDiv = document.id(this.options.content);
        else windowDiv.contentDiv = new Element('div').set('html', this.options.content);

        if (this.options.footer) {
            if(typeOf(this.options.footer)=='element') windowDiv.footer = this.options.footer;
            else if (document.id(this.options.footer)) windowDiv.footer = document.id(this.options.footer);
            else windowDiv.footer = new Element('div').set('html', this.options.footer);
            windowDiv.footer.addClass('footer');
        }

        windowDiv.contentDivHolder.adopt(windowDiv.contentDiv);

        windowDiv.adopt(new Element('div').addClass(this.options.className).adopt(
                windowDiv.titleBar,
                new Element('div.content').adopt(windowDiv.contentDivHolder, this.resizeIcon),
                windowDiv.footer
        ));
        windowDiv.inject(this.options.injectLocation || document.body, 'bottom');

        if(windowDiv.contentDiv.style.display == 'none')
            windowDiv.contentDiv.setStyle('display', 'block');
        windowDiv.set('tween', {duration: this.options.fade});
        this.windowDiv = windowDiv;
        if(this.options.width) windowDiv.contentDiv.setStyle('max-width', this.options.width);
        if(this.options.height) windowDiv.contentDiv.setStyle('max-height', this.options.height);
        var self = this;
        this.windowDiv.addEvent('mousedown', function() { self.windowDiv.setStyle('z-index', zIndex++); });
        
        if(window.IframeShim  &&  Browser.Engine.trident4)
            this.windowShim = new IframeShim(windowDiv, { display : false });
        
        if(this.options.isDraggable) {
            this.drag = new Drag.Move(windowDiv, {
                handle: windowDiv,
                onDrag: function() {
                    if(this.windowShim)
                        this.windowShim.position();
                }.bind(this)
            });
            windowDiv.titleBar.setStyle('cursor', 'move');
        }
        
        if (this.options.isClosable)
            this.windowDiv.closeIcon.addEvent('click', this.close.bind(this));
        
        if(this.options.isResizable) {
            windowDiv.contentDiv.makeResizable({
                handle: windowDiv.getElement('.resizeIcon'),
                limit: this.options.resizeLimits,
                onComplete: function(theDiv, event) { self.fireEvent('resize', [event]) } // a more elegant way to do this?
            });
        }
    },
    
    
    
    getWindowDiv:   function() { return this.windowDiv; },
    getContentDiv:  function() { return this.windowDiv.contentDivHolder; },
    
    setTitle:       function(newTitle) { this.windowDiv.titleSpan.set('html', newTitle); },
    setContent:     function(contentDiv) { this.windowDiv.contentDivHolder.empty().adopt(contentDiv); },
    setContentHTML: function(contentHTML) { this.windowDiv.contentDivHolder.set('html', contentHTML); },
    setWidth:       function(newWidth) { this.windowDiv.setStyle('width', newWidth); },
    
    close: function(event) {
        if(!this.isOpen)
            return;
        this.isOpen = false;
        
        this.fireEvent('close');
        this.windowDiv.fade('out');
        if(this.windowShim) this.windowShim.hide();
        return this;
    },
    
    open: function() {
        this.windowDiv.setStyle('z-index', PopUpWindow.topZIndex++); // make this PopUpWindow the top one
        if(this.isOpen)
            return;
        this.windowDiv.fade('in');
        if(this.windowShim) this.windowShim.show();
        this.fireEvent('open');
        this.isOpen = true;
        return this;
    },
    
    toggle: function() { 
        this.isOpen ? this.close() : this.open(); 
        return this;

    },
        
    setPosition: function(options) {
        this.windowDiv.position(options);
        /* Example options = {
                relativeTo: document.body,
                position: 'center',
                edge: false,
                offset: {x: 0, y: 0}
            } */
        return this;
    },
    positionTo: function(relativeTo, position, edge, xOffset, yOffset) { 
        position = position?position:'top left';
        edge = edge?edge:'top left';
        xOffset = xOffset?xOffset:0;
        yOffset = yOffset?yOffset:0;
        this.setPosition({ relativeTo: relativeTo, offset: { x: xOffset, y: yOffset}, 'position': position, 'edge': edge });
        return this;
    }
    
});
PopUpWindow.topZIndex = 1;
