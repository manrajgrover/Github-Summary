if (Meteor.isServer) {
  var Future=Npm.require("fibers/future");
  Meteor.methods({
    getRateLimit: function(){
      var res = HTTP.get("https://api.github.com/rate_limit",{
        headers: {
          "User-Agent": "Github-Summary"
        }
      });
      return res;
    },
    getDetails: function(urls,username){
      var range = _.range(urls.length);
      var futures = _.map(range,function(index){
        var future = new Future();
        HTTP.get(urls[index],{
          headers: {
            "User-Agent": username
          }
        },function(error,result){
          future.return(result);
        });
        return future;
      });
      var results = _.map(futures,function(future,index){
        var result=future.wait();
        return result;
      });
      return results;
    }
  });
}


if (Meteor.isClient) {
  function sortResults(data, prop, asc) {
    data = data.sort(function(a, b) {
        if (asc) return (a[prop] > b[prop]) ? 1 : ((a[prop] < b[prop]) ? -1 : 0);
        else return (b[prop] > a[prop]) ? 1 : ((b[prop] < a[prop]) ? -1 : 0);
    });
    return data;
  }
  Template.body.helpers({
    rateError: function () {
      var limit = Template.instance().limit.get();
      return limit<4;
    }
  });
  Template.body.created = function (){
    var self = this;
    self.limit = new ReactiveVar(0);
    Meteor.call("getRateLimit", function (error, results) {
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
      var urls = ["https://api.github.com/users/"+username,"https://api.github.com/users/"+username+"/repos?type=owner&sort=pushed&per_page=200"];
      Meteor.call("getDetails",urls,username, function(error, results) {
        if(error){
          $("#summary").text("Username entered by you does not exist!");
        }
        else{
              console.log(results[0]);
              console.log(results[1]);
              var summary = "";
              var languages={};
              var name = results[0].data.name;
              var url = results[0].data.url;
              var numberOfRepos = results[0].data.public_repos;
              var numberOfFollowers = results[0].data.followers;
              var email = results[0].data.email;
              var blog = results[0].data.blog;
              var location = results[0].data.location;
              var createdAccount = moment(results[0].data.created_at).format('Do MMMM, YYYY');
              var lastActivity = moment(results[0].data.updated_at).format('Do MMMM, YYYY');
              for(var i=0;i<results[1].length;i++){
                var repo = results[1][i];
                if(!repo.fork){
                  if(repo.language in languages){
                    languages[repo.language] += 1;
                  }
                  else{
                    languages[repo.language] = 1; 
                  }
                }
              }
              var max = 0;
              var popular="";
              for(var k in languages){
                if(languages[k] > max){
                  popular = k;
                }
              }
              summary += '<a href="'+url+'" target="_blank">' + name + '</a> joined Github on ' + createdAccount + ' and was last active on ' + lastActivity+ '. ';
              summary += 'He/She has ' + numberOfRepos + ' <a href="'+url+'?tab=repositories" target="_blank">public repositories</a> and '+ numberOfFollowers + ' followers. ';
              if(location != null){
                summary += name + ' is currently in ' + location +'.';  
              }
              if(blog != null){
                summary += 'You can find his/her blog <a href="'+blog+'" target="_blank">here</a>. ';  
              }
              if(email != null){
                summary += 'You can email him at <a href="mailto:'+email+'" target="_blank">'+email+'</a>.';  
              }
              $("#avatar").show();
              $("#avatar").attr("src",results[0].data.avatar_url);
              $("#summary").html(summary);
            //}
          //});
          //var adjectives = {};
          //console.log(adjectives);
          // last active on github DONE
          // joined DONE
          // BLOG
          // COMPANY
          // Lives in
          // EMAIL
          // Stats on number of repos DONE
          // organizations
        }
      });
      //event.target.username.value = "";
    }
  });
}
