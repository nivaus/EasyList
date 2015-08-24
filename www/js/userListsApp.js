$.mobile.buttonMarkup.hoverDelay = 0;

document.addEventListener("deviceready", onDeviceReady, false);

function onDeviceReady() {
    console.log("Device Ready");
    navigator.splashscreen.hide();
    document.addEventListener("backbutton", onBackKeyDown, false); //Listen to the User clicking on the back button
    subscribe();
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

var subscribe;

//Constants
var PARSE_APP_ID = "YNiKFOkpulbY1j19E2gcdSREgTKd0AiZZKtzJaeg";
var PARSE_JS_ID = "Ht7VpNFFhB6KKod4L8gvWlyzjwWt0PEPXjEHVD1H";
var CHANNEL_PREFIX = "ch";

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
        $scope.userLists = {};
        //$scope.username = "I8OECfZ0Zt2d4MCUUmNP1HV4E";
        $scope.defaultListImage = "http://files.parsetfss.com/78e798b2-27ce-4608-a903-5f5baf8a0899/tfss-02790cd8-92cb-4d01-ab48-e0372541c24a-checklist.png";
        $scope.listNameInput = "";



        var getUserLists = function() {
            var lists = Parse.Object.extend("Lists");
            var query = new Parse.Query(lists);

            query.containedIn("sharedUsers",[$scope.username]);
            query.descending("createdAt");
            query.find(
                {
                    success: function (results) {
                        addListsFromParse(results);
                        var userListsIds = getListsIdsForSubscription();

                        Parse.Cloud.run('subscribeToAllSharedLists', {userListsIds:  userListsIds}, {
                            success: function (result) {
                                console.log(result);
                            },
                            error: function (error) {
                            }
                        });
                    },
                    error: function (error) {
                        console.log(error);
                    }
                }
            );
        };
        subscribe = getUserLists;

        //getUserLists();

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
                    ParsePushPlugin.subscribe(CHANNEL_PREFIX + newList.listId,function (success)
                    {
                        console.log(success);
                    },
                    function (error)
                    {
                        console.log(error);
                    });

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
            var list = getListFromListId(listId);
            var listName = list.listName;
            var listAdminUserName = list.adminUser;

            localStorage.setItem("listId",listId);
            localStorage.setItem("listName",listName);
            localStorage.setItem("listAdminUserName",listAdminUserName);
            window.location = "./listContent.html";
        };

        function getListFromListId(listId)
        {
            for(var createdDate in $scope.userLists) {
                for (var listIndex in $scope.userLists[createdDate].lists)
                {
                    var userList = $scope.userLists[createdDate].lists[listIndex];
                    if (userList.listId === listId)
                    {
                        var list = $scope.userLists[createdDate].lists[listIndex];
                        return list;
                        //var listAdminUserName =  $scope.userLists[createdDate].lists[listIndex].adminUser;
                        //return listAdminUserName;
                    }
                }
            }
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

        var getListsIdsForSubscription = function()
        {
            var listId;
            var channel;
            var subscriptions = [];
            for (var listDateIndex in $scope.userLists) {
                for (var listIndex in $scope.userLists[listDateIndex].lists) {
                    listId = $scope.userLists[listDateIndex].lists[listIndex].listId;
                    channel = CHANNEL_PREFIX + listId;
                    subscriptions.push(channel);
                }
            }
            return subscriptions;
        };
    }
);