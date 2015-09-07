/**
 * Created by Idan on 13/08/2015.
 */
function showLoadingWidget(text) {
    $.mobile.loading('show', {
        text: text,
        textVisible: true,
        theme: 'a',
        html: ""
    });
}

function hideLoadingWidget() {
    $.mobile.loading('hide');
}

function logOut() {
    var installationObjectId = localStorage.getItem("installationObjectId");
    facebookConnectPlugin.logout(function (success) {
            console.log("User logged out from facebook.");
        },
        function (error) {
            console.log("error logging out of facebook");
        });

    Parse.Cloud.run('clearUserInstallationOnLogout', {installationObjectId: installationObjectId}, function (success) {
        console.log("User unsubscribed from installations.");
        Parse.User.logOut().then(function (success) {
                localStorage.clear();
                console.log("Local Storage Cleaned.");
                window.location = "logIn.html";
            },
            function (error) {
                console.log("error logging out of parse " + error);
            });
    });
}

function clearSavedLocalStorageOfList() {
    localStorage.removeItem("listId");
    localStorage.removeItem("listName");
    localStorage.removeItem("listAdminUserName");
    localStorage.removeItem("sharedFacebookFriends");
    localStorage.removeItem("notSharedFacebookFriends");
    localStorage.removeItem("listContent");
    localStorage.removeItem("invertedList");
}

function exitApp() {
    navigator.app.exitApp();
}

