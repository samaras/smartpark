var mysql = require('mysql');
var bcrypt = require("bcrypt");
var Config = require('../config/config');
var log = require('../libs/log')(module);
var validator = require('validator');

var connection = mysql.createConnection({
	host: Config.mysql.host,
	user: Config.mysql.user,
	password: Config.mysql.password,
	database: Config.mysql.database
});

// Connect to db
connection.connect();

// Modules
EmailMod = require("./email.js");

module.exports = {
	findUserById: function (user_id, callback) {
		connection.query("SELECT u.id, u.email, u.username, u.password, u.first_name, u.last_name, u.last_login, u.date_joined, ug.user_id, ug.group_id, g.id AS gid, g.group FROM users AS u LEFT JOIN users_groups AS ug ON u.id=ug.user_id LEFT JOIN groups AS g ON ug.group_id=g.id WHERE u.id=?", user_id, function(err, rows){
			if (err) { return callback(err, null) };
			if (rows && rows.length > 0) {
				var user = rows[0]
				return callback(err, user);
			} else {
				return callback(null, null);
			}
		});
		
	},

	findByUsername: function(username, callback) {
		var sql = "SELECT * FROM users WHERE username= ?" 
		connection.query(sql, username, function(err, rows){
			if (err) return callback(err);
			if (rows && rows.length > 0) {
				var user = rows[0];
				return callback(err, user);
			}
			else {
				return callback(err, null);
			}
		});
	},

	findUserByEmail: function(email, callback) {
		var sql = "SELECT * FROM users WHERE email = ?";
		connection.query(sql, email, function(err, user) {
			if(err) { return callback(err); }
			if(user && user.length > 0) {
				return callback(null, user);
			} else {
				return callback(null);
			}
		});
	},

	findUserByCellphone: function(cellphone, callback) {
		var sql = "SELECT * FROM users WHERE cellphone = ?";
		connection.query(sql, cellphone, function(err, user) {
			if(err) { return callback(err); }
			if(user && user.length > 0) {
				return callback(null, user);
			} else {
				return callback(null);
			}
		});
	},

	verifyEmailUsername: function(username, email, user_id, callback) {
		var sql = "SELECT * FROM users WHERE (email="+ connection.escape(email) +" OR username="+ connection.escape(username) +") AND (id <> "+ connection.escape(user_id) +")";
		connection.query(sql, function (err, users) {
			if(err) { return callback(err); }
			if(users) {
				return callback(null, true);
			} else {
				return callback(null);
			}
		});
	},

	getUserInfo: function(user, callback) {
		var username = user.username;
		var passwd = user.password;
	  	var sql = "SELECT username, password FROM users WHERE username = ? AND password = ? ";
	  	var params = [username, passwd];
		connection.query(sql, params, function(err, rows) {
	    	if (err) return callback(err);
	    	if (rows && rows.length > 0) {
	      		var user = rows[0];
	      		callback(null, user);
	    	} else {
	    		callback(null)
	    	}
	  	});
	},

	login: function(req, res) {
		return res.render("login", { user: req.user,	message: "Error logging in", title: "Login" });
	},

	findOne: function (user, callback) {
		var username = user.username;
		var password = user.password;
		
		sql = 'SELECT * FROM users WHERE username = ' + connection.escape(username);
		connection.query(sql, function(err, rows) {
	    	if (err) return err;
	    	if (rows && rows.length > 0) {
	      		var user = rows[0];
	      		console.log(rows);
	      		bcrypt.compare(password, user.password, function (err, isMatch) {
				    if (err) { return callback(err) };
				    if (isMatch) {
		      			return callback(false, user);
		      		} else {
		      			console.log("null/null user exists just wrong password");
	    				return callback(null, null); 
		      		}
			    });
	    	}
	    	else {
	    		console.log("null/null no such user");
	    		return callback(null, null); 
	    	}
	  	});
	},

	findAllUsers: function (callback) {
		var sql = "SELECT u.id, u.first_name, u.last_name, u.email, u.username, u.last_login, u.date_joined, ug.group_id, ug.user_id, g.group, cu.company_id, c.company "+
			" FROM users AS u LEFT JOIN users_groups AS ug ON (u.id=ug.user_id)"+
			" LEFT JOIN groups AS g ON (ug.group_id=g.id) "+
			" LEFT JOIN company_users AS cu ON (cu.user_id=u.id) "+
			" LEFT JOIN companies AS c ON (c.id=cu.company_id)";
		connection.query(sql, function(err, rows) {
			if(err) return err;
			if(rows!=null) {
				return callback(null, rows);
			} else {
				return callback(null);
			}

		});
	},

	findAllUsersByGroup: function(group_id, callback) {
		var sql = "SELECT u.id, u.first_name, u.last_name, u.email, u.username, u.last_login, u.date_joined, ug.group_id, ug.user_id, g.group, cu.company_id, c.company "+
			" FROM users AS u LEFT JOIN users_groups AS ug ON (u.id=ug.user_id)"+
			" LEFT JOIN groups AS g ON (ug.group_id=g.id) "+
			" LEFT JOIN company_users AS cu ON (cu.user_id=u.id) "+
			" LEFT JOIN companies AS c ON (c.id=cu.company_id) "+
			" WHERE g.id=?";
		connection.query(sql, group_id, function(err, rows) {
			if(err) return err;
			if(rows!=null) {
				return callback(null, rows);
			} else {
				return callback(null);
			}

		});
	},

	createUser: function(user, groupId, callback) {
		var username = user.username;
		console.log(user);
		console.log(groupId);
		this.findUserByCellphone(user.cellphone, function(err, result_c) {
			if(err) return callback(new Error("Error"));
			if(result_c) { return callback(new Error("Cellphone number exists")) }
			else {
			  module.exports.findByUsername(username, function(err, results){
				module.exports.findUserByEmail(user.email, function (err2, result_e) {
					if(err2) { return callback(err); }
					if(result_e) {
						return callback(new Error("Email exists"))
					} else {
						console.log("Before bcrypt")
						bcrypt.genSalt(10, function(err, salt) {
							bcrypt.hash(user.password, salt, function(err, hash){
								if(err) { return callback(err) };
								console.log(results);
								console.log(result_e);
								if(results!==null) { 
									console.log("Results");
									console.log(results);
									return callback(new Error('Username exists'));
								} else {
									var userObj = {
										first_name: user.first_name, 
										last_name: user.last_name, 
										username: user.username,
										email: user.email,
										cellphone: user.cellphone,
										password: hash,
										date_joined: new Date() 
									};

									mail_details = {
						                from: "Smart Park <samuel@littlebuddhadigital.com>", // sender address
						                to: user.first_name +" "+ user.last_name + " <"+ user.email +">", // comma separated list of receivers
						                subject: "Welcome SmartPark ✔", // Subject line
						                text: "SmartPark ✔", // plaintext body
						                html: "<html><body><h2>SmartPark</h2><p>This is the SmartPark welcome email. </p> <p>Username: "+ user.username +"<br />Password: "+ user.password +"</p> <p>The aim is to create hassle free, device independant parking solution.</p></body></html>"
						            };
						            
						            var company_name = null;
				        			var registration_no = null;
				        			var contact = null;
				        			var vat_number = null;
				        			var address = null;

				        			if(undefined !== typeof user.company) { company_name = user.company; }
			        				if(undefined !== typeof user.registration_number) { registration_no = user.registration_number; }
			        				if(undefined !== typeof user.address) { address = user.address; }
			        				if(undefined !== typeof user.contact) { contact = user.contact; }
			        				if(undefined !== typeof user.vat_number) { address = user.vat_number; }

			        				console.log(groupId);

			        				var company_error = null;

							        connection.query("INSERT INTO users SET ?", userObj, function(err, queryres) {
							        	if(err) { return callback(err); }
							        	if(queryres!==null) {
							        		var company_obj = {company_name: company_name, registration_no: registration_no, company_admin: queryres.insertId, vat_number: vat_number, address: address, contact: contact}
							        		if(groupId==2) {
						        				company_error = ModUser.saveCompany(company_obj, function (err, res_comp) { 
						        					if(err) { return callback(err); }
						        					if(res_comp===null) {
						        						return true;
						        					} else {
						        						return null;
						        					}
						        				});
					        				}
					        				if(groupId==2 && company_error===true) { return callback(new Error("Company Fields not optional on Company user type")); }; 

							        		module.exports.addUserToGroup(queryres.insertId, groupId, function(err, grp_response) { 
								        			if(err) { callback(err); }
								        			ModTrans.createAccount(queryres.insertId, function(err, acc_response) {
								        				if(err) { callback(err); }
											            EmailMod.sendMail(mail_details, function(err, mail_response){
											                if(err) { 
											                	log.error("Error sending mail to: ");
											                	log.error(mail_details);
											                    console.log("Error sending mail");
											                    return callback(err);
											                } 

											                if(mail_response!==null) {
											                    console.log("Message sent" + mail_response);
											                    return callback(null, queryres);
											                } else {
											                	return callback(new Error("Email not sent"));
											                }
											            });
										            });
								            });
							            } else {
							            	return callback(new Error("Error creating user"));
							            }
							      	});
						      	} 
					      	});
				      	});
					}
				});
			  });
			}
		});
	},

	deleteUser: function(user_id, callback) {
		var sql = "DELETE FROM users WHERE users.id=?";
		connection.query(sql, user_id, function (err, response) {
			console.log(err);
			console.log(response);
			if(err) { return callback(err); }
			if(response) {
				return callback(null, response);
			} else {
				return callback(null, null);
			}
		});
	},

	deleteCompany: function(company_id, callback) {
		var sql = "DELETE FROM companies WHERE id = ?";
		connection.query(sql, company_id, function(err, response) {
			if(err) { return callback(err); }
			if(response) {
				return callback(null, true);
			} else {
				callback(null, null)
			}
		});
	},

	saveCompany: function(company, callback) {
		var sql_company = "INSERT INTO companies SET ?";
		var sql_company_users = "INSERT INTO company_users SET ?";
		var comp_obj = { company: company.company_name, registration_number: company.registration_no, vat_number: company.vat_number, billing_address: company.address, business_contact: company.contact }; 
		connection.query(sql_company, comp_obj, function(err, response_1) {
			if(err) { return callback(err); }
			if(response_1) {
				if(company.company_admin) {
					var obj = { user_id: company.company_admin, company_id: response_1.insertId};
					connection.query(sql_company_users, obj, function(err, response_2) {
						if(err) { return callback(err);}
						if(response_2) {
							return callback(null, true);
						} else {
							return callback(null, null);
						}
					});
				} else {
					return callback(null, true);
				}
			} else {
				return callback(null, null);
			}
		});
	},

	saveProfile: function(user_id, user, callback) {
		var username = user.username;
		var email = user.email;
		// match against logged in user
		var sql = "UPDATE users SET ? WHERE id = "+ connection.escape(user_id);
		connection.query(sql, user, function (err, response) {
			if(err) { return callback(err); }
			if(response!=null){
				return callback(null, response);
			} else {
				return callback(null);
			}
		});
	},

	saveNewPassword: function(user_id, password, callback) {
		bcrypt.genSalt(10, function(err, salt) {
            bcrypt.hash(password, salt, function(err, hash){
                if(err) { return callback(err); };
                if(hash==null) {
                	return callback(null);
                } else {
                    var sql = "UPDATE users SET password="+ connection.escape(hash) +" WHERE id = "+ connection.escape(user_id);
                    connection.query(sql, function(err, result) {
                        if(err) { return callback(err); };
		                if(result==null) {
		                	return callback(null);
		                } else {
		                	return callback(null, result);
		                }
                    });
                }
            });
        });
	},

	generateRandomAlphaNumeric: function(numGen){
		var idChars = "1234567890abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
		var numChars = numGen;

		var randomId = "";
		while(numChars){
			var rnum = Math.floor(Math.random() * idChars.length);
			randomId += idChars.substring(rnum,rnum+1);
			numChars --;
		}

		return randomId;
	},

	resetPassword: function(user, password, callback){
		bcrypt.genSalt(10, function(err, salt) {
			bcrypt.hash(password, salt, function(err, hash){
				if(err) { return callback(err) };
				if(hash) {
					sql = 'UPDATE users SET password = ? WHERE id = '+ user.user_id;
					connection.query(sql, hash, function(err, queryres){
						if(err) { return callback(err); }
						if(queryres==null){
							return callback(err, null);
						} else {
							return callback(err, queryres);
						}
					});
				}
				else 
				{
					return callback(err, null);
				}
			});
		});
	},

	matchToken: function(token, callback){
		var sql = 'SELECT * FROM token_stamps WHERE token = '+ connection.escape(token);
		connection.query(sql, function(err, result){
			if (err) {return callback(err);}
			if (result.length > 0) {
				var now = new Date().getTime();
				var ts = new Date(result[0].timestamp);
				var expiryDate4Link = ts.getTime() + (1000*60*60*24);

				if (now < expiryDate4Link) {
					callback(err, result[0]);
				}
				else
				{
					console.log("link expired");
					// Link expired
					callback(err, null)
				}

			}
			else {
				// no such token
				callback(err, null);
			}
		}); 
	},

	forgotPassword: function(username, email, callback){
		var fs = require('fs');
		var sql = 'SELECT * FROM users WHERE username = '+ connection.escape(username) +' AND email = '+  connection.escape(email);
		var token = this.generateRandomAlphaNumeric(75); // generate token for email link
		var email_template =  __dirname + '/../views/forgot.html'; 
		console.log("in forgotPassword");
		connection.query(sql, function(err, results){
			if (err) { 
				console.log(err);
				return callback(err); }
			console.log("results for getting user");
			console.log(results);
			if(results.length > 0) {
				var r = results[0];
				name = r.first_name +' '+ r.last_name;
				link = "http://localhost:3000/reset/" + token;
				var post = { token: token, timestamp: new Date().getTime(), user_id: r.id }; // to insert to token_stamps

				var mail_vars = { name: name, link: link, username: username };
				connection.query('INSERT INTO token_stamps SET ?', post, function(err, queryres){
					console.log(email_template);
					fs.readFile(email_template, function(err, data){
						console.log(err);
						if (err) throw err;

						data = data.toString();
						data = data.replace(/{{name}}/g, name);
						data = data.replace(/{{link}}/g, link);
						data = data.replace(/{{username}}/g, username);

						console.log("Data is ....");
						console.log(data);

						mail = {
							from: "Smart Park <samuel@littlebuddhadigital.com>",
							to: name +" <"+ email +">, TestMailer <skomfi@gmail.com>",
							subject: "Password Reset Confirmation",
							html: data };

						EmailMod.sendMail(mail, function(err, response){
							if (err) { return callback(err) };
							if (response) {
								callback(err, response);
							} else {
								callback(err, null);
							}
						});
					});
				});
			}
			else{
				console.log("Failed");
				console.log(results);
				return callback(err, null);
			}
		});
	},

	getCompanies: function (callback) {
		var sql = 'SELECT * FROM companies';
		connection.query(sql, function(err, companies){
			if(err) { return callback(err); }
			if(companies!=null & companies.length>0) {
				return callback(null, companies);
			} else {
				return callback(null);
			}
		});
	},


	getCompany: function (userId, callback) {
		var sql = 'SELECT cu.company_id, c.company, c.registration_number FROM company_users AS cu LEFT JOIN users_groups AS ug ON ug.user_id=cu.user_id LEFT JOIN companies AS c ON c.id=company_id WHERE cu.user_id='+ connection.escape(userId) +' LIMIT 1';
		connection.query(sql, function (err, company) {
			if(err) { return err; }
			if(company && company.length > 0) {
				return callback(null, company[0]);
			} else {
				return callback(null, null);
			}
		});
	},	

	/*
	 * Get a list of users that are administered and belongs to the users company. 
	 */
	getCompanyUsers: function(userId, callback){
		var sql_company = 'SELECT cu.company_id, c.company FROM company_users AS cu LEFT JOIN users_groups AS ug ON ug.user_id=cu.user_id LEFT JOIN companies AS c ON c.id=company_id WHERE cu.user_id='+ connection.escape(userId) +' LIMIT 1';
		var sql_users = 'SELECT u.first_name, u.last_name, u.username, u.email, u.last_login, u.date_joined, acc.balance, acc.user_id FROM users AS u LEFT JOIN accounts AS acc ON acc.user_id=u.id LEFT JOIN company_users AS cu ON cu.user_id=u.id WHERE cu.company_id=? AND cu.user_id<>'+connection.escape(userId);
		connection.query(sql_company, function(err, userComp) {
			if (err) { return callback(err); }
			if (userComp!==null & userComp.length>0) {
				connection.query(sql_users, userComp[0].company_id, function (err, users) {
					if(err) { 
						log.error(err);
						return callback(err); 
					}

					if(users)
					{
						console.log("ok");
						return callback(null, userComp, users);
					} else {
						console.log("just user");
						log.info("Company user with no users managed");
						return callback(null, userComp, null);
					}
				});
			} else {
				//
				return callback(null);
			}
		});
	},

	getCompanyAdmin: function(company_id, callback) {
		var sql = "SELECT u.id, u.first_name, u.last_name FROM company_users AS cu LEFT JOIN users AS u ON (cu.user_id=u.id) "+
					" LEFT JOIN users_groups AS ug ON u.id=ug.group_id WHERE ug.group_id=2 AND cu.company_id=?";
		connection.query(sql, company_id, function (err, company_admin) {
			if(err) { return callback(err); }
			if(company_admin) {
				return callback(null, company_admin);
			} else {
				return callback(null, null);
			}
		});
	},

	getCompanyUsersById: function(companyId, callback){
		// TODO: suspicious ameteurish sql going on here need to be removed
		var sql_company = 'SELECT id, company,registration_number FROM companies WHERE id='+ connection.escape(companyId) +' LIMIT 1';
		var sql_users = "SELECT u.id, u.first_name, u.last_name, u.email, u.username, u.last_login, u.date_joined, ug.group_id, ug.user_id, g.group, cu.company_id, c.company "+
			" FROM users AS u LEFT JOIN users_groups AS ug ON (u.id=ug.user_id)"+
			" LEFT JOIN groups AS g ON (ug.group_id=g.id) "+
			" LEFT JOIN company_users AS cu ON (cu.user_id=u.id) "+
			" LEFT JOIN companies AS c ON (c.id=cu.company_id) WHERE c.id=?";
		connection.query(sql_company, function(err, userComp) {
			if (err) { return callback(err); }
			if (userComp!==null & userComp.length>0) {
				connection.query(sql_users, companyId, function (err, users) {
					if(err) { 
						log.error(err);
						return callback(err); 
					}

					if(users)
					{
						return callback(null, userComp, users);
					} else {
						console.log("just user");
						log.info("Company user with no users managed");
						return callback(null, userComp, null);
					}
				});
			} else {
				//
				return callback(null);
			}
		});
	},

	updateLastLogin: function(userId, callback){
		var now = new Date();
		var sql = 'UPDATE users SET last_login='+ connection.escape(now) +' WHERE id=?';
		connection.query(sql, userId, function (err, result) {
			if(err) {
				log.error(err);
				return callback(err);
			}

			if (result!==null) {
				return callback(null, result);
			}
			else
			{
				return callback(null, null);
			}
		});
	},

	/**
	 * Add user to a certain group
	 * TODO: Check if user belongs to other group, rules for users to change their groups
	 */
	addUserToGroup: function(userId, groupId, callback) {
		console.log("addUserToGroup");
		console.log(userId);
		console.log(groupId);
		var row = {user_id: userId, group_id: groupId}
		var sql = "INSERT INTO users_groups SET ?";
		connection.query(sql, row, function (err, result) {
			if(err) { return callback(err); }
			if(result) {
				return callback(null, result);
			} else {
				return callback(null, null);
			}
		});
	},

	addUserToCompany: function (userId, companyId, callback) {
		var row = {user_id: userId, company_id: companyId};
		var sql = "INSERT INTO company_users SET ?";
		connection.query(sql, row, function (err, result) {
			if(err) { return callback(err); }
			if(result) {
				return callback(null, result);
			} else {
				return callback(null, null);
			}
		});
	},

	getGroups: function (callback) {
		var sql = "SELECT * FROM groups";
		connection.query(sql, function (err, groups) {
			if(err) { return callback(err); }
			if(groups!=null) {
				return callback(null, groups);
			} else {
				return callback(null);
			}
		})
	}
}

function comparePassword (candidatePassword, password, callback) {		
	bcrypt.compare(candidatePassword, password, function (err, isMatch) {
	    if (err) { return callback(err) };
	    console.log(isMatch);
	    return callback(err, isMatch);
    });
}

function createBcryptHash(password){
	bcrypt.hash('bacon', 8, function(err, hash) {
		if(err) { throw err; }
		return hash;
	});
};

