
// Use Parse.Cloud.define to define as many cloud functions as you want.
// For example:
Parse.Cloud.define("hello", function(request, response) {
    var query = new Parse.Query(Parse.User);
    var listId = request.params.listId;
    var sharedFacebookFriends = request.params.sharedFacebookFriends;
    for (var index in sharedFacebookFriends)
    {
        var friendFacebookId = sharedFacebookFriends[index].facebookFriendId;

    }
    var notSharedFacebookFriends = request.params.notSharedFacebookFriends;
    //console.log(sharedFacebookFriends);
    response.success("OK");
    //response.success("sharedFacebookFriends :" + sharedFacebookFriends);
    //response.success("Hello world!");
});
