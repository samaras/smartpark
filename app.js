
/**
 * Module dependencies.
 */

var express = require('express');
var connect = require('connect');
var routes = require('./routes');
var user = require('./routes/user');
var admin = require('./routes/admin');
var smartpark = require('./routes/smartpark');
var flash = require('connect-flash');
var http = require('http');
var path = require('path');
//var expressCsrf = express.csrf();
var helmet = require("helmet");
var RedisStore = require('connect-redis')(express);
var Config = require('./config/config');
var fs = require('fs');
var oauth2orize = require('oauth2orize');
var oauthserver = require('node-oauth2-server');
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var ClientPasswordStrategy  = require('passport-oauth2-client-password').Strategy;
var BearerStrategy = require('passport-http-bearer').Strategy;
var log = require('./libs/log')(module);
var roles = require('./libs/user_roles');
var usersById = {};
var nextUserId = 0;

var ModUser = require("./modules/users.js");
var SmartParkMod = require("./modules/smartpark.js");


// Passport Sessions
passport.serializeUser(function(user, done) {
    done(null, user.id);
});

passport.deserializeUser(function(id, done) {
    ModUser.findUserById(id, function (err, user) {
        done(err, user);
    });
});

// Passport Local Stategy Handling
passport.use(
    new LocalStrategy(
        function(username, password, done){
            process.nextTick(function () {
                ModUser.findOne({username:username, password: password}, function(err, user){
                    if (err) { return done(err); }
                    if (user === null) {
                        console.log("Error login User with username: " + username + " & passwd: " + password);
                        log.info("Error login User with username: " + username + " & passwd: " + password);
                        return done(null, false, { message: "Username/password incorrect"});
                    }
                    else {
                        ModUser.updateLastLogin(user.id, function(err, result) {
                            if (err) { res.status(500); }
                            if(result) {
                               log.info("Login Successful: "+ username);
                            }
                            else{
                              log.error("Error on updateLastLogin: "+ username);  
                            }
                        });
                        return done(null, user);
                    }
                });
            });
        })
);


/**
 * BearerStrategy
 *
 * This strategy is used to authenticate users based on an access token (aka a
 * bearer token).  The user must have previously authorized a client
 * application, which is issued an access token to make requests on behalf of
 * the authorizing user.
 */
passport.use(new BearerStrategy(
    function(accessToken, done) {
        SmartParkMod.getAccessToken(accessToken, function(err, token) {
        if (err) { return done(err); }
        if (!token) { return done(null, false); }
        var info = { scope: '*' }
        UserMod.findUserById(token.user_id, function(err, result){
            if (err) { return done(null, false); }
            if (!result) { return done(null, false); }
            user = result[0];
            done(null, user, info);    
        });
        
    });
  }
));


/**
 * ClientPasswordStrategy
 *
 * Validate the client (using the ClientPasswordStrategy of passport.js)
 */
passport.use(new ClientPasswordStrategy(
    function(clientId, clientSecret, done) {
        SmartParkMod.getClient({ clientId: clientId }, function (err, client) {
            if (err) { return done(err); }
            if (!client) { return done(null, false); }
            if (client.clientSecret != clientSecret) { return done(null, false); }
            return done(null, client);
        });
    }
));

// get express application
var app = express();

// all environments
app.set('port', process.env.PORT || 3000);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.json());
app.use(express.urlencoded());
app.use(express.methodOverride());
// required because of oauth provider
app.use(express.bodyParser());

app.use(express.cookieParser());
app.use(express.session({ 
  store: new RedisStore(),
  secret: "secretsmartparkthingy",
  cookie: { 
    maxAge: 3600000 ,
    //httpOnly: true,
    //secure: true
  },
  key: "sessionId"
}));

app.use(passport.initialize());
app.use(passport.session());
app.use(flash());
app.disable('x-powered-by');
app.use(helmet.defaults());

// OAuth provider settings
app.oauth = oauthserver({
    model: require('./modules/smartpark'), // See below for specification
    grants: ['auth_code', 'refresh_token', 'passwords'],
    debug: true
});

// Cross site forgery
/*app.use(express.csrf());
app.use(function(req, res, next){
    res.locals.token = req.session._csrf;
    next();
});

var customCsrf = function (req, res, next) {
    // I assume exact match, but you can use regex match here
  var csrfEnabled = true;
  var whiteList = new Array("/pattern1/param1","/pattern2/param2","/pattern3/param3");
  if (whiteList.indexOf(req.path) != -1) {
    csrfEnabled = false;
  }

  if (csrfEnabled) {
    expressCsrf(req, res, next);
  } else {
    next();
  }
}

app.use(customCsrf);
*/
app.use(app.router);
app.use(express.static(path.join(__dirname, 'public')));



