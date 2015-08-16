$.mobile.buttonMarkup.hoverDelay = 0;

document.addEventListener("deviceready", onDeviceReady, false);

function onDeviceReady() {
    document.addEventListener("backbutton", onBackKeyDown, false); //Listen to the User clicking on the back button
}

function onBackKeyDown(e) {
    if( $(".ui-panel").hasClass("ui-panel-open") == true ){
        e.preventDefault();
        $( ".ui-panel" ).panel( "close" );
    }
    else{
        navigator.app.exitApp();
    }
}

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
        //$scope.username = Parse.User.current().attributes.username;
        $scope.userLists = new Object();
        $scope.username = "I8OECfZ0Zt2d4MCUUmNP1HV4E";
        $scope.defaultListImage = "http://files.parsetfss.com/78e798b2-27ce-4608-a903-5f5baf8a0899/tfss-02790cd8-92cb-4d01-ab48-e0372541c24a-checklist.png";
        $scope.listNameInput = "";

        getUserLists();

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

        // TODO :Check my createdTime doesn't show when adding a list
        $scope.createNewList = function()
        {
            Parse.initialize(PARSE_APP_ID, PARSE_JS_ID);
            var Lists = Parse.Object.extend("Lists");
            var parseUserLists = new Lists();

            var listName = $scope.listNameInput;
            var adminUser = $scope.username;
            var sharedUsers = [$scope.username];
            var listImage = $scope.defaultListImage;

            parseUserLists.save({
                listName: listName,
                adminUser: adminUser,
                sharedUsers: sharedUsers,
                listImage: listImage
            }, {
                success: function(listObjectFromParse) {
                    var newList = createNewListFromParseObject(listObjectFromParse);
                    if ($scope.userLists.hasOwnProperty(newList.createdTime) === false) //if the creation date is already created
                    {
                        $scope.userLists[newList.createdTime] = {
                            createdDate: newList.createdTime,
                            lists: []
                        };
                    }
                    console.log(newList.createdTime);
                    $scope.userLists[newList.createdTime].lists.push(newList);
                    $scope.clearCreateNewListFields();
                    $("#createNewListPanel").panel("close");
                    console.log('New List created with listId: ' + newList.listId);
                    $scope.$apply();

                },
                error: function(productFromParse, error) {
                    console.log('Failed to create new object, with error code: ' + error.message);
                }
            });
        };

        function createNewListFromParseObject(parseListObject)
        {
            var listId = parseListObject.id;
            var adminUser = parseListObject.attributes.adminUser;
            var listName = parseListObject.attributes.listName;
            var sharedUsers = parseListObject.attributes.sharedUsers;
            var listImage = parseListObject.attributes.listImage;
            var createdTime = parseListObject.createdAt.toDateString();
            var newList = new UserList(listId, adminUser, listName, sharedUsers, listImage, createdTime);
            return newList;
        }

        $scope.clearCreateNewListFields = function()
        {
            $("#listName").val("");
        };

        $scope.navigateToListContentPage = function(listId)
        {
            localStorage.setItem("listId",listId);
            window.location = "./listContent.html";
        };

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


        function arraySubscribe (array, index)
        {
            ParsePushPlugin.subscribe(array[index], function(msg) {
                console.log("successfully subscribed to channel: " + array[index]);
                if (index < array.length - 1)
                {
                    index++;
                    arraySubscribe(array,index);
                }
            }, function(e) {
                console.log('error');
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
            }, function(e) {
                consolo.log('error');
            });
        }

        var subscribeToUserListsIdsInParse = function()
        {
            var listId;
            var channel;
            var subscriptions = [];
            for (var listDateIndex in $scope.userLists) {
                for (var listIndex in $scope.userLists[listDateIndex].lists) {
                    listId = $scope.userLists[listDateIndex].lists[listIndex].listId;
                    channel = "ch" + listId;
                    subscriptions.push(channel);
                }
            }
            arraySubscribe(subscriptions,0);
        };
    }
);