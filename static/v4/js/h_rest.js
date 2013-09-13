var noFollow = false;
hidetimeout = null;
sidemenus = null;
myscroll = null;
tabs = null;
slider = null;
imenu = 0;
msections = null;
//pages = [];
zindex = 10;
placeClicked = "";
window.addEvent('domready', function() {
    var dtype = window.location.href.getUrlValue('dtype');
    if ($('gototop')) {
        myscroll = new Fx.SmoothScroll({duration:500}, window);
        /* link management */
        $('gototop').set('opacity', '0').setStyle('display', 'block').addEvent('click', function() {
            myscroll.toElement('header');
        });
        /* scrollspy instance */
        var ss = new ScrollSpy({
            min: 200,
            onEnter: function(position, state, enters) {
                $('gototop').fade('in');
            },
            onLeave: function(position, state, leaves) {
                $('gototop').fade('out');
            },
            container: window
        });
    }

    load_menu();
    if ($$('.msg')[0]) showPopup(null, $$('.msg')[0], {width: 400, buttons: [{title:'', color:'ok'}]});
    if ($('add_item_content')) show_item();

    $$('#restaurant_tabs a').addEvent('click', function(){ 
        var a = this;
        var cpa = this.get('href').split('/').getLast();
        if (!['menu', 'info', 'reviews'].contains(cpa)){
           var cpa = 'menu';
        }
        if (!a.retrieve('loaded') && !$('rest_'+cpa)){
            e24spin(this.getParent(), 15000);
            //e24spin($('pages').getFirst(), 15000);
            send_sms('page', {page: cpa}, function(res, err){
                e24unspin();
                a.store('loaded', 1);
                if (res){
                    var page = new Element('div', {styles: {display: 'block'}, 'html': res});
                    $('pages').adopt(page.getFirst());
                    page.dispose();
                    show_page(cpa);
                }
            });
        } else {
            if ($('rest_'+cpa)) {
                show_page(cpa);
                return false
            } else return true;

        }
        return false;
    });

    /*
    if (show_nodelivery(item)) return false;
            e24spin(item, 15000);
            popupsms("item2order", {'item_id': item.get('item_id')}, show_item);

    */


});

function show_page(cpa){
    $$('#restaurant_tabs li').swapClass('selected', 'not_selected');
    $$('#restaurant_tabs .li_'+cpa).swapClass('not_selected', 'selected');
    $$('.page').removeClass('pactive').fade('hide').chains();
    $('rest_'+cpa).addClass('pactive').setStyle('z-index', zindex++).inject($('pages'), 'top').fade('in').show();
    $$('.page:not(.pactive)').hide();
    if (window['load_'+cpa]) window['load_'+cpa]();
}

