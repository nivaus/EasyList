/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
// TODO : Change every this element to $scope
$.mobile.buttonMarkup.hoverDelay = 0;

var listContent = new Object();
var DEFAULT_PRODUCT_IMAGE = "http://files.parsetfss.com/64d6988d-576e-4edc-b686-e7a05d6ed73b/tfss-c2486cd8-6833-4ef0-b569-7d1445ebee99-shopping-cart.png";
var PHOTO_LIBRARY = 0;
var PHOTO_CAMERA = 1;
//var listId = localStorage.getItem("listId");
var listId = "4vfJrTpOlW";
var listContentApp = angular.module('SmartShoppingList', []);


listContentApp.controller('ShoppingListController', function ($scope) {
        this.listContent = listContent;
        this.selectedProduct;
        this.inEditMode = false;

        getList($scope,listId);

        this.addProduct = function (productCategory, productName, productQuantity) {
            productQuantity = parseInt(productQuantity);

            if (listContent.hasOwnProperty(productCategory) === true) //if a category is already created
            {
                this.addNewProductToExistingCategory(productCategory, productName, productQuantity);
            }
            else {
                this.addNewProductToNewCategory(productCategory, productName, productQuantity);
            }

            $("#addProductPopup").popup("close");
            $("#addProductPanel").panel("close");
            $scope.productCategory = "";
            $scope.productName = "";
            $scope.productQuantity = "";
        };

        this.addNewProductToNewCategory = function (productCategory, productName, productQuantity) {
            listContent[productCategory] = {
                categoryName: productCategory,
                products: []
            };
            var productImage = DEFAULT_PRODUCT_IMAGE;
            var newProduct = new Product(null, productCategory, productName, productQuantity, productImage, false);
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
                var newProduct = new Product(null, productCategory, productName, productQuantity, productImage, false);
                addNewProductToParse($scope, newProduct);
            }
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

        this.toggleProductChecked = function(product) {
            product.productChecked = !product.productChecked;
        };

        this.updateSelectedProduct = function (product) {
            this.selectedProduct = product;
        };

        this.removeSelectedProduct = function () {
            var categoryName = this.selectedProduct.categoryName;
            if (this.listContent.hasOwnProperty(categoryName) === true)
            {
                deleteProductFromParse($scope, this.selectedProduct);
            }
        };

        this.editList = function () {
            this.addQuantityEditing();
        };

        this.executeEditOrSaveFunction = function () {
            if (this.inEditMode === true)
                this.saveList();
            else
                this.editList();
            this.inEditMode = !this.inEditMode;
        };

        this.saveList = function () {
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
            var popover = new CameraPopoverOptions(300, 300, 100, 100, Camera.PopoverArrowDirection.ARROW_ANY);
            var cameraOptions = {
                quality: 100,
                destinationType: Camera.DestinationType.DATA_URL,
                allowEdit: true,
                sourceType: "",
                encodingType: Camera.EncodingType.JPEG,
                targetWidth: 500,
                targetHeight: 500,
                popoverOptions: popover,
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

        this.showLoadingWidget = function() {
            $.mobile.loading('show', {
                text: 'Uploading Image...',
                textVisible: true,
                theme: 'a',
                html: ""
            });
        };

        this.hideLoadingWidget = function() {
            $.mobile.loading('hide');
        };

        $scope.navigateToUserLists = function() {
            window.location = "userLists.html";
        };

        $scope.logOut = function()
        {
            facebookConnectPlugin.logout(
                function(success)
                {
                    console.log("User logged Out From Facebook.");
                    Parse.User.logOut();
                    console.log("User logged Out From Parse.");
                    cleanSavedLocalStorage();
                    console.log("Local Storage Cleaned.");
                    window.location = "logIn.html";
                },
                function(error)
                {
                    console.log(error);
                }
            );
        };

        function cleanSavedLocalStorage()
        {
            localStorage.removeItem("listId");
        }

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

