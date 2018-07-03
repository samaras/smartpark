
ModEmail = require("../modules/email.js");
ModUser = require("../modules/users.js");
ModParking = require("../modules/parking.js");
SmartPark = require("../modules/smartpark.js");
ModTrans = require("../modules/transactions.js");

var validator = require('validator');
var log = require('../libs/log')(module);

/*
 * GET admin home page(Dashboard).
 */
exports.index = function(req, res){
    var user = req.user;
    var status = {};
    res.render('index', { title: 'SmartPark - Admin Dashboard', error: req.flash('error'), message: req.flash('message'), status: status, user: user}); 
};

/*
 * GET 
 */
exports.companies = function(req, res){
    var user = req.user;
    ModUser.getCompanies(function(err, response){
        if(err) { 
            res.render('index', { title: 'SmartPark - Error', error: err, message: req.flash('message'), user: user}); 
        }else{
            res.render('admin/companies_list', { title: 'Companies', error: req.flash("error"), message: req.flash("message"), companies: response, user: user });
        }
    });
};

/*
 * GET 
 */
exports.transactions = function(req, res){
    var user = req.user;
    ModTrans.findAllTrans(function(err, response){
        if(err) { 
            res.render('index', { title: 'SmartPark - Error', error: err, message: req.flash('message'), user: user}); 
        }else{
            res.render('admin/transactions_list', { title: 'Transactions', error: req.flash("error"), message: req.flash("message"), transactions: response, user: user });
        }
    });
};


/*
 * DEL 
 */
exports.deleteCompany = function(req, res){
    var user = req.user;
    var company_id = req.params.id;
    ModUser.deleteCompany(company_id, function(err, response){
        if(err) { 
            res.render('index', { title: 'SmartPark' + response, error: req.flash("error"), message: req.flash("message"), user: user });
        }else{
            req.flash("message", "Company deleted");
            res.redirect('admin/companies'); 
        }
    });
};

/*
 * GET
 */
exports.createCompany = function(req, res, next) {
    var user = req.user;
    var group_id = 2;
    ModUser.findAllUsersByGroup(group_id, function(err, users) {
        if(err) { res.status(500); }
        if(users) {
            var company = { company: "", registration_number: "" }
            res.render('admin/create_company', {title: 'New Company', error: req.flash("error"), message: req.flash("message"), user: user, users_list: users, company: company});
        } else {
            req.flash("error", "Error creating company");
            res.redirect('admin/companies');
        }
    });
};

/*
 *
 */
exports.saveCompany = function(req, res, next) {
   var user = req.user;
   var company = { company_name: req.body.company_name,
                    registration_no: req.body.registration_no,
                    company_admin: req.body.company_admin }
   ModUser.saveCompany(company, function (err, response) {
        if(err) { res.status(500); }
        if(response) {
            req.flash("message", "Company saved.");
            res.redirect("admin/companies");
        } else {
            req.flash("error", "Error saving company.");
            res.render("admin/create_company");
        }
   });
};

exports.manageCompany = function(req, res, next) {
    var user = req.user;
    var company_id = req.params.id;
    ModUser.getCompanyAdmin(company_id, function(err, admin) {
        console.log(admin)
        if(err) { res.status(500); }
        ModUser.getCompanyUsersById( company_id, function(err, company, company_users) {
            if(err) { res.status(500); }
            console.log(company)
            if(company) {
                res.render('admin/edit_company', { title: 'SmartPark Users', error: req.flash('error'), message: req.flash('message'), users: company_users, company: company[0], user: user, company_admin: admin })
            } else {
                console.log(company);
                req.flash("error", "Error: Company does not exist");
                res.redirect("admin/companies");
            }
        });
    });
};

/*
 * GET 
 */
exports.systemReports = function(req, res){
    var user = req.user;
    res.render('admin/reports', { title: 'SmartPark - Error', error: req.flash('error'), user: user}); 
};


/*
 * GET 
 */
exports.manageVendors = function(req, res){
    var user = req.user;
    ModParking.findParkingVendors(function(err, response){
        if(err) { 
            res.render('index', { title: 'SmartPark - Error', error: err, message: req.flash("message"), user: user }); 
        }else{
            res.render('admin/vendors_list', { title: 'Vendors' + response, error: req.flash("error"), message: req.flash("message"), vendors: response, user: user });
        }
    });
};

