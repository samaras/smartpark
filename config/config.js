/**
 *
 * Config Module 
 *
 */

var config = {mysql:{}, redis:{}, mail:{}, parking_api: {}}

config.mysql = {
    host: 'localhost',
    user: 'root',
    password: '1samuel1',
    database: 'smartparkdb'
};

config.redis = {
    host: 'localhost',
    port: 6379,
};

config.mail = {
    service: "Gmail",
    user: "samuel@littlebuddhadigital.com",
    password: "1samuel1"
};

// My Vendor Connection Credentials(eg to ZMS for instance)
config.parking_api = {
    client_id: "",
    client_secret: "",
    vendor_id: "",
    user: "",
    password: ""
}

module.exports = config;