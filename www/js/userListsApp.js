$.mobile.buttonMarkup.hoverDelay = 0;

document.addEventListener("deviceready", onDeviceReady, false);

function onDeviceReady() {
    console.log("Device Ready");
    navigator.splashscreen.hide();
    document.addEventListener("backbutton", onBackKeyDown, false); //Listen to the User clicking on the back button
    subscribe();
}

function onBackKeyDown(e) {
    if ($(".ui-panel").hasClass("ui-panel-open") == true) {
        e.preventDefault();
        $(".ui-panel").panel("close");
    }
    else {
        exitApp();
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
function UserList(listId, adminUser, adminName, listName, sharedUsers, listImage, createdTime) {
    this.listId = listId;
    this.adminUser = adminUser;
    this.adminName = adminName;
    this.listName = listName;
    this.sharedUsers = sharedUsers;
    this.listImage = listImage;
    this.createdTime = createdTime;
}

var userListsApp = angular.module('UserListsApp', []).filter('object2Array', function() {
    return function(input) {
        var out = [];
        for(var i in input){
            out.push(input[i]);
        }
        return out;
    }
});

userListsApp.controller('UserListsAppController', function ($scope) {
    //$scope.username = Parse.User.current().attributes.username;
    $scope.username = "I8OECfZ0Zt2d4MCUUmNP1HV4E";
    $scope.userLists = {};
    $scope.defaultListImage = "http://files.parsetfss.com/78e798b2-27ce-4608-a903-5f5baf8a0899/tfss-175847af-a54e-456a-a078-a71198b96403-list-image.png";
    $scope.listNameInput = "";
    $scope.inEditMode = false;


    var listsToRemove = [];
    var temporaryUserLists = {};

    var getUserLists = function () {
        var lists = Parse.Object.extend("Lists");
        var query = new Parse.Query(lists);

        query.containedIn("sharedUsers", [$scope.username]);
        query.descending("createdAt");
        query.find(
            {
                success: function (results) {
                    addListsFromParse(results);
                    var userListsIds = getListsIdsForSubscription();

                    Parse.Cloud.run('subscribeToAllSharedLists', {userListsIds: userListsIds}, {
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

    getUserLists();

    // TODO :Check my createdTime doesn't show when adding a list
    $scope.createNewList = function () {
        Parse.initialize(PARSE_APP_ID, PARSE_JS_ID);
        var Lists = Parse.Object.extend("Lists");
        var parseUserLists = new Lists();

        var listName = $scope.listNameInput;
        var adminUser = $scope.username;
        var adminName = localStorage.getItem("fullName");
        var sharedUsers = [$scope.username];
        var listImage = $scope.defaultListImage;

        parseUserLists.save({
            listName: listName,
            adminUser: adminUser,
            adminName: adminName,
            sharedUsers: sharedUsers,
            listImage: listImage
        }, {
            success: function (listObjectFromParse) {
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
                ParsePushPlugin.subscribe(CHANNEL_PREFIX + newList.listId, function (success) {
                        console.log(success);
                    },
                    function (error) {
                        console.log(error);
                    });

            },
            error: function (productFromParse, error) {
                console.log('Failed to create new object, with error code: ' + error.message);
            }
        });
    };

    function createNewListFromParseObject(parseListObject) {
        var listId = parseListObject.id;
        var adminUser = parseListObject.attributes.adminUser;
        var adminName = parseListObject.attributes.adminName;
        var listName = parseListObject.attributes.listName;
        var sharedUsers = parseListObject.attributes.sharedUsers;
        var listImage = parseListObject.attributes.listImage;
        var createdTime = parseListObject.createdAt.toDateString();
        var newList = new UserList(listId, adminUser, adminName, listName, sharedUsers, listImage, createdTime);
        return newList;
    }

    $scope.clearCreateNewListFields = function () {
        $("#listName").val("");
    };

    $scope.navigateToListContentPage = function (listId) {
        var list = getListFromListId(listId);
        var listName = list.listName;
        var listAdminUserName = list.adminUser;

        localStorage.setItem("listId", listId);
        localStorage.setItem("listName", listName);
        localStorage.setItem("listAdminUserName", listAdminUserName);
        window.location = "./listContent.html";
    };

    function getListFromListId(listId) {
        for (var createdDate in $scope.userLists) {
            for (var listIndex in $scope.userLists[createdDate].lists) {
                var userList = $scope.userLists[createdDate].lists[listIndex];
                if (userList.listId === listId) {
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

    var getUserListFromParseObject = function (parseObject) {
        var listId = parseObject.id;
        var adminUser = parseObject.get("adminUser");
        var adminName = parseObject.get("adminName");
        var listName = parseObject.get("listName");
        var sharedUsers = parseObject.get("sharedUsers");
        var listImage = parseObject.get("listImage");
        var createdDate = parseObject.createdAt.toDateString();

        if ($scope.userLists.hasOwnProperty(createdDate) === false) {
            $scope.userLists[createdDate] = {
                createdDate: createdDate,
                lists: []
            };
        }

        return new UserList(listId, adminUser, adminName, listName, sharedUsers, listImage, createdDate);
    };

    var getListsIdsForSubscription = function () {
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

    $scope.editLists = function () {
        localStorage.setItem("userLists", JSON.stringify($scope.userLists));
        $("#menuButton").hide();
        $("#createNewListButton").hide();
        removeNotAdminLists();
        $("#menuPanel").panel("close");
        $scope.inEditMode = !$scope.inEditMode;
    };

    function removeNotAdminLists() {
        var userListsInDate;
        var userList;
        var listIndex;
        var createdDate;
        var notAdminListsToRemove;
        temporaryUserLists = {};
        for (createdDate in $scope.userLists) {
            notAdminListsToRemove = [];
            userListsInDate = $scope.userLists[createdDate].lists;
            for (listIndex in userListsInDate) {
                userList = userListsInDate[listIndex];
                if (userList.adminUser !== $scope.username) {
                    notAdminListsToRemove.push(userList);
                }
            }
            if (notAdminListsToRemove.length !== 0) {
                temporaryUserLists[createdDate] = {
                    createdDated: createdDate,
                    lists: notAdminListsToRemove
                };
            }

            $scope.userLists[createdDate].lists = _.difference($scope.userLists[createdDate].lists, notAdminListsToRemove);
            if ($scope.userLists[createdDate].lists.length === 0) {
                delete $scope.userLists[createdDate];
            }
        }
        console.log(JSON.stringify(temporaryUserLists));
    }

    function retrieveRemovedNotAdminLists() {
        var userListsInDate;
        var createdDate;
        for (createdDate in temporaryUserLists) {
            userListsInDate = temporaryUserLists[createdDate].lists;
            if ($scope.userLists.hasOwnProperty(createdDate) === false) //if the creation date is not exists
            {
                $scope.userLists[createdDate] = {
                    createdDate: createdDate,
                    lists: []
                };
            }
            $scope.userLists[createdDate].lists = userListsInDate;
        }
    }

    $scope.saveListsChanges = function () {
        $("#menuButton").show();
        removeDeletedListsInParse();
        retrieveRemovedNotAdminLists();
        localStorage.removeItem("userLists");
        console.log("Lists Changes Saved.");
        $("#menuPanel").panel("close");
        $("#menuButton").show();
        $("#createNewListButton").show();
        $scope.inEditMode = !$scope.inEditMode;
    };

    $scope.cancelEditListsChanges = function () {
        var oldContent = localStorage.getItem("userLists");
        $scope.userLists = JSON.parse(oldContent);
        localStorage.removeItem("userLists");
        listsToRemove = [];
        $("#menuButton").show();
        $("#createNewListButton").show();
        this.inEditMode = !this.inEditMode;
        console.log("Lists Changes Canceled.");
    };

    $scope.getTheme = function (list) {
        console.log("list");
        if ($scope.inEditMode === false) {
            return "b";
        }
        else if (list.adminUser === $scope.username) {
            return "g";
        }
        else {
            return "b";
        }
    };

    $scope.getIcon = function (list) {
        if ($scope.inEditMode === false) {
            return 'carat-r';
        }
        else if (list.adminUser === $scope.username) {
            return 'delete';
        }
        else {
            return 'carat-r';
        }
    };

    $scope.isListAdmin = function (list) {
        return ((list.adminUser === $scope.username) ? true : false);
    };

    $scope.listAction = function (list) {
        if (list.adminUser === $scope.username) {
            console.log("List Admin");
            $scope.removeSelectedList(list);
        }
        else {
            console.log("Not List Admin");
        }
    };

    // TODO : FINISH
    $scope.removeSelectedList = function (selectedList) {
        var userListsInDate;
        var userList;
        var foundList = false;
        var listIndex;
        var createdDate;
        for (createdDate in $scope.userLists) {
            userListsInDate = $scope.userLists[createdDate].lists;
            for (listIndex in userListsInDate) {
                userList = userListsInDate[listIndex];
                if (userList.listId === selectedList.listId) {
                    foundList = true;
                    listsToRemove.push(userList);
                    $scope.userLists[createdDate].lists.splice(listIndex, 1);
                    if ($scope.userLists[createdDate].lists.length === 0) {
                        delete $scope.userLists[createdDate];
                    }
                    break;
                }
                if (foundList == true) {
                    break;
                }
            }
        }
    };

    function removeDeletedListsInParse() {
        Parse.initialize(PARSE_APP_ID, PARSE_JS_ID);
        console.log(listsToRemove);
        var Lists = Parse.Object.extend("Lists");
        var listId;
        var query = new Parse.Query(Lists);
        var listsIds = [];

        for (var list in listsToRemove) {
            listsIds.push(listsToRemove[list].listId);
        }

        query.containedIn("objectId", listsIds);
        query.each(function (list) {
            // Deleting the list from Parse
            console.log(list);
            listId = list.id;
            return list.destroy({}).then(function () {
                console.log('List with listId ' + list.id + ' deleted successfully.');

                var ListContent = Parse.Object.extend("ListContent");
                var query = new Parse.Query(ListContent);
                query.equalTo("listId", listId);
                return query.find().then(function (results) {
                    console.log(results);

                    return Parse.Object.destroyAll(results);
                }).then();
            });
        }).then(function (success) {
            removeListIdChannel(listsIds);
            console.log(success);

        }, function (error) {
            console.log(error);
        });
    }

    function removeListIdChannel(listsIds) {
        console.log("removeListsIdsChannel:");
        console.log(listsIds);
        Parse.Cloud.run('removeListsIdsChannel', {listsIds: listsIds}, function (success) {
                console.log(success);
            },
            function (error) {
                console.log(error);
            });
    }
});