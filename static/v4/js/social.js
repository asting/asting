window.addEvent("domready", function () {
    $$(".clickable").each(function (e) {
        e.addEvent("click", function () {
            top.location.href = e.getProperty("href");
            return false;
        });
    });

    //video toggle
    if ($('slide_video')) {
        var status = {
            'true':'Got it, hide video',
            'false':'Confused? Watch this.'
        };
        var myVerticalSlide = new Fx.Slide('slide_video');
        myVerticalSlide.hide();
        myVerticalSlide.wrapper.setStyles({width:"910px",
            float:"left"});
        $('v_toggle').addEvent('click', function (event) {
            event.stop();
            myVerticalSlide.toggle();
        });
        myVerticalSlide.addEvent('complete', function () {
            var imgNumber = new Element('img', {'src':'/static/v4/images/social/video_img.jpg', 'style':'display:block;', 'border':0});
            $('v_toggle').set('text', status[myVerticalSlide.open]);
            $('v_toggle').grab(imgNumber, 'top');
        });
    }

    init_lists_slider();
});

var rating = {};//new Array();
var remooz = {};//new Array();
function UploadImg(id, params) {
    new qq.FileUploader({
        element:$('uploader'),
        template:'<div class="qq-uploader">' +
                '<div class="qq-upload-drop-area"><span>Drop Image here to upload</span></div>' +
                '<div class="qq-upload-button"><img src="/static/v4/images/social/icons/myupload.png"/></div>' +
                '</div>',
        action:'/index.php?sms=img_upload&sms_enable=1',
        multiple:false,
        listElement:$('qq_upload_list'),
        sizeLimit:5 * 1024 * 1024,
        allowedExtensions:['jpg', 'jpeg', 'png', 'gif'],
        onProgress:function (id, fileName, loaded, total) {
        },
        onSubmit:function (id0, fileName) {
            e24spin($("uploader").getElement(".qq-uploader"));
        },
        onCancel:function (id0, fileName) {
            e24unspin();
        },
        onComplete:function (id0, fileName, responseJSON) {
            if (responseJSON.files) {
                e24unspin();
                $('item_logo').setProperty('src', responseJSON.files['thumb']);
                $("item_logo_href").setProperty('href', responseJSON.files['img']);
                $("note_img").set('value', responseJSON.files['img']);
                remooz[id].destroy();
                remooz[id].link = responseJSON.files['img'];
                $('upload_logo_td').addClass("has_logo");
            } else {
                //$("uploader" + id).show();
                e24unspin();
                $("note_img").set('value', '');
            }
        },
        showMessage:function (message) {
	       alert(message);
        },
        params:{
            type:"POST"
        }
    });
}

function order_info(e) {
	var arr = new Element('div#small_arrow');
    var id = $(e).get("order-id");
    var order_data = $("order_data");
    var pos = $(e).getPosition();
    var parent_pos = $('social-table').getPosition();
    send_sms("vieworder", {order_id:id}, function (r) {
        order_data.set("html", r["html"]);
        order_data.grab(arr);
        arr.show();
        $$('.social-info ').removeClass('selected');
        $(e).addClass('selected');
	    order_data.setStyle("margin-top", pos.y - parent_pos.y + 0);
    });
}

function note_tasty(e, retasty) {
    if (retasty) {
        $(e).removeClass("show1").removeClass("like").removeClass("dislike");
        $(e).getPrevious().removeClass("show0");
        $('note_tasty').set('value', '');
    } else {
        var tasty = $(e).get('value');
        var css = (tasty == 1) ? "like" : "like dislike";
        var title = (tasty == 1) ? "Tasty" : "Not a fan";
        var parent = $(e).getParent();
        parent.getNext().addClass(css).setProperty("title", title).show();
        parent.addClass("show0");
        $('note_tasty').set('value', tasty);
    }
}

