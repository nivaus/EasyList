/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */

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
        navigator.app.backHistory();
    }
}


// TODO : Change every this element to $scope
$.mobile.buttonMarkup.hoverDelay = 0;



function FacebookFriend(facebookFriendId, facebookFriendName, facebookFriendPicture) {
    this.facebookFriendId = facebookFriendId;
    this.facebookFriendName = facebookFriendName;
    this.facebookFriendPicture = facebookFriendPicture;
}
var listContentApp = angular.module('SmartShoppingList', []);

listContentApp.controller('ShoppingListController', function ($scope) {
        // Local Storage
        var userName = localStorage.getItem("userName");
        var fullName = localStorage.getItem("fullName");
        var facebookId = localStorage.getItem("facebookId");
        var listId = localStorage.getItem("listId");
        var listAdminUserName = localStorage.getItem("listAdminUserName");
        //var sharedFacebookFriendsIds = [];

        // Constants
        var CHANNEL_PREFIX = "ch";
        var DEFAULT_PRODUCT_IMAGE = "http://files.parsetfss.com/64d6988d-576e-4edc-b686-e7a05d6ed73b/tfss-c2486cd8-6833-4ef0-b569-7d1445ebee99-shopping-cart.png";
        var PHOTO_LIBRARY = 0;
        var PHOTO_CAMERA = 1;

        // Scope Variables
        this.selectedProduct;
        this.inEditMode = false;

        $scope.isListAdmin = (userName === listAdminUserName) ? true : false;
        $scope.facebookFriends = [];
        $scope.sharedFacebookFriends = [];
        $scope.notSharedFacebookFriends = [];
        $scope.productCategory = "";
        $scope.productName = "";
        $scope.productQuantity = "";
        $scope.notifyText="";
        $scope.listContent = new Object();
        $scope.productsToRemove = [];

        getList($scope, listId);

        this.addProduct = function (productCategory, productName, productQuantity) {
            productQuantity = parseInt(productQuantity);

            if ($scope.listContent.hasOwnProperty(productCategory) === true) //if a category is already created
            {
                this.addNewProductToExistingCategory(productCategory, productName, productQuantity);
            }
            else {
                this.addNewProductToNewCategory(productCategory, productName, productQuantity);
            }
            $scope.clearAddProductFields();
            $("#addProductPanel").panel("close");
        };

        this.addNewProductToNewCategory = function (productCategory, productName, productQuantity) {
            $scope.listContent[productCategory] = {
                categoryName: productCategory,
                products: []
            };
            var productImage = DEFAULT_PRODUCT_IMAGE;
            var newProduct = new Product(null, productCategory, productName, productQuantity, productImage, false, listId);
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
                var newProduct = new Product(null, productCategory, productName, productQuantity, productImage, false, listId);
                addNewProductToParse($scope, newProduct);
            }
        };

        $scope.clearAddProductFields = function () {
            $scope.productCategory = "";
            $scope.productName = "";
            $scope.productQuantity = "";
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

        this.updateSelectedProduct = function (product) {
            this.selectedProduct = product;
        };

        this.removeSelectedProduct = function () {
            var categoryName = this.selectedProduct.categoryName;
            if ($scope.listContent.hasOwnProperty(categoryName) === true) {
                $scope.productsToRemove.push(this.selectedProduct);
                removeProductFromList($scope.listContent,this.selectedProduct);
                //deleteProductFromParse($scope, this.selectedProduct);
            }
        };

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
            this.inEditMode = !this.inEditMode;
        };

        this.editList = function () {
            localStorage.setItem("listContent",JSON.stringify($scope.listContent));
            $("#addProductButton").hide();
            $("#menuButton").hide();
            this.addQuantityEditing();
        };

        this.saveList = function () {
            $("#addProductButton").show();
            $("#menuButton").show();
            this.updateProductsQuantity();
            console.log("saveList " + $scope.productsToRemove);
            removeDeletedProductsInParse ($scope, $scope.productsToRemove);
            localStorage.removeItem("listContent");
            console.log("List Changes Saved.");
        };

        this.cancelEditListChanges = function () {
            var oldContent = localStorage.getItem("listContent");
            $scope.listContent = JSON.parse(oldContent);
            localStorage.removeItem("listContent");
            $scope.productsToRemove = [];
            $("#addProductButton").show();
            $("#menuButton").show();
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
            var productName = productToUpdate.productName;
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

        $scope.navigateToUserLists = function () {
            window.location = "userLists.html";
        };

        $scope.notifyFriends = function () {
            if ($scope.notifyText === "") {
                $scope.notifyText = "I'm on my way to the supermarket. Last chance for changes!";
            }
            sendNotifyPushMessage(listId,$scope.notifyText);
            $("#notifyFriendsPopUp").popup("close");
            $scope.clearNotifyFriendsFields();
        };

        function sendNotifyPushMessage(channel, message) {
            var listPushChannel = CHANNEL_PREFIX + channel;
            var userPushChannel = CHANNEL_PREFIX + userName;
            console.log(listPushChannel);
            console.log(message);

            var listIdQuery = new Parse.Query(Parse.Installation);
            var pushQuery = new Parse.Query(Parse.Installation);
            listIdQuery.equalTo('channels', listPushChannel);
            pushQuery.notEqualTo('channels', userPushChannel);
            pushQuery.matchesKeyInQuery("channels","channels",listIdQuery);
            Parse.Push.send({
                where: pushQuery, // Set our Installation query
                data: {
                    alert: fullName + ": " + message
                }
            });
        }

        $scope.clearNotifyFriendsFields = function () {
            $scope.notifyText = "";
        };

        // TODO : Disable showing friends who are already shared in the list
        $scope.getFacebookFriendsDetails = function () {
            $scope.facebookFriends = [];
            facebookConnectPlugin.api("/me?fields=friends{name,id,picture.width(150).height(150)}", [],
                function(results) {
                    var facebookFriendId;
                    var facebookFriendName;
                    var facebookFriendPicture;
                    var facebookFriend;
                    for (var index in results.friends.data)
                    {
                        facebookFriendId = results.friends.data[index].id;
                        facebookFriendName = results.friends.data[index].name;
                        facebookFriendPicture = results.friends.data[index].picture.data.url;
                        facebookFriend = new FacebookFriend(facebookFriendId,facebookFriendName,facebookFriendPicture);
                        $scope.facebookFriends.push(facebookFriend);
                    }
                    getSharedFacebookFriendsDetails();
                }
            );
        };

        function getSharedFacebookFriendsDetails () {
            Parse.initialize(PARSE_APP_ID, PARSE_JS_ID);
            var Lists = Parse.Object.extend("Lists");
            var query = new Parse.Query(Lists);
            var sharedFacebookFriendsIds =[];
            query.equalTo("objectId", listId);
            query.first(
                {
                    success: function (results) {
                        var sharedFriendsUserNamesInParse = results.get("sharedUsers");
                        var query = new Parse.Query(Parse.User);
                        query.containedIn("username",sharedFriendsUserNamesInParse);
                        query.find(
                            {
                                success: function (results) {
                                    for (var index in results)
                                    {
                                        var friendFacebookId = results[index].attributes.facebookId;
                                        if (friendFacebookId !== facebookId) {
                                            sharedFacebookFriendsIds.push(friendFacebookId);
                                        }
                                    }
                                    $scope.sharedFacebookFriends = getSharedFacebookFriends(sharedFacebookFriendsIds);
                                    $scope.notSharedFacebookFriends = $($scope.facebookFriends).not($scope.sharedFacebookFriends).get();
                                    $("#menuPanel").panel("close");
                                    if ($scope.isListAdmin === true) {
                                        $("#shareListPopUp").popup("open");
                                    }
                                    else {
                                        $("#showSharedUsersPopUp").popup("open");
                                    }
                                    $scope.$apply();
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
        };

        function getSharedFacebookFriends (sharedFriendsIdArray) {
            var sharedFacebookFriends = [];
            for (var index in $scope.facebookFriends)
            {
                var friendId = $scope.facebookFriends[index].facebookFriendId;
                var sharedFriendIndex = $.inArray(friendId,sharedFriendsIdArray);
                if (sharedFriendIndex !== -1)
                {
                    sharedFacebookFriends.push($scope.facebookFriends[index]);
                }
            }
            return sharedFacebookFriends;
        }

        $scope.shareListWithFriend = function (myFacebookFriend) {
            Parse.initialize(PARSE_APP_ID, PARSE_JS_ID);
            // Get the Parse username of the given facebookId
            var friendFacebookUserId = String(myFacebookFriend.facebookFriendId);
            var query = new Parse.Query(Parse.User);
            query.equalTo("facebookId", friendFacebookUserId);
            query.first({
                success: function (success) {
                    // Update the username of the selected facebook friend in the sharedUsers in parse
                    var friendUserNameInParse = success.attributes.username;
                    updateSharedUsersInParse(friendUserNameInParse);
                    $("#shareListPopUp").popup("close");
                },
                error: function (error) {
                    console.log(error.message);
                }
            });
        };

        function updateSharedUsersInParse(friendUsernameInParse) {
            var Lists = Parse.Object.extend("Lists");
            var parseUserList = new Lists();
            parseUserList.id = listId;
            parseUserList.add("sharedUsers", friendUsernameInParse);
            parseUserList.save(null, {
                success: function (result) {
                    console.log("Username " + friendUsernameInParse + " is now shared in listId " + listId);
                    sendPushMessageToFriendWhenSharedToList(friendUsernameInParse);
                },
                error: function (error) {
                    console.log(error.message);
                }
            });
        }

        function sendPushMessageToFriendWhenSharedToList(friendUsernameInParse) {
            var pushChannel = CHANNEL_PREFIX + friendUsernameInParse;
            var message = fullName + " shared his list with you.";
            //sendPushMessage(channel,message);

            console.log(pushChannel);
            console.log(message);
            var query = new Parse.Query(Parse.Installation);
            query.equalTo('channels', pushChannel);
            Parse.Push.send({
                where: query, // Set our Installation query
                data: {
                    alert: message
                }
            });

            $("#notifyFriendsPopUp").popup("close");
            $scope.clearNotifyFriendsFields();
        };
    }
);


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