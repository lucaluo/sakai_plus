// // MAKE THIS OPTINAL auto login
// var form = document.getElementById("loginForm")
// if (form){
// 	form.eid.value="";
// 	form.pw.value="";
// 	form.submit.click();
// }

unread = {unread_num: 0, unread_title: []};
// Get unread annoucement
chrome.runtime.onMessage.addListener(
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
