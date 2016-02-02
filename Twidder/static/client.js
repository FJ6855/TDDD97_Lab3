var displayView = function(viewId)
{
    var alertMessageView = document.getElementById("alertMessageView");

    document.getElementsByTagName("body")[0].innerHTML = alertMessageView.innerHTML;
   
    var view = document.getElementById(viewId);
    
    document.getElementsByTagName("body")[0].innerHTML += view.innerHTML;
}

var displayMessage = function(message, type)
{
    setTimeout(hideMessage, 3000);

    var alertMessage = document.getElementById("alertMessage");

    alertMessage.className = type;

    alertMessage.innerHTML = message;
}

var hideMessage = function()
{
    var alertMessage = document.getElementById("alertMessage");

    alertMessage.className = "";

    alertMessage.innerHTML = "";
}

var signOut = function()
{
    serverstub.signOut(localStorage.getItem("userToken"));

    localStorage.removeItem("userToken");

    location.reload();
}

var loginSubmit = function()
{
    var loginEmail = document.getElementById("loginEmail");
    var loginPassword = document.getElementById("loginPassword");

    var xhttp = new XMLHttpRequest();

    xhttp.open("POST", "sign_in", false);

    var dataString = "loginEmail=" + loginEmail.value + "&loginPassword=" + loginPassword.value;

    xhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");

    xhttp.send(dataString);

    var response = JSON.parse(xhttp.responseText);
   
    if (response.success)
    {
	localStorage.setItem("userToken", response.data);
    }
    else
    {
	loginEmail.setCustomValidity(response.message);
	loginEmail.checkValidity();

	return false;
    }
}

var signupSubmit = function()
{
    var signupPassword = document.getElementById("signupPassword");
    var repeatPassword = document.getElementById("repeatPassword");
    
    if (validatePasswordLength(signupPassword) && validatePasswordMatch(signupPassword, repeatPassword))
    {
	var xhttp = new XMLHttpRequest();

	xhttp.open("POST", "sign_up", false);

	var dataString = "signupEmail=" + document.getElementById("signupEmail").value +
	    "&signupPassword=" + signupPassword.value +
	    "&repeatPassword=" + repeatPassword.value +
	    "&firstName=" + document.getElementById("firstName").value +
	    "&lastName=" + document.getElementById("lastName").value +
	    "&gender=" + document.getElementById("gender").value +
	    "&city=" + document.getElementById("city").value + 
	    "&country=" + document.getElementById("country").value;

	xhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");

	xhttp.send(dataString);

	var response = JSON.parse(xhttp.responseText);

	if (response.success)
	{
	    displayMessage(response.message, "infoMessage");
	    
	    document.getElementById("signupForm").reset();
	}
	else
	{ 
	    var signupEmail = document.getElementById("signupEmail");
	    
	    signupEmail.setCustomValidity(response.message);
	}
    }

    return false;
}

var changePasswordSubmit = function()
{
    var oldPassword = document.getElementById("oldPassword");
    var newPassword = document.getElementById("newPassword");
    var repeatNewPassword = document.getElementById("repeatNewPassword");

    if (validatePasswordLength(oldPassword) && validatePasswordLength(newPassword) && validatePasswordMatch(repeatNewPassword, newPassword))
    {
	var xhttp = new XMLHttpRequest();
	
	xhttp.open("POST", "change_password/" + localStorage.getItem("userToken"), false);
	
	var dataString = "token=" + localStorage.getItem("userToken") +
	    "&oldPassword=" + oldPassword.value + 
	    "&newPassword=" + newPassword.value + 
	    "&repeatNewPassword=" + repeatNewPassword.value;
	
	xhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
	
	xhttp.send(dataString);

	var response = JSON.parse(xhttp.responseText);

	if (response.success)
	{
	    displayMessage(response.message, "infoMessage");

	    document.getElementById("changePasswordForm").reset();
	}
	else
	{
	    oldPassword.setCustomValidity(response.message);
	}
    }
	    
    return false;
}

var homePostMessageSubmit = function()
{
    var message = document.getElementById("homeMessage");

    postMessage(message.value, getEmail());

    loadMessages(getEmail(), "homeMessages");

    return false;
}

