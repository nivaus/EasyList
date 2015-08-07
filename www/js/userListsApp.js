/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
$.mobile.buttonMarkup.hoverDelay = 0;

var userName = "WBKj6Xmo5WGiaMmsoz8q3B1Ty";
var userLists = new Object();
var userListsApp = angular.module('UserListsApp', []);

userListsApp.controller('UserListsAppController', function ($scope) {
        this.userLists = userLists;
        getUserLists(userName,$scope);
        this.listContent = function()
        {
            window.location = "./listContent.html";
            //$scope.apply();
        };
    }
);