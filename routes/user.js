
/*
 * GET users listing.
 */

 // Get the modules

var ModUser = require("../modules/users.js");
var Mail = require("../modules/email.js"); // TODO: Change to ModEmail for consistency
var SmartPark = require('../modules/smartpark.js');
var ModParking = require('../modules/parking.js');
var ModTransaction = require('../modules/transactions.js');
var validator = require('validator');
var log = require('../libs/log')(module);

exports.list = function(req, res){
  res.send("respond with a resource");
};

exports.login = function(req, res) {
    var user = req.user;
    if(user) {
        if(req.user.group=='admin') {
            res.redirect("admin");
        } else {
            res.redirect("account/profile");
        }
    }
    var loginerror = null;
    var error = req.flash('error');
    if(error.length > 0) {
        loginerror = error[0];
    }
	res.render("user/login", { title: 'Login', layout: "layout.jade", error: loginerror, req:req });
};

exports.register = function(req, res) {
    var user = req.user;
    if(user) {
        res.redirect("account/profile");
    }
    errors = req.flash("errors");
    message = req.flash("message");
    var reuser = {"first_name":"", "last_name":"", "email":"", "cellphone":"", "username": ""}
    res.render("user/register", { title: 'Register', layout: "layout.jade", errors: errors, message: message, reuser: reuser });
};

exports.registerUser = function(req, res) {
    var user = req.body.user;
    var errors = new Array();

    // Validation
    var UserLib = require('../libs/user_roles');
    errors = UserLib.validateProfile(user);

    var passwordtest = UserLib.matchPasswords(user.password, user.repeat_password);

    console.log(passwordtest);
    if(passwordtest===false) { 
        errors.push("Passwords do not match.");
    }

    console.log(errors);

    if(user.group==2) {

        var company_name = null;
        var registration_no = null;
        if(user.company) {
            company_name = user.company;
        } else {
            errors.push("Company name not optional with Company user type");
        }

        if(user.registration_number) {
            registration_no = user.registration_number;
        } else {
            errors.push("Company name not optional with Company user type");    
        }
    }

    if(errors.length > 0) {
        req.flash("errors", errors);
        res.redirect("/register");        
    } else {
        ModUser.createUser(req.body.user, user.group, function(err, response){
            if (err===null && response){
                req.flash("message", "User created. Please Login");
                console.log("Message logging in user");
                req.login(req.body.user, function(err2) {
                    if (err2) { res.redirect('/login'); }
                    return res.redirect('/account/profile');
                });
            }
            else {
                res.render("user/register", { title: 'Register', layout: "layout.jade", errors: err, user: req.body.user });
            }
        });
    }    
};

exports.profile = function(req, res) {
	var user = req.user;
    res.render("user/index", {title: 'Profile', layout: "layout.jade", user: req.user});
};

exports.editProfile = function(req, res) {
    console.log("Edit User");
    console.log(req.user);
    var user = req.user;
    res.render("user/edit", { title: 'Edit Profile', layout: "layout.jade", user: user});
}

exports.saveProfile = function(req, res) {
    var user_id = req.user.id; // from session
    var post_user = req.body.user;

    var error = validateProfile(post_user);
    if(!error.length > 0) {
        ModUser.verifyEmailUsername(post_user.username, post_user.email, user_id, function(err, userExists){
            if (err) { res.status(500, err); }
            if(userExists!=null) {
                ModUser.saveProfile(user_id, post_user, function(err, response) {
                    if(response!=null) {
                        req.flash('message', "Profile updated")
                        res.redirect('/account/profile');
                    } else {
                        res.render('user/edit', {error: "Error saving profile", title: "Edit Profile", user: user});
                    }
                });
            } else {
                log.error("User ID non existent: " + user_id);
                req.flash("error", "User not found.");
                req.flash("message", "User not found.");
                res.redirect('/account/profile');
            }
        });
    } else {
        res.render('user/edit', {title: 'Edit Profile', user: post_user, error: error});
    }

}

exports.changePassword = function (req, res, next) {
    var user = req.user;
    console.log(req.flash('errors'))
    res.render('user/change_password', {title: "Change Password", user: user, errors: req.flash('errors'), message: req.flash('message')});
}

