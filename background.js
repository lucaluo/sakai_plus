// Track usage by google analytics
var _gaq = _gaq || [];
_gaq.push(['_setAccount', 'UA-41224216-1']);
_gaq.push(['_trackPageview']);

(function() {
  	var ga = document.createElement('script'); ga.type = 'text/javascript'; ga.async = true;
  	ga.src = 'https://ssl.google-analytics.com/ga.js';
  	var s = document.getElementsByTagName('script')[0]; s.parentNode.insertBefore(ga, s);
})();

console.log(new Date().getTime() + ": " + "Sakai Plus Start");

// Bind event
var runtimeOrExtension = chrome.runtime && chrome.runtime.sendMessage ?
                         'runtime' : 'extension';

// Initialization
unread = {unread_num: 0, unread_title: []};
unnotify = {unnotify_num: 0, unnotify_title: []};
checking_count = 0;

// Check by schedule
checkOptions();
checkConnection();
setInterval(function(){checkConnection()}, checkInterval * 60 * 1000);

// Check when get message
chrome[runtimeOrExtension].onMessage.addListener(
  	function(request, sender, sendResponse) {
    	if (request.message == "checkNew"){
    		checkConnection();
    	}
});


sakaiTabId = null;
chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
	// Sakai leaved
	if ((tabId == sakaiTabId) && (tab.url.indexOf("sakai.umji.sjtu.edu.cn") == -1)){
		sakaiTabId = null;
		lastVisitTime = new Date().getTime();
		console.log(new Date().getTime() + ": " + "lastVisitTime update: " + lastVisitTime);
		localStorage.setItem("lastVisitTime", lastVisitTime);
		checkConnection();	
	}
	// Sakai opened
	else if (tab.url.indexOf("sakai.umji.sjtu.edu.cn") != -1){
		sakaiTabId = tabId;
		checkConnection();
		chrome.tabs.sendMessage(sakaiTabId, unread, function(response) {
			// Get response
		});
	}
});
chrome.tabs.onRemoved.addListener(function(tabId, removeInfo) {
	// Sakai closed
	if (tabId == sakaiTabId){
		sakaiTabId = null;
		lastVisitTime = new Date().getTime();
		console.log(new Date().getTime() + ": " + "lastVisitTime update: " + lastVisitTime);
		localStorage.setItem("lastVisitTime", lastVisitTime);
		checkConnection();
	}
});


function openSakai(){
	window.open('http://sakai.umji.sjtu.edu.cn/','_blank');
	// var _gaq = _gaq || [];
	// _gaq.push(['_setAccount', 'UA-41224216-1']);
	// _gaq.push(['_trackEvent', 'clicke_sakai_plus_icon']);
}

chrome.browserAction.onClicked.addListener(openSakai);

