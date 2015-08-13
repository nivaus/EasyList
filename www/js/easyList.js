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