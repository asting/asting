var sms_response = {};
function send_sms(sms, params, func, nocache){
  nocache = nocache || true;
  var is_sms=true;
  if (!sms.test(/[\W]+/)) var url = location.href.updateUrlValues({'sms':sms, 'sms_enable':1});
  else {
    var url=sms; 
    sms=url.getUrlValue('sms');
  }
  JsHttpRequest.query(
    url,                           // the path to backend
    params,                        // the JavaScript array with data you want to pass
    function(result, errors){
      if ("function" == typeof(func)) {
        if (is_sms) var res = func(result[sms], errors);
        else var res = func(result, errors);
      } else sms_response[sms] = result[sms];
      var js = function(){
        if (result["js"]) try {
          $exec(result["js"]);
          //eval(result["js"]);
        } catch (e) {}
      }
      if ((result["load_js"]||[]).length>0) {
        var jss = $splat(result["load_js"]);
        var counter = 0;
        jss.each(function(src, index){
          var myScript = new Asset.javascript(src, {id: 'load_js_'+index,
            'onload': function(){
              counter++;
              if (counter == jss.length) js();
            }
          });
        });
      } else js();
    }, // the function is called when an answer is ready
    nocache                      // if set to TRUE, caching will be disabled
  );
}

var popups={};

function popupsms(sms, params, func, nocache){
  nocache = nocache || false;
  send_sms(sms, params, function(result, errors){
    if (!result || !result["html"]) return;
    var html = result["html"].stripStyles(true);
    var p = $merge({width: 600, title:''}, params, result["params"]||{});
    showPopup(null, html, p);
    if (typeof func == "function") func(result, errors);
 }, nocache);
}