function load_menu(){
    if (!$('menu_inner') || this.runing) return false;
    this.runing = true;
    tmenus = $$('.panel').get('tmenu');
    collaps('.panel .link', '.panel .section', 0);
    msections = collaps('.section2', '.section_items', 1);
    tabs = new TabSwapper({
        selectedClass: 'selected',
        deselectedClass: 'not_selected',
        tabs: '#menu_nav li',
        clickers: '#menu_nav li a',
        sections: '#contents_list .panel',
        /*use transitions to fade across*/
        initPanel: 0,
        onActive: function(i) {
            slide_menu(i);
        },
        smooth: true
    });

    if ($('sidebox')) {
        sidemenus = collaps('#sidebox .side_menus li', '#sidebox .side_sections', 0, function(active) {
            sidemenus.each(function(menu, i) {
                if (i != active) menu.hide()
            });
        });
        $('sidebutton').addEvent('click', showsidebox);
        $$('#sidebox li, #sidebox').addEvents({'mouseover': hidesidebox, 'click': hidesidebox, 'mouseleave': hidesidebox});
        stick_div('sidemenu', 100);
        if ($('cart_follow')) stick_div('cart_follow', 100);
    }

    if ($('menu_inner')) {
        slider = new SlideItMoo({
            overallContainer: 'menu_outer',
            elementScrolled: 'menu_inner',
            thumbsContainer: 'menu_items',
            itemsSelector: '.menu',
            itemsVisible:1,
            itemWidth:600,
            showControls: 0,
            autoSlide: 0,
            transition: Fx.Transitions.Quart.easeInOut,
            duration: 800,
            direction:1,
            /* the onChange event fires when the current slide changes. We'll use it to display the next/previous article title ( in #announce ) */
            onChange: function(index) {
                slider.options.duration = 800;
                slide_tab(index);
                fix_menu_height(index);
                scroll2section();
                spicy_flt();
                /* calculate the previous slide index and the next */
                var prev = index - 1 < 0 ? this.elements.length - 1 : index - 1;
                var next = index + 1 >= this.elements.length ? 0 : index + 1;
                /* titles are stored in h1 inside each .info_item. Grab the text and put it in our prev/next containers */
                var imgNext = new Element('img', {'src':'/static/v4/images/next_arrow.png','width':'94', 'align':'absmiddle', 'border':'0', 'height': '33'});
                $('next_title').store('next', next).set({'html': this.elements[next].getElement('.menu_name').get('text')}).morph({'opacity':[0,1]}).grab(imgNext,'top');
            }
        });
        /* set morph effect on previous and next article container ( inside #announce ) */
        if (slider.elements[1]){
           var imgNext = new Element('img', {'src':'/static/v4/images/next_arrow.png','width':'94', 'align':'absmiddle', 'border':'0', 'height': '33'});
           $('next_title').set({'html': slider.elements[1].getElement('.menu_name').get('text')}).grab(imgNext,'top');
        }
        $('next_title').set('morph', {wait:false, duration:1000}).addEvent('click', function() {
            slider.options.duration = 0;
            slider.slide2(this.retrieve('next', 1));
        });
        

        $$('.over').addEvents({
            'mouseover': function() {
                this.setStyles({'background-color': '#eeeeee'})
            },
            'mouseout': function() {
                this.setStyles({'background-color': '#ffffff'})
            }
        });
        $$('.item').addEvents({
            'click': function(event) {
				if (event.target && event.target.hasClass('item_img')) placeClicked = "image";
				else  placeClicked = "name"; 
                if (this.get('item_id')){
                    if (show_nodelivery(this)) return false;
                    e24spin(this, 15000);                    
                    popupsms("item2order", {baseClass: 'lightface popup_item2order','item_id': this.get('item_id')}, show_item);
                    return false;
                }
            }
        });

        $$('.coupon').addEvents({
            'click': function() {
                var coupon_id= this.get('item_id');
                if (coupon_id) {
                    var idx = $('ch_coupon') ? $('ch_coupon').getElements('option').get('value').indexOf(coupon_id) : -1;
                    if (idx!=-1) {
                        if ($('ch_coupon').get('value')==coupon_id) alert('You already have this coupon.');
                        else if (idx == 0 || confirm("Only One Coupon per order is allowed.\n Adding this coupon will remove your current coupon \n\""
                                                        + $('ch_coupon').getSelected().get('text')[0].trim() + "\"\n Change Coupon ?")){
                            $('ch_coupon').set('value', coupon_id);
                            change_cart($('ch_coupon'));
                        }

                    } else {
                        alert('"'+this.getElement('.coupon_name').get('text').trim() + '" can be added: \n' + this.getElement('.coupon_description').get('text').trim());
                    }
                    return false;
                }
            }
        });

        if (item_id) {
           var item=$("item_"+item_id);
           item.fireEvent("click", item, 1500);
        }

        if (usual) {
            usual.split(',').each(function(id){
                var img = new Element('img.item_icon', {
                    src: '/static/v4/images/new/adicon5.png',
                    width: 16,
                    height: 16,
                    title: 'My Usual'
                });
                var item = $$('#item_'+id+' .item_name')[0];
                if (item) item.grab(img).getParent().addClass('usual');
            });
        }

        if (cnotes) {
            Object.each(cnotes, function(c, key){
                notes[key] = Math.max(notes[key], c);
            });
        }

        if (notes) {
            Object.each(notes, function(c, id){
                var img = new Element('img.item_icon', {
                    src: '/static/v4/images/social/icons/note_icon.png',
                    height: 16,
                    title: 'Note'
                });
				var span = new Element('span.note');
                var item = $$('#item_'+id+' .item_name')[0];
                if (item) item.grab(span.grab(img, 'top'), '').getParent().addClass('notes');
            });
        }

        $$('.legend_icons_top').addEvent('click', function() {
            spicy_flt();
        });
        spicy_flt();
        //$('notes').addEvent('click', function(){
            //if (this.checked) $$('.note').show('inline');
            //else $$('.note').hide();
        //});
    }
}

