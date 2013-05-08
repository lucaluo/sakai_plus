// auto login
var form = document.getElementById("loginForm")
if (form){
	form.eid.value="5113709074";
	form.pw.value="19930414";
	form.submit.click();
}

// get/set last visit time
if(sessionStorage.getItem("sessionLastTime")){
	var lastTime = sessionStorage.getItem("sessionLastTime");
	localStorage.setItem("lastTime", new Date().getTime());	
} else if(localStorage.getItem("lastTime")){
	var lastTime = localStorage.getItem("lastTime");
	sessionStorage.setItem("sessionLastTime", lastTime);
	localStorage.setItem("lastTime", new Date().getTime());
} else{
	var lastTime = new Date().getTime();
	localStorage.setItem("lastTime", lastTime);
	sessionStorage.setItem("sessionLastTime", lastTime);
}

// parse annoucement/resources time
$('iframe').load(function() 
{
	var table = document.getElementsByTagName("iframe")[0].contentWindow.document.getElementsByTagName("tbody")[0];
	if (table){
		var trs = table.getElementsByTagName("tr");
		var trsLength = trs.length; 
		for (var i = 0; i < trsLength; i++){
			var tds = trs[i].getElementsByTagName("td");
			var tdsLength = tds.length; 
			for (var j = 0; j < tdsLength; j++){
				if(tds[j].headers == "date"){
					var publishTimeStr = tds[j].innerText;
					var publishTime = new Date(publishTimeStr).getTime();
					if (publishTime >= lastTime){
						trs[i].style.backgroundColor = "#FFFF00";
					}
				}
			}

		}
	}
});
	
