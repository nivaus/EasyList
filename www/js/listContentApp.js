/* To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
var PARSE_CLIENT_KEY="wV1lOSJJWBlvQhvQYISlKyGlFiolEaXMsbOaMD7I";
var PARSE_APP_ID="YNiKFOkpulbY1j19E2gcdSREgTKd0AiZZKtzJaeg";


document.addEventListener("deviceready", onDeviceReady, false);

function onDeviceReady() {
    document.addEventListener("backbutton", onBackKeyDown, false); //Listen to the User clicking on the back button
    registerSilentNotifications();
}

function registerSilentNotifications()
{
    ParsePushPlugin.register({
            appId: PARSE_APP_ID, clientKey: PARSE_CLIENT_KEY, eventKey: "myEventKey"
        },
        function () {
            console.log("registered for silent notifications");
            ParsePushPlugin.on('receivePN', function(pn){
                var listId = localStorage.getItem("listId");
                var userName = localStorage.getItem("userName");
                if (pn.hasOwnProperty("listContent") === true)
                {
                    console.log(pn.listsIds);
                    if (pn.listContent === "unshare" && pn.listId == listId)
                    {
                        window.location = "userLists.html";
                    }
                    else if (pn.listContent === "delete" && _.indexOf(pn.listsIds, listId) !== -1)
                    {
                        window.location = "userLists.html";
                    }
                    else if (pn.senderId !== userName && pn.listId === listId)
                    {
                        console.log(pn.senderId);
                        var scope = angular.element("#shoppingListController").scope();
                        getList(scope, listId);
                    }
                }
            });


        }, function (e) {
            console.log('error registering device: ' + e);
        });
}

function onBackKeyDown(e) {
    var scope = angular.element("#shoppingListController").scope();

    // In Edit Mode
    if (scope.list.inEditMode === true) {
        e.preventDefault();
        scope.list.cancelEditListChanges();
    }
    //Panel Is Opened
    else if ($(".ui-panel").hasClass("ui-panel-open") == true) {
        e.preventDefault();
        $(".ui-panel").panel("close");
    }
    // No Popup Is Opened
    else if ($(".ui-popup-container").hasClass("ui-popup-active") == false) {
        clearSavedLocalStorageOfList();
        navigator.app.backHistory();
    }

    // Popup Is Open
    else {
        localStorage.removeItem("sharedFacebookFriends");
        localStorage.removeItem("notSharedFacebookFriends");
        localStorage.removeItem("listContent");
        navigator.app.backHistory();
    }
}


$.mobile.buttonMarkup.hoverDelay = 0;


function FacebookFriend(facebookFriendId, facebookFriendName, facebookFriendPicture) {
    this.facebookFriendId = facebookFriendId;
    this.facebookFriendName = facebookFriendName;
    this.facebookFriendPicture = facebookFriendPicture;
}
var listContentApp = angular.module('SmartShoppingList', []);

listContentApp.controller('ShoppingListController', function ($scope) {
        showLoadingWidget("Loading...");

        // Local Storage
        var userName = localStorage.getItem("userName");
        var fullName = localStorage.getItem("fullName");
        var facebookId = localStorage.getItem("facebookId");
        var facebookProfilePicture = localStorage.getItem("facebookProfilePicture");
        var listId = localStorage.getItem("listId");
        var listAdminUserName = localStorage.getItem("listAdminUserName");

        // Constants
        var CHANNEL_PREFIX = "ch";
        var DEFAULT_PRODUCT_IMAGE = "http://files.parsetfss.com/78e798b2-27ce-4608-a903-5f5baf8a0899/tfss-f9c4341c-de01-4d07-9419-3cbc0ef120f0-shopping-cart.png";
        var PHOTO_LIBRARY = 0;
        var PHOTO_CAMERA = 1;
        var facebookFriendsMap = {};

        // Scope Variables
        this.selectedProduct;
        this.inEditMode = false;

        $scope.listName = localStorage.getItem("listName");
        $scope.isListAdmin = (userName === listAdminUserName);
        $scope.facebookFriends = [];
        $scope.sharedFacebookFriends = [];
        $scope.notSharedFacebookFriends = [];
        $scope.productCategory = "";
        $scope.productName = "";
        $scope.productQuantity = 1;
        $scope.notifyText = "";
        $scope.listContent = {};
        $scope.productTemplates = { products : [], categories : []};
        $scope.productsToRemove = [];
        $scope.emptyList = isEmptyListContent();
        $scope.invertedList = (localStorage.getItem("invertedList") === "true");

        getList($scope, listId);

        getProductTemplates($scope);

        function isEmptyListContent() {
            return (_.keys($scope.listContent).length === 0);
        }

        $scope.changeEmptyListValue = function () {
            $scope.emptyList = isEmptyListContent();
            if ($scope.emptyList) {
                $("#editListButton").addClass("ui-state-disabled");
                $("#notifyFriendsButton").addClass("ui-state-disabled");
                $(".editSaveButton").removeClass("ui-btn-active");
            }
            else{
                $("#editListButton").removeClass("ui-state-disabled");
                $("#notifyFriendsButton").removeClass("ui-state-disabled");
            }
        };

        $scope.hideOrShowEmptyListNotification = function () {
            if (isEmptyListContent() === true) {
                $("#emptyListItem").show();
            }
            else {
                $("#emptyListItem").hide();
            }
        };

        this.addProduct = function (productCategory, productName, productQuantity) {
            if (productName === "") {
                $("#invalidInputMessage").text("Product name cannot be empty!");
                $("#invalidInputMessage").show();
            }
            else if (productCategory === "") {
                $("#invalidInputMessage").text("Product category cannot be empty!");
                $("#invalidInputMessage").show();
            }
            else if (productQuantity < 0 || productQuantity === null) {
                $("#invalidInputMessage").text("Product quantity cannot be empty!");
                $("#invalidInputMessage").show();
            }
            else {
                showLoadingWidget("Saving product...");
                productQuantity = parseInt(productQuantity);

                if ($scope.listContent.hasOwnProperty(productCategory) === true) //if a category is already created
                {
                    this.addNewProductToExistingCategory(productCategory, productName, productQuantity);
                }
                else {
                    this.addNewProductToNewCategory(productCategory, productName, productQuantity);
                }
                $scope.clearAddProductFields();
                $scope.changeEmptyListValue();
                $("#invalidInputMessage").hide();
                $("#emptyListItem").hide();
                $("#addProductPanel").panel("close");
            }
        };

        this.addNewProductToNewCategory = function (productCategory, productName, productQuantity) {
            $scope.listContent[productCategory] = {
                categoryName: productCategory,
                products: []
            };
            var productImage = DEFAULT_PRODUCT_IMAGE;
            var newProduct = new Product(null, productCategory, productName, productQuantity, productImage, false, listId, null, null);
            addNewProductToParse($scope, newProduct);
        };

        this.addNewProductToExistingCategory = function (productCategory, productName, productQuantity) {
            var products = $scope.listContent[productCategory].products;
            var indexOfProductName = findProductByName(products, productName);
            if (indexOfProductName !== -1) { //if a product is already in the list
                var product = products[indexOfProductName];
                var newProductQuantity = product.productQuantity + productQuantity;
                updateProductQuantityInParse($scope, product, newProductQuantity);
            }
            else {
                var productImage = DEFAULT_PRODUCT_IMAGE;
                var newProduct = new Product(null, productCategory, productName, productQuantity, productImage, false, listId, null, null);
                addNewProductToParse($scope, newProduct);
            }
        };

        $scope.clearAddProductFields = function () {
            $("#invalidInputMessage").hide();
            $scope.productCategory = "";
            $scope.productName = "";
            $scope.productQuantity = 1;
        };

        this.itemClicked = function (product) {
            if (this.inEditMode === false) {
                var elementClickedClassName = $(event.target).attr("class");
                if (elementClickedClassName === "productImage") {
                    $(".popphoto").attr("src", product.productImage);
                    $(".popphoto").attr("alt", product.productName);
                    $("#productImagePopUp").popup('open');
                }
                else {
                    toggleProductCheckedInParse($scope, product);
                }
            }
        };

        this.toggleProductChecked = function (product) {
            product.productChecked = !product.productChecked;
        };

        this.productAction = function (product) {
            this.updateSelectedProduct(product);
            if (this.inEditMode) {
                removeSelectedProduct(product);
            }
        };

        this.updateSelectedProduct = function (product) {
            this.selectedProduct = product;
        };

        function removeSelectedProduct(product) {
            var categoryName = product.categoryName;
            if ($scope.listContent.hasOwnProperty(categoryName) === true) {
                $scope.productsToRemove.push(product);
                removeProductFromList($scope.listContent, product);
            }
            $scope.hideOrShowEmptyListNotification();
        }

        function removeProductFromList(listContent, productToRemove) {
            var categoryName = productToRemove.categoryName;
            var productsList = listContent[categoryName].products;
            var productIndex = findProduct(productsList, productToRemove);
            if (productIndex != -1) {
                productsList.splice(productIndex, 1);
                deleteCategoryFromListIfEmpty(listContent, categoryName);
            }
        }

        function deleteCategoryFromListIfEmpty(listContent, categoryName) {
            if (listContent[categoryName].products.length === 0) {
                delete listContent[categoryName];
            }
        }

        this.executeEditOrSaveFunction = function () {
            if (this.inEditMode === true) {
                this.saveList();
            }
            else {
                this.editList();
            }
            $scope.changeEmptyListValue();
            this.inEditMode = !this.inEditMode;
        };

        this.editList = function () {
            localStorage.setItem("listContent", JSON.stringify($scope.listContent));
            $("#addProductButton").hide();
            $("#menuButton").hide();
            this.addQuantityEditing();
        };

        this.saveList = function () {
            showLoadingWidget("Saving Changes...");
            $("#addProductButton").show();
            $("#menuButton").show();
            this.updateProductsQuantity();
            console.log("saveList " + $scope.productsToRemove);
            removeDeletedProductsInParse($scope, $scope.productsToRemove);
            localStorage.removeItem("listContent");
            $scope.hideOrShowEmptyListNotification();
            console.log("List Changes Saved.");
        };

        this.cancelEditListChanges = function () {
            var oldContent = localStorage.getItem("listContent");
            $scope.listContent = JSON.parse(oldContent);
            localStorage.removeItem("listContent");
            $scope.productsToRemove = [];
            $("#addProductButton").show();
            $("#menuButton").show();
            $scope.hideOrShowEmptyListNotification();
            this.inEditMode = !this.inEditMode;
            console.log("List Changes Canceled.");
        };

        this.updateProductsQuantity = function () {
            for (var categoryName in $scope.listContent) {
                var products = $scope.listContent[categoryName].products;
                for (var productIndex in products) {
                    var product = products[productIndex];
                    var newProductQuantity = parseInt($("#quantity" + product.objectId + " input").val());
                    if (product.productChecked === false) {
                        updateProductQuantityInParse($scope, product, newProductQuantity);
                    }
                }
            }
        };

        this.updateProductQuantity = function (productToUpdate) {
            productToUpdate.productQuantity = $("#quantity" + objectId + " input").val();
        };

        this.addQuantityEditing = function () {
            for (var categoryName in $scope.listContent) {
                var products = $scope.listContent[categoryName].products;
                for (var productIndex in products) {
                    if (products[productIndex].productChecked === false) {
                        var elementId = "quantity" + products[productIndex].objectId;
                        var productQuantity = products[productIndex].productQuantity;
                        dpUI.numberPicker("#" + elementId, {
                            min: 1,
                            max: 100,
                            step: 1,
                            format: "",
                            formatter: function (x) {
                                return x;
                            }
                        }, productQuantity);
                    }
                }
            }
        };

        this.changePhoto = function (product, photoType) {
            console.log("Take Photo!");
            var cameraOptions = {
                quality: 50,
                destinationType: Camera.DestinationType.DATA_URL,
                allowEdit: true,
                sourceType: "",
                encodingType: Camera.EncodingType.JPEG,
                saveToPhotoAlbum: true
            };
            if (photoType === PHOTO_CAMERA) {
                cameraOptions.sourceType = Camera.PictureSourceType.CAMERA;
            }
            else {
                cameraOptions.sourceType = Camera.PictureSourceType.PHOTOLIBRARY;
            }
            window.navigator.camera.getPicture(function (imageURI) {
                changeProductPhotoInParse($scope, product, imageURI);
            }, function (err) {
                console.log(err);
            }, cameraOptions);
        };

        this.getTheme = function (product) {
            if (this.inEditMode === true)
                return 'g';
            else {
                if (product.productChecked === true)
                    return 'f';
                else
                    return 'b';
            }
        };

        this.getIcon = function (product) {
            if (this.inEditMode === true)
                return 'delete';
            else {
                if (product.productChecked === true)
                    return 'check';
                else
                    return 'gear';
            }
        };

        this.getIconInInvertedList = function (product) {
            if (this.inEditMode === true) {
                return 'delete';
            }
            else if (product.productChecked === true) {
                return 'check';
            }
            else if ($scope.isOwnerOfProduct(product) || $scope.isListAdmin) {
                return 'gear';
            }
            else {
                return 'carat-r';
            }
        };

        $scope.navigateToUserLists = function () {
            clearSavedLocalStorageOfList();
            window.location = "userLists.html";
        };

        $scope.notifyFriends = function () {
            if ($scope.notifyText === "") {
                $scope.notifyText = "I'm on my way to the supermarket. Last chance for changes!";
            }
            //sendNotifyPushMessage(listId, $scope.notifyText);
            Parse.Cloud.run('sendNotifyPushMessage', {listId: listId, message: $scope.notifyText});
            $("#notifyFriendsPopUp").popup("close");
            $scope.clearNotifyFriendsFields();
        };

        $scope.checkIfToShowProductOptions = function (product) {
            return ($scope.isListAdmin || $scope.isOwnerOfProduct(product));
        };

        $scope.clearNotifyFriendsFields = function () {
            $scope.notifyText = "";
        };

        $scope.shareListOptions = function () {
            getFacebookFriendsDetails(function () {
                if ($scope.isListAdmin === true) {
                    $("#shareListPopUp").popup("open");
                }
                else {
                    $("#showSharedUsersPopUp").popup("open");
                }
            });
        };

        function getFacebookFriendsDetails(callback) {
            showLoadingWidget("Loading...");
            $scope.facebookFriends = [];
            facebookConnectPlugin.api("/me?fields=friends{name,id,picture.width(150).height(150)}", [],
                function (results) {
                    var facebookFriendId;
                    var facebookFriendName;
                    var facebookFriendPicture;
                    var facebookFriend;
                    for (var index in results.friends.data) {
                        facebookFriendId = results.friends.data[index].id;
                        facebookFriendName = results.friends.data[index].name;
                        facebookFriendPicture = results.friends.data[index].picture.data.url;
                        facebookFriend = new FacebookFriend(facebookFriendId, facebookFriendName, facebookFriendPicture);
                        $scope.facebookFriends.push(facebookFriend);
                    }
                    getSharedFacebookFriendsDetails(callback);
                }
            );
        }

        function getSharedFacebookFriendsDetails(callback) {
            Parse.initialize(PARSE_APP_ID, PARSE_JS_ID);
            var Lists = Parse.Object.extend("Lists");
            var query = new Parse.Query(Lists);
            var sharedFacebookFriendsIds = [];
            query.equalTo("objectId", listId);
            query.first(
                {
                    success: function (results) {
                        var sharedFriendsUserNamesInParse = results.get("sharedUsers");
                        var query = new Parse.Query(Parse.User);
                        query.containedIn("username", sharedFriendsUserNamesInParse);
                        query.find(
                            {
                                success: function (results) {
                                    var friendFacebookId;
                                    var parseUserName;
                                    for (var index in results) {
                                        friendFacebookId = results[index].attributes.facebookId;
                                        parseUserName = results[index].attributes.username;
                                        if (friendFacebookId !== facebookId) {
                                            sharedFacebookFriendsIds.push(friendFacebookId);
                                            facebookFriendsMap[friendFacebookId] = {
                                                userName: parseUserName
                                            };
                                        }
                                    }
                                    $scope.sharedFacebookFriends = getSharedFacebookFriends(sharedFacebookFriendsIds);
                                    $scope.notSharedFacebookFriends = $($scope.facebookFriends).not($scope.sharedFacebookFriends).get();
                                    addNotSharedFriendsUserNamesToMap();
                                    localStorage.setItem("sharedFacebookFriends", JSON.stringify($scope.sharedFacebookFriends));
                                    localStorage.setItem("notSharedFacebookFriends", JSON.stringify($scope.notSharedFacebookFriends));
                                    $scope.$apply();
                                    callback();
                                    $("#menuPanel").panel("close");
                                    hideLoadingWidget();
                                },
                                error: function (error) {
                                    console.log(error);
                                }
                            }
                        );
                    },
                    error: function (error) {
                        console.log(error);
                    }
                }
            );
        }

// Get array of facebook Id's and creates array of FacebookFriend
        function getSharedFacebookFriends(sharedFriendsIdArray) {
            var sharedFacebookFriends = [];
            for (var index in $scope.facebookFriends) {
                var friendId = $scope.facebookFriends[index].facebookFriendId;
                var sharedFriendIndex = $.inArray(friendId, sharedFriendsIdArray);
                if (sharedFriendIndex !== -1) {
                    sharedFacebookFriends.push($scope.facebookFriends[index]);
                }
            }
            return sharedFacebookFriends;
        }

// Adds the usernames of the users who are not shared in the list to the map
        function addNotSharedFriendsUserNamesToMap() {
            var friendsFacebookIds = createFacebookIdsArrayFromNotSharedFacebookFriends();
            var query = new Parse.Query(Parse.User);
            query.containedIn("facebookId", friendsFacebookIds);
            query.find(
                {
                    success: function (results) {
                        for (var index in results) {
                            var facebookId = results[index].attributes.facebookId;
                            var parseUserName = results[index].attributes.username;
                            facebookFriendsMap[facebookId] = {
                                userName: parseUserName
                            }
                        }
                    },
                    error: function (error) {
                        console.log(error);
                    }
                }
            );
        }

// Gets array of FacebookFriends who are not shared in the list, and created an array of their facebookId
        function createFacebookIdsArrayFromNotSharedFacebookFriends() {
            var facebookIdsArray = [];
            var facebookId;
            for (var index in $scope.notSharedFacebookFriends) {
                facebookId = $scope.notSharedFacebookFriends[index].facebookFriendId;
                facebookIdsArray.push(facebookId);
            }
            return facebookIdsArray;
        }

        $scope.toggleSharedFriend = function (myFacebookFriend) {
            var index = $scope.sharedFacebookFriends.indexOf(myFacebookFriend);
            if (index > -1) {
                $scope.sharedFacebookFriends.splice(index, 1);
            }
            $scope.notSharedFacebookFriends.push(myFacebookFriend);
            //$scope.$apply();
        };

        $scope.toggleUnSharedFriend = function (myFacebookFriend) {
            var index = $scope.notSharedFacebookFriends.indexOf(myFacebookFriend);
            if (index > -1) {
                $scope.notSharedFacebookFriends.splice(index, 1);
            }
            $scope.sharedFacebookFriends.push(myFacebookFriend);
            //$scope.$apply();
        };

        $scope.cancelShareListChanges = function () {
            var originalSharedFacebookFriends = localStorage.getItem("sharedFacebookFriends");
            $scope.sharedFacebookFriends = JSON.parse(originalSharedFacebookFriends);
            localStorage.removeItem("sharedFacebookFriends");

            var originalNotSharedFacebookFriends = localStorage.getItem("notSharedFacebookFriends");
            $scope.notSharedFacebookFriends = JSON.parse(originalNotSharedFacebookFriends);
            localStorage.removeItem("notSharedFacebookFriends");
        };

        $scope.saveShareListChanges = function () {
            var originalSharedFacebookFriends = localStorage.getItem("sharedFacebookFriends");
            originalSharedFacebookFriends = JSON.parse(originalSharedFacebookFriends);

            var request = {
                listId: listId,
                listName: $scope.listName,
                sharedFacebookFriends: $scope.sharedFacebookFriends,
                originalSharedFacebookFriends: originalSharedFacebookFriends,
                facebookFriendsMap: facebookFriendsMap
            };
            Parse.Cloud.run('updateSharesSubscribeAndSendPushNotification', request, {
                success: function (result) {
                    // result is 'Hello world!'
                    console.log(result);
                    console.log("Shared Users Changes Saved.");
                },
                error: function (error) {
                    console.log("Error in saving changes.");
                }
            });
        };

        $scope.showChangeProductOwnerOptions = function () {
            getFacebookFriendsDetails(function () {
                // Add myself to the list of optional new product owner
                var myFacebookUser = new FacebookFriend(facebookId, fullName, facebookProfilePicture);
                $scope.sharedFacebookFriends.push(myFacebookUser);
                // Add myself to the facebook map
                facebookFriendsMap[facebookId] = {
                    userName: userName
                };
                $scope.$apply();
                // Close opened popup
                $("#productOptionsPopup").popup("close");
                $("#changeProductOwnerPopUp").popup("open");
            });
        };

        this.changeProductOwner = function (productOwner) {
            var newProductOwnerUsernameInParse = facebookFriendsMap[productOwner.facebookFriendId].userName;
            var newProductOwnerFullName = productOwner.facebookFriendName;
            this.selectedProduct.ownerUsername = newProductOwnerUsernameInParse;
            this.selectedProduct.ownerFullName = newProductOwnerFullName;
            updateProductOwnerInParse($scope, this.selectedProduct);
            if (newProductOwnerUsernameInParse !== userName) {
                // TODO : Send push message
            }
            $("#changeProductOwnerPopUp").popup("close");
        };

        $scope.isOwnerOfProduct = function (product) {
            return (product.ownerUsername === userName);
        };

        $scope.hideInvalidInputMessage = function () {
            $("#invalidInputMessage").hide();
        };

        $scope.autocompleteProductSelected = function(product) {
            $("#productsFilter").hide();
            $scope.productCategory = product.productCategory;
            $scope.productName = product.productName;
        };

        $scope.autocompleteCategorySelected = function(category) {
            $("#categoriesFilter").hide();
            $scope.productCategory = category;
        };
    }
)
;


function findProductByName(array, productName) {
    for (var i = 0; i < array.length; i++) {
        if (array[i].productName === productName) {
            return i;
        }
    }
    return -1;
}

function findProduct(array, product) {
    for (var i = 0; i < array.length; i++) {
        if (array[i].objectId === product.objectId) {
            return i;
        }
    }
    return -1;
}

function showProductsFilter() {
    $("#productsFilter").show();
}

function showCategoriesFilter() {
    $("#categoriesFilter").show();
}