/**
 * GET
 */
 exports.addVendor = function (req, res, next) {
     // body...
 };
/**
 * GET 
 */
exports.newParkingArea= function(req, res){
    var user = req.user;
    res.render('admin/create_vendor', { title: 'SmartPark - Error', error: req.flash('error'), message: req.flash("message"), user: user }); 
};


/*
 * POST 
 */
exports.createVendor = function(req, res){
    var user = req.user;
    ModParking.findParkingVendors(null, function(err, response){
        if(err) { 
            res.render('admin/create_vendor', { title: 'SmartPark - Error', error: err }); 
        }else{
            res.render('index', { title: 'SmartPark' + response, error: req.flash("error"), message: req.flash("message") });
        }
    });
};

/*
 * DEL
 */
exports.deleteVendor = function(req, res){
    var user = req.user;
    var vendor_id = req.params.id;
    ModParking.deleteVendor(vendor_id, function(err, response){
        if(err) { 
            res.render('admin/vendors_list', { title: 'SmartPark - Error', error: err }); 
        }else{
            res.render('index', { title: 'SmartPark' + response, error: req.flash("error"), message: req.flash("message") });
        }
    });
};

/*
 * PUT 
 */
exports.updateVendor = function(req, res){
    var user = req.user;
    var vendor = req.body.vendor;
    if(vendor) {
        ModParking.updateParkingVendor(vendor, function(err, response){
            if(err) { 
                res.render('admin/vendors_list', { title: 'SmartPark - Error', error: err, user: user }); 
            }else{
                res.redirect('admin/create_vendor', { title: 'SmartPark' + response, error: req.flash("error"), message: req.flash("message"), vendor: vendor, user: user });
            }
        });
    }
};

/*
 * GET
 */
exports.vendorAreas = function(req, res){
    var user = req.user;
    var vendor_id = req.params.vendor_id;
    ModParking.findParkingAreasByVendor(vendor_id, function(err, parking_areas){
        if(err) { 
            res.render('admin/vendors_list', { title: 'SmartPark - Error', error: err, user: user }); 
        }else{
            res.render('index', { title: 'SmartPark' + response, error: req.flash("error"), message: req.flash("message"), user: user });
        }
    });
};

/*
 * DEL
 */
exports.deleteVendorArea = function(req, res){
    var user = req.user;
    var parking_area_id = req.params.id;
    ModParking.deleteVendorArea(parking_area_id, function(err, response){
        if(err) { 
            res.render('admin/vendors_list', { title: 'SmartPark - Error', error: err, user: user }); 
        }else{
            res.render('index', { title: 'SmartPark' + response, error: req.flash("error"), message: req.flash("message"), user: user });
        }
    });
};

/*
 * POST
 */
exports.addParkingArea = function(req, res){
    var user = req.user;
    var parking_area = req.body.parking_area;
    // validate parking area fields

    ModParking.findParkingVendors(parking_area, function(err, response){
        if(err) { 
            res.render('index', { title: 'SmartPark - Error', error: err, user: user }); 
        }else{
            res.render('admin/create_parking_area', { title: 'SmartPark' + response, error: req.flash("error"), message: req.flash("message"), user: user });
        }
    });
};

exports.vendor = function (req, res) {
    var user = req.user;
    var vendor_id = req.params.id;
    // TODO: Validate id to number
    ModParking.findVendorAreas(vendor_id, function(err, vendor) {
       if(err) {
            res.render('index', { title: 'SmartPark - Error', error: err, message: req.flash('message'), user: user})
       } else {
            var vendor_name = '';
            if(vendor & vendor.length>0) {
                vendor_name = vendor[0].name;
            }
            res.render('admin/vendor', { title: 'Vendor Parking Areas', error: req.flash("error"), message: req.flash("message"), vendor_areas: vendor, vendor_name: vendor_name, user: user });
       }
    });
}