// Handle Error Request
app.use(function(req, res, next){
  res.status(404);

  // respond with html page
  if (req.accepts('html')) {
    var user = req.user;
    log.debug('Not found URL: %s',req.url);
    res.render('404', { url: req.url, title: "Error", user: user });
    return;
  }

  // respond with json
  if (req.accepts('json')) {
    res.send({ error: 'Not found' });
    return;
  }

  // default to plain-text. send()
  res.type('txt').send('Not found');
});

/*app.use(function(err, req, res, next){
    // we may use properties of the error object
    // here and next(err) appropriately, or if
    // we possibly recovered from the error, simply next().
    var user = null;
    if (req.isAuthenticated()) { user = req.user; }
    log.error('Internal error(%d): %s', res.statusCode, err.message);
    res.status(err.status || 500);
    res.render('500', { error: err, user: user });
});
*/
// development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
}

app.get('/', routes.index);

// Login/logout
app.get('/login', user.login);
app.get('/register', user.register);
app.post('/login',  passport.authenticate("local", 
    { successRedirect: '/account/profile', failureRedirect: '/login', failureFlash: true }), 
    function(req, res) {
        var targetUrl = req.session.pageAfterLogin;
        delete req.session.pageAfterLogin;
        res.redirect(targetUrl || '/account/profile');
    }
);

app.post('/register', user.registerUser);
app.get('/logout', function (req, res) {
    req.logout();
    req.session.destroy(function () {
        res.redirect('/');
    });
});


// Reset user password
app.get('/forgot', user.forgot);
app.get('/reset/:tid', user.reset);
app.post('/forgot', user.forgotPost);
app.post('/reset', user.resetPost);

function List() {
  this.listSize = 0;
  this.pos = 0;
  this.dataStore = [];
  this.contains = contains;
  this.append = append;

  function append (element) {
    this.dataStore[this.listSize++] = element;
  }

  function contains(element) {
    for(var i = 0; i < this.dataStore.length; ++i){
      if(this.dataStore[i]==element){
        return true;
      }
    }
    return false;
  } 

  function length() {
    return this.listSize;
  } 
}

var notAdmin = new List();
notAdmin.append("company");
notAdmin.append("regular");

var g_company = new List();
g_company.append("company");

var g_admin = new List();
g_admin.append("admin");

app.get('/test', routes.test);

app.get('/ticket', roles.requireRole(notAdmin), routes.scanTicket);
app.post('/ticket', roles.requireRole(notAdmin), routes.validateTicket);

app.get('/account/profile', ensureAuthenticated, user.profile);
app.get('/account/reports', ensureAuthenticated, user.reporting);

app.get('/account/users', roles.requireRole(notAdmin), user.companyUsers);
app.get('/account/users/create', roles.requireRole(notAdmin), user.createCompanyUsers);
app.post('/account/users/create', roles.requireRole(notAdmin), user.saveCompanyUsers);

app.get('/account/users/edit', ensureAuthenticated, user.editProfile);
app.post('/account/users/edit', roles.requireRole(g_company), user.saveProfile);
app.get('/account/users/changepassword', ensureAuthenticated, user.changePassword);
app.post('/account/users/changepassword', ensureAuthenticated, user.changePasswordPost);
app.get('/account/balance', roles.requireRole(notAdmin), user.balance);
app.get('/account/addcredit', roles.requireRole(notAdmin), user.addCredit);
app.post('/account/addcredit', roles.requireRole(notAdmin), user.processAddCredit);
app.get('/account/parkingareas', ensureAuthenticated, user.parkingareas);
app.get('/account/transactions/area/:id', ensureAuthenticated, user.parkingareatrans);
app.get('/account/transact/:id', ensureAuthenticated, user.transact);
app.get('/account/transactions', ensureAuthenticated, user.myTransactions);
app.get('/account/transactions/:user_id', ensureAuthenticated, user.transactions);
app.get('/account/transfer/credit', roles.requireRole(notAdmin), user.transferCredit);
app.post('/account/transfer/credit', roles.requireRole(notAdmin), user.processTransferCredit)

// Admin routes 
app.get('/admin', roles.requireRole(g_admin), admin.index);
app.get('/admin/companies', roles.requireRole(g_admin), admin.companies);

app.get('/admin/transactions', roles.requireRole(g_admin), admin.transactions);

app.get('/admin/companies/add', roles.requireRole(g_admin), admin.createCompany);
app.post('/admin/companies/add', roles.requireRole(g_admin), admin.saveCompany);

app.get('/admin/companies/:id', roles.requireRole(g_admin), admin.manageCompany);
app.post('/admin/companies/:id', roles.requireRole(g_admin), admin.saveCompany);