function note_add(item_id, id, order_id, note_id, js_screen, prefix) {
    var tasty = $('note_tasty').get('value'),
            note = $("item_note").get("value"),
            lists = $("item_lists").get("value"),
            is_public = $("item_is_public").checked ? 0 : 1,
            note_img = $("note_img").get("value");
    if (!tasty && !note && !note_img) {
        return alert('Please write note.');
    }
    var params = {
        js_screen:js_screen,
        prefix:prefix,
        note_id:note_id,
        order_id:order_id,
        note:note,
        is_public:is_public,
        item_id:item_id,
        tasty:tasty,
        note_img:note_img,
        lists:lists
    };
    switch (js_screen) {
        case "orders":
            params.order_item_id = id;
            var callback = function (r) {
                if(prefix=="b"){//return bigview
                    popupsms("view_item_notes",{ item_id:item_id });
                }else{
                    popups["_last_"].destroy();
                    $("order_item_note_box" + id).set("html",r);
                    $("note_state_icon" + id).getNext('span').set('text', 'View note');
                    $("note_state_icon" + id).setProperty("src", "/static/v4/images/social/icons/magnify_icon.png");
					note_id = note_id ? note_id : $("order_item_note_box" + id).getChildren().getProperty('note')[0];
                    $("note_state_link" + id).setProperties({onclick : "popupsms('popup_note',{note_id:" + note_id + ",order_item_id:" + item_id + ",item_id:" + item_id + ",js_screen:'orders'})",
                                                         title : "View"});
                }
            }
            break;
        case "notes":
            e24spin($('notes_container'));
            var filters_hash=get_filters_hash();
            params = $merge(params,filters_hash);
            var callback = function (r) {
                if(prefix=="b"){//return bigview
                    popupsms("view_item_notes",{ item_id:item_id });
                }else{
                    popups["_last_"].destroy();
                }
                update_notes_callback(r);
                e24unspin();
            }
            break;
        case "rest":
            var callback = function (r) {
                if(prefix=="b"){//return bigview
                    popupsms("view_item_notes",{ item_id:item_id });
                }else{
                    popupsms("item2order", {baseClass: 'lightface popup_item2order','item_id': item_id}, function(result,err){
                        show_item(result,err);
                        //rest_menu_show_item_notes(item_id);
                    });
                }
            }
            break;
        default:
            popups["_last_"].destroy();
    }
    send_sms("note_manager", params, callback);
}

function delete_item_img() {
    $('upload_logo_td').removeClass("has_logo");
    $("note_img").set('value', '');
}

function notes_delete(id, js_screen) {
    send_sms("notes_delete", {note_id:id, js_screen:js_screen}, function (r) {
        popups["_last_"].destroy();
        if (js_screen == "notes") {
            var tmp = new Element("div", {html:r});
            var html = tmp.getFirst("#note_content").get("html");
            $("note_content").set("html", html);
        }
    });
}

function note_like(e, id, prefix, js_screen) {
    send_sms('note_like', {id:id}, function (result) {
        if(result)$(prefix + 'likes_count_' + id).set("text", result);
        //if(prefix=="")
        $(e).removeClass("link-button").removeProperty("onclick").removeProperty("title");
        //else e.dispose();
        if (js_screen == "notes") {
            notes_update()
        }
    });
}

function renote(e, id, prefix, js_screen, list_id,item_id) {
    send_sms('renote', {id:id,list:list_id}, function (result) {
        var renote_text = $(prefix + 'renotes_count_' + id);
        if(renote_text) renote_text.set("text", result);
        if($(e)) $(e).removeClass("link-button").removeProperty("onclick").removeProperty("title");
        //else if($(e)) e.dispose();
        switch(js_screen){
            case "notes":
                notes_update();
                popups["_last_"].destroy();
                break;
            case "rest":
                    if(prefix=="b"){//return bigview
                        popupsms("view_item_notes",{ item_id:item_id });
                    }else{
                        popupsms("item2order", {baseClass: 'lightface popup_item2order','item_id': item_id}, function(result,err){
                            show_item(result,err);
                            rest_menu_show_item_notes(item_id);
                        });
                    }
                break;
            default:
                popups["_last_"].destroy();
        }
    });
}

function sub_comment(id, prefix) {
    $(prefix + 'subcomment_div' + id).show();
    $(prefix + 'comment_text' + id).focus();
    $(prefix + 'note_bottom' + id).hide();
}

function cancel_comment(id, prefix) {
    $(prefix + 'subcomment_div' + id).hide();
    $(prefix + 'note_bottom' + id).show();
}

function send_comment(id, prefix, js_screen) {
    var text = $(prefix + 'comment_text' + id).get('value');
    var span = $(prefix + 'comments_count_' + id);
    $(prefix + 'comment_text' + id).set('value', '');
    var ul = $(prefix + 'note_comments_' + id);
    var now = new Date().format("%m/%d/%Y");
    var tpl ="<li><b class='username'></b>"+strip_tags(text)+"<div style='line-height:13px'><div class='comment_date f-left'>"+now+" by "+UserName+"</div><div class='clear'></div></div></li>";
    ul.adopt(new Element("div", {html:tpl}).getFirst());
    send_sms('subcomment', {id:id, text:text}, function (r) {
        span.set("text", r);
        if (js_screen == "notes") {
            notes_update()
        }
    });
}