var searchProfileSubmit = function()
{
    var profileEmail = document.getElementById("profileEmail");
    
    var profileInformation = loadProfileInformation(profileEmail.value);

    if (profileInformation != undefined)
    {
	appendSearchProfileInformation(profileInformation);

	loadMessages(profileEmail.value, "browseMessages");

	localStorage.setItem("currentBrowseEmail", profileEmail.value);
    }

    return false;
}

var browsePostMessageSubmit = function()
{
    var message = document.getElementById("browseMessage");
    
    postMessage(message.value, localStorage.getItem("currentBrowseEmail"));

    loadMessages(localStorage.getItem("currentBrowseEmail"), "browseMessages");

    return false;
}
    
var postMessage = function(message, email)
{	
    var xhttp = new XMLHttpRequest();

    xhttp.open("POST", "post_message/" + localStorage.getItem("userToken") + "/" + email, false);

    xhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
    
    var dataString = "message=" + message;

    xhttp.send(dataString);

    console.log(xhttp.responseText);
    
    //var response = JSON.parse(xhttp.responseText);

    //displayMessage(response.message, "infoMessage");
}

var validatePasswordLength = function(passwordElement)
{
    if (passwordElement.value.length < 6)
    {
	passwordElement.setCustomValidity("Password must be at least 6 characters long");

	return false;
    }
    else
    {
	passwordElement.setCustomValidity("");

	return true;
    }
}

var validatePasswordMatch = function(repeatPasswordElement, passwordElement)
{
    if (passwordElement.value != repeatPasswordElement.value)
    {
	repeatPasswordElement.setCustomValidity("Password doesn't match");

	return false;
    }
    else
    {
	repeatPasswordElement.setCustomValidity("");

	return true;
    }
}

var menuItemClick = function(menuItem)
{
    var selectedMenuItem = document.getElementsByClassName("selected");

    selectedMenuItem[0].classList.remove("selected");

    menuItem.classList.add("selected");

    var selectedContent = document.getElementsByClassName("selectedContent");

    selectedContent[0].classList.remove("selectedContent");

    var view;

    if (menuItem.getAttribute("id") == "homeButton")
    {
	view = document.getElementById("homeView");
    }
    else if (menuItem.getAttribute("id") == "browseButton")
    {
	view = document.getElementById("browseView");	    
    }
    else if (menuItem.getAttribute("id") == "accountButton")
    {
	view = document.getElementById("accountView"); 
    }
    
    view.classList.add("selectedContent");
}

var loadProfileInformation = function(email)
{
    var xhttp = new XMLHttpRequest();

    xhttp.open("GET", "get_user_data/" + localStorage.getItem("userToken") + "/" + email, false);

    xhttp.send();

    var response = JSON.parse(xhttp.responseText);

    if (response.success)
    {
	var profileInformation = {
	    name: response.data.firstName + " " + response.data.lastName,
	    email: response.data.email,
	    gender: response.data.gender,
	    city: response.data.city,
	    country: response.data.country,
	};

	return profileInformation;
    }
    else
    {
	displayMessage(response.message, "errorMessage");
    }
}

var appendProfileInformation = function(profileInformation)
{    
    document.getElementById("profileInfoName").innerHTML = "<span>Name:</span> " + profileInformation.name;
    document.getElementById("profileInfoEmail").innerHTML = "<span>Email:</span> " + profileInformation.email;
    document.getElementById("profileInfoGender").innerHTML = "<span>Gender:</span> " + profileInformation.gender;
    document.getElementById("profileInfoCity").innerHTML = "<span>City:</span> " + profileInformation.city;
    document.getElementById("profileInfoCountry").innerHTML = "<span>Country:</span> " + profileInformation.country;
}

var appendSearchProfileInformation = function(profileInformation)
{    
    document.getElementById("browseProfileInfoName").innerHTML = "<span>Name:</span> " + profileInformation.name;
    document.getElementById("browseProfileInfoEmail").innerHTML = "<span>Email:</span> " + profileInformation.email;
    document.getElementById("browseProfileInfoGender").innerHTML = "<span>Gender:</span> " + profileInformation.gender;
    document.getElementById("browseProfileInfoCity").innerHTML = "<span>City:</span> " + profileInformation.city;
    document.getElementById("browseProfileInfoCountry").innerHTML = "<span>Country:</span> " + profileInformation.country;
}

