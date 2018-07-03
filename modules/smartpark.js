var mysql = require('mysql');
var bcrypt = require("bcrypt");

var conn = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '1samuel1',
    database: 'smartparkdb'
});

// Connect to db
conn.connect();

// Modules
EmailMod = require("./email.js");
UserMod = require("./users.js");


module.exports = {

    getAccessToken: function(bearerToken, callback) {
        console.log("mod/smartpark : getAccessToken 22");
        console.log(bearerToken);
        var sql = 'SELECT access_token, client_id, expires, user_id FROM oauth_access_tokens WHERE access_token = ?';
        conn.query(sql, bearerToken, function (err, result) {
            if (err || !result.length) return callback(err);
            // This object will be exposed in req.oauth.token
            // The user_id field will be exposed in req.user (req.user = { id: "..." }) however if
            // an explicit user object is included (token.user, must include id) it will be exposed
            // in req.user instead
            var token = result.rows[0];
            callback(null, {
                accessToken: token.access_token,
                clientId: token.client_id,
                expires: token.expires,
                userId: token.user_id
            });
        });
    },

    getClient: function(clientId, clientSecret, callback) {
        console.log("mod/smartpark: 40 getClient");
        console.log(clientId);
        console.log(clientSecret);
        var sql = 'SELECT client_id, client_secret, redirect_uri FROM oauth_clients WHERE client_id = ?';
        conn.query(sql, clientId, function (err, result) {
            if (err || !result.rowCount) return callback(err);

            var client = result.rows[0];
            
            if (clientSecret !== null && client.client_secret !== clientSecret) return callback();

            // This object will be exposed in req.oauth.client
            callback(null, {
                clientId: client.client_id,
                clientSecret: client.client_secret
            });
        });
    },

    getRefreshToken: function(bearerToken, callback) {
        var sql = 'SELECT refresh_token, client_id, expires, user_id FROM oauth_refresh_tokens WHERE refresh_token = ?';
        conn.query(sql, bearerToken, function (err, result) {
              // The returned user_id will be exposed in req.user.id
              if (err) { return callback(err); }
              callback(err, result.length ? result.rows[0] : false);
        });
    },

    // This will very much depend on your setup, I wouldn't advise doing anything exactly like this but
    // it gives an example of how to use the method to resrict certain grant types
    // var authorizedClientIds = ['abc1', 'def2'];
    grantTypeAllowed: function(clientId, grantType, callback) {
        if (grantType === 'password') {
            var authorizedClientIds = ['lbd', 'lbd1'];
            return callback(false, authorizedClientIds.indexOf(clientId.toLowerCase()) >= 0);
        }
        callback(false, true);
    },

    saveAccessToken: function(accessToken, clientId, expires, userId, callback) {
        // if (err) return callback(err);
        var sql = 'INSERT INTO oauth_access_tokens(access_token, client_id, user_id, expires) VALUES (?, ?, ?, ?)';
        conn.query(sql, [accessToken, clientId, userId, expires], function (err, result) {
            callback(err);
        });
    },

    saveRefreshToken: function (refreshToken, clientId, userId, expires, callback) {
        var sql = 'INSERT INTO oauth_refresh_tokens(refresh_token, client_id, user_id, expires) VALUES (?, ?, ?, ?)';
        client.query(sql, [refreshToken, clientId, userId, expires], function (err, result) {
            callback(err);
        });
    },

    getUser: function(username, password, callback) {
        sql = 'SELECT id FROM users WHERE username = '+ conn.escape(username) +' AND password = '+ conn.escape(password);
        client.query(sql, function (err, result) {
            callback(err, result.length ? result.rows[0] : false);
        });
    },

    validateRedirectUri: function(clientId, redirect_uri, callback){
        // strip url query params from uri
        var url = decodeURIComponent(redirect_uri); // decode url

        sql = "SELECT * FROM tokens WHERE client_id = "+ conn.escape(clientId) +" AND redirect_uri="+ conn.escape(url);
        conn.query(sql, client_id, function(err, response){
            if (err) { return err; }
            if (response){
                return callback(err, response);
            } else
            {
                return callback(err, null);
            }
        });
    }

}