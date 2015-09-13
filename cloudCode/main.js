var _ = require('underscore');
var CHANNEL_PREFIX = "ch";

//======================================================================================================================
// IDAN - updateSharesSubscribeAndSendPushNotification
//======================================================================================================================

Parse.Cloud.define("updateSharesSubscribeAndSendPushNotification", function (request, response) {
    var listId = request.params.listId;
    var listName = request.params.listName;
    var sharedFacebookFriends = request.params.sharedFacebookFriends;
    var originalSharedFacebookFriends = request.params.originalSharedFacebookFriends;
    var facebookFriendsMap = request.params.facebookFriendsMap;

    var addedSharedFacebookFriendsIds;
    var removedSharedFacebookFriends;
    var friendsUserNamesInParseToAdd;
    var friendsUserNamesInParseToRemove;
    console.log("=================================================================================================================================================");
    // Find the added friends
    addedSharedFacebookFriendsIds = createAddedSharedFriendsIdsArray(sharedFacebookFriends, originalSharedFacebookFriends);

    // Find the removed friends
    removedSharedFacebookFriends = createRemovedSharedFriendsIdsArray(sharedFacebookFriends, originalSharedFacebookFriends);

    // Update shared friends in the current list
    friendsUserNamesInParseToAdd = createArrayOfParseUserNames(addedSharedFacebookFriendsIds, facebookFriendsMap);
    friendsUserNamesInParseToRemove = createArrayOfParseUserNames(removedSharedFacebookFriends, facebookFriendsMap);
    saveSharedFriendsChangesInParse(listId, friendsUserNamesInParseToAdd, friendsUserNamesInParseToRemove).then(function (success) {
        return addUsersToChannelListId(friendsUserNamesInParseToAdd, CHANNEL_PREFIX + listId);
    }).then(function (success) {
        return removeUsersFromChannelListId(friendsUserNamesInParseToRemove, CHANNEL_PREFIX + listId);
    }).then(function (success) {
        return sendSilentNotificationsToRemovedFriends(friendsUserNamesInParseToRemove, listName, listId);
    })
        .then(function (success) {
            sendPushNotificationToSharedFriendsInList(friendsUserNamesInParseToAdd, listName);
            response.success("OK");
        }, function (error) {
            response.error("Error");
        });

});

function createAddedSharedFriendsIdsArray(sharedFacebookFriends, originalSharedFacebookFriends) {
    var originFriendFacebookId;
    var friendFacebookId;
    var addedSharedFacebookFriendsIds = [];
    for (var index in sharedFacebookFriends) {
        var foundAddedSharedFriend = true;
        friendFacebookId = sharedFacebookFriends[index].facebookFriendId;
        for (var originIndex in originalSharedFacebookFriends) {
            originFriendFacebookId = originalSharedFacebookFriends[originIndex].facebookFriendId;
            if (friendFacebookId === originFriendFacebookId) {
                foundAddedSharedFriend = false;
            }
        }
        if (foundAddedSharedFriend === true) {
            addedSharedFacebookFriendsIds.push(friendFacebookId);
        }
    }
    return addedSharedFacebookFriendsIds;
}

function createRemovedSharedFriendsIdsArray(sharedFacebookFriends, originalSharedFacebookFriends) {
    var originFriendFacebookId;
    var friendFacebookId;
    var removedSharedFacebookFriends = [];
    for (var originIndex in originalSharedFacebookFriends) {
        var foundRemovedSharedFriend = true;
        originFriendFacebookId = originalSharedFacebookFriends[originIndex].facebookFriendId;
        for (var index in sharedFacebookFriends) {
            friendFacebookId = sharedFacebookFriends[index].facebookFriendId;
            if (friendFacebookId === originFriendFacebookId) {
                foundRemovedSharedFriend = false;
            }
        }
        if (foundRemovedSharedFriend === true) {
            removedSharedFacebookFriends.push(originFriendFacebookId);
        }
    }
    return removedSharedFacebookFriends;
}

function createArrayOfParseUserNames(sharedFacebookFriendsIds, facebookFriendsMap) {
    var friendsUserNamesInParse = [];
    for (var index in sharedFacebookFriendsIds) {
        var facebookId = sharedFacebookFriendsIds[index];
        var parseUserName = facebookFriendsMap[facebookId].userName;
        friendsUserNamesInParse.push(parseUserName);
    }
    return friendsUserNamesInParse;
}


