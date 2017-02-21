var express = require("express");
var app = express();
var config = require('../config'); // get our config file
app.set('superSecret', config.secret); // secret variable
var mongoose = require('mongoose');

var userModel = mongoose.model('userModel');
var eventModel = mongoose.model('eventModel');

var pageSize=config.pageSize;

exports.getAllEvents = function(req, res) {
	eventModel.find({
		date: {$gte: new Date()},
		type: {$nin: ["alert"]}//cal filtrar per type d'event, aquí només agafem els type: alert
	})
	.lean()
    .populate('user', 'username img shortDescription')
	.sort('date')
    .limit(pageSize)
    .skip(pageSize * Number(req.query.page))
    .exec(function (err, events) {
        if (err) return res.send(500, err.message);
        res.status(200).jsonp(events);
    });
};
exports.getAllAlerts = function(req, res) {
	eventModel.find({
		date: {$gte: new Date()},
		type: "alert"
	})
	.lean()
    .populate('user', 'username img shortDescription')
	.sort('date')
    .limit(pageSize)
    .skip(pageSize * Number(req.query.page))
    .exec(function (err, events) {
        if (err) return res.send(500, err.message);
        res.status(200).jsonp(events);
    });
};

exports.getEventById = function (req, res) {
    eventModel.findOne({_id: req.params.eventid})
    .lean()
    .populate('user', 'username img shortDescription')
    .exec(function (err, event) {
        if (err) return res.send(500, err.message);
        if (!event) {
            res.json({success: false, message: 'event not found.'});
        } else if (event) {

            res.status(200).jsonp(event);
        }
    });
};


exports.addEvent = function(req, res) {
	userModel.findOne({'tokens.token': req.headers['x-access-token']})
	.exec(function(err, user){
		if (err) return res.send(500, err.message);
		if (!user) {
			console.log("user not found");
            res.json({success: false, message: 'User not found.'});
        } else if (user) {
			var event = new eventModel({
				title: req.body.title,
			    description:   req.body.description,
			    img:   req.body.img,
			    date:   req.body.date,
			    categories:   req.body.categories,
			    generateddate: Date(),
			    user:   user._id
			});

			event.save(function(err, event) {
				if(err) return res.send(500, err.message);

				user.events.push(event._id);
				user.save(function (err, user) {
                    if (err) return res.send(500, err.message);
					exports.getAllEvents(req, res);
                });
			});//end of event.save
		}
	});//end of usermodel.find
};
exports.addAlert = function(req, res) {
	userModel.findOne({'tokens.token': req.headers['x-access-token']})
	.exec(function(err, user){
		if (err) return res.send(500, err.message);
		if (!user) {
			console.log("user not found");
            res.json({success: false, message: 'User not found.'});
        } else if (user) {
			var event = new eventModel({
				title: req.body.title,
			    description:   req.body.description,
			    date:   req.body.date,
			    generateddate: Date(),
			    user:   user._id,
				type: "alert"
			});

			event.save(function(err, event) {
				if(err) return res.send(500, err.message);

				user.events.push(event._id);
				user.save(function (err, user) {
                    if (err) return res.send(500, err.message);
					exports.getAllEvents(req, res);
                });
			});//end of event.save
		}
	});//end of usermodel.find
};
exports.deleteEvent = function(req, res) {
	userModel.findOne({'tokens.token': req.headers['x-access-token']})
	.exec(function(err, user){
		if (err) return res.send(500, err.message);
		eventModel.findOne({
			_id: req.params.eventid,
			user: user._id
		})
		.exec(function(err, event) {
			if (err) return res.send(500, err.message);
			if(event.user.equals(user._id))
			{
				event.remove(function(err) {
					if(err) return res.send(500, err.message);

					console.log("deleted");
					exports.getAllEvents(req, res);
				});
			}
		});
	});
};//funciona, pero no esborra les referències dels users als events que s'esborren. Més endavant caldria fer-ho.

/*
un get events by following, que seria:
s'envia un post /events/following
amb la data:
{
  "following": ["user1", "user2", "user3"]
}
que bàsicament és una array amb els followings que tens
això retorna els events d'aquests users que segueixes
*/

exports.getEventsByFollowingArray = function(req, res) {
	eventModel.find({
        date: {$gte: new Date()},
        'username': req.body.users
    })
	.sort('date')
    .limit(pageSize)
    .skip(pageSize * Number(req.query.page))
    .exec(function (err, events) {
        if (err) return res.send(500, err.message);
        res.status(200).jsonp(events);
    });
};

/*
un get events by categories, que seria:
s'envia un get /events/category/:category
això retorna els events d'aquests users que segueixes
*/
exports.getEventsByCategory = function(req, res) {
	eventModel.find({
        date: {$gte: new Date()},
        'categories.name': req.params.category
    })
	.sort('date')
    .limit(pageSize)
    .skip(pageSize * Number(req.query.page))
    .exec(function (err, events) {
        if (err) return res.send(500, err.message);
        res.status(200).jsonp(events);
    });
};