app.get('/admin/companies/del/:id', roles.requireRole(g_admin), admin.deleteCompany);
app.get('/admin/reports', roles.requireRole(g_admin), admin.systemReports);
app.get('/admin/vendors', roles.requireRole(g_admin), admin.manageVendors);
app.post('/admin/vendor', roles.requireRole(g_admin), admin.addVendor);
//app.post('/admin/vendor', ensureAuthenticated, admin.createVendor);
app.get('/admin/users', roles.requireRole(g_admin), admin.users);
app.get('/admin/users/create', roles.requireRole(g_admin), admin.createUser);
app.post('/admin/users/create', roles.requireRole(g_admin), admin.saveUser);
app.get('/admin/users/company/:id', roles.requireRole(g_admin), admin.companyUsers);
app.get('/admin/users/del/:id', roles.requireRole(g_admin), admin.deleteUser);
app.get('/admin/users/:id', roles.requireRole(g_admin), admin.viewUser);

//app.get('/admin/manageareas', ensureAuthenticated, admin.vendorAreas); 
app.get('/admin/vendors/:id', roles.requireRole(g_admin), admin.vendor);
app.del('/admin/vendors/:id', roles.requireRole(g_admin), admin.deleteVendor);
app.put('/admin/vendors/:id', roles.requireRole(g_admin), admin.updateVendor);
app.del('/admin/manageareas/:id', roles.requireRole(g_admin), admin.deleteVendorArea);
app.get('/admin/manageareas', roles.requireRole(g_admin), admin.newParkingArea);
app.post('/admin/manageareas/:id', roles.requireRole(g_admin), admin.addParkingArea);


/*app.post("/account/requestcredit", express.csrf(), function(req, res, next) {
    // put your code here
});
*/

////////////// AJAX Calls ///////////////
app.get('/account/gettranspark', user.getTransPark);
app.get('/account/getcostperarea', user.getCostPerArea);
app.get('/account/getminperparkingarea', user.getMinPerParkingArea);
app.get('/account/getcostperday', user.getCostPerDay);
app.get('/account/getcostperareainmin', user.getCostPerAreaInMin);
app.get('/account/getcostbyday', user.getCostByDay);


app.get('/admin/visitedareas', admin.getVisitedAreas);
app.get('/admin/transpark', admin.getTransPark);
app.get('/admin/getdailyrevenue', admin.getDailyRevenue)

//////////// OAuth 2.0 /////////////////

// Oauth API Access

/*app.get('/api',  passport.authenticate('token', { session: false }),
    function(req, res) {
        res.json(req.user);
});
*/
app.get('/api/auth', passport.authenticate('bearer', { session: false }),
    function(req, res) {
        res.json(req.user);
});


//app.post('/api/request_token', smartpark.requestToken);
//app.post('/api/access_token', smartpark.accessToken);
//app.post('/api/auth', smartpark.authorize);

// Handle token grant requests
app.all('/api/token', app.oauth.grant());

// Show them the "do you authorise xyz app to access your content?" page
app.get('/api/authorise', function (req, res, next) {
    if (!req.session.user) {
        // If they aren't logged in, send them to your own login implementation
        return res.redirect('/api/login?redirect=' + req.path + '&client_id=' +
            req.query.client_id + '&redirect_uri=' + req.query.redirect_uri);
    }

    res.render('authorise', {
        client_id: req.query.client_id,
        redirect_uri: req.query.redirect_uri
    });
});

/*/ Handle login
app.post('/api/login', function (req, res, next) {
  // Insert your own login mechanism
  UserMod.findByUsername(req.body.username, function(err, user){
      if (user) {
            res.render('/api/login', {
              redirect: req.body.redirect,
              client_id: req.body.client_id,
              redirect_uri: req.body.redirect_uri
            });
      } else {
            // Successful logins should send the user back to the /oauth/authorise
            // with the client_id and redirect_uri (you could store these in the session)
            return res.redirect((req.body.redirect || '/home') + '?client_id=' +
                req.body.client_id + '&redirect_uri=' + req.body.redirect_uri);
        }
    });
});

// Handle authorise
app.post('/api/authorise', function (req, res, next) {
    if (!req.session.user) {
        return res.redirect('/api/login?client_id=' + req.query.client_id + '&redirect_uri=' + req.query.redirect_uri);
    }

    next();
    }, app.oauth.authCodeGrant(function (req, next) {
        // The first param should to indicate an error
        // The second param should a bool to indicate if the user did authorise the app
        // The third param should for the user/uid (only used for passing to saveAuthCode)
        next(null, req.body.allow === 'yes', req.session.user.id, req.session.user);
    }));
*/

app.get('/api', app.oauth.authorise(), function (req, res) {
    res.send('Secret area');
});

app.get('/api/user/list', app.oauth.authorise(), user.list);
app.get('/api/user/:id', app.oauth.authorise(), user.profile);
app.get('/api/user/balance/:id', app.oauth.authorise(), user.profile);

// OAuth Error Handler
app.use(app.oauth.errorHandler());

http.createServer(app).listen(app.get('port'), function(){
    log.info('Express server listening on port ' + app.get('port'));
    console.log('Express server listening on port ' + app.get('port'));
});

function ensureAuthenticated(req, res, next) {
    if (req.isAuthenticated()) { return next(); }
    
    //save the requested page and then redirected
    req.session.pageAfterLogin = req.url;
    res.redirect('/login');
}