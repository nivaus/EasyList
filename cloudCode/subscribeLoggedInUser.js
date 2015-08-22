var _ = require('underscore');

Parse.Cloud.define("subscribeLoggedInUser", function (request, response) {

    console.log("==========================================================================================");
    Parse.Cloud.useMasterKey();
    var query = new Parse.Query(Parse.Installation);
    var installationObjectId = request.params.installationObjectId;
    var username = Parse.User.current().attributes.username;

    query.get(installationObjectId, {
        success: function (installation) {
            // object is an instance of Parse.Object.
            installation.set("username", username);
            installation.save();
            addChannelsToInstallations("I8OECfZ0Zt2d4MCUUmNP1HV4E", ["testA", "testB"], response);
            //response.success("OK");
        },

        error: function (object, e) {
            // error is an iof Parse.Error.
            console.log(object);
            console.log(error);
            response.error("Error");
        }
    });
});

function addChannelsToInstallations(username, channelsArray, response) {
    console.log("addChannelsToInstallations");
    Parse.Cloud.useMasterKey();
    var query = new Parse.Query(Parse.Installation);
    query.equalTo("username", username);

    query.find(function (results) {
            // results is an array of Parse.Object.
            console.log(results);
            var newChannels;
            for (var index in results) {
                newChannels = results[index].get("channels");

                newChannels.concat(channelsArray);
                console.log(newChannels);
                newChannels = _.uniq(newChannels)
                results[index].set("channels", newChannels);
            }
            Parse.Object.saveAll(results, {
                success: function(list) {
                    // All the objects were saved.
                    console.log("success");
                    response.success("OK");
                },
                error: function(error) {
                    // An error occurred while saving one of the objects.
                    console.log("error");
                    response.error("Error");
                },
            });

        },
        function (error) {
            // error is an instance of Parse.Error
            console.log(error);
            response.error("ERROR");
        });
}