/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
// TODO : Change every this element to $scope
$.mobile.buttonMarkup.hoverDelay = 0;

var listContent = new Object();


//var listId = "cnF6gv1Ps2";
//var facebookFriends = new Object();

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

        // Constants
        var CHANNEL_PREFIX = "ch";
        var DEFAULT_PRODUCT_IMAGE = "http://files.parsetfss.com/64d6988d-576e-4edc-b686-e7a05d6ed73b/tfss-c2486cd8-6833-4ef0-b569-7d1445ebee99-shopping-cart.png";
        var PHOTO_LIBRARY = 0;
        var PHOTO_CAMERA = 1;

        // Scope Variables
        this.listContent = listContent;
        this.selectedProduct;
        this.inEditMode = false;

        $scope.facebookFriends = [
            new FacebookFriend("10206162796762317", "Idan Meir", "https://fbcdn-profile-a.akamaihd.net/hprofile-ak-xpt1/v/t1.0-1/p200x200/11259841_10152719200292364_4316760221844671350_n.jpg?oh=1b35f8aa0b64e111fc1512fab67b85d0&oe=564A4296&__gda__=1447318298_9b908e7ba739f5a0aa28ec1a6341461f"),
            new FacebookFriend("10152853548977364", "Niv Auslender", "https://fbcdn-profile-a.akamaihd.net/hprofile-ak-xpt1/v/t1.0-1/p200x200/11259841_10152719200292364_4316760221844671350_n.jpg?oh=1b35f8aa0b64e111fc1512fab67b85d0&oe=564A4296&__gda__=1447318298_9b908e7ba739f5a0aa28ec1a6341461f")
        ];

        $scope.productCategory = "";
        $scope.productName = "";
        $scope.productQuantity = "";
        $scope.notfyText = "";


        getList($scope, listId);

        this.addProduct = function (productCategory, productName, productQuantity) {
            productQuantity = parseInt(productQuantity);

            if (listContent.hasOwnProperty(productCategory) === true) //if a category is already created
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
            listContent[productCategory] = {
                categoryName: productCategory,
                products: []
            };
            var productImage = DEFAULT_PRODUCT_IMAGE;
            var newProduct = new Product(null, productCategory, productName, productQuantity, productImage, false, listId);
            addNewProductToParse($scope, newProduct);
        };

        this.addNewProductToExistingCategory = function (productCategory, productName, productQuantity) {
            var products = listContent[productCategory].products;
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
            if (this.listContent.hasOwnProperty(categoryName) === true) {
                deleteProductFromParse($scope, this.selectedProduct);
            }
        };

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
            $("#addProductButton").hide();
            $("#menuButton").hide();
            this.addQuantityEditing();
        };

        this.saveList = function () {
            $("#addProductButton").show();
            $("#menuButton").show();
            this.updateProductsQuantity();
        };

        this.updateProductsQuantity = function () {
            for (var categoryName in listContent) {
                var products = listContent[categoryName].products;
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
            for (var categoryName in listContent) {
                var products = listContent[categoryName].products;
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

        this.showLoadingWidget = function () {
            $.mobile.loading('show', {
                text: 'Uploading Image...',
                textVisible: true,
                theme: 'a',
                html: ""
            });
        };

        this.hideLoadingWidget = function () {
            $.mobile.loading('hide');
        };

        $scope.navigateToUserLists = function () {
            window.location = "userLists.html";
        };

        $scope.logOut = function () {
            facebookConnectPlugin.logout(
                function (success) {
                    console.log("User logged Out From Facebook.");
                    Parse.User.logOut();
                    console.log("User logged Out From Parse.");
                    clearSavedLocalStorage();
                    console.log("Local Storage Cleaned.");
                    window.location = "logIn.html";
                },
                function (error) {
                    console.log(error);
                }
            );
        };

        function clearSavedLocalStorage() {
            localStorage.removeItem("listId");
            localStorage.removeItem("userName");
            localStorage.removeItem("fullName");
            localStorage.removeItem("facebookId");
        }

        $scope.notifyFriends = function () {
            if ($scope.notifyText === "") {
                $scope.notifyText = "I'm on my way to the supermarket. Last chance for changes!";
            }
            sendPushMessage(listId,$scope.notifyText);
            $("#notifyFriendsPopUp").popup("close");
            $scope.clearNotifyFriendsFields();
        };

        function sendPushMessage(channel, message) {
            var pushChannel = CHANNEL_PREFIX + channel;
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
        }

        $scope.clearNotifyFriendsFields = function () {
            $scope.notifyText = "";
        };

        // TODO : Disable showing friends who are already shared in the list
        $scope.getFacebookFriendsDetails = function () {
            //facebookFriends = new Object();
            //facebookFriends = [];
            //facebookConnectPlugin.api("me?fields=friends{id,name,picture}", [],
            //    function (resultSuccess) {
            //for (var index in resultSuccess.friends.data) {
            //    var myFriendFacebookId = resultSuccess.friends.data[index].id;
            //    var myFriendFacebookName = resultSuccess.friends.data[index].name;
            //    var myFriendFacebookPicture = resultSuccess.friends.data[index].picture;
            //    var newFacebookFriend = new FacebookFriend(myFriendFacebookId, myFriendFacebookName, myFriendFacebookPicture);
            //    facebookFriends.push(newFacebookFriend);

            //facebookFriends[myFriendFacebookId] = {
            //    id: myFriendFacebookId,
            //    name: myFriendFacebookName
            //};
            //getImages();
            $("#menuPanel").panel("close");
            $("#shareListPopUp").popup("open");
            //}
            //}
            //);
        };

        //function getImages() {
        //    FB.init({
        //        appId: '1060741983939011',
        //        status: true,
        //        xfbml: true,
        //        version: 'v2.3' // or v2.0, v2.1, v2.0
        //    });
        //
        //    FB.api("10152238736957364/picture?type=large", function (s) {
        //        x = s
        //    })
        //    var friendId;
        //    for (var id in facebookFriends) {
        //        friendId = facebookFriends[id].id;
        //        //facebookConnectPlugin.api(, ["public_profile"],
        //        FB.api(friendId + "/picture?type=large", function (success) {
        //                facebookFriends[id].image = success.data.url;
        //            }
        //        );
        //        //function (largePictureResultSuccess) {
        //        //    console.log(largePictureResultSuccess);
        //        //    var myFriendFacebookPicture = largePictureResultSuccess.data.url;
        //        //    console.log(myFriendFacebookPicture);
        //        //}
        //        //);
        //    }
        //}

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
            var channel = friendUsernameInParse;
            var message = fullName + " shared his list with you.";
            sendPushMessage(channel,message);
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

