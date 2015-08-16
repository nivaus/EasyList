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
            unSubscribePushChannels();
            console.log("User logged Out From Facebook.");
            Parse.User.logOut();
            console.log("User logged Out From Parse.");
            clearSavedLocalStorage();
            console.log("Local Storage Cleaned.");

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

function unSubscribePushChannels ()
{
    ParsePushPlugin.getSubscriptions(function (success) {
        var channelsArray = success.replace(/\s/g, '');
        var channelsArray = channelsArray.substring(1, channelsArray.length -1).split(",");
        arrayUnsubscribe(channelsArray,0);
    },
    function (error)
    {
        console.log(error);
    });
}

function arrayUnsubscribe (array, index)
{
    ParsePushPlugin.unsubscribe(array[index], function(msg) {
        console.log(msg);
        if (index < array.length - 1)
        {
            index++;
            arrayUnsubscribe(array,index);
        }
        else
        {
            window.location = "logIn.html";
        }
    }, function(e) {
        console.log('error');
    });
}