function delete_comment(e, comment_id, note_id, prefix) {
    var li = $(e).getParent("li");
    li.dispose();
    var mynotes_span = $("note_comment_count_" + note_id);
    var span = $(prefix+'comments_count_' + note_id);
    var comments_count = parseInt(span.get("text"));
    comments_count = comments_count - 1;
    span.set("text", comments_count);
    if (mynotes_span) {
        mynotes_span.set("text", comments_count);
    }
    send_sms("delete_comment", {note_id:note_id, comment_id:comment_id}, function () {
    });
}

function change_account() {
    send_sms("change_account", '', function () {
        alert('Your account has been changed to the old version');
        location.reload(true);
    });
}

function strip_tags(str) {
    return str.replace(/<\/?[^>]+>/gi, '');
}
function view_reciept(id) {
    popupsms('viewReciept', {order_id:id});
}

function order_took(e, oid, took_value) {
    var took_div = $(e).getParent(".took");
    took_div.getElements("label").each(function (e) {
        if (took_value != $(e).getElement(".styled").get("value"))
            $(e).dispose();
        else {
            $(e).getElement("span.radio,.styled").dispose();
        }
    });
    send_sms("rateit", {order_id:oid, took:took_value}, function (r) {
    });
}
function restaurant_rating(oid, rvalue) {
    rating[oid].locked = true;
    send_sms("rateit", {order_id:oid, rating:rvalue}, function (r) {
    });
}

function rateit(e) {
    form = $(e).getParent("form");
    hash = form.getFormHash();
    //todo: check selected
    if (hash["rating"] == 0) {
        alert("Please Rate Restaurant!");
        return;
    }
    rating[hash["order_id"]].locked = true;
    form.getElements(".took label").each(function (e) {
        if (hash["took"] != $(e).getElement(".styled").get("value"))
            $(e).dispose();
        else {
            $(e).getElement("span.radio,.styled").dispose();
        }
    });
    //$(e).dispose();

    send_sms("rateit", hash, function (r) {
    });
    popups["_last_"].destroy();
}

function hide_notes() {
    $("cart_follow").show();
    $("notes_right_block").hide();
}

function view_notes(e, el, id) {
    var epos = el.getPosition();
    var menupos = $("menu_outer").getPosition();
    var top = epos.y - menupos.y - 5;
    var total = $$("#total span")[1].get("html");
    e24spin(el);
    send_sms("view_item_notes", {item_id:id}, function (r) {
        $("cart_follow").hide();
        $$("#mycart_button_style span")[0].set("html", total);
        $('notes_right_block').setStyle("margin-top", top).show();
        $("item_notes_content").set("html", r["html"]);
        e24unspin(el)

    });
    //xd(window.event);
    if (!e) var e = window.event;
    $(e).cancelBubble = true;
    if ($(e).stopPropagation) $(e).stopPropagation();
    return false;
}

function cell_center_update(sms_name, params) {
    e24spin($('cell_center_container'));
    send_sms(sms, params, function (r) {
        $('cell_center_container').set('html', r);
        e24unspin();
    });
}

function list_manage(e, params) {
    var hash = $(e).getParent('form').getFormHash();
    var list_wrapper = $('lists_wrapper');
    if (params.del) {
        var hash2 = hash;
        delete hash;
        hash["delete"] = 1;
        hash["id"] = hash2["id"];
    }
    popups["_last_"].destroy();
    e24spin(list_wrapper);
    send_sms("list_manager", hash, function (r) {
        $('lists_wrapper').set('html', r["html"]);
        e24unspin();
    });
}

function list_manage_editnote(e) {
    var hash = $(e).getParent('form').getFormHash();
    var lists_wrapper = $('lists_wrapper');
    $("list_name").set("value","");
    hash["json"] = 1;
    send_sms("list_manager", hash, function (r) {
        if(lists_wrapper) {
            $('lists_wrapper').set('html', r["html"]);
        }
        var json = r["json"];
        $('item_lists').adopt(new Element("option",{"text":json.name, "value": json.id, "selected": "true"}));
        $("sms_table2").hide();
        $("sms_table").show();
        popups["_last_"].resizeEvent();
    });
}



function edit_list_popup(event,id){
    var event = new Event(event);
    event.preventDefault();
    event.stopPropagation();
    popupsms('list_manager',{id:id});
}

function active_list(e){
    var last_active = $(e).getParent().getElement(".list_block.active");
    if(!$(e).hasClass("active")){
        if(last_active) last_active.removeClass("active");
        $(e).addClass("active");
    }
    if($(e).get("list-id")==""){
        reset_filters();
    }
    update_notes();
}