var loadMessages = function(email, elementId)
{
    var xhttp = new XMLHttpRequest();

    xhttp.open("GET", "get_user_messages/" + localStorage.getItem("userToken") + "/" + email, false);

    xhttp.send();
    
    var response = JSON.parse(xhttp.responseText);

    if (response.success)
    {
	document.getElementById(elementId).innerHTML = "";

	for (var i = 0; i < response.data.length; ++i)
	{
	    createMessage(response.data[i].writer, response.data[i].message, response.data[i].datePosted, elementId);
	}
    }
    else
    {
	displayMessage(response.message, "errorMessage");
    }
}

var createMessage = function(writer, message, datePosted, elementId)
{
    var container = document.createElement("DIV");

    container.classList.add("messageContainer");

    var header = document.createElement("H2");

    var writerTextNode = document.createTextNode(writer + " : " + datePosted);
    
    header.appendChild(writerTextNode);

    container.appendChild(header);

    var messageNode = document.createElement("P");

    var messageTextNode = document.createTextNode(message);

    messageNode.appendChild(messageTextNode);

    container.appendChild(messageNode);

    document.getElementById(elementId).appendChild(container);
}

var getEmail = function()
{
    var xhttp = new XMLHttpRequest();

    xhttp.open("GET", "get_user_data/" + localStorage.getItem("userToken"), false);

    xhttp.send();
    
    var response = JSON.parse(xhttp.responseText);

    if (response.success)
    {
	return response.data.email;
    }
    else
    {
	displayMessage(response.message, "errorMessage");
    }
}

var clearCustomValidityOnInput = function(element)
{
    element.oninput = function()
    {
	element.setCustomValidity("");
    }
}

var validatePasswordLengthOnInput = function(element)
{
    element.oninput = function()
    {
	validatePasswordLength(element);
    }
}

var validatePasswordMatchOnInput = function(element, elementToMatch)
{
    element.oninput = function()
    {
	validatePasswordMatch(element, elementToMatch);
    }
}

var setupLoginForm = function()
{    
    document.getElementById("loginForm").onsubmit = loginSubmit;
    
    clearCustomValidityOnInput(document.getElementById("loginEmail"));
}

var setupSignUpForm = function()
{   
    document.getElementById("signupForm").onsubmit = signupSubmit;

    validatePasswordLengthOnInput(document.getElementById("signupPassword"));

    validatePasswordMatchOnInput(document.getElementById("repeatPassword"), document.getElementById("signupPassword"));
    
    clearCustomValidityOnInput(document.getElementById("signupEmail"));
}

var setupMenuItems = function()
{
    var menuItems = document.getElementsByClassName("menuItem");

    for (var i = 0; i < menuItems.length; ++i)
    {
	menuItems[i].onclick = function()
	{
	    menuItemClick(this);
	}
    }
}

var setupChangePasswordForm = function()
{
    document.getElementById("changePasswordForm").onsubmit = changePasswordSubmit;

    validatePasswordLengthOnInput(document.getElementById("oldPassword"));

    validatePasswordLengthOnInput(document.getElementById("newPassword"));
	
    validatePasswordMatchOnInput(document.getElementById("repeatNewPassword"), document.getElementById("newPassword"));
}

var loadProfile = function(email, wallId)
{
    appendProfileInformation(loadProfileInformation(email));

    loadMessages(email, wallId);
}

var setupRefreshButton = function(element, email, wallId)
{
    element.onclick = function()
    {	
	loadMessages(email, wallId);
    }
}

window.onload = function()
{
    if (localStorage.getItem("userToken") === null)
    {	
	displayView("welcomeView");

	setupLoginForm();

	setupSignUpForm();
    }
    else
    {
	displayView("profileView");

	loadProfile(getEmail(), "homeMessages");

	setupMenuItems();

	setupChangePasswordForm();

	document.getElementById("homePostMessageForm").onsubmit = homePostMessageSubmit;

	setupRefreshButton(document.getElementById("homeRefreshButton"), getEmail(), "homeMessages");
	setupRefreshButton(document.getElementById("browseRefreshButton"), localStorage.getItem("currentBrowseEmail"), "browseMessages");

	document.getElementById("searchProfileForm").onsubmit = searchProfileSubmit;

	document.getElementById("browsePostMessageForm").onsubmit = browsePostMessageSubmit;

	document.getElementById("signOut").onclick = signOut;
    }
}