exports.users = function (req, res, next) {
    var user = req.user;
    ModUser.findAllUsers(function (err, users) {
        if(err) {
            req.flash("Error getting users");
            res.redirect('admin/index')
        } else {
            res.render('admin/users_list', { title: 'SmartPark Users', error: req.flash('error'), message: req.flash('message'), users: users, user: user });
        }
    });
}

exports.viewUser = function (req, res, next) {
    var user = req.user;
    var user_id = req.params.id;
    ModUser.findUserById(user_id, function(err, ret_user) {
        if(err) { res.status(500); }
        if(ret_user) {
            res.render("admin/user_details", {title: 'Profile', layout: "layout.jade", user: req.user, user_view: ret_user});
        } else {
            req.flash("error", "Error: User does not exist");
            res.redirect("admin/users");
        }
    });
}

exports.companyUsers = function (req, res, next) {
    var user = req.user;
    var company_id = req.params.id;
    // TODO: Validate id
    if (validator.isNumeric(company_id)){
        ModUser.getCompanyUsersById(company_id, function (err, company, users) {
            if(err) {
                res.render('index', { title: 'SmartPark', error: err, message: req.flash("message"), user: user });
            } else {
                res.render('admin/company_users', { title: 'SmartPark Users', error: req.flash('error'), message: req.flash('message'), users: users, company: company[0], user: user });
            }
        });
    } else {
        res.status(500);
    }
}

exports.deleteUser = function (req, res, next) {
    var user_id = req.params.id;
    var user = req.user;

    ModUser.deleteUser(user_id, function (err, response) {
        if(err) {
            res.render('index', { title: 'SmartPark', error: err, message: req.flash("message"), user: user });
        } else {
            if(response!==null) {
                req.flash("message", "User removed");
            } else {
                req.flash("error", "Error removing user");
            }
            res.redirect('admin/users');
        }
    })
}

exports.createUser = function (req, res, next) {
    var user = req.user;
    ModUser.getGroups(function (err, groups) {
        if(err) { 
            req.flash("error", err);
            res.redirect('/admin');
        } else {
            res.render('admin/create_user', {title: 'Create new user', error: req.flash('error'), message: req.flash('message'), groups: groups, user: user });
        }
    });
}

exports.saveUser = function (req, res, next) {
    var user_details = req.body.user;
    var user = req.user;

    // Validate user form
    var errors = validateProfile(user_details);
    if(errors.length > 0) {
        req.flash("error", errors);
        res.redirect('admin/users/create')
    } else {
        ModUser.findByUsername(user_details.username, function (err, response) {
            if(err) { res.status(500); }
            ModUser.findUserByEmail(user_details.email, function (err, response2) {
                if(err) { res.status(500); }
                if(response) {
                    errors.push("Username already exists");   
                } 

                if(response2){
                    errors.push("Email already exists")
                }

                if(errors)
                {
                    req.flash("error", errors);
                    res.redirect('admin/users/create');
                } else {
                    ModUser.createUser(user_details, user_details.group, function (err, is_created) {
                        if(err) { res.status(500); }
                        if(is_created===true) {
                            req.flash("message", "User created");
                            res.redirect("admin/users");
                        } else {
                            req.flash("error", is_created);
                            res.redirect("admin/users/create");
                        }
                    })
                }
            });
        });
    }
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

// AJAX/JSON/API Calls Functions //

exports.getParkAreasUsed = function (req, res, next) {
    
}

exports.getVisitedAreas = function(req, res) {
    ModParking.findParkingAreasVisited(function (err, parkingareas) {
        console.log("*******************");
        console.log(parkingareas);
        if(parkingareas) {
            res.json(parkingareas);
        } else {
            res.json(500, { error: 'Error getting parking reports' })
        }
    });
}

exports.getTransPark = function (req, res) {
    ModParking.findTransactionAreas(function (err, cost) {
        console.log("+++++++++");
        console.log(cost);
        if(cost) {
            res.json(cost);
        } else {
            res.json(500, {error: 'Error getting cost reports'})
        }
    });
}

exports.getDailyRevenue = function (req, res) {
    ModTrans.findDailyRevenue(function (err, result) {
        if(result) {
            res.json(result);
        } else {
            res.json(500, 'Error getting daily revenue')
        }
    })
}