function show_nodelivery(item){
    if(!Cookie.read('nodelivery') && $('nodelivery') && $('delivery') && $('delivery').checked){
        showPopup(0, $('nodelivery'), {width: 'auto', title:'Information', onClose: function(){
            this.destroy();
            if (item && showitemafteraddress){
                e24spin(item, 15000);
                popupsms("item2order", {baseClass: 'lightface popup_item2order','item_id': item.get('item_id')}, show_item);
            }
            return false;
        }});
        Cookie.write('nodelivery', 1, {duration:1});

        return true;
    }
    return false;
}

function show_item(result, errors) {
    e24unspin();
    smallPopupNotesFx="";
    var myTips1 = new Tips($$('.tips'), {
        maxTitleChars: 100,     // long caption
        className: 'tip'
    });
    $$('.topping input').addEvent('change', function() {
        var label = this.getParent();
        if (this.checked && $('price1')) {
            var price = $$('input[name=price]:checked')[0];
            if (label.getElement('span')) label.getElement('span').hide();
            label.retrieve('tip:title', '').split(/ <br> /).each(function(s) {
                if (!s) return;
                var m = [];
                if (m = s.match(/\$([\d\.]+) extra/)) p=[price.get('title'), m[1]];
                else var p = s.split(/: \$/);
                if (p[0].toLowerCase() == price.get('title').toLowerCase()) {
                    if (label.getElement('span')) label.getElement('span').set('html', '+$' + p[1]+'').show('inline');
                    else label.adopt(new Element('span', {html: '+$' + p[1]+'', 'class': 'extraprice'}));
                }
            });
        } else {
            if (label.getElement('span')) label.getElement('span').hide();
        }
    });
    
    $$('input[name=price]').addEvent('change', function(){
        $$('.topping input').fireEvent('change');
    });
    if ($('notes').checked && $('item_notes')) {
        $$('.lightface')[0].get('tween').setOptions({link: 'chain'});
        $('item_notes').onclick();
    }
}

function submit_item(el) {
    e24spin($('cart'), 15000);
    var form = $($(el).getParent('form'));
    var hash = form.getFormHash();
    var action = form.get('action').toURI().getData();
    if (action.key != undefined) hash.key = action.key;
    if (popups && popups["_last_"]) popups["_last_"].destroy();
    else return true;

    send_sms("item2order", hash, function(html, errors) {
        e24unspin();
        $('cart_follow').set('html', html);
        //var total=$$("#total span")[1].get("html");
  		//$$("#mycart_button_style span")[0].set("html",total);
  		//hide_notes();
    });
    return false;
}


function spicy_flt() {
    var sel = [];
    var active = '.menu' + imenu;
    $$('.legend_icons_top').each(function(el) {
        var items = $$(active + ' .' + el.value);
        if (items.length > 0) {
            el.disabled = false;
            el.getNext('label').swapClass('labelNull', 'labelFull');
            if (el.checked) {
                sel.push(items);
            }
        } else {
            el.disabled = true;
            el.getNext('label').swapClass('labelFull', 'labelNull');
        }
    });
    if (sel.length > 0) {
        $$(active + ' .item').hide();
        sel.each(function(a) {
            $$(a).show()
        });
    } else $$(active + ' .item').show();
    msections.each(function(sect) {
        sect.show();
        if (sect.wrapper.getStyle('height').toInt() > 0) sect.wrapper.getPrevious().show();
        else sect.wrapper.getPrevious().hide();
    });
    fix_menu_height(imenu);
}