exports.changePasswordPost = function(req, res, next) {
    var old_password = req.body.old_password;
    var password = req.body.password;
    var repeat_password = req.body.repeat_password;
    var user = req.user;

    if(password==repeat_password){
        ModUser.getUserInfo(user, function(err, userObj) {
            if(err) { res.status(500, err); }
            console.log("Returned userObj");
            console.log(userObj);
            if(userObj!=null) { 
                if(userObj!=null) {
                    ModUser.saveNewPassword(user.id, password, function(err, response) {
                        if(err) { res.status(500, err); }

                        if(response==null) {
                            req.flash('Error changing password.');
                            res.render('user/change_password', {title: "Change Password", error: req.flash('error'), message: req.flash('message')});
                        } else {
                            req.flash("message", "Password changed successfully.");
                            res.redirect('/account/profile');
                        }
                    });
                } else {
                    console.log("User old password fail : 150");
                    req.flash("errors", 'Password is incorrect.');
                    res.redirect('/account/users/changepassword');
                }
            } else {
                console.log("User not found");
                req.flash("errors",'Password is incorrect.');
                res.redirect('/account/users/changepassword');
            }
        }); 
    } else {
        console.log("Passwords do not match nje");
        req.flash("errors", 'Password do not match.');
        res.redirect('/account/users/changepassword');
    }

}

exports.forgot = function(req, res, next) {
    console.log("in user forgot password");
    res.render("user/forgot", {title: 'Forgot Password', layout: "layout.jade", error: req.flash('error'), message: req.flash('message')});
}

exports.forgotPost = function(req, res, next){
    var email = req.body.email;
    var username = req.body.username;

    if(!validator.isAlphanumeric(username)) {
        req.flash("message", "Username has invalid characters.");
        res.redirect('/forgot');
    }

    var reset = ModUser.forgotPassword(username, email, function (err,response) {
        if (err) { 
            console.log("err");
            res.render('500', { error: err }); 
        } 
        if(response) {
            req.flash("message", "Check your inbox for a password reset message.");
            res.redirect('/');
        } else{
            console.trace();
            console.log(response);
            console.log("response null");
            // TODO: redirect to forgot with proper values
            res.redirect('/forgot', { layout: "layout.jade", message: "Error setting up page for new password"});
        }
    });
}

exports.reset = function(req, res, next) {
    console.log("in user reset password");
    var token  = req.params.tid; // get token from url
    console.log("Token in reset");
    console.log(token);
    if (!token || !validator.isAlphanumeric(token)) { 
        req.flash("error", "Invalid link");
        return res.redirect('/'); 
    }
    else 
    {
        res.render("user/reset", {title: 'Reset Password', layout: "layout.jade", reset_token: token, error: req.flash('error'), message: req.flash('message')});
    }
}

exports.resetPost = function(req, res, next) {
    console.log("Reseting user passowrd and sending email to confirm password changed.");

    console.log(req.body._rstoken);
    var token = req.body._rstoken
    if (!token || !validator.isAlphanumeric(token)) { 
        req.flash("error", "Invalid link");
        return res.redirect('/'); 
    }
    else{
        // match passwords
        var password = req.body.password;
        var confirm = req.body.confirm;

        if (password !== confirm) {
            req.flash('error', 'passwords do not match');
            res.redirect('/reset/' + token);
        }
        else
        {
            ModUser.matchToken(token, function(err, user){
                // Check if token matches and is not outdated
                if (err) { return res.render(500, {error: err}); }
                if(user==null) {
                    req.flash('error', 'Link expired');
                    res.redirect('/forgot');
                }
                else
                {
                    ModUser.resetPassword(user, password, function(err, response){
                        if (err) { return res.render(500, { error: err});}
                        if(response==null){
                            req.flash("error", "Error resetting password. Please try again.");
                            res.redirect("/forgot");               
                        }
                        else {
                            req.flash("message", "Password reset successful.");
                            res.redirect("/login");               
                        }
                    });
                }
            });
        }
    }
}

exports.reporting = function(req, res, next) {
    var user = req.user;
    res.render("user/reports", {title: 'Reports', layout: "layout.jade", user: req.user});
}

exports.companyUsers = function(req, res, next) {
    var user = req.user;
    ModUser.getCompanyUsers(user.id, function (err, company, users) {
        if(err) { 
            log.error(err); // TODO: Move logging to modules
            res.status(500); 
        }

        var company_row = null;
        if(company) {
            company_row = company[0]
        }
        res.render("user/company_users", {title: 'My Account Users', layout: "layout.jade", user: req.user, users: users, company: company_row});
    });
}

exports.createCompanyUsers = function(req, res, next) {
    var user = req.user;
    console.log();
    res.render('user/create_subuser', {title: 'Create new user', errors: req.flash('errors'), message: req.flash('message'), user: user });
}

