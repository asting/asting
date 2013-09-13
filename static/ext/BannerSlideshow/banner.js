var BannerSlideshow = new Class({
  options: {
    showControls: false,
    showDuration: 10000,
    showTOC: true,
    tocWidth: 380,
    tocClass: 'toc',
    tocActiveClass: 'toc-active'
  },
  Implements: [Options,Events],
  initialize: function(container,elements,options) {
    //settings
    this.container = $(container);
    this.elements = $$(elements);
    this.currentIndex = 0;
    this.interval = '';
    if(this.options.showTOC) this.toc = [];
    
    //assign
    this.elements.each(function(el,i){
      if(this.options.showTOC) {
        this.toc.push(new Element('a',{
          text: "",
          href: '#',
          'class': this.options.tocClass + '' + (i == 0 ? ' ' + this.options.tocActiveClass : ''),
          events: {
            click: function(e) {
              if(e) e.stop();
              this.stop();
              this.show(i);
            }.bind(this)
          },
          styles: {
            left: ((i * 30) + (this.options.tocWidth))
          }
        }).inject(this.container));
      }
      if(i > 0) el.set('opacity',0);
    },this);
    
    //next,previous links
    if(this.options.showControls) {
      this.createControls();
      
    }
    //events
    this.container.addEvents({
      mouseenter: function() { this.stop(); }.bind(this),
      mouseleave: function() { this.start(); }.bind(this)
    });

  },
  show: function(to) {
    this.elements[this.currentIndex].fade('out');
    if(this.options.showTOC) this.toc[this.currentIndex].removeClass(this.options.tocActiveClass);
    this.elements[this.currentIndex = ($defined(to) ? to : (this.currentIndex < this.elements.length - 1 ? this.currentIndex+1 : 0))].fade('in');
    if(this.options.showTOC) this.toc[this.currentIndex].addClass(this.options.tocActiveClass);
  },
  start: function() {
    this.interval = this.show.bind(this).periodical(this.options.showDuration);
  },
  stop: function() {
    $clear(this.interval);
  },
  //"private"
  createControls: function() {
    var next = new Element('a',{
      href: '#',
      id: 'next',
      text: '>>',
      events: {
        click: function(e) {
          if(e) e.stop();
          this.stop(); 
          this.show();
        }.bind(this)
      }
    }).inject(this.container);
    var previous = new Element('a',{
      href: '#',
      id: 'previous',
      text: '<<',
      events: {
        click: function(e) {
          if(e) e.stop();
          this.stop(); 
          this.show(this.currentIndex != 0 ? this.currentIndex -1 : this.elements.length-1);
        }.bind(this)
      }
    }).inject(this.container);
  }
});