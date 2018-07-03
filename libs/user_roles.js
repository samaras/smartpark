module.exports = {
  requireRole: function(role) {
    return function(req, res, next) {
        if(req.user) {
            if(role.contains(req.user.group)) {
                return next();
            } else {
                res.send(403);
            }
        } else {
            res.redirect("/login");
        }
    }
  },

  validateProfile: function(user) {
    var validator = require('validator');
    var errors = new Array();
    if(!validator.isAlphanumeric(user.first_name)) {
        errors.push("First name invalid");
    }
        
    if(!validator.isAlphanumeric(user.last_name)) {
        errors.push("Last name invalid");
    }
        
    if(!validator.isEmail(user.email)) {
        errors.push("Email is invalid");
    }
        
    if(!validator.isAlphanumeric(user.username)) {
        errors.push("Username is invalid");
    }
        
    return errors;
  },

  matchPasswords: function(password1, password2) {
    var validator = require('validator');
    var match = validator.matches(password1, password2, 'i');
    if(match) {
        return true;
    } else {
        return false;
    }
  },

  validateCompanyFields: function(company_name, reg_number, vat_number) {
      var validator = require('validator');
      var errors = new Array();
      if(!validator.isAlphanumeric(company_name)) {
        errors.push("Invalid characters for company name. Alphanumeric only.");
      }

      if(!validator.isAlphanumeric(reg_number)) {
        errors.push("Invalid characters for reg. number. Alphanumeric only.");
      }

      if(!validator.isNumeric(vat_number)) {
        errors.push("Invalid characters for vat number. Numeric only.");
      }
  }
}