function saveSharedFriendsChangesInParse(listId, friendsUserNamesInParseToAdd, friendsUserNamesInParseToRemove, response) {
    var Lists = Parse.Object.extend("Lists");
    var parseUserList = new Parse.Query(Lists);
    var parseUserName;
    var promise = new Parse.Promise();
    parseUserList.equalTo("objectId", listId);
    return parseUserList.find().then(function (results) {
        for (var index in friendsUserNamesInParseToAdd) {
            parseUserName = friendsUserNamesInParseToAdd[index];
            results[0].addUnique("sharedUsers", parseUserName);
            console.log("Username " + parseUserName + " is now shared in listId " + listId);
        }
        return results[0].save();
    }).then(function (result) {
        for (var index in friendsUserNamesInParseToRemove) {
            parseUserName = friendsUserNamesInParseToRemove[index];
            result.remove("sharedUsers", parseUserName);
            console.log("Username " + parseUserName + " is now un-shared in listId " + listId);
        }
        return result.save();
    });
}

//======================================================================================================================
//NIV - subscribeLoggedInUser
//======================================================================================================================

Parse.Cloud.define("subscribeLoggedInUser", function (request, response) {

    console.log("==========================================================================================");
    Parse.Cloud.useMasterKey();
    var query = new Parse.Query(Parse.Installation);
    var installationObjectId = request.params.installationObjectId;
    var username = Parse.User.current().attributes.username;
    console.log("OBjectID = " + installationObjectId);
    query.get(installationObjectId, {
        success: function (installation) {
            // object is an instance of Parse.Object.
            installation.set("username", username);
            installation.save().then(function (success) {
                addChannelsToInstallations(username, [CHANNEL_PREFIX + username]).then(function (success) {
                    response.success("OK");
                });
            });
        },

        error: function (object, e) {
            // error is an iof Parse.Error.
            console.log(object);
            console.log(error);
            response.error("Error");
        }
    });
});

//======================================================================================================================
//NIV - subscribeToAllSharedLists
//======================================================================================================================

Parse.Cloud.define("subscribeToAllSharedLists", function (request, response) {
    var userListsIds = request.params.userListsIds;
    var username = Parse.User.current().attributes.username;
    addChannelsToInstallations(username, userListsIds).then(
        function (success) {
            response.success("Successfully Subscribed To Shared Lists");
        },
        function (error) {
            response.error("Error On Subscribe to Shared Lists");
        }
    );

});

//======================================================================================================================
//NIV - clearUserInstallationOnLogout
//======================================================================================================================

Parse.Cloud.define("clearUserInstallationOnLogout", function (request, response) {
    var username = Parse.User.current().attributes.username;
    var installationObjectId = request.params.installationObjectId;
    clearUserChannelsFromInstallation(installationObjectId).then(function (success) {
        clearUsernameFromInstallation(installationObjectId).then(function (success) {
                response.success("Successfully Cleared Installation For User");
            },
            function (error) {
                response.error("Error Clearing Installation For User");
            });
    });

});
//======================================================================================================================
//NIV - subscribeUserToNewCreatedList
//======================================================================================================================

Parse.Cloud.define("subscribeUserToNewCreatedList", function (request, response) {
    var username = Parse.User.current().attributes.username;
    var listId = request.params.listId;
    var channelsArray = [CHANNEL_PREFIX + listId];
    addChannelsToInstallations(username, channelsArray).then(
        function (success) {
            response.success("Successfully subscribed " + username + " to listId: " + listId);
        },
        function (error) {
            response.error("Error subscribe " + username + " to listId: " + listId);
        });
});
//======================================================================================================================
//NIV - unshareCurrentUserFromListId
//======================================================================================================================
Parse.Cloud.define("unshareCurrentUserFromListId", function (request, response) {
    var username = Parse.User.current().attributes.username;
    var listId = request.params.listId;
    var listName = request.params.listName;
    Parse.Cloud.useMasterKey();
    var Lists = Parse.Object.extend("Lists");
    var query = new Parse.Query(Lists);
    query.get(listId, function (result) {
            var sharedUsers = result.get("sharedUsers");
            sharedUsers = _.difference(sharedUsers, [username]);
            result.set("sharedUsers", sharedUsers);
            result.save().then(function (success) {
                removeUsersFromChannelListId([username], CHANNEL_PREFIX + listId).then(
                    function (success) {
                        return sendFriendLeavedNotification(CHANNEL_PREFIX + listId, listName);
                    }).then(
                    function(success){
                        response.success("Successfully unshared friend");
                    },
                    function (error) {
                        response.error(error);
                    });
            });
        },
        function (error) {
            response.error(error);
        });

});
//======================================================================================================================
//NIV - removeCurrentUserFromListId
//======================================================================================================================

