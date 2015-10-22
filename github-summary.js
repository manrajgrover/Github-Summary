if (Meteor.isServer) {
  Meteor.methods({
    githubUserNameAPI: function (username) {
      this.unblock();
      var res = HTTP.get("https://api.github.com/users/"+username,{
        headers: {
          "User-Agent": username
        }
      });
      console.log(res);
      return res;
    },
    getRateLimit: function(){
      var res = HTTP.get("https://api.github.com/rate_limit",{
        headers: {
          "User-Agent": "Github-Summary"
        }
      });
      return res;
    }
  });
}


if (Meteor.isClient) {
  Template.body.helpers({
    rateError: function () {
      var limit = Template.instance().limit.get();
      return limit<4;
    }
  });
  Template.body.created = function (){
    var self = this;
    self.limit = new ReactiveVar(0);
    Meteor.call('getRateLimit', function (error, results) {
        if(error){
          console.log(error);
        }
        else{
          var limit = results.data.rate.remaining;
          self.limit.set(limit);
        }
    });
  }
  Template.body.events({
    "submit #get-username": function (event) {
      event.preventDefault();
      var username = event.target.username.value;
      Meteor.call("githubUserNameAPI",username, function(error, results) {
        if(error){
          $("#summary").text("Username entered by you does not exist!");
        }
        else{
          console.log(results);
          $("#summary").text("Generated Summary");
        }
      });
      //event.target.username.value = "";
    }
  });
}