function checkNew()
{	
	checking_count ++;
	console.log(new Date().getTime() + ": " + "Start check new announcements");
	checkOptions();
	unnotify = {unnotify_num: 0, unnotify_title: []};
	if (localStorage.getItem("username") && localStorage.getItem("password")){ // Ask for usrname & pw
		userName = localStorage.getItem("username");
		passWord = localStorage.getItem("password");

		var request = {unread_num: 0, unread_title: []};
		// Login
		var login_url = "http://sakai.umji.sjtu.edu.cn/portal/relogin";
		$.post(login_url, { eid: userName, pw: passWord })
		.done(function(data) {
			// parse tabs
			var tab_strings = data;
			var tab_start = tab_strings.indexOf("Sites list begins here");
			tab_strings = tab_strings.substring(tab_start);
			var tab_end1 = tab_strings.indexOf("<script");
			var tab_end2 = tab_strings.indexOf('title="More Sites"');
			if (tab_end2 >= 0 && tab_end2 < tab_end1){
				var tab_end = tab_end2;
			} else {
				var tab_end = tab_end1;
			}
			tab_strings = tab_strings.substring(0, tab_end);
			// console.log(new Date().getTime() + ": " + "tab_strings: " + tab_strings);

			var tab_str_matches = tab_strings.match(/<li.*?<\/a>/g);

			var outer_count = 0;
			var inner_count = 0;

			for (var key in tab_str_matches){
				// get tab url
				var tab_url_match = tab_str_matches[key].match(/http.*?(?=")/);
				// console.log(new Date().getTime() + ": " + "tab_url_match: " + tab_url_match);
				if (null !== tab_url_match){
					var tab_url = tab_url_match[0];
					console.log(new Date().getTime() + ": " + "tab_url: " + tab_url);
				}

				// get tab content
				if (typeof tab_url != 'undefined'){
					outer_count ++;

					$.get(tab_url, function(data){
						outer_count --;
						tab_content = data;

						if (null == tab_content.match(/title="Home"/)){
							var tab_home_url_match = tab_content.match(/http.*?(?=" title="For displaying Site information | Display recent announcements, updated as messages arrive | Show a summary of schedule events in My Workspace | Display unread discussion and forum topic messages for all sites or a site | Display recent chat messages, updated as messages arrive")/);
							if (null !== tab_home_url_match){
								var tab_home_url = tab_home_url_match[0];
								$.get(tab_home_url, function(data){
									tab_content = data;
								});
							}
						}
						
						// find annoucement url
						var tab_content_match = tab_content.match(/Recent Announcements(.?\r?\n?)*?\/iframe/);
						if (null !== tab_content_match){
							var tab_announce_url_match = tab_content_match[0].match(/src="http.*(?=")/);
							if (null !== tab_announce_url_match){
								var tab_announce_url = tab_announce_url_match[0].substring(5) + "&eventSubmit_doLinkcancel=Return%20to%20List"; 
							}
						}

						inner_count ++;
						// fetch tab recent annoucement
						$.get(tab_announce_url, function(data){
							inner_count --;
							var announce_content = data;
							var announce_content_matches = announce_content.match(/<li>(.?\r?\n?)*?<\/li>/g);
							for (var announce_key in announce_content_matches){
								// parce annoucement title
								var announce_title_match = announce_content_matches[announce_key].match(/announcement .*?(?=")/);
								if (null !== announce_title_match){
									var annouce_title = announce_title_match[0].substring(13);
								}
								// parce annoucement time
								var announce_time_match = announce_content_matches[announce_key].match(/(Jan|JAN|Feb|FEB|Mar|MAR|Apr|APR|May|MAY|Jun|JUN|Jul|JUL|Aug|AUG|Sep|SEP|Oct|OCT|Nov|NOV|Dec|DEC).*(am|pm)(?=\))/);
								if (null !== announce_time_match){
									var annouce_time = announce_time_match[0];
								}
								// Check if new annoucement
								var publishTime = new Date(annouce_time).getTime();
								if (publishTime >= lastVisitTime){
									request.unread_num += 1;
									annouce_title = tochar(annouce_title);
									request.unread_title[request.unread_num-1] = annouce_title;
									console.log(new Date().getTime() + ": " + "Unread: " + "unread_num: " + request.unread_num + "unread_title: " + request.unread_title[request.unread_num-1] + "unread_time: " + publishTime);

									if (publishTime >= notificationTime){
										unnotify.unnotify_num += 1;
										unnotify.unnotify_title[unnotify.unnotify_num-1] = annouce_title;
										console.log(new Date().getTime() + ": " + "Notification: " + "unnotify_num: " + unnotify.unnotify_num + "unnotify_title: " + unnotify.unnotify_title[unnotify.unnotify_num-1] + "unnotify_time: " + publishTime);
									}	
								}
							}
							if (outer_count == 0 && inner_count == 0){
								checking_count --;
								unread = request;
								chrome.browserAction.setBadgeBackgroundColor({color: "#009AC7"});
								chrome.browserAction.setBadgeText({text: unread.unread_num.toString()});
								// Show notification
								if (ifNotify && unnotify.unread_num > 0){
									notificationTime = new Date().getTime();
									console.log(new Date().getTime() + ": " + "Notification Time update: " + notificationTime);
									localStorage.setItem("notificationTime", notificationTime);
									for (key in unnotify.unnotify_title) {
										show_notification(unnotify.unnotify_title[key]);
									}
								}
							}
						});
					});
				}
			}
		console.log(new Date().getTime() + ": " + "CheckNew End");
		});
	} else {
		window.open('option.html','_blank');
	}
}


function checkConnection(){
	// http://sakai.umji.sjtu.edu.cn/library/skin/neo-default/images/logo_inst.gif

	var Url = 'http://sakai.umji.sjtu.edu.cn/'
	console.log(new Date().getTime() + ": " + "Start check Connection");
	xmlHttp = new XMLHttpRequest(); 
    xmlHttp.onreadystatechange = ProcessRequest;
    xmlHttp.open( "GET", Url, true );
    xmlHttp.send( null );

    function ProcessRequest() 
	{
		console.log(new Date().getTime() + ": " + "Process Request");
		console.log(new Date().getTime() + ": " + "Ready State: " + xmlHttp.readyState);
		console.log(new Date().getTime() + ": " + "Status: " + xmlHttp.status);
		if (xmlHttp.readyState == 4 && xmlHttp.status == 200 && checking_count == 0){
			console.log(new Date().getTime() + ": " + "Connection Success");
			checkNew();
		} else if (xmlHttp.readyState == 4 && xmlHttp.status == 200 && checking_count > 0){
			console.log(new Date().getTime() + ": " + "Checking has been in progress");
		} else if (xmlHttp.readyState == 4 && xmlHttp.status == 0){
			console.log(new Date().getTime() + ": " + "Connection Fail");
			chrome.browserAction.setBadgeBackgroundColor({color: "#000"});
			chrome.browserAction.setBadgeText({text: "X"});
		}
	}
}

function show_notification(title){
	console.log(new Date().getTime() + ": " + "Show Notification: " + title);
	var notification = webkitNotifications.createNotification(
	  	'icons/icon-48.png', 
	  	'New Announcement',  // notification title
	  	title  // notification body text
	);
	notification.show();
}

function checkOptions() {
	console.log(new Date().getTime() + ": " + "Check Options");
	if (localStorage.getItem("lastVisitTime")){
		lastVisitTime = localStorage.getItem("lastVisitTime");
		console.log(new Date().getTime() + ": " + "Get lastVisitTime: " + lastVisitTime);
	} else{
		lastVisitTime = new Date().getTime();
		console.log(new Date().getTime() + ": " + "New lastVisitTime: " + lastVisitTime);
		localStorage.setItem("lastVisitTime", lastVisitTime);
	}

	if (localStorage.getItem("notificationTime")){
		notificationTime = localStorage.getItem("notificationTime");
		console.log(new Date().getTime() + ": " + "Get notificationTime: " + notificationTime);
	} else{
		notificationTime = new Date().getTime();
		console.log(new Date().getTime() + ": " + "New notificationTime: " + notificationTime);
		localStorage.setItem("notificationTime", notificationTime);
	}

	if (localStorage.getItem("checkInterval")){
		checkInterval = localStorage.getItem("checkInterval");
		console.log(new Date().getTime() + ": " + "Get checkInterval: " + checkInterval);
	} else{
		checkInterval = 5; // unit: min
		console.log(new Date().getTime() + ": " + "New checkInterval: " + checkInterval);
		localStorage.setItem("checkInterval", checkInterval);
	}

	if (localStorage.getItem("ifNotify")){
		if (localStorage.getItem("ifNotify") == "true"){
			ifNotify = true;
		} else {
			ifNotify = false;
		}
		console.log(new Date().getTime() + ": " + "Get ifNotify: " + ifNotify);
	} else{
		ifNotify = false; // default no notification
		console.log(new Date().getTime() + ": " + "New ifNotify: " + ifNotify);
		localStorage.setItem("ifNotify", ifNotify);
	}
	ifNotify = false;
}

function tochar(input){
 	var amyreg = /&#\d{1,5};/;
 	var pmyreg = /%/g;
 	output = input.replace(pmyreg,"%25");
 	str1 = output;
 	atest = amyreg.test(str1);
 	while (atest == true){
  		strMatch = str1.match(amyreg);
  		asubst = strMatch[0].slice(2);
	  	asubstlen = asubst.length;
	  	asubst = asubst.slice(0,(asubstlen - 1));
	  	asubst = parseInt(asubst,10);
	  	akey = asubst;
	  	asubst = asubst.toString(16);
	  	if (akey >= 65536){newreg = "ki~saqbvd_Vgf&ath_" + akey + ";";}
	   	else if ((akey >= 256) && (akey < 4096)){newreg = "%u0" + asubst;}
	   	else if (akey >= 4096){newreg = "%u" + asubst;}
	   	else if((akey >= 16) && (akey < 256)){newreg = "%" + asubst;}
	   	else if(akey < 16){newreg = "%0" + asubst;
	  	}
	  	re = new RegExp(strMatch[0],"mig");
	  	strReplace = str1.replace(re,newreg);
	  	output = strReplace;
	  	str1 = output;
	  	atest = amyreg.test(str1);
 	}
 	output = output.replace(/ki~saqbvd_Vgf&ath_/gm,"&#");
 	output = unescape(output);
 	var text = document.createElement("text");
 	text.innerHTML = output;
 	output = text.innerHTML;
 	return output;
}
