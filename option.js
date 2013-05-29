// Track usage by google analytics
var _gaq = _gaq || [];
_gaq.push(['_setAccount', 'UA-41224216-1']);
_gaq.push(['_trackPageview']);

(function() {
  var ga = document.createElement('script'); ga.type = 'text/javascript'; ga.async = true;
  ga.src = 'https://ssl.google-analytics.com/ga.js';
  var s = document.getElementsByTagName('script')[0]; s.parentNode.insertBefore(ga, s);
})();

// Bind event
var runtimeOrExtension = chrome.runtime && chrome.runtime.sendMessage ?
                         'runtime' : 'extension';

$( document ).ready(function() {
	// Read username & psw from local storage
	if (localStorage.getItem("username") && localStorage.getItem("password")){
		$("#username")[0].value = localStorage.getItem("username");
		$("#password")[0].value = localStorage.getItem("password");
	}

	if (localStorage.getItem("checkInterval")){
		$("#refreshInterval")[0].value = localStorage.getItem("checkInterval");
	} else{
		$("#refreshInterval")[0].value = 1; // unit: min
		localStorage.setItem("checkInterval", $("#refreshInterval")[0].value);
	}

	// if (localStorage.getItem("ifNotify")){
	// 	$("#showNotifications")[0].value = localStorage.getItem("ifNotify");
	// } else{
	// 	$("#showNotifications")[0].value = false; // default no notification
	// 	localStorage.setItem("ifNotify", $("#showNotifications")[0].value);
	// }
	
	$("#save").click(function() {
		$("#warning")[0].innerHTML = "";
		$("#success")[0].innerHTML = "";
		if(!$("#username")[0].value || !$("#password")[0].value){
			$("#warning")[0].innerHTML = "Please input Sakai username & password!"
		} else {
			// Test validity of username & psw
			var login_url = "http://sakai.umji.sjtu.edu.cn/portal/relogin";
			// Show wait.gif
			$("#wait-gif").css("display", "inline");

			$.post(login_url, { eid: $("#username")[0].value, pw: $("#password")[0].value})
			.done(function(data) {
				if (data.indexOf('action="http://sakai.umji.sjtu.edu.cn/portal/relogin"') == -1){
					// Success, save it to local storage
					localStorage.setItem("username", $("#username")[0].value);
					localStorage.setItem("password", $("#password")[0].value);
					localStorage.setItem("checkInterval", $("#refreshInterval")[0].value);
					// localStorage.setItem("ifNotify", $("#showNotifications")[0].value);
					$("#wait-gif").css("display", "none");
					$("#success")[0].innerHTML = "Succeed! You can close this page now."
					chrome[runtimeOrExtension].sendMessage({message: "checkNew"}, function(response) {
						// Get response
					});
				} else{
					$("#wait-gif").css("display", "none");
					$("#warning")[0].innerHTML = "Login failed!"
				}
			});
		}
	});
});
