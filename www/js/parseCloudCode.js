
// Use Parse.Cloud.define to define as many cloud functions as you want.
// For example:
Parse.Cloud.define("updateSharesSubscribeAndPushNotification", function(request, response) {
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


    for (var index in sharedFacebookFriends)
    {
        var foundAddedSharedFriend = false;
        friendFacebookId = sharedFacebookFriends[index].facebookFriendId;
        for (var originIndex in originalSharedFacebookFriends)
        {
            originFriendFacebookId = originalSharedFacebookFriends[originIndex].facebookFriendId;
            if (friendFacebookId === originFriendFacebookId)
            {
                foundAddedSharedFriend = true;
            }
        }
        if (foundAddedSharedFriend === false)
        {
            addedSharedFacebookFriendsIds.push(friendFacebookId);
        }
    }

    // Find the removed friends
    for (var index in notSharedFacebookFriends)
    {
        var foundRemovedSharedFriend = false;
        friendFacebookId = notSharedFacebookFriends[index].facebookFriendId;
        for (var originIndex in originalNotSharedFacebookFriends)
        {
            originFriendFacebookId = originalNotSharedFacebookFriends[originIndex].facebookFriendId;
            if (friendFacebookId === originFriendFacebookId)
            {
                foundRemovedSharedFriend = true;
            }
        }
        if (foundRemovedSharedFriend === false)
        {
            removedSharedFacebookFriends.push(friendFacebookId);
        }
    }
    response.success("OK");
});
