var popups = [];
var noteMask;
var h100;
var masonry;

function clean_notes(e) {
    if (e && e.target!=this) return;
    if (noteMask) noteMask.empty();
    if (h100) h100.hide();
    $(document.body).removeClass('noscroll');
}

function get_item_img(images){
    var res='';
    if (images) {
        if (images.owner_thumb) res = images.owner_thumb;
        else $H(images).each(function(val, key){
            if (key.indexOf('thumb')>0) res = val;
        });
    }
    return res;
}

function show_note_client(id, c){
    var info=$('notes_info').show().addClass('notMasked');
    info.getElements('.nrc').hide();
    info.getElements('.note_client').show();
    info.getElement('.name').set('html', c.client_name);
    info.getElement('.logo img').setProperties({src: c.client_logo, width: 60});
    if(c.client_about) info.getElement('.about span').set('html', '"'+c.client_about+'"');
    info.getElement('.blocks span').set('html', c.blocks>20?'More than 20':c.blocks);
    if (!c.notes) c.notes = {};
    info.getElement('.notes .qicon').set('html', parseInt(c.notes.qty||'0'));
    info.getElement('.tasty .qicon').set('html', parseInt(c.notes.tasty||'0'));
    info.getElement('.tasteless .qicon').set('html', parseInt(c.notes.tasteless||'0'));
    info.getElement('.photos .qicon').set('html', parseInt(c.notes.images||'0'));
}

function show_note_rest(id){
    var info=$('notes_info').show().addClass('notMasked');
    info.getElements('.nrc').hide();
    info.getElements('.note_rest').show();
    var r = rests[id];
    info.getElement('.name').set('html', r.name);
    info.getElement('.logo img').setProperties({src: r.logo, width: 60});
    info.getElement('.rating').setStyle('width', r.rating.ratingprc+'%');
    info.getElement('.rcount span').set('html', r.rating.count);
    info.getElement('.cuisines').set('html', '('+ Object.values(r.cuisines).join(', ')+')');
    if (!r.notes) r.notes = {};
    info.getElement('.notes .qicon').set('html', parseInt(r.notes.qty||'0'));
    info.getElement('.tasty .qicon').set('html', parseInt(r.notes.tasty||'0'));
    info.getElement('.tasteless .qicon').set('html', parseInt(r.notes.tasteless||'0'));
    info.getElement('.photos .qicon').set('html', parseInt(r.notes.images||'0'));

   /*
    var prev = id;
    do {
        var k = keys.indexOf(parseInt(prev))-1;
        if (k<0) k = keys.length-1;
        prev = keys[k];
    } while (!rests[prev].notes || rests[prev].notes.qty==0);

    var next=id;
    do {
        var k = keys.indexOf(parseInt(next))+1;
        if (k>=keys.length) k=0;
        next = keys[k];
    } while (!rests[next].notes || rests[next].notes.qty==0);
    info.getElement('#arrow_left').store('id', prev).store('type', 'restaurant');
    info.getElement('#arrow_right').store('id', next).store('type', 'restaurant');
    */
}

