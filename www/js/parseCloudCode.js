// Use Parse.Cloud.define to define as many cloud functions as you want.
// For example:
Parse.Cloud.define("updateSharesSubscribeAndSendPushNotification", function (request, response) {
    var query = new Parse.Query(Parse.User);
    var listId = request.params.listId;
    var sharedFacebookFriends = request.params.sharedFacebookFriends;
    var notSharedFacebookFriends = request.params.notSharedFacebookFriends;
    var originalSharedFacebookFriends = request.params.originalSharedFacebookFriends;
    var originalNotSharedFacebookFriends = request.params.originalNotSharedFacebookFriends;
    var facebookFriendsMap = request.params.facebookFriendsMap;

    var addedSharedFacebookFriendsIds = [];
    var removedSharedFacebookFriends = [];
    var friendsUserNamesInParse = [];
    console.log("=================================================================================================================================================");

    // Find the add friends
    var originFriendFacebookId;
    var friendFacebookId;


    for (var index in sharedFacebookFriends) {
        var foundAddedSharedFriend = false;
        friendFacebookId = sharedFacebookFriends[index].facebookFriendId;
        for (var originIndex in originalSharedFacebookFriends) {
            originFriendFacebookId = originalSharedFacebookFriends[originIndex].facebookFriendId;
            if (friendFacebookId === originFriendFacebookId) {
                foundAddedSharedFriend = true;
            }
        }
        if (foundAddedSharedFriend === false) {
            addedSharedFacebookFriendsIds.push(friendFacebookId);
        }
    }

    // Find the removed friends
    for (var index in notSharedFacebookFriends) {
        var foundRemovedSharedFriend = false;
        friendFacebookId = notSharedFacebookFriends[index].facebookFriendId;
        for (var originIndex in originalNotSharedFacebookFriends) {
            originFriendFacebookId = originalNotSharedFacebookFriends[originIndex].facebookFriendId;
            if (friendFacebookId === originFriendFacebookId) {
                foundRemovedSharedFriend = true;
            }
        }
        if (foundRemovedSharedFriend === false) {
            removedSharedFacebookFriends.push(friendFacebookId);
        }
    }

    // Update shared friends in the current list
    friendsUserNamesInParse = [];
    for (var index in addedSharedFacebookFriendsIds) {
        var facebookId = addedSharedFacebookFriendsIds[index];
        var parseUserName = facebookFriendsMap[facebookId].userName;
        friendsUserNamesInParse.push(parseUserName);
    }
    addSharedFriendsToListInParse(listId, friendsUserNamesInParse, response);
    //// Update the list with the removed shared users
    //friendsUserNamesInParse = [];
    //for (var index in removedSharedFacebookFriends) {
    //    var facebookId = removedSharedFacebookFriends[index].facebookFriendId;
    //    var parseUserName = facebookFriendsMap[facebookId].userName;
    //    friendsUserNamesInParse.push(parseUserName);
    //}
    //removeSharedFriendsToListInParse(listId, friendsUserNamesInParse);


});

function addSharedFriendsToListInParse(listId, friendsUserNamesInParse, response) {
    var Lists = Parse.Object.extend("Lists");
    var parseUserList = new Parse.Query(Lists);
    var parseUserName;
    parseUserList.equalTo("objectId", listId);
    parseUserList.first(
        {
            success: function (result) {
                for (var index in friendsUserNamesInParse) {

                    parseUserName = friendsUserNamesInParse[index];
                    result.addUnique("sharedUsers", parseUserName);
                    console.log("Username " + parseUserName + " are now shared in listId " + listId);
                }
                result.save(function (success) {
                        response.success("OK");
                    },
                    function (error) {
                        response.error("ERROR");
                    }
                )
            },
            error: function (error) {
                console.log(error);
            }
        }
    );

    //parseUserList.add("sharedUsers", friendsUserNamesInParse);
    //parseUserList.save(null, {
    //    success: function (result) {
    //        console.log("Usernames " + JSON.stringify(friendsUserNamesInParse) + " are now shared in listId " + listId);
    //        sendPushMessageToFriendWhenSharedToList(friendUsernameInParse);
    //},
    //error: function (error) {
    //    console.log(error.message);
    //}
    //});
}

function removeSharedFriendsToListInParse(listId, friendsUserNamesInParse) {
    var Lists = Parse.Object.extend("Lists");
    var parseUserList = new Lists();
    parseUserList.id = listId;
    parseUserList.remove("sharedUsers", friendsUserNamesInParse);
    parseUserList.save(null, {
        success: function (result) {
            console.log("Usernames " + JSON.stringify(friendsUserNamesInParse) + " are now un-shared in listId " + listId);
            //sendPushMessageToFriendWhenSharedToList(friendUsernameInParse);
        },
        error: function (error) {
            console.log(error.message);
        }
    });
}