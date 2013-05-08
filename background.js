if (localStorage.getItem("lastVisitTime")){
	lastVisitTime = localStorage.getItem("lastVisitTime");
} else{
	lastVisitTime = new Date().getTime();
}


unread = {unread_num: 0, unread_title: []};
checkInterval = 1; // unit: min

// Check by schedule
checkNew();
setInterval(function(){checkNew()}, checkInterval * 60 * 1000);


sakaiTabId = null;
chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
	// Sakai leaved
	if ((tabId == sakaiTabId) && (tab.url.indexOf("sakai.umji.sjtu.edu.cn") == -1)){
		sakaiTabId = null;
		lastVisitTime = new Date().getTime();
		localStorage.setItem("lastVisitTime", lastVisitTime);
		checkNew();	
	}
	// Sakai opened
	else if (tab.url.indexOf("sakai.umji.sjtu.edu.cn") != -1){
		sakaiTabId = tabId;
		checkNew();
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
		localStorage.setItem("lastVisitTime", lastVisitTime);
		checkNew();
	}
});


function openSakai(){
	window.open('http://sakai.umji.sjtu.edu.cn/','_blank')
}

chrome.browserAction.onClicked.addListener(openSakai);

function checkNew()
{
	// Ask for usrname & pw
	if (localStorage.getItem("username") && localStorage.getItem("password")){
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
			console.log("tab_strings: " + tab_strings);

			var tab_str_matches = tab_strings.match(/<li.*?<\/a>/g);

			var outer_count = 0;
			var inner_count = 0;

			for (var key in tab_str_matches){
				// get tab url
				var tab_url_match = tab_str_matches[key].match(/http.*?(?=")/);
				console.log("tab_url_match: " + tab_url_match);
				if (null !== tab_url_match){
					var tab_url = tab_url_match[0];
					console.log("tab_url: " + tab_url);
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


									console.log(request.unread_num + request.unread_title[request.unread_num-1]);
								}
							}
							if (outer_count == 0 && inner_count == 0){
								unread = request;
								chrome.browserAction.setBadgeBackgroundColor({color: "#009AC7"});
								chrome.browserAction.setBadgeText({text: unread.unread_num.toString()});
							}
						});
					});
				}
			}
		});
	} else {
		window.open('option.html','_blank');
	}
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
