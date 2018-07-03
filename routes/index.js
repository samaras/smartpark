var ModEmail = require("../modules/email.js");
var ModUser = require("../modules/users.js");
var ModParking = require("../modules/parking.js");
var SmartPark = require("../modules/smartpark.js");
var ModTrans = require("../modules/transactions.js");
var log = require('../libs/log')(module);
/*
 * GET home page.
 */
exports.index = function(req, res){
    res.render('index', { title: 'SmartPark - Home', error: req.flash("error"), message: req.flash("message") });
};

exports.scanTicket = function (req, res, next) {
    var user = req.user;
    ModParking.findAllParkingAreas( function (err, all_parking_areas) {
        if(err) { res.status(500); }
        if(all_parking_areas!==null & all_parking_areas.length>0){
            res.render('ticket', {title: 'Ticket', user: user, message: req.flash("message"), error: req.flash("error"), parking_areas: all_parking_areas}); 
        } else {
            req.flash("error", "No parking areas available");
            res.redirect("/");
        }
    });
};

exports.validateTicket = function(req, res, next) {
    var user = req.user;
    var ticket = req.body.ticket;

    var ticket_no = ticket.sequence_number;
    var parking_area = ticket.parking_area;

    // call vendor api to validate ticket, get time
    ModParking.processTicket(ticket_no, parking_area, user, function (err, result) {
        if(err) { return res.status(500); }
        if(result) {
            req.flash('message', "Ticket scanned and can bee used to leave now. Thank you.");
            res.redirect('account/balance');
        } else {
            log.error("Ticket Error - " + ticket.ticket_no);
            req.flash("error", "Unable to process Ticket: Ticket Invalid/Low balance")
            res.redirect('/ticket');
        }
    });   
}

exports.test = function (req, res) {
    var id = 1;

    // Call function
    ModUser.getCompany(id, function (err, response) {
        console.log(err)
        console.log(response);
        res.redirect("/");        
    }); 
}