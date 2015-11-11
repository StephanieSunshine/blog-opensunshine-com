// Define collection
Posts = new Meteor.Collection('posts');

// Define collection permissions
Posts.allow({
    insert: function(userId, doc) {
        // only allow posting if you are logged in
        return !!userId;
    },
    update: function(userId, doc) {
        // only allow updating if you are logged in
        return !!userId;
    },
    remove: function(userId, doc) {
        //only allow deleting if you are owner
        return doc.submittedById === Meteor.userId();
    }
});

// Limit account creation -- turn off when a new user is needed
Accounts.config({
    forbidClientAccountCreation: true
});

// Define some schema for autoform
Posts.attachSchema(new SimpleSchema({
    // Title of the post
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
    // Short Id for simple URLs
    shortId: {
        type: String,
        defaultValue: ShortId.generate(),
        autoform: {
            afFieldInput: {
                type: "hidden",
                label: false,
                class: "hidden"
            },
            afFormGroup: {
                label: false
            }
        }
    },
    // Date
    date: {
        type: Date,
        defaultValue: new Date(),
        autoform: {
            afFieldInput: {
                type: "hidden",
                label: false,
                class: "hidden"
            },
            afFormGroup: {
                label: false
            }
        }
    },
    // Comma seporated list of keywords
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
    // Body of posting
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

// Routes
Router.route('/', function() {
    this.layout('main');
    this.render('posts');
    this.render('coldHeader', {
        to: 'header'
    });
});

Router.route('/login', function() {
    this.layout('main');
    this.render('warmHeader', {
        to: 'header'
    });
    this.render('login');
});

Router.route('/home', function() {
    this.layout('main');
    this.render('postsMobile');
    this.render('warmHeader', {
        to: 'header'
    });
});

Router.route('/contact', function() {
    this.layout('main');
    this.render('contact');
    this.render('warmHeader', {
        to: 'header'
    });
});

Router.route('/about', function() {
    this.layout('main');
    this.render('about');
    this.render('warmHeader', {
        to: 'header'
    });
});

Router.route('/posts/:shortId', function() {
    this.layout('main');
    this.render('postDetail');
    this.render('warmHeader', {
        to: 'header'
    });
});

// Requires an authenticated user
Router.route('/create', function() {
    if (Meteor.user()) {
        this.layout('main');
        this.render('create');
        this.render('warmHeader', {
            to: 'header'
        });
    } else {
        Router.go('/home');
    }
});

// this feeds main.js for the intro desktop slider. Output is in JSON for easy jQuery parsing
Router.route('/slider', function() {
    var slider = Posts.find({}, {
        sort: {
            date: -1
        },
        limit: 4
    }).fetch();
    this.layout('raw');
    this.render('json');
    this.response.writeHead(200, {
        'Content-Type': 'application/json'
    });
    slider.forEach(function(ele, ind, arr) {
        arr[ind].date = moment(arr[ind].date).format('MMMM DD, YYYY');
    });
    this.response.end(JSON.stringify(slider));
}, {
    where: 'server'
});

// Client side goodies
if (Meteor.isClient) {
    // Get some perms to posts for the clients
    Meteor.subscribe('posts');
    
    // Login / Logout Authentication
    Template.login.events({
        'submit form': function(event) {
            event.preventDefault();
            var emailVar = event.target.loginEmail.value;
            var passwordVar = event.target.loginPassword.value;
            Meteor.loginWithPassword(emailVar, passwordVar);
            console.log("Login attempted");
        },
        'click .logout': function(event) {
            event.preventDefault();
            Meteor.logout();
        }
    });

    // Truncate strings for summary views
    UI.registerHelper('shortIt', function(stringToShorten, maxCharsAmount) {
        if (stringToShorten.length > maxCharsAmount) {
            return stringToShorten.substring(0, maxCharsAmount) + '...';
        }
        return stringToShorten;
    });

    // Generate a human readable date
    Template.registerHelper("local_date", function(date) {
        return (moment(date).format('MMMM DD, YYYY'));
    });

    // Get a detailed posting
    Template.postDetail.helpers({
        posts: function() {
            var sid = Router.current().params.shortId;
            return ([Posts.findOne({
                shortId: sid
            })]);
        }
    });

    // Navigation highlights Todo: add highlights for auth areas
    Template.nav.helpers({
        current_page_home: function() {
            if ((Router.current().route.getName() == undefined) || (Router.current().route.getName() == 'home')) {
                return ('current');
            } else {
                return ('');
            }
        },
        current_page_about: function() {
            if (Router.current().route.getName() == 'about') {
                return ('current');
            } else {
                return ('');
            }
        },
        current_page_contact: function() {
            if (Router.current().route.getName() == 'contact') {
                return ('current');
            } else {
                return ('');
            }
        }
    });

    // Render the proper offset of articles in desktop mode
    Template.postsDesktop.helpers({
        posts: function() {
            return (Posts.find({}, {
                sort: {
                    date: -1
                },
                limit: 6,
                skip: 4
            }));
        }
    });
    
    // Render the proper articles count for mobile mode
    Template.postsMobile.helpers({
        posts: function() {
            return (Posts.find({}, {
                sort: {
                    date: -1
                },
                limit: 10
            }));
        }
    });
}

if (Meteor.isServer) {
    Meteor.startup(function() {
        // code to run on server at startup
        // Allow the posts collection to be manipulated based on ACL's set earlier
        Meteor.publish("posts", function() {
            return Posts.find();
        });
    });
}