function reset_filters(){
    filters = $("filter_wrapper").getElements(".notes_filter") || {};
    for(i=0;i<filters.length;i++){
        if(filters[i].get("type")=="checkbox"){
            filters[i].checked=false;
        }else{
            filters[i].set("value","");
        }
    }
}

function get_filters_hash(){
    var params = {},
        list = $("lists_of_notes").getElement(".list_block.active"),
        filters = $("filter_wrapper").getElements(".notes_filter") || {};

    if(list){
        params["flt[lists]"] = list.get("list-id");
    }

    for(i=0;i<filters.length;i++){
        if(filters[i].get("type")=="checkbox"){
            params[filters[i].get("name")]=filters[i].checked;
        }else{
            params[filters[i].get("name")] = filters[i].get("value");
        }
    }
    return params;
}

function update_notes(flt_e){
    var params = get_filters_hash();
    e24spin($('notes_container'));
    send_sms("notes", params, function(r){
        update_notes_callback(r);
        e24unspin();
    });
}

function update_notes_callback(r){
    if(r){
        var tmp = new Element("div", {html:r});
        var notes_html = tmp.getElement(".notes_wrapper").get("html");
        var filters_html = tmp.getElement(".filter_wrapper").get("html");
        $("notes_wrapper").set("html", notes_html);
        $("filter_wrapper").set("html", filters_html);
    }else{
        reset_filters();
        showPopup("","<div style='font-size:14px;padding:10px;text-align: center;'>Oops, no results found for your search. Please modify your search</div>");
        (function(){
            var active = $$(".list_block.active");
            if(active){
                active.removeClass("active");
            }
            $("lists_of_notes").getFirst().addClass("active");
         })();
        update_notes();
    }
}

function note_popup_select_list(e) {
    if ($(e).get("value") == "new") {
        $("sms_table").hide();
        $("sms_table2").show();
        popups["_last_"].resizeEvent();
    }
}

function note_popup_cancel_add_list(){
    $("item_lists").getFirst("option").set("selected","true");
    $("sms_table2").hide();
    $("sms_table").show();
    popups["_last_"].resizeEvent();
}


var smallPopupNotesFx;
function rest_menu_show_item_notes(id) {
    var box = $("item_notes_box");
    var contentSize = $("add_item_content").getSize();
    var fx;
    if (!smallPopupNotesFx) {
        fx = box.get("fx") || new Fx.Slide(box, {
            mode:"horizontal",
            onStart: function(){
                popups["_last_"].box.tween('left', popups["_last_"].box.getPosition().x+([-1,1][this.open*1]*155));
            },
            onComplete:function (frame) {
                popups["_last_"].resizeEvent();
            }
        });
        fx.wrapper.setStyles({
            width:"310px"
        });
        fx.hide();
        smallPopupNotesFx = fx;
    }
    else {
        fx = smallPopupNotesFx;
    }
    if (box.hasClass("loaded")) {
        fx.toggle();
    } else {
        send_sms("view_item_notes", {item_id:id}, function (r) {
            box.set("html", r["html"]).addClass("loaded");
            var topHeight = $("view_item_notes_top").measure(function () {
                return this.getSize().y;
            });
            var content_height = contentSize.y - topHeight;
            $("view_item_notes_content").setStyles({
                "overflow-y":"auto",
                "height":content_height
            });
            fx.slideIn();
        });
    }
}
function init_lists_slider() {
    if($('lists_wrapper')){
        var status = {
            'true':'Hide list',
            'false':'Show List'
        };
        var myVerticalSlide = new Fx.Slide('lists_wrapper');
        //myVerticalSlide.hide();
        myVerticalSlide.wrapper.setStyles({width:"980px"});
        $('openclose_lists').addEvent('click', function (event) {
            event.stop();
            myVerticalSlide.toggle();
        });
        myVerticalSlide.addEvent('complete', function () {
            var link = $('openclose_lists');
            link.set('text', status[myVerticalSlide.open]);
            if (myVerticalSlide.open)
                link.addClass("open");
            else
                link.removeClass("open");

        });
    }
}

function list_image_open(){
    $("list_images_wrapper").show();
    $("list_form").hide();
    popups["_last_"].resizeEvent();
}

function list_image_cancel(){
    $("list_images_wrapper").hide();
    $("list_form").show();
    popups["_last_"].resizeEvent();
}

function list_image_select(e){
    var img = $(e).getFirst("img"),
        id = img.get("id"),
        url = img.get("src");

    list_image_cancel();
    $('list_img').setProperty('src', url);
    $("list_img_href").setProperty('href', url);
    $("list_img_val").set('value', url);
    list_remooz.destroy();
    list_remooz.link = url;
    $('list_img_td').addClass("has_logo");
}
