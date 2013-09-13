
function check_address(res, html) {
    e24unspin();
    switch (res["cmd"]) {
        case "alert":
            alert(res["mess"]);
            break;
        case "popup":
            showitemafteraddress = 0;
            showPopup(0, res["tpl"], res["params"]);
            break;
        case "redirect":
            if ($('cl_addr')) $('cl_addr').innerHTML = res["address"];
            popups['_last_'].destroy();
            if (res['cart']) $('cart_follow').set('html', res['cart']); //change_cart($('cart_follow'), res['cart']);
            if ($('address_full')) $('address_full').innerHTML = res["address_full"];
            if (res["dtype"] && $(res["dtype"])) {
                change_cart($(res["dtype"]).set('inputValue', res["dtype"]));
            }
            break;
    }
    return false;
}


function toggleFollow(togle) {
    if (!$('follow_toggler')) return;
    if (togle) noFollow = ! noFollow;
    if (noFollow) {
        $('follow_toggler').set('html', 'Cart, follow me!');
    } else {
        $('follow_toggler').set('html', 'Cart, don\'t follow me!');
    }
}


function edit_item(event, a) {
    if (!Browser.Engine.trident4) {
        event = new Event(event);
        event.stop();
        e24spin($(a).getParent('div'), 5000);
        var href = a.getParent('div').getElement('a.edit_item').href.toURI().getData();
        popupsms("item2order", Object.append(Object.subset(href, ['item_id', 'key']),{baseClass: 'lightface popup_item2order'}), show_item);
        return false;
    }
    return true;
}

function update_qty_item(event, a, qty) {
    if (!Browser.Engine.trident4) {
        event = new Event(event);
        event.stop();
        e24spin($(a).getParent('div'), 5000);
        var href = Object.append(a.getParent('div').getElement('a.edit_item').href.toURI().getData(),
                {'act': a.get('html'), 'qty': qty});
        send_sms("update_qty_item", Object.subset(href, ['item_id', 'key', 'qty', 'act']), function(html, errors) {
           e24unspin();
           $('cart_follow').set('html', html);
        });
        return false;
    }
    return true;
}


function del_item(event, a) {
    if (!Browser.Engine.trident4) {
        event = new Event(event);
        event.stop();
        e24spin($(a).getParent('div'), 5000);
        send_sms("del_item", Object.subset($(a).href.toURI().getData(), ['item_id', 'key']), function(html, errors) {
                    e24unspin();
                    $('cart_follow').set('html', html);
                });
        return false;
    }
    return true;
}

function change_cart(el, value) {
    if (popups['_last_']) popups['_last_'].destroy();
    e24spin($('cart'), 15000);
    var param = {};
    param[$(el).name] = value || $(el).get('inputValue');
    send_sms("update_cart", param, function(res, errors) {
                e24unspin();
                $('cart_follow').set('html', res['cart']);
                if($('dtype')) $('dtype').set('html', $f('dtype').get('inputValue').capitalize());
                if(res['popup']) showPopup(null, res['popup'], res['params']);
            });
    return false;
}

function ch_address(res, err){
    close_popup();
    if (res && res['address']) $('cl_addr').set('html', res['address']);
}

function close_popup(){
    e24unspin();
    if (popups && popups["_last_"]) popups["_last_"].destroy();
}
