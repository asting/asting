//Function to hide a DIV 
function hidediv(id) {
    document.getElementById('cnt_'+ id).style.display = 'none';
    var k = id.split("_");
    $('rest_'+k[0]).getElement('.btn'+k[1]).setStyle('backgroundImage', 'url(static/v4/images/preview_bg.png)');
    $('mapwraper').show();

}

var active_btn;

//Function to show a DIV with margin
function switchid(btn, box_id,status) {
    var margin = 0;
    var id = btn.getParent('.rest').get('id').split('_')[1];
    var status = !btn.getParent('.rest').hasClass('closed');
	var pickuponly = rests[id].pickuponly
    send_sms('right_panel', {id:id, box_id:box_id, status:status, pickuponly:pickuponly}, function(res){
        //selected.removeClass('glow');
        $('mapwraper').hide();
        $('right_panel').set('html', res);
        if (active_btn) $(active_btn).removeClass('active');
        active_btn = btn;
        active_btn.addClass('active');
        $('cnt_'+ id + box_id).show();
        
        /* collapse menu elements */
        var list = $$('.div');                  //list of target elements
        var headings = $$('.link');         //list elements to be clicked on
        var collapsibles = new Array(); //array to store all of the collapsibles
        var h1 = null;
        headings.each( function(heading, i) {
            //for each element create a slide effect
            var collapsible = new Fx.Slide(list[i], {
                duration: 500,
                transition: Fx.Transitions.linear
            });
            //and store it in the array
            collapsibles[i] = collapsible.hide();
            
            //add event listener
            heading.onclick = function(){
                collapsible.toggle();
                if (collapsible.open) 
                   this.getFirst().src= this.getAttribute('data-openimage');
                else 
                   this.getFirst().src= this.getAttribute('data-closedimage');
                return false;
            }
            //Show the first and collapse all the rest  
            if (!h1) { 
                   heading.onclick();
                   collapsible.show();
                   h1 = heading;
               }
            //collapse all of the list items 
            //collapsible.hide();
        });
        /* end collapse */          
          
        var myValues = $('rest_' + id).getCoordinates();
        var filterOpt = $('foptions').getCoordinates();
        if (filterOpt.height > 0)
           myValues.top = myValues.top - filterOpt.height + 17; 
        var ver = getInternetExplorerVersion();
        // Filteers Open
        if ($('toggleLink').hasClass('toggleOpen'))
           myValues.top = myValues.top - 155;  
        if ((ver >= 8) || (ver == -1))
          $('cnt_' + id + box_id).setStyle('margin-top', (myValues.top-376) + 'px');
        else
          $('cnt_' + id + box_id).setStyle('margin-top', (myValues.top-376) + 'px');
    }); 
}

function getInternetExplorerVersion()
// Returns the version of Windows Internet Explorer or a -1
// (indicating the use of another browser).
{
   var rv = -1; // Return value assumes failure.
   if (navigator.appName == 'Microsoft Internet Explorer')
   {
      var ua = navigator.userAgent;
      var re  = new RegExp("MSIE ([0-9]{1,}[\.0-9]{0,})");
      if (re.exec(ua) != null)
         rv = parseFloat( RegExp.$1 );
   }
   return rv;
}