Parse.Cloud.define("removeCurrentUserFromListId", function (request, response) {
    var username = Parse.User.current().attributes.username;
    var listId = request.params.listId;
    removeUsersFromChannelListId([username], CHANNEL_PREFIX + listId).then(
        function (success) {
            response.success(success);
        },
        function (error) {
            response.error(error);
        }
    );
});
//======================================================================================================================
//NIV - removeListIdsChannel
//======================================================================================================================

Parse.Cloud.define("removeListsIdsChannel", function (request, response) {
    console.log("removeListsIdsChannel");
    var listsIds = request.params.listsIds;
    var listsNames = request.params.listsNames;


    removeChannelsFromAllUsers(listsIds, listsNames).then(
        function (success) {
            console.log("Channels removed from parse successfully")
            response.success("Channels removed from parse successfully.");
        },
        function (error) {
            console.log("ERROR!!!!");
            response.error(error);
        }
    )
});
//======================================================================================================================
//NIV - sendNotifyPushMessage
//======================================================================================================================
Parse.Cloud.define("sendNotifyPushMessage", function (request, response) {
    var username = Parse.User.current().attributes.username;
    var fullName = Parse.User.current().attributes.fullName;
    var listId = request.params.listId;
    var message = request.params.message;
    var listIdQuery = new Parse.Query(Parse.Installation);
    var pushQuery = new Parse.Query(Parse.Installation);
    var userPushChannel = CHANNEL_PREFIX + username;
    var listPushChannel = CHANNEL_PREFIX + listId;

    listIdQuery.equalTo('channels', listPushChannel);
    pushQuery.notEqualTo('channels', userPushChannel);
    pushQuery.matchesKeyInQuery("channels", "channels", listIdQuery);
    Parse.Push.send({
        where: pushQuery, // Set our Installation query
        data: {
            alert: fullName + ": " + message
        }
    });
    response.success("OK");
});

//======================================================================================================================
//Global Functions
//======================================================================================================================

//======================================================================================================================
//Subscribe
//======================================================================================================================
function addChannelsToInstallations(username, channelsArray) {
    console.log("addChannelsToInstallations");
    Parse.Cloud.useMasterKey();

    var query = new Parse.Query(Parse.Installation);
    query.equalTo("username", username);

    return query.find().then(function (results) {
        // results is an array of Parse.Object.
        console.log(results);
        var newChannels;
        for (var index in results) {
            newChannels = results[index].get("channels");
            console.log("new Channels: " + newChannels);
            console.log("channels array: " + channelsArray);
            newChannels = newChannels.concat(channelsArray);

            newChannels = _.uniq(newChannels);
            results[index].set("channels", newChannels);
        }
        return Parse.Object.saveAll(results);
    });
}


function addUsersToChannelListId(usernames, channelListId) {
    console.log("addUsersToChannelListId");
    Parse.Cloud.useMasterKey();
    var query = new Parse.Query(Parse.Installation);
    query.containedIn("username", usernames);
    console.log(usernames);
    return query.find().then(function (results) {
        // results is an array of Parse.Object.
        var newChannels;
        for (var index in results) {
            newChannels = results[index].get("channels");
            console.log(channelListId);
            newChannels.push(channelListId);
            newChannels = _.uniq(newChannels);
            console.log(newChannels);
            results[index].set("channels", newChannels);
        }
        return Parse.Object.saveAll(results);
    });
}

//======================================================================================================================
//Un-Subscribe
//======================================================================================================================
function removeUsersFromChannelListId(usernames, channelListId) {
    console.log("removeUsersFromChannelListId");
    Parse.Cloud.useMasterKey();
    var query = new Parse.Query(Parse.Installation);
    query.containedIn("username", usernames);
    console.log(usernames);
    return query.find().then(function (results) {
        // results is an array of Parse.Object.
        var newChannels;
        for (var index in results) {
            newChannels = results[index].get("channels");
            newChannels = _.difference(newChannels, [channelListId]);
            results[index].set("channels", newChannels);
        }
        return Parse.Object.saveAll(results);
    });


}