exports.saveCompanyUsers = function(req, res, next) {
   // Validate user form
    var user_details = req.body.user;
    var user = req.user;

    errors = new Array();
    errors = validateProfile(user_details);

    if(errors.length > 0) {
        req.flash("errors", errors);
        res.redirect('account/users/create')
    } else {
        if(errors.length > 0)
        {
            req.flash("errors", errors);
            res.redirect('account/users/create');
        } else {
            ModUser.createUser(user_details, 1, function (err, is_created) {
                if(err) { res.status(500); }
                if(is_created) {
                    ModUser.getCompany(user.id, function(err, company_d) {
                        console.log(company_d);
                        console.log(err);
                        if(err) { res.status(500); }
                        if(company_d!==null) {
                            ModUser.addUserToCompany(is_created.insertId, company_d.company_id, function (err, done) {
                                console.log("controller addUserToCompany");
                                console.log(err);
                                console.log(done);
                                if(err) { res.status(500); }
                                if(done) {
                                    req.flash("message", "User created");
                                    res.redirect("account/users");
                                } else {
                                    req.flash("errors", "Error adding user");
                                    res.redirect("account/users/create");        
                                }
                            });
                        } else {
                            console.log("company_d null");
                            req.flash("errors", "Error adding user");
                            res.redirect("account/users/create");
                        }
                    });
                } else {
                    req.flash("errors", is_created);
                    res.redirect("account/users/create");
                }
            });
        }
    } 
}


exports.balance = function(req, res, next) {
    // Get users total balance
    var user = req.user;
    ModTransaction.getUserBalance(user.id, function (err, account){
        if (err) { res.status(500); }
        if (account !== null) {
            console.log(account);
            res.render("user/balance", {title: 'Balance', layout: "layout.jade", user: req.user, account: account});
        } else {
            res.status(500);
        }
    });
}

exports.parkingareas = function(req, res, next) { 
    var user = req.user;
    // get parking areas user visited
    ModParking.findUserParkingAreas(user.id, function (err, parkingareas) {
        if (err) { res.status(500); } 
        console.log(parkingareas);
        res.render("user/parking_areas", {title: 'Parking Areas visited', layout: "layout.jade", user: req.user, areas: parkingareas});
    });   
}

exports.parkingareatrans = function(req, res, next) {
    var user = req.user;
    var parkingarea_id = req.params.id;
    ModTransaction.findTransByParkingArea(parkingarea_id, user.id, function (err, area, transactions) {
        if(err) { res.status(500); }
        if(area && transactions) {
            res.render("user/area_transactions", {title: "Transactions for Area", layout: "layout.jade", user: user, transactions: transactions, area: area[0]});
        } else {
            req.flash("error", "Error: No transactions found");
            res.redirect("user/parkingareas");
        }
    });
}

exports.transact = function(req, res, next) {
    var user = req.user;
    var tid = req.params.id;

    ModTransaction.findTransById(tid, function(err, transaction) {
        if(err) { res.status(500); }
        if(transaction) {
            console.log("transaction");
            console.log(transaction);
            // TODO: Get user_id from tr 
            user_v = {"first_ name":"", "last_name": ""};
            res.render('user/transact', {title: 'Transaction', layout: "layout.jade", user: req.user, user_v: user_v, transaction: transaction});
        } else {
            req.flash('error', 'Transaction not found');
            res.redirect('account/transactions');
        }
    });

}

exports.myTransactions = function(req, res, next) {
    var user = req.user;

    ModTransaction.findTransByUserId(user.id, function(err, transactions) {
        if(err) { 
            res.status(500);
        }

        if (transactions !== null) {
            console.log(transactions);
            res.render('user/transactions', {title: 'Transactions', layout: "layout.jade", user: req.user, user_v: user, transactions: transactions});
        } else {
            req.flash('error', "Error getting transactions");
            res.redirect('account/profile');
        }
    
    });
}

exports.transactions = function(req, res, next) {
    var userId = req.params.user_id;
    var user = req.user;

    ModUser.findUserById(userId, function (err, user_v) {
        if(err) { return callback(err); }
        if (user_v!==null){
            ModTransaction.findTransByUserId(userId, function (err, transactions) {
                if(err) { 
                    res.status(500);
                }

                if (transactions !== null) {
                    console.log(transactions);
                    res.render('user/transactions', {title: 'Transactions', layout: "layout.jade", user: user, user_v: user_v, transactions: transactions});
                } else {
                    req.flash('error', "Error getting transactions");
                    res.redirect('account/users');
                }
            });
        } else {
            req.flash('error', "Error getting user");
            res.redirect('account/users');
        }
    });
}

exports.addCredit = function(req, res, next) {
    var user = req.user;    
    res.render("user/add_credit", {title: 'Choose Payment Method', layout: "layout.jade", user: req.user});
}