function fix_menu_height(i) {
    if (i == null) i = slider.currentElement;
    var h = 30 + slider.elements[i].getStyle('height').toInt();
    $(slider.options.elementScrolled).morph({height: h});
    //$$('.section_items').getParent().setStyle('height','auto');
}

function slide_menu(i, sect) {
    if (slider) {
        if (i != slider.currentElement) {
            slider.slide2(i);
            spicy_flt();
        }
        if (sect) scroll2section(sect);
    } else {
        //window.location.href = url;
    }
}

function slide_tab(i) {
    if (imenu != i) {
        imenu = i;
        tabs.show(i);
        spicy_flt();
    }
}

function scroll2section(sect) {
    if (sect && sect > 0) {
        myscroll.toElement('section_' + sect);
        $('sidebox').hide();
    } else {
        if (!$('menu_nav').inWindow()) myscroll.toElement('contents_list');
        if (sect == -1) showsidebox.delay(1500);
    }
}

function showsidebox() {
    if (hidetimeout) clearTimeout(hidetimeout);
    $('sidebox').position({relativeTo: 'sidebutton', position: 'topRight', offset:{y:-2, x:-1}})
            .setStyle('z-index', 2000).show();
    sidemenus.each(function(menu) {
        menu.hide()
    });
    sidemenus[imenu].show();
}

function hidesidebox() {
    if (hidetimeout) clearTimeout(hidetimeout);
    hidetimeout = setTimeout(function() {
        $('sidebox').hide();
    }, 3000);
}

function collaps(chead, clist, show, func) {
    //list elements to be clicked on
    var headings = $$(chead);
    //list of target elements1
    var list = $$(clist);
    var collapsibles = new Array();

    headings.each(function(heading, i) {
        var collapsible = new Fx.Slide(list[i], {
            duration: 500,
            transition: Fx.Transitions.linear
        });
        //add event listener
        heading.addEvent('click', function() {
            collapsible.toggle();
            var btn = this.getElement('img');
            if (btn && collapsible.open)  btn.src = btn.get('data-openimage');
            else if (btn)                 btn.src = btn.get('data-closedimage');
            if (func) func(i);
            fix_menu_height.delay(510);
            return false;
        });
        if (show === 1) collapsibles[i] = collapsible.show();
        else if (show === 0) collapsibles[i] = collapsible.hide();
    });
    return collapsibles;
}


function showImg(id, logo) {
    $(id).addEvent('mousemove', function() {
        var toolTip = new ToolTip.instance($(id), {
            autohide: true,
            position: {edge: 'left', position: 'right'}
        }, 'Loading ...').show();
        new Asset.image(logo, {
            onLoad: function() {
                // 'this' is an img element created by Asset.image
                toolTip.set(this);
            }
        });
    });
}

function max_toppings(el, m){
   $(el).getParent().getElements('input[type=checkbox]').addEvents({
   'change': function(){
       if ($(el) && $(el).getParent().getElements('input:checked').length > m){
          this.checked = false; 
          $(el).chains().tween('color', '#f00').pauseFx(1000).tween('color', '#000'); 
          return false; 
       } else return true
   }, 
   'click': function (){
       this.fireEvent('change'); 
    }
   }); 
}

function positionImage(){
	var img_id = 0;
	$$('.note_image').each(function(el){
		if(el.getSize().x > el.getSize().y) {
			el.setStyle('height', 300);
			el.setStyle('width', 'auto');
			var left = (300 - el.getSize().x) / 2;
			el.setStyle('left', left);
		}
		
		if(el.getSize().x < el.getSize().y) {
			el.setStyle('height', 'auto');
			el.setStyle('width', 300);
			var top = (300 - el.getSize().y) / 2;
			el.setStyle('top', top);
		}
		el.getParent().set('id', 'img'+img_id);
		img_id++;
	})        
}
	
