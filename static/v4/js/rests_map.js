var selected = null;
var myscroll = null;
var map = null;
var rest = null;
var next = null;

if (!selectors) var selectors = {rest: '.rest', mapwraper: 'mapwraper',title: '.content_list_rest_name a', numberParent: '.content_list_rest_name'};
window.addEvent('domready', function() {
    //stick_div($('map'), 0);
    new StaticScroller('GoogleMapCanvasBox', {scrollElement: window});
    map = new RestsMap(mapParam);
    //if (Object.getLength(rests)>0) load_map();
    load_map();
});

function load_map() {
    var param = {'duration':700, 'offset':{'x':0, 'y': -21}};
    myscroll = new Fx.SmoothScroll(param, window);
    var points = $$(selectors.rest).get('latlng');
    map.clear();
    $(document.body).addEvent('mousemove', function(event) {
        var trg = $(event.target).getParent(selectors.rest);
        if (trg) next = trg;
    });
    points.each(point2map);
}

function showmap(id, noscroll) {
    id = id.id || id;
    var rest = $('rest_' + id);
    if (selected) $(selected).removeClass('glow');
    selected = rest;
    rest.addClass('glow');
    if (!noscroll) myscroll.toElement(rest);
    //load_notes(id);
    return selectors.ballon ? ("<div class='RestBox Ballon'>" + rest.get('html') + "</div>") : false;
}

function point2map(p, i) {
    if (map.multi) return;
    var n = i + 1;
    var m = p.match(/(\d+):\(([\d.-]+),([\d.-]+)\)/);
    rest = $('rest_' + m[1]);
    var span = new Element('span', {'html': n + '.', 'class': 'number'});
    var show_rest_on_map = function(event) {
        var nrest = $(event.target).getParent(selectors.rest);
        //console.log($(selectors.mapwraper).isVisible(), next, nrest);
        if (!$(selectors.mapwraper).isVisible() || next != nrest) return;
        var content = showmap(m[1], 1);
        map.click({id: m[1], content: content});
    }
    rest.getElement(selectors.numberParent).grab(span, 'top');
    rest.addEvents({
        //'mouseover:pause(1000)': show_rest_on_map,
        'click': show_rest_on_map
    });
    rest.getElement('a.rest_menu').addEvents({
        'mouseover': show_rest_on_map
    });
    map.newPoint({
        i: n, id:m[1],
        lat: m[2], lng:m[3],
        title: rest.getElement(selectors.title).get('text'),
        click: showmap
    });

}
var RestsMap = new Class({

    Implements: [Options,Events],

    options: {
        div: '',
        icon: '/static/v4/images/google_maps/map_man.png',
        center: {lat: -25.344, lng: 131.036},
        zoom: 14,
        wheel: false,
        userPoint:true,
        route:true,
        directionPanel: null
    },


    initialize: function(options) {
        this.setOptions(options);
        this.markers = {};
        this.activeMarker = -1;
        this.center = new google.maps.LatLng(this.options.center.lat, this.options.center.lng);
        this.bounds = new google.maps.LatLngBounds();
        this.map = new google.maps.Map($(this.options.div), {
            zoom: this.options.zoom,
            center: this.center,
            scrollwheel: false,
            mapTypeId: google.maps.MapTypeId.ROADMAP
        });

        if (this.options.userPoint) {
            this.newClientPoint({lat: this.options.center.lat, lng: this.options.center.lng});
        }

        this.directionsDisplay = new google.maps.DirectionsRenderer();
        this.directionsDisplay.setMap(this.map);
        this.directionsDisplay.suppressMarkers = true;
        if (this.options.directionPanel) this.directionsDisplay.setPanel($(this.options.directionPanel));
        this.directionsService = new google.maps.DirectionsService();
        this.infowindow = new google.maps.InfoWindow();

        //google.maps.event.addListener(this.map, 'click', this.addPoint.bind(this));
        //this.draw();
    },
    newClientPoint: function(point) {
        if (this.client) this.client.setMap(null);
        this.center = new google.maps.LatLng(point.lat, point.lng);
        this.client = new google.maps.Marker({
            position: this.center,
            icon: this.options.icon,
            map: this.map,
            title: 'My Place'});

    },

    addPoint: function(event) {
        this.newPoint(event.latLng)
    },

    newPoint: function(param) {
        //http://chart.apis.google.com/chart?chst=d_map_spin&chld=.5|0|ffff00|11|b|
        var latLng = new google.maps.LatLng(param.lat, param.lng);
        var color = param.color || 'ff343e';
        var marker = new google.maps.Marker({
            position: latLng,
            map: this.map,
            icon: 'http://chart.apis.google.com/chart?chst=d_map_spin&chld=.5|0|' + color + '|11|b|' + param.i,
            title: param.title,
            draggable: false,
            i:param.i
        });
        this.markers[param.id] = marker;
        this.bounds.extend(latLng);
        google.maps.event.addListener(marker, 'click', [param.click, this.click].pick().bind(this, [param]));

    },

    fitBounds: function() {
        this.map.fitBounds(map.bounds);
    },

    clear: function() {
        this.directionsDisplay.setMap(null);
        if (this.markers) {
            this.bounds = new google.maps.LatLngBounds();
            for (i in this.markers) {
                this.markers[i].setMap(null);
            }
        }
    },

    click: function(param) {
        var point = this.markers[param.id].getPosition();
        if (this.options.userPoint && this.options.route) {
            var request = {
                origin: this.center,
                destination: point,
                travelMode: google.maps.DirectionsTravelMode.DRIVING
            };
            var self = this;
            this.directionsDisplay.setMap(this.map);
            this.directionsService.route(request, function(response, status) {
                if (status == google.maps.DirectionsStatus.OK) {
                    self.directionsDisplay.setDirections(response);
                }
            });
        } else {
        }

        this.map.setCenter(point);

        if (this.activeMarker != -1) {
            oldMarker = this.markers[this.activeMarker];
            oldMarker.setIcon("http://chart.apis.google.com/chart?chst=d_map_spin&chld=.5|0|ff343e|11|b|" + oldMarker.i);

        }
        this.activeMarker = param.id;
        marker = this.markers[param.id];
        marker.setIcon("http://chart.apis.google.com/chart?chst=d_map_spin&chld=.7|0|ffff00|13|b|" + marker.i);

        var content = param.content
        if (param.click) {
            content = param.click(param.id);
        }
        if (content) {
            this.info(content, point);
        }
    },
    info: function(content, point) {
        this.infowindow.setOptions({
            content: content,
            position: point
        });
        this.infowindow.open(this.map);
    }


});
