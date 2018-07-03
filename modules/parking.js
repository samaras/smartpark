var mysql = require('mysql');
var Config = require('../config/config');
var log = require('../libs/log')(module);

var conn = mysql.createConnection({
    host: Config.mysql.host,
    user: Config.mysql.user,
    password: Config.mysql.password,
    database: Config.mysql.database
});

// Connect to db
conn.connect();

// Modules
EmailMod = require("./email.js");

module.exports = {
    /**
     * Find which areas the user parked at
     */
    findUserParkingAreas: function (userId, callback) {
        var sql = 'SELECT pa.id, pa.name, pa.vendor_id, pa.city, COUNT(up.parking_area_id) AS parking_areas, up.id AS upid, up.parking_area_id, up.user_id FROM user_parking AS up LEFT JOIN parking_areas AS pa ON up.parking_area_id=pa.id WHERE up.user_id=? GROUP BY (up.parking_area_id)';
        conn.query(sql, userId, function (err, result) {
            if (err) { return callback(err); }

            if (result !== null) 
            {
                return callback(null, result);
            } else {
                return callback(null, null);
            }
        });
    },

    findUserParkingAreasById: function (userParkingId, callback) {
        var sql = 'SELECT pa.id, pa.name, pa.vendor_id, pa.city, up.id, up.parking_area_id, up.user_id, up.transaction_id, up.time_in, up.time_out FROM user_parking AS up LEFT JOIN parking_area AS pa ON up.parking_area_id=pa.id WHERE pa.id=?';
        conn.query(sql, userParkingId, function (err, result) {
            if (err) return callback(err);

            var user_parkings = result;
            if (user_parkings !== null) 
            {
                return callback(null, user_parkings);
            } else {
                return callback(null, null);
            }
        });
    },

    findAllParkingAreas: function (callback) {
        var sql = 'SELECT pa.id, pa.name, pa.vendor_id, pa.city, pa.longitude, pa.latitude, v.vendor FROM parking_areas AS pa LEFT JOIN vendors AS v ON v.id=pa.vendor_id';
        conn.query(sql, function (err, result) {
            if (err) return callback(err);

            var parking_areas = result;
            if (parking_areas !== null) 
            {
                return callback(null, parking_areas);
            } else {
                return callback(null, null);
            }
        });
    },

    findVendorAreas: function (vendor_id, callback) {
        var sql = 'SELECT pa.id, pa.name, pa.vendor_id, pa.city, pa.longitude, pa.latitude, v.vendor FROM parking_areas AS pa LEFT JOIN vendors AS v ON v.id=pa.vendor_id WHERE pa.vendor_id=?';
        conn.query(sql, vendor_id, function (err, result) {
            if (err) return callback(err);

            var parking_areas = result;
            if (parking_areas !== null) 
            {
                return callback(null, parking_areas);
            } else {
                return callback(null, null);
            }
        });
    },

    findParkingVendors: function (callback) {
        var sql = "SELECT * FROM vendors";
        conn.query(sql, function (err, vendors) {
            if(err) { return callback(err); }
            if (vendors!=null) {
                return callback(null, vendors);
            } else {
                return callback(null);
            }
        });
    },

    findParkingByCity: function (city, callback) {
        var sql = 'SELECT pa.id, pa.name, pa.vendor_id, pa.city, pa.longitude, pa.latitude, v.vendor FROM parking_area AS pa LEFT JOIN vendors AS v ON v.id=pa.vendor_id WHERE pa.city=?';
        conn.query(sql, city, function (err, result) {
            if (err) return callback(err);

            var parking_areas = result;
            if (parking_areas !== null) 
            {
                return callback(null, parking_areas);
            } else {
                return callback(null, null);
            }
        });
    },

    findUserParkingByDay: function (date, callback) {
        // convert date to 2 datetime with time for start 00:00 and 23:59 for end 
        var d_start = date;
        d_start.setHours(00);
        d_start.setMinutes(00);
        d_start.setSeconds(00);
        var d_end = date;
        d_end.setHours(23);
        d_end.setMinutes(59);
        d_end.setSeconds(59);

        var sql = 'SELECT pa.id, pa.name, pa.vendor_id, pa.city, up.id, up.parking_area_id, up.user_id, up.transaction_id, up.time_in, up.time_out FROM user_parking AS up LEFT JOIN parking_area AS pa ON up.parking_area_id=pa.id WHERE up.user_id=? AND time_in BETWEEN '+ d_start +' AND '+ d_end;
        conn.query(sql, function (err, result) {
            if (err) return callback(err);

            var user_parkings = result;
            if (user_parkings !== null) 
            {
                return callback(null, user_parkings);
            } else {
                return callback(null, null);
            }
        });
    },

    findUserParkingTransById: function(userId, callback) {
        var sql = 'SELECT * FROM user_parking AS up LEFT JOIN transactions AS t ON (t.id=up.transaction_id) WHERE up.user_id=?';
        conn.query(sql, userId, function (err, result) {
            if(err) { return callback(err); }

            if(result || result.rowCount>0) {
                return callback(null, result);
            } else {
                return callback(null, null);
            }
        })     
    },

    /**
     * 
     */
    findUserParkingByTransId: function (transactionId, callback) {
        var sql = 'SELECT pa.id, pa.name, pa.vendor_id, pa.city, up.id, up.parking_area_id, up.user_id, up.transaction_id, up.time_in, up.time_out FROM user_parking AS up LEFT JOIN parking_area AS pa ON up.parking_area_id=pa.id WHERE up.transaction_id=?';
        conn.query(sql, transactionId, function (err, result) {
            if (err) return callback(err);

            var user_parkings = result[0];
            if (user_parkings !== null) 
            {
                return callback(null, user_parkings);
            } else {
                return callback(null, null);
            }
        });
    },

    /**
     * Save parking details for transaction 
     */
    saveUserParking: function (userId, parkAreaId, transId, timeIn, timeOut, callback) {
        var userParkingObj = {
            parking_area_id: parkAreaId, 
            user_id: userId,
            transaction_id: transId,
            time_in: timeIn,
            time_out: timeOut
        }

        conn.query("INSERT INTO user_parking SET ?", userParkingObj, function(err, queryres) {
            if(err) {
                return callback(err);
            }

            if (queryres !== null)
            {
                return callback(null, true);
            }
            else {
                return callback(null, false);
            }
        });
    },

    /**
     * Save Parking Area Vendors e.g Interpark SA
     */
    saveVendor: function (vendor, callback) {
        var vendorObj = {
            vendor: vendor,
        }

        conn.query("INSERT INTO vendors SET ?", vendorObj, function(err, queryres) {
            if(err) {
                return callback(err);
            }

            if (queryres !== null)
            {
                return callback(null, true);
            }
            else {
                return callback(null, false);
            }
        });
    },

    /**
     * Get api credentials for a specified vendor
     *
     */
    getVendorApiCredentials: function (vendor_id, callback) {
        sql = "SELECT * FROM parking_vendor_api_credentials WHERE vendor_id=?"
        conn.query(sql, vendor_id, function (err, result) {
            if(err) { 
                log.error(err);
                return callback(err); 
            }

            if(result & result.length>0) {
                callback(null, result[0]);
            } else {
                callback(null, null);
            }
        });
    },

    /**
     * Find the users cost per day on parking
     *
     */
    findCostPerDay: function(userId, callback) {
        sql = "SELECT tt.transaction_id, tt.ticket_id, t.id, t.amount, t.type, t.date, SUM(t.amount) AS total_per_day " +
            " FROM transactions_tickets AS tt LEFT JOIN transactions AS t ON (t.id=tt.transaction_id)" +
            " LEFT JOIN user_parking AS up ON (up.transaction_id=t.id) " +
            " WHERE up.user_id = ? AND t.type='DEBIT'" +
            " GROUP BY t.date";
        console.log(sql);
        conn.query(sql, userId, function (err, result) {
            if(err) { 
                log.error(err);
                return callback(err); 
            }

            if(result) {
                callback(null, result);
            } else {
                callback(null, null);
            }
        });
    },

    /**
     * Find the users cost per day on parking
     *
     */
    findCostPerAreaInMin: function(userId, callback) {
        var sql = "SELECT * FROM transaction WHERE ";
        conn.query(sql, userId, function (err, result) {
            if(err) { 
                log.error(err);
                return callback(err); 
            }

            if(result & result.length>0) {
                callback(null, result[0]);
            } else {
                callback(null, null);
            }
        });
    },

    /**
     * Find the users cost per day on parking
     *
     */
    findCostPerArea: function(userId, callback) {
        var sql = "SELECT up.parking_area_id, up.transaction_id, up.user_id, t.amount, FORMAT( SUM(t.amount), 2) AS total_per_area, pa.name, pa.city "+
                " FROM user_parking AS up LEFT JOIN parking_areas AS pa ON up.parking_area_id=pa.id "+
                " LEFT JOIN transactions AS t ON up.transaction_id=t.id"+
                " WHERE up.user_id=? GROUP BY up.parking_area_id";
        conn.query(sql, userId, function (err, result) {
            if(err) { 
                log.error(err);
                return callback(err); 
            }
            if(result) {
                callback(null, result);
            } else {
                callback(null, null);
            }
        });
    },

    findTotalMinPerArea: function (userId, callback) {
        var sql = "SELECT up.parking_area_id, up.transaction_id, up.user_id, up.time_in, up.time_out, SUM(TIMESTAMPDIFF(MINUTE, up.time_in, up.time_out)) AS total_time, pa.name, pa.city "+
                " FROM user_parking AS up LEFT JOIN parking_areas AS pa ON up.parking_area_id=pa.id "+
                " WHERE up.user_id=? GROUP BY up.parking_area_id";
        conn.query(sql, userId, function (err, result) {
            if(err) { return callback(err); }
            if(result && result.length>0) {
                return callback(null, result);
            } else {
                return callback(null, null);
            }
        });  
    },


    /**
     * Find the users cost per day on parking
     *
     */
    getCostInMin: function(userId, callback) {
        var sql = "SELECT * FROM transaction AS tr LEFT JOIN transactions_tickets AS tt ON() WHERE ";
        conn.query(sql, userId, function (err, result) {
            if(err) { 
                log.error(err);
                return callback(err); 
            }

            if(result & result.length>0) {
                callback(null, result[0]);
            } else {
                callback(null, null);
            }
        });
    },

    findCostPerMin: function (userId, callback)  {
        var sql = "SELECT * FROM user_parking AS up LEFT JOIN transactions AS t ON t.id=up.transaction_id";
        conn.query(sql, userId, function (err, result) {
            if (err) { return callback(err); }
            if(result & result.length>0) {
                callback(null, result[0]);
            } else {
                callback(null);
            }
        });
    },

    findParkingAreasVisited: function(callback) {
        var sql = 'SELECT pa.id, pa.name, pa.vendor_id, pa.city, COUNT(up.parking_area_id) AS parking_areas, up.id, up.parking_area_id, up.user_id FROM user_parking AS up LEFT JOIN parking_areas AS pa ON up.parking_area_id=pa.id GROUP BY (up.parking_area_id)';
        conn.query(sql, function (err, result) {
            if (err) { return callback(err); }

            if (result !== null) 
            {
                return callback(null, result);
            } else {
                return callback(null, null);
            }
        });
    },

    findTransactionAreas: function (callback) {
        var sql = "SELECT up.parking_area_id, up.transaction_id, up.user_id, t.amount, FORMAT( SUM(t.amount), 2) AS total_per_area, pa.name, pa.city "+
                " FROM user_parking AS up LEFT JOIN parking_areas AS pa ON up.parking_area_id=pa.id "+
                " LEFT JOIN transactions AS t ON up.transaction_id=t.id GROUP BY up.parking_area_id";
        conn.query(sql, function (err, result) {
            if (err) { return callback(err); }
            if(result) {
                callback(null, result);
            } else {
                callback(null);
            }    
        });
    },


    /**
     * The uber function handling processing of tickets by users leaving
     */
    processTicket: function (ticket_no, parking_area_id, user, callback) {
        // Get current timestamp
        tsmp = Math.round(new Date().getTime() / 1000);

        // START XA TRANSACTION
        var xid = "ticket_" + ticket_no +"_"+ tsmp;

        var xa_commit_query = "XA COMMIT '"+ xid +"'";
        var xa_rollback_query = "XA ROLLBACK '"+ xid +"'";
        var xa_prepare_query = "XA PREPARE '"+ xid +"'";
        var xa_end_query = "XA END '" + xid +"'";

        // Rollback Query
        var xa_error_query = xa_end_query +"; "+ xa_prepare_query +"; "+ xa_rollback_query;

        conn.query("XA START '" + xid +"'", function(err, response) {
            ///////////////////// BEGIN //////////////////////
            /**
             * Get API Credentials
             */
            var https = require('https');
            var http = require('http');
            var querystring = require('querystring');
            var ModTransaction = require('./transactions.js')

            sql_vendor =  "SELECT * FROM vendors AS v LEFT JOIN parking_areas AS pa ON (pa.vendor_id=v.id) WHERE pa.id=? LIMIT 1";
            conn.query(sql_vendor, parking_area_id, function(err, result) {
                // Error in sql or vendor parking area not found
                if (err | result==null) { 
                    conn.query(xa_end_query, function(err) {
                        if(err) { throw err; }
                        conn.query(xa_prepare_query, function (err) { 
                            if (err) throw err; 
                            conn.query(xa_rollback_query, function (err) {
                                if(err) throw err;
                                return callback(null, null);
                            });
                        });
                    });
                } else {

                    var host = result[0].host;
                    var userlogin = result[0].client_login;
                    var userpass = result[0].client_secret;
                    var port = result[0].port;
                    var path = result[0].path;
                    var apiKey = '*****';
                    var sessionId = null;

                    // Request options config
                    var optionsget = {
                        host : host,
                        port : port,
                        path : path +"/"+ ticket_no, // url with parameters
                        //method : 'GET' // GET Method
                    };

                    // Log query
                    log.info(optionsget);
                    console.log(optionsget);

                    var requestGet = http.request(optionsget, function (response) {
                        response.on('data', function (data) {
                            console.log("=====data=====");
                            console.log(data);
                            console.log(JSON.parse(data));
                            console.log("==============");
                            var td = null;
                            try {
                                td = JSON.parse(data.toString());
                            }
                            catch (e) {
                                console.log("END XA 413");
                                conn.query(xa_end_query, function(err) {
                                    if(err) { throw err; }
                                    conn.query(xa_prepare_query, function (err) { 
                                        if (err) throw err; 
                                        conn.query(xa_rollback_query, function (err) {
                                            if(err) throw err;
                                            return callback(null, null);
                                        });
                                    });
                                });
                            }

                            if(td) {
                                var building = td.building_id;
                                var cost = td.cost;
                                var entry_dt = td.entry_time;
                                var ispaid = td.paid;
                                var sequence_number = td.sequence_no;

                                // Check if user has enough balance 
                                ModTransaction.debitUserAccount(user.id, cost, function (err, responseDebit) {
                                    console.log("debitUserAccount Response")
                                    console.log(responseDebit);
                                    console.log(err);
                                    if(err) {
                                        console.log("End XA 424");
                                        conn.query(xa_end_query, function(err) {
                                            if(err) { throw err; }
                                            conn.query(xa_prepare_query, function (err) { 
                                                if (err) throw err; 
                                                conn.query(xa_rollback_query, function (err) {
                                                    if(err) throw err;
                                                    return callback(null, null);
                                                });
                                            });
                                        });
                                    }

                                    if(responseDebit) {
                                        // User succesfully debited
                                        // Save ticket on lbd database
                                        // Save ticket details
                                        console.log(responseDebit);
                                        var ticket_local = {
                                            //transaction_id: responseDebit.insertId,
                                            ticket_number: ticket_no,
                                            entry_time: entry_dt,
                                            parking_area_id: parking_area_id,
                                            lane_number: "",
                                            entry_sequence_number: sequence_number,
                                            departure_time: new Date(),
                                            licence_plate_number: "NOT SUPPORTED YET"
                                        }
                                        var sql_t = "INSERT INTO tickets SET ?";
                                        conn.query(sql_t, ticket_local, function (err, resp_tl) {
                                            console.log(err);
                                            if(err) {  
                                                console.log("End XA 447");
                                                conn.query(xa_end_query, function(err) {
                                                    if(err) { throw err; }
                                                    conn.query(xa_prepare_query, function (err) { 
                                                        if (err) throw err; 
                                                        conn.query(xa_rollback_query, function (err) {
                                                            if(err) throw err;
                                                            return callback(null, null);
                                                        });
                                                    });
                                                });        
                                            } else {
                                                var tickets_trans = {
                                                    transaction_id: responseDebit.insertId,
                                                    time_in: entry_dt,
                                                    time_out: new Date(),
                                                    user_id: user.id,
                                                    parking_area_id: parking_area_id
                                                    //ticket_id: resp_tl.insertId,
                                                }
                                                sql_tt = "INSERT INTO user_parking SET ?";
                                                conn.query(sql_tt, tickets_trans, function(err, resp_tt) {
                                                    if(err || resp_tt===null) {
                                                        console.log("Error: user_parking 478");
                                                        console.log(resp_tt);
                                                        conn.query(xa_end_query, function(err) {
                                                            if(err) { throw err; }
                                                            conn.query(xa_prepare_query, function (err) { 
                                                                if (err) throw err; 
                                                                conn.query(xa_rollback_query, function (err) {
                                                                    if(err) throw err;
                                                                    return callback(null, null);
                                                                });
                                                            });
                                                        });
                                                    } else {
                                                        
                                                        // Call API to confirm that user paid
                                                        console.log("Yep Started from the top");

                                                        //******************** IF DONE**********************
                                                        conn.query(xa_end_query, function(err) {
                                                            console.log("the end game");
                                                            if(err) { throw err; }
                                                            conn.query(xa_prepare_query, function (err) { 
                                                                if (err) throw err; 
                                                                conn.query(xa_commit_query, function (err) {
                                                                    if(err) throw err;
                                                                    return callback(null, true);
                                                                });
                                                            });
                                                        });
                                                    }
                                                });
                                            }
                                        });
                                    } else {
                                        console.log("END XA 499");
                                        conn.query(xa_end_query, function(err) {
                                            if(err) { throw err; }
                                            conn.query(xa_prepare_query, function (err) { 
                                                if (err) throw err; 
                                                conn.query(xa_rollback_query, function (err) {
                                                    if(err) throw err;
                                                    return callback(null, null);
                                                });
                                            });
                                        });
                                    }
                                });
                            } else {
                                console.log("XA END 526");
                                conn.query(xa_end_query, function(err) {
                                    if(err) { throw err; }
                                    conn.query(xa_prepare_query, function (err) { 
                                        if (err) throw err; 
                                        conn.query(xa_rollback_query, function (err) {
                                            if(err) throw err;
                                            return callback(null, null);
                                        });
                                    });
                                });
                            }
                        });
                    });
                                                
                    requestGet.end();
                    requestGet.on('error', function (e) {
                        console.log("on-Error")
                        console.error(e);
                        console.log(e.stack);
                        conn.query(xa_end_query, function(err) {
                            if(err) { throw err; }
                            conn.query(xa_prepare_query, function (err) { 
                                if (err) throw err; 
                                conn.query(xa_rollback_query, function (err) {
                                    if(err) throw err;
                                    return callback(null, null);
                                });
                            });
                        });
                    });
                }
            }); // Query
        }); // close transaction
    },
}

function performRequest(endpoint, method, data,success) {
    var dataString = JSON.stringify(data);
    var headers = {}

    if(method=='GET') {
        endpoint += '?' + querystring.stringify(data);
    } else {
        headers = {
            'Content-Type': 'application/json',
            'Content-Length': dataString.length
        };
    }

    var options = {
        host: host,
        path: endpoint,
        method: method,
        headers: headers
    };

    var req = https.request(options, function(res) {
        res.setEncoding('utf-8');
        var responseString = '';

        res.on('data', function(data) {
            responseString += data;
        });

        res.on('end', function() {
            console.log(responseString);
            var responseObject = JSON.parse(responseString);
            success(responseObject);
        });
    });

    req.write(dataString);
    req.end();
}