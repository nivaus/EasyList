/**
 * Created by oslander on 05/07/2015.
 */

var PARSE_APP_ID = "YNiKFOkpulbY1j19E2gcdSREgTKd0AiZZKtzJaeg";
var PARSE_JS_ID = "Ht7VpNFFhB6KKod4L8gvWlyzjwWt0PEPXjEHVD1H";

function Product(objectId, categoryName, productName, productQuantity, productImage, productChecked, listId) {
    this.objectId = objectId;
    this.categoryName = categoryName;
    this.productName = productName;
    this.productQuantity = productQuantity;
    this.productImage = productImage;
    this.productChecked = productChecked;
    this.listId = listId;
}

var getList = function ($scope, listId) {

    Parse.initialize(PARSE_APP_ID, PARSE_JS_ID);
    var ListContent = Parse.Object.extend("ListContent");
    var query = new Parse.Query(ListContent);
    query.equalTo("listId", listId);
    query.find(
        {
            success: function (results) {
                for (var i = 0, len = results.length; i < len; i++) {
                    var objectId = results[i].id;
                    var categoryName = results[i].get("categoryName");
                    var productName = results[i].get("productName");
                    var productQuantity = results[i].get("productQuantity");
                    var productImage = results[i].get("productImage");
                    var productChecked = results[i].get("productChecked");
                    var listId = results[i].get("listId");

                    if ($scope.listContent.hasOwnProperty(categoryName) === false) {
                        $scope.listContent[categoryName] = {
                            categoryName: categoryName,
                            products: []
                        };
                    }
                    var newProduct = new Product(objectId, categoryName, productName, productQuantity, productImage, productChecked, listId);
                    $scope.listContent[categoryName].products.push(newProduct);
                    console.log("New Product added with objectId: " + objectId);
                }
                $scope.hideOrShowEmptyListNotification();
                hideLoadingWidget();
                $scope.$apply();
            },
            error: function (error) {
                console.log(error);
            }
        }
    );
};

var addNewProductToParse = function ($scope, newProduct) {
    Parse.initialize(PARSE_APP_ID, PARSE_JS_ID);
    var ListContent = Parse.Object.extend("ListContent");
    var parseListContent = new ListContent();

    parseListContent.save({
        categoryName: newProduct.categoryName,
        productName: newProduct.productName,
        productQuantity: newProduct.productQuantity,
        productImage: newProduct.productImage,
        productChecked: newProduct.productChecked,
        listId: newProduct.listId
    }, {
        success: function (productFromParse) {
            var productCategory = newProduct.categoryName;
            newProduct.objectId = productFromParse.id;
            $scope.listContent[productCategory].products.push(newProduct);
            hideLoadingWidget();
            $scope.$apply();
            console.log('New Product created with objectId: ' + productFromParse.id);
        },
        error: function (productFromParse, error) {
            console.log('Failed to create new object, with error code: ' + error.message);
        }
    });
};

var toggleProductCheckedInParse = function ($scope, productToUpdate) {
    Parse.initialize(PARSE_APP_ID, PARSE_JS_ID);
    var ListContent = Parse.Object.extend("ListContent");
    var query = new Parse.Query(ListContent);
    query.equalTo("objectId", productToUpdate.objectId);
    query.first({
        success: function (productFromParse) {
            // Get the new value of product checked
            var productChecked = !productToUpdate.productChecked;
            // Update the new product checked value in parse
            productFromParse.set("productChecked", productChecked);
            productFromParse.save().then(function () {
                    // Update the new product checked value in listContent
                    productToUpdate.productChecked = productChecked;
                    $scope.$apply();
                    console.log('Product with objectId ' + productFromParse.id + ' updated successfully.');
                }
            );
        },
        error: function (product, error) {
            console.log('Failed to update object, with error code: ' + error.message);
        }
    });
};

var updateProductQuantityInParse = function ($scope, productToUpdate, newProductQuantity) {
    Parse.initialize(PARSE_APP_ID, PARSE_JS_ID);
    var ListContent = Parse.Object.extend("ListContent");
    var query = new Parse.Query(ListContent);
    query.equalTo("objectId", productToUpdate.objectId);
    query.first({
        success: function (productFromParse) {
            // Update the new quantity in parse
            productFromParse.set("productQuantity", newProductQuantity);
            productFromParse.save().then(function () {
                // Update the new quantity in the listContent
                productToUpdate.productQuantity = newProductQuantity;
                hideLoadingWidget();
                $scope.$apply();
                console.log('Product with objectId ' + productFromParse.id + ' quantity updated successfully.');
            });
        },
        error: function (product, error) {
            console.log('Failed to update object, with error code: ' + error.message);
        }
    });
};

var deleteProductFromParse = function ($scope, productToDelete) {
    Parse.initialize(PARSE_APP_ID, PARSE_JS_ID);
    var ListContent = Parse.Object.extend("ListContent");
    var query = new Parse.Query(ListContent);
    query.get(productToDelete.objectId, {
        success: function (product) {
            // Deleting the product from Parse
            product.destroy({}).then(function () {
                // Deleting the product from listContent
                removeProductFromList($scope.listContent, productToDelete);

                $scope.$apply();
                console.log('Product with objectId ' + product.id + ' deleted successfully.');
            });
        },
        error: function (product, error) {
            console.log('Failed to delete object, with error code: ' + error.message);
        }
    });
};

var changeProductPhotoInParse = function ($scope, productToUpdate, imageURI) {
    Parse.initialize(PARSE_APP_ID, PARSE_JS_ID);

    var file = new Parse.File(productToUpdate.objectId + ".jpg", {base64: imageURI});
    showLoadingWidget("Uploading Image...");
    file.save().then(function () {
        // The file has been saved to Parse.
        getProductFromParse(productToUpdate, function (productFromParse) {
            productFromParse.set("productImage", file.url());
            productFromParse.save().then(function () {
                productToUpdate.productImage = file.url();
                $scope.$apply();
                hideLoadingWidget();
            });
        })
    }, function (error) {
        // The file either could not be read, or could not be saved to Parse.
        console.log(error);
    });
};

var getProductFromParse = function (productToQuery, callBack) {
    Parse.initialize(PARSE_APP_ID, PARSE_JS_ID);
    var ListContent = Parse.Object.extend("ListContent");
    var query = new Parse.Query(ListContent);
    query.equalTo("objectId", productToQuery.objectId);
    query.first({
        success: function (product) {
            callBack(product);
        },
        error: function (product, error) {
            console.log('Failed to update object, with error code: ' + error.message);
        }
    });
};

var removeDeletedProductsInParse = function ($scope, productsToRemove) {
    console.log(productsToRemove);
    Parse.initialize(PARSE_APP_ID, PARSE_JS_ID);
    var ListContent = Parse.Object.extend("ListContent");
    var productId;
    for (var productIndex in productsToRemove) {
        productId = productsToRemove[productIndex].objectId;
        console.log(productId);
        var query = new Parse.Query(ListContent);
        query.get(productId, {
            success: function (product) {
                // Deleting the product from Parse
                product.destroy({}).then(function () {
                    console.log('Product with objectId ' + product.id + ' deleted successfully.');
                    hideLoadingWidget();
                });
            },
            error: function (product, error) {
                console.log('Failed to delete object, with error code: ' + error.message);
            }
        });
    }
    $scope.productsToRemove = [];
};