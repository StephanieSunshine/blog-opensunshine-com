Posts = new Meteor.Collection('posts');

Posts.allow({
  insert: function(userId, doc) {
    // only allow posting if you are logged in
    return !! userId; 
  },
  update: function(userId, doc) {
    // only allow updating if you are logged in
    return !! userId; 
  },
  remove: function(userId, doc) {
    //only allow deleting if you are owner
    return doc.submittedById === Meteor.userId();
  }
});

Accounts.config({
  forbidClientAccountCreation : true
});

Posts.attachSchema(new SimpleSchema({
  title: {
    type: String,
    label: "Title",
    max: 60,
    autoform: {
      afFieldInput: {
        type: "text",
        class: "input-xxlarge"
      }
    } 
  },
  shortId: {
    type: String,
    defaultValue: ShortId.generate(),
    autoform: {
      afFieldInput: {
        type: "hidden",
        label: false,
        class: "hidden" },
      afFormGroup: { label: false } 
    }  
  },
  date: {
    type: Date,
    defaultValue: new Date(),
    autoform: {
      afFieldInput: {
        type: "hidden",
        label: false,
        class: "hidden" },
      afFormGroup: { label: false } 
    }
  },
  keywords: {
    type: String,
    label: "Keywords",
    autoform: {
      afFieldInput: {
        type: "text",
        class: "input-xxlarge"
      }   
    }
  },
  body: {
    type: String,
    label: "Body",
    autoform: {
      afFieldInput: {
        type: "textarea",
        rows: 20, 
        class: "input-xxlarge"
      }   
    }
  }  
}));


Router.route('/', function () {
    this.layout('main');
    this.render('posts');
    this.render('coldHeader', {to: 'header'});
});

Router.route('/login', function () {
    this.layout('main');
    this.render('warmHeader', {to: 'header'});
    this.render('login');
});

Router.route('/home', function () {
    this.layout('main');
    this.render('postsMobile');
    this.render('warmHeader', {to: 'header'});
});

Router.route('/contact', function () {
    this.layout('main');
    this.render('contact');
    this.render('warmHeader', {to: 'header'});
});

Router.route('/about', function () {
    this.layout('main');
    this.render('about');
    this.render('warmHeader', {to: 'header'});
});

Router.route('/posts/:shortId', function () {
    this.layout('main');
    this.render('postDetail');
    this.render('warmHeader', {to: 'header'});
});

Router.route('/create', function () {
    if(Meteor.user()) { 
      this.layout('main');
      this.render('create');
      this.render('warmHeader', {to: 'header'});
    }else{
      Router.go('/home');
    }
});

Router.route('/slider', function () {
    var slider = Posts.find({}, { sort: {date: -1}, limit:4}).fetch();
    this.layout('raw');
    this.render('json');
    this.response.writeHead(200, {'Content-Type': 'application/json'});
    slider.forEach(function ( ele, ind, arr ) {
      arr[ind].date = moment(arr[ind].date).format('MMMM DD, YYYY');
    });
    this.response.end(JSON.stringify(slider));
    }, { where: 'server' });

if (Meteor.isClient) {
  Meteor.subscribe('posts');
 
  Template.login.events({
    'submit form': function(event) {
      event.preventDefault();
      var emailVar = event.target.loginEmail.value;
      var passwordVar = event.target.loginPassword.value;
      Meteor.loginWithPassword(emailVar, passwordVar);
      console.log("Login attempted");
    },
    'click .logout': function(event){
        event.preventDefault();
        Meteor.logout();
    }
  });

  UI.registerHelper('shortIt', function(stringToShorten, maxCharsAmount){
    if(stringToShorten.length > maxCharsAmount){return stringToShorten.substring(0, maxCharsAmount) + '...'; }
  return stringToShorten;
  });

  Template.registerHelper("local_date", function(date) { return(moment(date).format('MMMM DD, YYYY')); });

  Template.postDetail.helpers({ 
    posts:                function()  { var sid = Router.current().params.shortId; return([Posts.findOne({ shortId: sid })]); }
  });

  Template.nav.helpers({
    current_page_home:    function()      { if((Router.current().route.getName() == undefined)||(Router.current().route.getName() == 'home')){return('current');}else{return('');} },
    current_page_about:   function()      { if(Router.current().route.getName() == 'about'){return('current');}else{return('');} },
    current_page_contact: function()      { if(Router.current().route.getName() == 'contact'){return('current');}else{return('');} }
  });

  Template.postsDesktop.helpers({
    posts:                function()      { return(Posts.find({}, {sort: {date: -1}, limit:6, skip:4})); }
  });

  Template.postsMobile.helpers({
    posts:                function()      { return(Posts.find({}, {sort: {date: -1}, limit:10})); }
  });
}

if (Meteor.isServer) {
  Meteor.startup(function () {
    // code to run on server at startup
    Meteor.publish("posts", function(){ return Posts.find(); });
  });
}
