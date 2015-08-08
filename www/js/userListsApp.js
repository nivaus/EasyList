$.mobile.buttonMarkup.hoverDelay = 0;

//Constants
var PARSE_APP_ID = "YNiKFOkpulbY1j19E2gcdSREgTKd0AiZZKtzJaeg";
var PARSE_JS_ID = "Ht7VpNFFhB6KKod4L8gvWlyzjwWt0PEPXjEHVD1H";

//Initializing Parse
Parse.initialize(PARSE_APP_ID, PARSE_JS_ID);

//Class UserList
function UserList(listId, adminUser, listName, sharedUsers, listImage, createdTime) {
    this.listId = listId;
    this.adminUser = adminUser;
    this.listName = listName;
    this.sharedUsers = sharedUsers;
    this.listImage = listImage;
    this.createdTime = createdTime;
}

var userListsApp = angular.module('UserListsApp', []);

userListsApp.controller('UserListsAppController', function ($scope) {
        $scope.username = Parse.User.current().attributes.username;
        $scope.userLists = new Object();
        getUserLists();
        $scope.navigateToListContentPage = function(listId)
        {
            localStorage.setItem("listId",listId);
            window.location = "./listContent.html";
        };

        function getUserLists() {
            var lists = Parse.Object.extend("Lists");
            var query = new Parse.Query(lists);

            query.containedIn("sharedUsers",[$scope.username]);
            query.descending("createdAt");
            query.find(
                {
                    success: function (results) {
                        addListsFromParse(results);
                        subscribeToUserListsIdsInParse();
                    },
                    error: function (error) {
                        console.log(error);
                    }

                }
            );
        }

        var addListsFromParse = function (results) {
            var userList;
            var createdDate;
            for (var i = 0, len = results.length; i < len; i++) {
                userList = getUserListFromParseObject(results[i]);
                createdDate = results[i].createdAt.toDateString();
                $scope.userLists[createdDate].lists.push(userList);
            }
            $scope.$apply();
        };

        var getUserListFromParseObject = function(parseObject)
        {
            var listId = parseObject.id;
            var adminUser = parseObject.get("adminUser");
            var listName = parseObject.get("listName");
            var sharedUsers = parseObject.get("sharedUsers");
            var listImage = parseObject.get("listImage");
            var createdDate = parseObject.createdAt.toDateString();

            if ($scope.userLists.hasOwnProperty(createdDate) === false)
            {
                $scope.userLists[createdDate] = {
                    createdDate: createdDate,
                    lists: []
                };
            }

            return new UserList(listId, adminUser, listName, sharedUsers,listImage, createdDate);
        };

        var subscribeToUserListsIdsInParse = function()
        {
            var listId;
            for (var listDateIndex in $scope.userLists) {
                console.log("listDateIndex =" + listDateIndex);
                for (var listIndex in $scope.userLists[listDateIndex].lists) {
                    console.log("listIndex =" + listIndex);
                    listId = $scope.userLists[listDateIndex].lists[listIndex].listId;
                    console.log("listId =" + listId);
                    ParsePushPlugin.subscribe(listId, function (success) {
                            console.log(success);

                        },
                        function (error) {
                            console.log(error);
                        });
                }
            }
        };
    }
);