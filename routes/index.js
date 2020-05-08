// user related things
const express = require("express");
const router = express.Router();
const { ensureAuthenticated } = require("../config/auth");
const { loggedIn } = require("../config/auth");
const User = require('../models/User')
const Question = require('../models/Question')

// home page
router.get('/', loggedIn, (req, res) => res.render("home"));
// dashboard
router.get('/dashboard', ensureAuthenticated, (req, res) => res.render("dashboard",{
    name: req.user.name
}));

// leaderboard pages
// Sort by winrate
router.get('/leaderboard_winrate', async function (req, res) {
    User.find().sort({ win : -1 }).then(users => {
        // Sort by pure win percentage
        let sortedUsers = users.sort( (a, b) => {
            if (((a.win/(a.win+a.lose))*100) > ((b.win/(b.win+b.lose))*100)) {
                return -1; 
            }
            if (((b.win/(b.win+b.lose))*100) > ((a.win/(a.win+a.lose))*100)) {
                return 1; 
            }
            return 0;
        });
        res.render("leaderboard_winrate", {
            player_rows: sortedUsers
        });
    }).catch(err => console.log(err));
});

// Sort by win count
router.get('/leaderboard_wincount', async function (req, res) {
    User.find().sort({ win : -1 , lose: 1 }).then(users => {
        console.log(users)
        var player_rows = users;
        res.render("leaderboard_wincount", {
            player_rows: player_rows
        });
    }).catch(err => console.log(err));
});

// Sort questions by "hardest" 
router.get('/hardest_question', async function (req, res) {
    Question.find().sort({ wrong: -1,  right : -1 }).then(questions => {
        console.log(questions)
        var question_rows = questions;
        res.render("hardest_question", {
            question_rows: question_rows
        });
    }).catch(err => console.log(err));
});

module.exports = router;