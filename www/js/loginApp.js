/**
 * Created by Idan on 07/08/2015.
 */
var PARSE_CLIENT_KEY="wV1lOSJJWBlvQhvQYISlKyGlFiolEaXMsbOaMD7I";
var PARSE_JS_KEY = "Ht7VpNFFhB6KKod4L8gvWlyzjwWt0PEPXjEHVD1H";
var PARSE_APP_ID="YNiKFOkpulbY1j19E2gcdSREgTKd0AiZZKtzJaeg";

$.mobile.buttonMarkup.hoverDelay = 0;

var loginApp = angular.module('loginApp', []);

function facebookLogin ()
{
    facebookConnectPlugin.login(["user_about_me", "email", "user_friends"],
        function (result) {
            var expirationDate = new Date();
            expirationDate.setSeconds(result.authResponse["expiresIn"]);
            var facebookAuthData = {
                "id": result.authResponse["userID"],
                "access_token": result.authResponse["accessToken"],
                "expiration_date": expirationDate
            };
            loginToParse(facebookAuthData, function(){window.location = "userLists.html";});
        },
        function () {
            alert("Error login with facebook.");
        }
    );
}

function loginToParse (facebookAuthData, callback)
{
    console.log("loginToParse");
    Parse.initialize(PARSE_APP_ID, PARSE_JS_KEY);
    Parse.FacebookUtils.logIn(facebookAuthData, {
        success: function (user) {
            setUserDetailsInParse(user, callback);
            localStorage.setItem("username",user.attributes.username);
            console.log("Function loginToParse : User is logged into Parse");
        },

        error: function (error1, error2) {
            console.log("Unable to create/login to as Facebook user");
            console.log("  ERROR1 = " + JSON.stringify(error1));
            console.log("  ERROR2 = " + JSON.stringify(error2));
        }
    });
}

function setUserDetailsInParse (parseUser, callback)
{
    facebookConnectPlugin.api("me?fields=id,name,email", [],
        function (resultSuccess) {
            var fullName = resultSuccess.name;
            var email = resultSuccess.email;
            // Get Profile Picture
            facebookConnectPlugin.api("/me/picture?redirect=0&type=large", [],
                function (resultSuccess){
                    var profilePicture = resultSuccess.data.url;
                    console.log(fullName);
                    console.log(email);
                    console.log(profilePicture);
                    parseUser.set("fullName", fullName);
                    parseUser.set("email", email);
                    parseUser.set("profilePicture", profilePicture);
                    parseUser.save().then(function()
                    {
                        registerDeviceInParse(callback);
                    });
                    console.log("Function setUserDetailsInParse: " + parseUser);
                }
            );

        },
        function (resultError) {
            console.log(resultError);
        });
}

function registerDeviceInParse (callback)
{
    ParsePushPlugin.register({
            appId: PARSE_APP_ID, clientKey: PARSE_CLIENT_KEY, eventKey: "myEventKey"
        }, //will trigger receivePN[pnObj.myEventKey]
        function () {
            console.log('successfully registered device!');
            callback();
            //subscribeUsernameToParse(callback);
        }, function (e) {
            console.log('error registering device: ' + e);
        });
}

//function subscribeUsernameToParse (callback)
{
//    var username = Parse.User.current().attributes.username;
//    ParsePushPlugin.subscribe(username, function (success) {
//            console.log(success);
//            callback();
//        },
//        function (fail) {
//            console.log(fail);
//        });
}

//loginApp.controller('loginAppController', function ($scope) {
//        $scope.facebookLogin = function() {
//
//        };
//
//        var loginToParse = function (facebookAuthData, callback) {
//
//        };
//
//        var setUserDetailsInParse = function (FBuser, callback) {
//
//        };
//
//        var registerDeviceInParse = function (callback) {
//
//
//            //ParsePushPlugin.on('receivePN', function(pn){
//            //    alert('yo i got this push notification:' + JSON.stringify(pn));
//            //});
//        };
//
//        var subscribeUsernameToParse = function (callback) {
//
//        };
//    }
//);