// // Track usage by google analytics
// var _gaq = _gaq || [];
// _gaq.push(['_setAccount', 'UA-41224216-1']);
// _gaq.push(['_trackPageview']);

// (function() {
//   var ga = document.createElement('script'); ga.type = 'text/javascript'; ga.async = true;
//   ga.src = 'https://ssl.google-analytics.com/ga.js';
//   var s = document.getElementsByTagName('script')[0]; s.parentNode.insertBefore(ga, s);
// })();

// Bind event
var runtimeOrExtension = chrome.runtime && chrome.runtime.sendMessage ?
                         'runtime' : 'extension';

unread = {unread_num: 0, unread_title: []};
// Get unread annoucement
chrome[runtimeOrExtension].onMessage.addListener(
	function(request, sender, sendResponse) {
		unread = request;
    	console.log(request);
    	highlight();
      	// sendResponse({farewell: "goodbye"});
});


function highlight(){
	// Highlight new annoucement
	var iframes = document.getElementsByTagName("iframe")
	for (var key in iframes){
		iframe = iframes[key]
		if (iframe.getAttribute("title") == "Recent Announcements "){
			iframe_content = iframe.contentWindow.document.getElementsByTagName("html")[0];
			for (var i in unread.unread_title){
				var iframe_content_str = iframe_content.innerHTML.toString();
				console.log(iframe_content_str);
				if ((iframe_content_str.indexOf(unread.unread_title[i]+"</a>") != -1) && (iframe_content_str.indexOf(unread.unread_title[i]+"</a>"+'<span style="color: #F00E0E;"> NEW</span>') == -1) )
					iframe_content.innerHTML = iframe_content_str.replace(unread.unread_title[i]+"</a>", unread.unread_title[i]+"</a>"+'<span style="color: #F00E0E;"> NEW</span>');
			}
		}
	}
}
