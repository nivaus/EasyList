// Use Parse.Cloud.define to define as many cloud functions as you want.
// For example:
Parse.Cloud.define("updateSharesSubscribeAndPushNotification", function (request, response) {
    var query = new Parse.Query(Parse.User);
    var listId = request.params.listId;
    var sharedFacebookFriends = request.params.sharedFacebookFriends;
    var notSharedFacebookFriends = request.params.notSharedFacebookFriends;
    var originalSharedFacebookFriends = request.params.originalSharedFacebookFriends;
    var originalNotSharedFacebookFriends = request.params.originalNotSharedFacebookFriends;
    var facebookFriendsMap = request.params.facebookFriendsMap;

    var addedSharedFacebookFriendsIds = [];
    var removedSharedFacebookFriends = [];
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

    // Update the list with the new shared users
    for (var index in addedSharedFacebookFriendsIds) {
        var facebookId = addedSharedFacebookFriendsIds[index].facebookFriendId;
        var parseUserName = facebookFriendsMap[facebookId].userName;
        addSharedFriendToListInParse(listId, parseUserName);
    }

    // Update the list with the removed shared users
    for (var index in removedSharedFacebookFriends) {
        var facebookId = removedSharedFacebookFriends[index].facebookFriendId;
        var parseUserName = facebookFriendsMap[facebookId].userName;
        addSharedFriendToListInParse(listId, parseUserName);
    }
    response.success("OK");
});

function addSharedFriendToListInParse(listId, friendUsernameInParse) {
    var Lists = Parse.Object.extend("Lists");
    var parseUserList = new Lists();
    parseUserList.id = listId;
    parseUserList.add("sharedUsers", friendUsernameInParse);
    parseUserList.save(null, {
        success: function (result) {
            console.log("Username " + friendUsernameInParse + " is now shared in listId " + listId);
            //sendPushMessageToFriendWhenSharedToList(friendUsernameInParse);
        },
        error: function (error) {
            console.log(error.message);
        }
    });
}

function removeSharedFriendToListInParse(listId, friendUsernameInParse) {
    var Lists = Parse.Object.extend("Lists");
    var parseUserList = new Lists();
    parseUserList.id = listId;
    parseUserList.add("sharedUsers", friendUsernameInParse);
    parseUserList.save(null, {
        success: function (result) {
            console.log("Username " + friendUsernameInParse + " is now shared in listId " + listId);
            //sendPushMessageToFriendWhenSharedToList(friendUsernameInParse);
        },
        error: function (error) {
            console.log(error.message);
        }
    });
}