function clearUserChannelsFromInstallation(installationObjectId) {
    console.log("clearUserChannelsFromInstallation");
    Parse.Cloud.useMasterKey();

    var query = new Parse.Query(Parse.Installation);
    query.equalTo("objectId", installationObjectId);

    return query.find().then(function (results) {
        // results is an array of Parse.Object.
        console.log(results);
        for (var index in results) {
            results[index].set("channels", []);
        }
        return Parse.Object.saveAll(results);
    });
}

function clearUsernameFromInstallation(installationObjectId) {
    console.log("clearUsernameFromInstallation");
    Parse.Cloud.useMasterKey();
    var query = new Parse.Query(Parse.Installation);
    query.equalTo("objectId", installationObjectId);
    return query.find().then(function (results) {
        // results is an array of Parse.Object.
        console.log(results);
        var newChannels;
        for (var index in results) {
            results[index].set("username", "");
        }
        return Parse.Object.saveAll(results);
    });
}

function removeChannelsFromAllUsers(listsIds, listsNames) {
    console.log("removeChannelsFromAllUsers");
    Parse.Cloud.useMasterKey();
    var channelsToRemove = [];

    for (var id in listsIds) {
        channelsToRemove.push(CHANNEL_PREFIX + listsIds[id]);
    }

    var query = new Parse.Query(Parse.Installation);
    query.containedIn("channels", channelsToRemove);
    console.log(channelsToRemove);
    return query.find().then(function (results) {
        var channels;
        var objectIds = [];
        for (var index in results) {
            channels = results[index].get("channels");
            objectIds.push(results[index].id);
            channels = _.difference(channels, channelsToRemove);
            results[index].set("channels", channels);

        }

        return Parse.Object.saveAll(results).then(function () {
            sendSilentNotificationsToAllUsers(objectIds, listsNames, listsIds)
        });
    });
}

//======================================================================================================================
//Push
//======================================================================================================================
function sendPushNotificationToSharedFriendsInList(friendsArray, listName) {
    Parse.Cloud.useMasterKey();
    var username = Parse.User.current().attributes.username;
    var query = new Parse.Query(Parse.Installation);
    var fullName = Parse.User.current().attributes.fullName;

    query.containedIn("username", friendsArray);
    Parse.Push.send({
        where: query, // Set our Installation query
        data: {
            userLists: "List Shared",
            alert: fullName + " shared the list " + listName + " with you."
        }
    });
}

function sendSilentNotificationsToAllUsers(objectIds, listsNames, listsIds) {
    Parse.Cloud.useMasterKey();
    var query = new Parse.Query(Parse.Installation);
    var pushQuery = new Parse.Query(Parse.Installation);
    var fullName = Parse.User.current().attributes.fullName;
    var username = Parse.User.current().attributes.username;
    var message;

    if (listsNames.length === 1) {
        message = fullName + " deleted the list: " + listsNames[0];
    }
    else {
        message = fullName + " deleted the lists: ";
        for (var index in listsNames) {
            message = message + listsNames[index] + ", ";
        }
        message.slice(0, message.length - 2);
    }


    query.containedIn("objectId", objectIds);
    pushQuery.notEqualTo("username", username);
    pushQuery.matchesKeyInQuery("objectId", "objectId", query);
    return Parse.Push.send({
        where: pushQuery,
        data: {
            alert: message,
            userLists: "delete",
            listContent: "delete",
            listsIds: listsIds
        }
    });
}

function sendFriendLeavedNotification (listChannel, listName)
{
    Parse.Cloud.useMasterKey();
    var fullName = Parse.User.current().attributes.fullName;
    return Parse.Push.send({
        channels: [listChannel],
        data: {
            alert: fullName + "  as leved the list: " + listName,
            userLists: "update"
        }
    });
}

function sendSilentNotificationsToRemovedFriends(friendsUserNamesInParseToRemove, listName, listId) {
    Parse.Cloud.useMasterKey();
    var query = new Parse.Query(Parse.Installation);
    var fullName = Parse.User.current().attributes.fullName;
    var message = fullName + " unshared you from list: " + listName;

    query.containedIn("username", friendsUserNamesInParseToRemove);
    return Parse.Push.send({
        where: query,
        data: {
            alert: message,
            userLists: "unshare",
            listContent: "unshare",
            listId: listId
        }
    });
}