var PARSE_APP_ID = "YNiKFOkpulbY1j19E2gcdSREgTKd0AiZZKtzJaeg";
var PARSE_JS_ID = "Ht7VpNFFhB6KKod4L8gvWlyzjwWt0PEPXjEHVD1H";


function UserList(objectId, adminUser, listName, sharedUsers, listImage, createdTime) {
    this.objectId = objectId;
    this.adminUser = adminUser;
    this.listName = listName;
    this.sharedUsers = sharedUsers;
    this.listImage = listImage;
    this.createdTime = createdTime;
}

var getUserLists = function (username,$scope) {
    Parse.initialize(PARSE_APP_ID, PARSE_JS_ID);
    var lists = Parse.Object.extend("Lists");
    var query = new Parse.Query(lists);

    query.containedIn("sharedUsers",[username]);
    console.log(username);
    query.descending("createdAt");
    query.find(
        {
            success: function (results) {
                var objectId;
                var adminUser;
                var listName;
                var sharedUsers;
                var listImage;
                var createdDate;
                for (var i = 0, len = results.length; i < len; i++) {
                    objectId = results[i].id;
                    adminUser = results[i].get("adminUser");
                    listName = results[i].get("listName");
                    sharedUsers = results[i].get("sharedUsers");
                    listImage = results[i].get("listImage");
                    createdDate = results[i].createdAt.toDateString();

                    console.log("ListId : " + objectId);
                    console.log("Admin User : " + adminUser);
                    console.log("List Name : " + listName);
                    console.log("Shared Users : " + sharedUsers);
                    console.log("Created Time : " + results[i].createdAt.toDateString());

                    if (userLists.hasOwnProperty(createdDate) === false)
                    {
                        userLists[createdDate] = {
                            createdDate: createdDate,
                            lists: []
                        };
                    }

                    var userList = new UserList(objectId, adminUser, listName, sharedUsers,listImage, createdDate);

                    userLists[createdDate].lists.push(userList);

                }
                $scope.$apply();
            },
            error: function (error) {
                console.log(error);
            }

        }
    );
};