if (Meteor.isServer) {
  Meteor.methods({
    githubUserNameAPI: function (username) {
      this.unblock();
      var resp = HTTP.get("https://api.github.com/users/"+username,{
        headers: {
          "User-Agent": username
        }
      });
      console.log(resp);
      return resp;
    }
  });
}


if (Meteor.isClient) {
  Template.body.events({
    "submit #get-username": function (event) {
      event.preventDefault();
      var username = event.target.username.value;
      Meteor.call("githubUserNameAPI",username, function(error, results) {
        console.log(results);
      });
      event.target.username.value = "";
    }
  });
}
