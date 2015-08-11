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
var x;
userListsApp.controller('UserListsAppController', function ($scope) {
        //$scope.username = Parse.User.current().attributes.username;
        $scope.userLists = new Object();
        $scope.username = "WBKj6Xmo5WGiaMmsoz8q3B1Ty";
        $scope.defaultListImage = "http://files.parsetfss.com/78e798b2-27ce-4608-a903-5f5baf8a0899/tfss-02790cd8-92cb-4d01-ab48-e0372541c24a-checklist.png";
        getUserLists();
        $scope.navigateToListContentPage = function(listId)
        {
            localStorage.setItem("listId",listId);
            window.location = "./listContent.html";
        };

        $scope.createNewList = function(listName)
        {
            Parse.initialize(PARSE_APP_ID, PARSE_JS_ID);
            var Lists = Parse.Object.extend("Lists");
            var parseUserLists = new Lists();

            parseUserLists.save({
                listName: listName,
                adminUser: $scope.username,
                sharedUsers: [$scope.username],
                listImage: $scope.defaultListImage
            }, {
                success: function(listFromParse) {
                    var createdTime = listFromParse.createdAt.toDateString();
                    var listId = listFromParse.id;
                    if ($scope.userLists.hasOwnProperty(createdTime) === false) //if the creation date is already created
                    {
                        $scope.userLists[createdTime] = {
                            createdTime: createdTime,
                            lists: []
                        };
                    }
                    var newList = new UserList(listId, $scope.username, listName, [$scope.username], $scope.defaultListImage, createdTime);
                    $scope.userLists[createdTime].lists.push(newList);
                    $scope.$apply();
                    $("#createNewListPanel").panel("close");
                    console.log('New List created with listId: ' + listId.id);
                },
                error: function(productFromParse, error) {
                    console.log('Failed to create new object, with error code: ' + error.message);
                }
            });
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
                console.log("ListId " + userList.listId + " added.");
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
                for (var listIndex in $scope.userLists[listDateIndex].lists) {
                    listId = $scope.userLists[listDateIndex].lists[listIndex].listId;
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