exports.processAddCredit = function(req, res, next) {
    var user = req.user;
    var payment_method = req.body.credit.payment_method;

    if(payment_method=="creditcard") {
        // redirect to payment gateway
        var access_number = 0;
    }

    if(payment_method=="debitcard") {

    }

    if(payment_method=="eft") {
        // generate token(save it against user) and display it as reference with eft bank details 
        ModTransaction.saveEftToken(user, function (err, token) {
            // body...
        });
        // user should be notified on succesful payment(sms), credit allocated
    }

    req.flash("error", "Please select payment method");
    res.render("user/addcredit", {title: 'Payment', layout: "layout.jade", user: req.user});
}

exports.processTransferCredit = function (req, res, next) {
    var user = req.user;
    var amount = req.body.credit.amount;

    // get email and username, lookup and check if valid user
    var email = req.body.credit.email;
    var username = req.body.credit.username;

    if(!validator.isAlphanumeric(username)) {
        req.flash("message", "Username has invalid characters.");
        res.render('user/transfer_credit', {title: 'Transfer Credits', layout:"layout.jade", credit:req.body.credit,  error: req.flash("error"), message: req.flash("message")});
    }

    // validate amount
    if(!validator.isFloat(amount) || amount < 0) {
        req.flash("error", "Amount is invalid.");
        res.render('user/transfer_credit', {title: 'Transfer Credits', layout:"layout.jade", credit:req.body.credit,  error: req.flash("error"), message: req.flash("message")});
    }
    else{
        // check if user sending credits to exists
        ModUser.findByUsername(username, function (err, userTo) {
            if(err) {
                res.status(500);
            }

            // check if email match said user
            if(userTo!==null & userTo.email==email){
                ModTransaction.transferCreditToUser(user.id, userTo.id, amount, function (err, transfered) {
                    if(transfered){
                        req.flash("message", "Transfer Done!");
                        res.redirect('account/balance');
                    } else {
                        req.flash("error", "Error sending user credit.");
                        res.render('user/transfer_credit', {title: 'Transfer Credits', layout:"layout.jade", credit:req.body.credit, error: req.flash("error"), message: req.flash("message")});
                    }
                });
            } else {
                req.flash("error", "Error getting users account. Please try again.");
                res.render("user/transfer_credit", {title: "Transfer Credit", layout: "layout.jade", credit: req.body.credit, error: req.flash("error"), message: req.flash("message")});
            }
        });
    }
}

exports.transferCredit = function(req, res, next) {
    var user = req.user;
    res.render('user/transfer_credit', {title: 'Transfer Credits', layout:"layout.jade", user: req.user});
}

function validateProfile(user) {
    var error = {};

    if(!validator.isAlphanumeric(user.first_name)) {
        error.push("First name invalid");
    }

    if(!validator.isAlphanumeric(user.last_name)) {
        error.push("Last name invalid");
    }

    if(!validator.isEmail(user.email)) {
        error.push("Email is invalid");
    }

    if(!validator.isAlphanumeric(user.username)) {
        error.push("Username is invalid");
    }

    return error;
 }


// JSON/API/Ajax calls
exports.getTransPark = function(req, res) {
    var user = req.user;
    ModParking.findUserParkingAreas(user.id, function (err, parkingareas) {
        if(parkingareas) {
            res.json(parkingareas);
        } else {
            res.json(500, { error: 'Error getting parking reports' })
        }
    });
}

exports.getCostPerArea = function (req, res) {
    var user = req.user;
    ModParking.findCostPerArea(user.id, function (err, cost) {
        if(cost) {
            res.json(cost);
        } else {
            res.json(500, {error: 'Error getting cost reports'})
        }
    });
}

exports.getCostPerDay = function (req, res) {
    var user = req.user;
    ModParking.findCostPerDay(user.id, function (err, cost) {
        if(cost) {
            res.json(cost);
        } else {
            res.json(500, {error: 'Error getting cost reports'})
        }
    });
}

exports.getCostPerAreaInMin = function (req, res) {
    var user = req.user;
    ModParking.findCostPerAreaInMin(user.id, function (err, cost) {
        if(cost) {
            res.json(cost);
        } else {
            res.json(500, {error: 'Error getting cost reports'})
        }
    });
}

exports.getCostByDay = function (req, res) {
    var user = req.user;
    ModTransaction.findTotalCostPerDay(user.id, function (err, cost) {
        if(cost) {
            res.json(cost);
        } else {
            res.json(500, {error: 'Error getting cost reports'})
        }
    });
}

exports.getMinPerParkingArea = function(req, res) {
    var user = req.user;
    ModParking.findTotalMinPerArea(user.id, function(err, total_min) {
        if(total_min) {
            res.json(total_min)
        } else {
            res.json([]);
        }
    });
}
// END of JSON/API/Ajax calls