function load_notes(id, type) {
    clean_notes();
    var p = {};
    switch (type) {
        case "client":
            p = {client_id:id, restaurants:Object.keys(rests)};
            break;
        case "restaurant":
        default:
            type = 'restaurant';
            p = {restaurant_id:id};
            break;
    }
    if(!$('notes_info')) p.bar=1;
    send_sms("load_notes", p, function (params) {
        if (!params || !params.notes) return;
        var mr = 20;
        var ns = Object.values(params.notes);
        //ns = ns.append(ns).append(ns).append(ns).append(ns).append(ns);
        clean_notes();
        var sl = $(window).getScroll();
        var y=5;
        var sz = $(window).getSize();

        if (ns.length > 0) {
            if (params.bar) {
                if (!h100) {
                    h100 = new Element('div#h100', {
                        html:params.bar,
                        style : {
                            'z-index' : ++zIndex
                        },
                        events: {click: clean_notes}
                    });
                    document.body.adopt(h100);
                }
                if (!noteMask) {
                    noteMask = new Element('div.notemask#notemask', {
                        events: {click: clean_notes}
                    }).inject(h100);
                }
            }
            var w = 230;
            var p = ((sz.x-w*ns.length).limit(sz.x % w, 3000)/2).limit(0, 3000);
            if (!masonry) {
                masonry = new MasonryClass($('notemask'));
            }
            masonry.setOptions({
                singleMode: true,
                left: p,
                right: p,
                itemSelector : '.stickyBox'
            });

            $(document.body).addClass('noscroll');
            h100.show();

            if (type == "restaurant") {
                if (typeof(showmap)!='undefined') showmap(id, 1);
                show_note_rest(id);
            } else if(type == "client") {
                show_note_client(id, params.client);
            }
                //.setStyles({height: document.body.getComputedSize().height});
            //noteMask.show();
            $('notes_info').setStyles({'z-index':++zIndex}).addEvent('keydown:keys(esc)', clean_notes);
            ns.each(function (note, i) {
                var w = 220;
                var h = 100;
                var profile_pic = note.client_logo || "/static/v4/images/social/icons/profile_pic.png";
                var r=rests[note['restaurant_id']];
                var title = new Element('div.title').adopt(
                        new Element('a.item_name', {
                            html: note['item_name'],
                            href: r.cp_menu+'?item_id='+note.item_id,
                            title: 'Order',
                            events: {click: function(){
                                var it = $('item_'+note.item_id);
                                if (it) {
                                    it.fireEvent('click');
                                    return false;
                                }
                            }}
                        }),
                        new Element('div.counters').adopt(
                            new Element('span.tasty', {html:parseInt(0+note["tasty_qty"])}),
                            new Element('span.tasteless', {html:parseInt(0+note["tasteless_qty"])}),
                            new Element('span').addClass(note['image']&&note['image']["thumb"] ?'photo':'').set('title', 'View Photo')
                        ).addEvent('click', function(){
                                    popupsms("view_item_notes",{note_id: note.id, item_id:note.item_id,
                                        offsets: {x:10, y: 100}});
                        })
                );
                switch (type) {
                    case "client":
                        if (rests[note['restaurant_id']]){
                            var footer = new Element("div", {
                                events:{click:load_notes.pass([note["restaurant_id"], "restaurant"])}
                            }).adopt(
                                    new Element('img.logo', {
                                                        title:'from ' + r['name'],
                                                        src: r['logo']
                                                        }),
                                    new Element('span.cname', {html: r['name']}),
                                    new Element('dev.clear')
                            );
                        }
                        break;
                    case "restaurant":
                    default:
                        var footer = new Element("div").adopt(
                                new Element('img.profile', {
                                                    title:'By ' + note['client_name'],
                                                    src:  note['client_logo']
                                                    }),
                                new Element('span.cname', {html: note['client_name'],
                                                           events:{click:load_notes.pass([note["client_id"], "client"])}}),
                                new Element('div').addClass(['tasteless','tasty'][parseInt(note['tasty'])]),
                                new Element('div.counters').adopt(
                                        new Element('span.likes', {
                                               id: 'like_btn_' + note.id,
                                               html: ' likes',
                                               title: 'Like this',
                                               onclick: "note_like(this,"+note.id+",'','')"}).grab(
                                                         new Element('span', {
                                                                html: parseInt(note['like_qty']+0),
                                                                id: 'likes_count_' + note.id}), 'top'),
                                        new Element('span.renotes', {
                                               id: 'renote_btn_' + note.id,
                                               html: ' renotes',
                                               title: 'Save this note for later',
                                               onclick: "popupsms('renote',{id: "+note.id+", popup:1, js_screen:'', prefix:'', item_id:"+note.item_id+"});"}).grab(
                                                         new Element('span', {
                                                                html: parseInt(note['renote_qty']+0),
                                                                id: 'renotes_count_' + note.id}), 'top')
                                )
                        );
                        break;
                }

                var text = note["note"]+"<hr/>";
                if (note['images']) {
                    text = '<img class="nthumb" src="'+get_item_img(note['images'])+'">'+text;
                }
                var p = new PopUpWindow(title, {
                    injectLocation: noteMask,
                    content:text,
                    footer: footer,
                    className:'stickyNote ' + type,
                    fade: 500,
                    width:w
                });
                p.open();
            });
            masonry.go();
            masonry.go.delay(500, masonry);
        }
    });
}
