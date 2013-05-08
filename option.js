$( document ).ready(function() {
	// Read username & psw from local storage
	if (localStorage.getItem("username") && localStorage.getItem("password")){
		$("#username")[0].value = localStorage.getItem("username");
		$("#password")[0].value = localStorage.getItem("password");
	}
	
	$("#form").submit(function(e) {
		e.preventDefault();
		if(!$("#username")[0].value || !$("#password")[0].value){
			$("#warning")[0].innerHTML = "Please input Sakai username & password!"
			$("#success")[0].innerHTML = ""
		} else {
			// Test validity of username & psw
			var login_url = "http://sakai.umji.sjtu.edu.cn/portal/relogin";
			$.post(login_url, { eid: $("#username")[0].value, pw: $("#password")[0].value})
			.done(function(data) {
				if (data.indexOf('action="http://sakai.umji.sjtu.edu.cn/portal/relogin"') == -1){
					// Success, save it to local storage
					localStorage.setItem("username", $("#username")[0].value);
					localStorage.setItem("password", $("#password")[0].value);
					$("#warning")[0].innerHTML = ""
					$("#success")[0].innerHTML = "Success! You can close this page now."
					checkNew();
				} else{
					$("#warning")[0].innerHTML = "Login failed!"
					$("#success")[0].innerHTML = ""
				}
			});
		}
		

		
		// If not, ask again
	});
});
