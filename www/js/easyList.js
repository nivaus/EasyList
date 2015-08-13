/**
 * Created by Idan on 13/08/2015.
 */
function showLoadingWidget (text) {
    $.mobile.loading('show', {
        text: text,
        textVisible: true,
        theme: 'a',
        html: ""
    });
}

function hideLoadingWidget () {
    $.mobile.loading('hide');
}

function logOut () {
    facebookConnectPlugin.logout(
        function (success) {
            console.log("User logged Out From Facebook.");
            Parse.User.logOut();
            console.log("User logged Out From Parse.");
            clearSavedLocalStorage();
            console.log("Local Storage Cleaned.");
            window.location = "logIn.html";
        },
        function (error) {
            console.log(error);
        }
    );
}

function clearSavedLocalStorage() {
    localStorage.removeItem("listId");
    localStorage.removeItem("userName");
    localStorage.removeItem("fullName");
    localStorage.removeItem("facebookId");
}

function exitApp ()
{
    navigator.app.exitApp();
}

document.addEventListener("deviceready", onDeviceReady, false);

function onDeviceReady() {
    document.addEventListener("backbutton", onBackKeyDown, false); //Listen to the User clicking on the back button
}

function onBackKeyDown(e) {
    e.preventDefault();
    navigator.notification.confirm("Are you sure you want to exit ?", onConfirm, "Confirmation", "Yes,No");
    // Prompt the user with the choice
}

function onConfirm(button) {
    if(button==2){//If User selected No, then we just do nothing
        return;
    }else{
        navigator.app.exitApp();// Otherwise we quit the app.
    }
}