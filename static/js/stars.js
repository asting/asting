/**
 * Dynamic Rating stars
 * @copyright 2006 Beau D. Scott http://beauscott.com
 * @
 */
var Stars = new Class({
  options : {
    bindField: null,      // Form Field to bind the value to
    maxRating: 5,       // Maximum rating, determines number of stars
    container: null,      // Container of stars
    imagePath: '/static/images/stars/',   // Path to star images
    callback: null,       // Callback function, fires when the stars are clicked
    actionURL: null,      // URL to call when clicked. The rating will be appended to the end of the URL (eg: /rate.php?id=5&rating=)
    value: 0,         // Initial Value
    locked: false,
    star_off_file: "star_off.gif",
    star_on_file: "star_on.gif"
    //star_half_file: "star_half2.gif"
  },
  Implements: [Events, Options],
  /**
   * Initialized?
   * @var (Boolean)
   */
  _initialized : false,
  /**
   * Constructor
   * @param {Object} options
   */
  initialize: function(options) {

    /**
     * Base option values
     * @var (Object)
     */
    this.setOptions(options);
    this.locked = this.options.locked ? true : false;
    /**
     * Image sources for hover and user-set state ratings
     */
    this._starSrc = {
      empty: this.options.imagePath + this.options.star_off_file,
      full: this.options.imagePath + this.options.star_on_file
      //half: this.options.imagePath + this.options.star_half_file
    };
    /**
     * Preload images
     */
    for(var x in this._starSrc) {
      var y = new Image();
      y.src = this._starSrc[x];
    }

    this.value = -1;
    this.stars = [];
    this._clicked = false;


    if(this.options.container) {
      this._container = $(this.options.container);
      this.id = this._container.id;
    } else {
      this.id = 'starsContainer.' + Math.random(0, 100000);
      document.write('<span id="' + this.id + '"></span>');
      this._container = $(this.id);
    }
    this._display();
    this.setValue(this.options.value);
    this._initialized = true;
  },

  _display: function(){
    for(var i = 0; i < this.options.maxRating; i++){
      var star = new Element('img');
      star.setProperties({
        'src': this._starSrc.empty,
        'title': 'Rate as ' + (i + 1),
        'tag': i
      }).setStyle('cursor', 'pointer');

      !this.locked && star.addEvents({
             'mouseover': this._starHover.bind(this),
             'click': this._starClick.bind(this),
             'mouseout': this._starClear.bind(this)
      });
      this.stars.push(star);
      this._container.appendChild(star);
    }
  },
  _starHover: function(e) {
    if(this.locked) return;
    var event = new Event(e);
    var tag = event.target.getProperty('tag');
    //xd(tag)
    var empty = false;
    for(var i = 0; i < this.stars.length; i++) {
      //xd(this.stars[i].tag)
      this.stars[i].src = empty ? this._starSrc.empty : this._starSrc.full;
      if(this.stars[i].getProperty('tag') == tag) empty = true;
    }
  },
  _starClick: function(e) {
    if(this.locked) return;
    var event = new Event(e);
    var tag = event.target.getProperty('tag');
    this._clicked = true;
    for(var i = 0; i < this.stars.length; i++) {
      if(this.stars[i].getProperty('tag') == tag) {
        this.setValue(i+1);
        break;
      }
    }
  },
  _starClear: function(e){
    if(this.locked && this._initialized) return;
    var greater = false;
    for(var i = 0; i < this.stars.length; i++) {
      if(i > this.value) greater = true;
      this.stars[i].src = greater ? (this.value + .5 == i) ? this._starSrc.half : this._starSrc.empty : this._starSrc.full;
    }
  },
  /**
   * Sets the value of the star object, redraws the UI
   * @param {Number} value to set
   * @param {Boolean} optional, do the callback function, default true
   */
  setValue: function(val){
    var doCallBack = arguments.length > 1 ? !!arguments[1] : true;
    if(this.locked && this._initialized) return;
    this.value = val-1; //0-based
    if(this.options.bindField)
      $(this.options.bindField).value = val;
    if(this._initialized && doCallBack){
      if(this.options.callback) this.options['callback'](val);
    }
    this._starClear();
  }
});
Stars.implement(new Options);
