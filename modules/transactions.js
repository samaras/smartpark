var numeral = require('numeral');
var mysql = require('mysql');
var Config = require('../config/config');

var log = require('../libs/log')(module);

// TODO: Init script for db connection
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
     * Individual transactions by user id
     */
    findTransByUserId: function (userId, callback) {
        var sql = 'SELECT t.id, t.account_id, t.amount, t.type, t.date, up.parking_area_id, pa.name FROM transactions AS t LEFT JOIN accounts AS a ON t.account_id=a.id LEFT JOIN user_parking AS up ON up.transaction_id=t.id LEFT JOIN parking_areas AS pa ON pa.id=up.parking_area_id WHERE a.user_id = '+ conn.escape(userId);
        console.log(sql);
        conn.query(sql, function (err, transactions) {
            if (err) return callback(err);
            console.log(transactions);
            if (transactions !== null) 
            {
                return callback(null, transactions);
            } else {
                return callback(null, null);
            }
        });
    },

    /**
     * Find transaction by id
     */
    findTransById: function(transId, callback) {
        var sql = 'SELECT t.account_id, t.amount, t.type, t.date FROM transactions AS t LEFT JOIN accounts AS a ON t.account_id=a.id WHERE t.id = '+ conn.escape(transId);
        conn.query(sql, function (err, transaction) {
            if (err) return callback(err);
            
            if (transaction !== null & transaction.length>0) 
            {
                return callback(null, transaction[0]);
            } else {
                return callback(null, null);
            }
        });
    },

    /**
     * Individual user balance
     */
    getUserBalance: function (userId, callback) {
        var sql = 'SELECT * FROM accounts WHERE user_id = '+ conn.escape(userId) + ' LIMIT 1';
        conn.query(sql, function (err, account) {
            if (err) return callback(err);
            if (account !== null & account.length > 0) 
            {
                var balance = account[0];
                return callback(null, balance);
            } else {
                return callback(null, null);
            }
        });
    },

    /**
     * Company balance
     */
    getCompanyBalance: function (companyId, callback) {
        var sql = 'SELECT SUM(acc.balance) FROM company_users AS cu LEFT JOIN accounts AS acc ON acc.user_id=cu.user_id WHERE cu.company_id= ?';
        conn.query(sql, companyId, function (err, result) {
            if (err || !result.rowCount) return callback(err);
            
            var balance = result.row[0];

            if (balance !== null) 
            {
                return callback(null, balance);
            } else {
                return callback(null, null);
            }
        });
    },

    /**
     * Company transactions for all users
     */
    findAllCompanyUserTrans: function (companyId, callback) {
        var sql = 'SELECT t.id, t.account_id, t.amount, t.type, t.date, cu.company_id, cu.user_id, acc.user_id, acc.id FROM company_users AS cu LEFT JOIN accounts AS acc ON acc.user_id=cu.user_id LEFT JOIN transactions AS t ON t.account_id=acc.id WHERE cu.company_id= ?';
        conn.query(sql, companyId, function (err, result) {
            if (err || !result.rowCount) return callback(err);
            
            var transactions = result;

            if (transactions !== null) 
            {
                return callback(null, transactions);
            } else {
                return callback(null, null);
            }
        });
    },

    /**
     * Company transactions for all users
     */
    findAllTrans: function (callback) {
        var sql = 'SELECT t.id AS tid, t.account_id, t.amount, t.type, t.date, acc.user_id, acc.id, u.first_name, u.last_name FROM transactions AS t LEFT JOIN accounts AS acc ON acc.id=t.account_id LEFT JOIN users AS u ON acc.user_id=u.id';
        conn.query(sql, function (err, result) {
            if (err) return callback(err);
            if (result) 
            {
                return callback(null, result);
            } else {
                return callback(null, null);
            }
        });
    },

    /**
     * Company debit type transactions
     */
    findDebitTrans: function (userId, callback) {
        var sql = 'SELECT * FROM transactions WHERE type="DEBIT" AND user_id=?';
        conn.query(sql, userId, function (err, result) {
            if (err || !result.rowCount) return callback(err);

            var transactions = result;
            if (transactions !== null) 
            {
                return callback(null, transactions);
            } else {
                return callback(null, null);
            }
        });
    },

    /**
     * Company debit type transactions
     */
    findCompDebitTrans: function (companyId, callback) {
        var sql = 'SELECT t.id, t.account_id, t.amount, t.type, t.date, cu.company_id, cu.user_id, acc.user_id, acc.id FROM company_users AS cu LEFT JOIN accounts AS acc ON acc.user_id=cu.user_id LEFT JOIN transactions AS t ON t.account_id=acc.id WHERE type="DEBIT" AND cu.company_id=?';
        conn.query(sql, companyId, function (err, result) {
            if (err || !result.rowCount) return callback(err);

            var transactions = result;
            if (transactions !== null) 
            {
                return callback(null, transactions);
            } else {
                return callback(null, null);
            }
        });
    },

    /**
     * Individual credit type transactions
     */
    findCreditTrans: function (userId, callback) {
        var sql = 'SELECT * FROM transactions WHERE type="CREDIT" AND user_id=?';
        conn.query(sql, userId, function (err, result) {
            if (err || !result.rowCount) return callback(err);

            var transactions = result;
            if (transactions !== null) 
            {
                return callback(null, transactions);
            } else {
                return callback(null, null);
            }
        });
    },

    /**
     * Company credit type transactions
     */
    findCompCreditTrans: function (companyId, callback) {
        var sql = 'SELECT t.id, t.account_id, t.amount, t.type, t.date, cu.company_id, cu.user_id, acc.user_id, acc.id FROM company_users AS cu LEFT JOIN accounts AS acc ON acc.user_id=cu.user_id LEFT JOIN transactions AS t ON t.account_id=acc.id WHERE type="CREDIT" AND cu.company_id=?';
        conn.query(sql, companyId, function (err, result) {
            if (err || !result.rowCount) return callback(err);

            var transactions = result;
            if (transactions !== null) 
            {
                return callback(null, transactions);
            } else {
                return callback(null, null);
            }
        });
    },

    findTransByParkingArea: function (parkingarea_id, user_id, callback) {
        var sql_a = "SELECT name, city FROM parking_areas WHERE id=?"
        var sql_t = "SELECT up.id, up.transaction_id, up.parking_area_id, t.amount, t.type, t.date  FROM user_parking AS up "+
                " LEFT JOIN transactions AS t ON up.transaction_id=t.id WHERE up.user_id="+ conn.escape(user_id) +" AND up.parking_area_id="+ conn.escape(parkingarea_id);
        conn.query(sql_a, parkingarea_id, function (err, area) {
            conn.query(sql_t, function (err2, transactions) {
                if(err) { return callback(err); }
                if(err2) { return callback(err2); }
                return callback(null, area, transactions);
            });
        });
    },

    /**
     * Initialize account for new user
     */
    createAccount: function (userId, callback) {
        var account = { balance: 0.0, user_id: userId }
        var sql = "INSERT INTO accounts SET ?";
        var query = conn.query(sql, account, function(err, result){
            if(err) { return callback(err); }
            if (result) {
                return callback(null, result);
            } else {
                return callback(null, null);
            }
        }); 
        log.info(query.sql);
    },

    /**
     * Check if user has enough credit for transaction
     * Returns null if account does'nt exist, false on low funds, and the 
     *    balance of user account when it has enough funds
     */
    validateBalance: function (userId, amount, callback) {
        var sql = 'SELECT * FROM accounts WHERE user_id=?';
        conn.query(sql, userId, function (err, result) {
            if (err) { return callback(err); };
            console.log("Validate Balance");
            console.log(result);
            console.log(err);
            console.log(amount);
            console.log("*****************");
            var account = result[0];
            if (account !== null) 
            {
                if (account.balance >= amount) {
                    return callback(null, account.balance);
                } else {
                    return callback(null, false);
                }
            } else {
                return callback(null, null);
            }
        });
    },

    /**
     * Debit user account
     */
    debitUserAccount: function (userId, amount, callback) {
        this.validateBalance(userId, amount, function(err, canDebit){
            if(err) { return callback(err); }

            if(canDebit==null) { 
                console.log("UserId"+ userId +" has no account."); // TODO: Log to file
                return callback(null); 
            }

            if (canDebit){
                new_balance = canDebit - amount;
                var sql = "UPDATE accounts SET balance ="+ conn.escape(new_balance) +" WHERE user_id=?";
                conn.query(sql, userId, function (err, result) {
                    console.log(result);
                    if (err) return callback(err);

                    if (result) {
                        conn.query("SELECT id FROM accounts WHERE user_id=? LIMIT 1", userId, function(err, accountId) { 
                            if (err) { return callback(err); }
                            if(accountId!==null) {
                                var transObj = {
                                    account_id: accountId[0].id,
                                    type: "DEBIT",
                                    amount: amount, 
                                    date: new Date(),
                                };

                                var sql = "INSERT INTO transactions SET ?";
                                conn.query(sql, transObj, function (err, result) {
                                    if (err) { return callback(err); }
                                    if(result) {
                                       return callback(null, result);
                                    } else {
                                       return callback(null, null);
                                    }
                                });
                            } else {
                                return callback(null, null)
                            }
                        });
                    } else {
                        return callback(null, null);
                    }
                });    
            } else {
                return callback(null);
            }
        });
    },

    /**
     * Credit user account
     */
    creditUserAccount: function (userId, amount, callback) {
        var sql = 'SELECT * FROM accounts WHERE user_id=?';
        conn.query(sql, userId, function (err, result) {
            if (err || !result.rowCount) return callback(err);

            if (result !== null) 
            {
                var account = result.row[0];
                var new_balance = amount + account.balance;
                var sql_update = "UPDATE accounts SET balance="+ new_balance +" WHERE user_id=?";
                var updated = conn.query(sql, userId, function (err, result2) {
                    if (err || !result2.rowCount) return callback(err);                
                    if (result2) {
                        return callback(null, true);
                    } else {
                        return callback(null, false);
                    }
                });
                console.log("UPDATE on creditUserAccount");
                console.log(updated);
            } else {
                return callback(null, null);
            }
        });    
    },

    transferCreditToUser: function (fromUserId, toUserId, amount, callback) {
        conn.beginTransaction(function(err){
            if (err) { return callback(err); }
            // START TRANSACTION
            module.exports.getUserBalance(fromUserId, function(err1, balanceFrom){
                module.exports.getUserBalance(toUserId, function(err2, balanceTo){
                    if(err1 || err2) {
                        return callback(err); // unable to get account of either/both users, CRASH!
                    } 
                     else 
                    {
                        // convert amount to numeral
                        var amount_ = numeral(amount);
                        if(balanceFrom && balanceTo){
                            module.exports.validateBalance(fromUserId, amount_, function(err, canDebit){
                                if (err) { 
                                    conn.rollback(function() {
                                        throw err;
                                    });
                                }

                                // something is wrong here, user cannot exist without an account.balance set, log error
                                if(canDebit==null) { 
                                    console.log("UserId"+ balanceTo.user_id +" has no account."); // TODO: Log to file
                                    return callback(null); 
                                }

                                if (canDebit){
                                    var sender_new_balance = numeral(balanceFrom.balance).subtract(amount_);
                                    var receiver_new_balance = numeral(balanceTo.balance).add(amount_);

                                    console.log(receiver_new_balance.value());
                                    var sql_from_user = "UPDATE accounts SET balance ="+ conn.escape(sender_new_balance.value()) +" WHERE user_id=?";
                                    conn.query(sql_from_user, balanceFrom.user_id, function (err, result) {
                                        if (err) {
                                            conn.rollback(function() {
                                                throw err;
                                          });
                                        }
                                        // Log: INSERT debit transaction
                                        var trans_debit = { account_id: balanceFrom.id, amount: amount, type: "DEBIT", date: new Date() };
                                        sql_1 = "INSERT INTO transactions SET ?";
                                        conn.query(sql_1, trans_debit, function(err, result2){
                                            if(err) {
                                                conn.rollback(function () {
                                                    throw err;
                                                });
                                            }
                                        });

                                        console.log("receiver_new_balance 328");
                                        console.log(receiver_new_balance.value());
                                        var sql_to_user = "UPDATE accounts SET balance = "+ conn.escape(receiver_new_balance.value())+" WHERE user_id=?";
                                        conn.query(sql_to_user, balanceTo.user_id, function(err, resultUpdateToBal) {
                                            if(err) {
                                                conn.rollback(function () {
                                                    console.log(err);
                                                    throw err;
                                                });
                                            }

                                            if (resultUpdateToBal!==null) {
                                                trans_credit = { account_id: balanceTo.id, amount: amount, type: "CREDIT", date: new Date() };
                                                var sql_2 = "INSERT INTO transactions SET ?";
                                                conn.query(sql_2, trans_credit, function (err, resultTransCredit) {
                                                    conn.commit(function(err) {
                                                        if (err) { 
                                                            conn.rollback(function() {
                                                                throw err;
                                                            });
                                                        }
                                                        // log.info("TRANSACTION - CREDIT : " + sql_2);
                                                        console.log('success!');
                                                    });
                                                });
                                            } else {
                                                conn.rollback(function () {
                                                    return callback(null, null);
                                                });
                                            }
                                        });
                                    });
                                    // everything logged without an error
                                    return callback(null, true);
                                } else {
                                    // canDebit returned false, not enough credit in account
                                    return callback(null, false);
                                }
                            }); // close validateBalance    
                        
                        } else {
                            // close if(balFrom & balTo)
                            return callback(null); // one or balance object null or not set
                        }
                    } // else
                }); // getUserBalance(balanceTo)
            }); // getUserBalance(balanceTo)
        }); // END TRANSACTION
    },

    findTotalCostPerDay: function(userId, callback) {
        var sql = "SELECT t.id, t.amount, SUM(t.amount) AS dayc, DATE(up.time_in) AS dayp FROM transactions t INNER JOIN user_parking up ON (up.transaction_id = t.id) WHERE up.user_id = ? GROUP BY DATE(up.time_in)";
        conn.query(sql, userId, function(err, result) {
            if (err) { return callback(err); }
            if(result) {
                callback(null, result);

            } else {
                callback(null, null);
            }
        });
    },

    findDailyRevenue: function(callback) {
        var sql = "SELECT t.id, t.amount, SUM(t.amount) AS dayc, DATE(up.time_in) AS dayp FROM transactions t INNER JOIN user_parking up ON (up.transaction_id = t.id) GROUP BY DATE(up.time_in)";
        conn.query(sql, function(err, result) {
            if (err) { return callback(err); }
            if(result) {
                callback(null, result);

            } else {
                callback(null, null);
            }
        });
    },

    createTransaction: function (accountId, amount, type, date, callback) {
        conn.beginTransaction(function(err){
            if (err) { return callback(err); }
            // START TRANSACTION
            var transObj = {
                account_id: accountId,
                type: type,
                amount: amount, 
                date: new Date(),
            }

            var sql = "INSERT INTO transactions SET ?";
            conn.query(sql, transObj, function (err, result) {
                if (err) { return callback(err); }
                if(result) {
                    // If successful update balance

                    var sql2 = "UPDATE accounts SET balance = ";
                    if(type=='DEBIT') {
                        sql2 = sql2 + " balance - "+ amount +" ";
                    } else {
                        sql2 = sql2 + " balance + "+ amount +" ";
                    }
                    sql2 = sql2 + " WHERE id=?"
                    conn.query(sql2, accountId, function(err, response) {
                        if (err) { 
                            conn.rollback(function(err) {
                                if(err) throw err;
                            });
                        };

                        if(response) {
                            conn.commit(function (err) {
                                if(err) { throw err; }
                                callback(null, true);
                            });
                        } else {
                            conn.rollback(function(err) {
                                if (err) throw err;
                                callback(null, null);
                            });
                        }
                    });
                } else {
                    callback(null, null);
                }

            });
        });
    },

}