// user related things
const express = require("express");
const router = express.Router();
const { ensureAuthenticated } = require("../config/auth");
const Question = require('../models/Question');
const User = require('../models/User');
var fetch = require('node-fetch');

// game page
router.get('/', ensureAuthenticated, async function(req, res) {
    var opentdb = ("https://opentdb.com/api.php?amount=1");
    var game = "";
    var game_choices = [];
    var win = 0;
    var lose = 0;
    // Fetch the data from API
    await fetch(opentdb).then(response => response.json())
    .then(data => {
        game = data.results[0];
    })
    // Assign const 
    const category = game.category;
    const type = game.type;
    const difficulty = game.difficulty;
    const correct_answer = decodeHtml(game.correct_answer);
    // Organise answers
    // Sanitise before pushing
    game_choices.push(decodeHtml(game.correct_answer));
    for(var i in game.incorrect_answers){
        // Sanitise before pushing
        game_choices.push(decodeHtml(game.incorrect_answers[i]));
    }
    // If multiple choice, shuffle the answers
    if(game.type == "multiple"){
        game_choices = shuffleAnswers(game_choices);
    }
    if(game.type == "boolean"){
        game_choices[0] = "True";
        game_choices[1] = "False";
    }
    var question = decodeHtml(game.question);
    // Add question to mongodb for stats
    Question.findOne({question: question})
    .then(q => {
        if(q){
            // don't add as stat exists
        } else {
            console.log("saving question")
            const newQuestion = new Question({
                question,
                category,
                type,
                difficulty,
                correct_answer
            });
            // Save the question to mongodb
            newQuestion.save()
                .then(question => {
                    console.log("Successfully saved")
                }).catch(err => console.log(err));
        }
    });
    // Check player's winrate and then render
    User.findOne({email: req.user.email}).then(u => {
        if(u){
            console.log("Assign the win/lose for the player");
            win = u.win;
            lose = u.lose;
            var winrate = (win/(win+lose))*100;
            winrate = winrate.toFixed(2);
            if (isNaN(winrate)) {
                winrate = "0"
            }
            res.render("game",{
                name: req.user.name,
                question: question,
                game_type: type,
                category: category,
                difficulty: difficulty,
                game_choices: game_choices,
                winrate: winrate,
                player_win: win,
                player_lose: lose
            });
        }
    }).catch(err => console.log(err));
});


// Post
router.post('/result', async function (req, res, next) {
    const { choice, question } = req.body;
    // Add question to mongodb for stats
    var decoded_question = decodeHtml(question);
    Question.findOne({question: decoded_question})
    .then(q => {
        if(q){
            // edit stats according to right/wrong answer
            if(choice == q.correct_answer) {
                var answer_status = "You answer is correct!";
                console.log(q._id);
                // update question
                Question.findOneAndUpdate(
                    { _id: q._id },
                    { $inc: 
                        {
                            right: 1,
                        }
                    }
                ).then(question => {
                    console.log("Successfully updated question stats")
                }).catch(err => console.log(err));
                // update user
                User.findOneAndUpdate(
                    { email: req.user.email },
                    { $inc: 
                        {
                            win: 1,
                        }
                    }
                ).then(u => {
                    console.log("Successfully updated question stats")
                }).catch(err => console.log(err));
            } else {
                var answer_status = "Your answer is wrong";
                console.log(q._id);
                // update question
                Question.findOneAndUpdate(
                    { _id: q._id },
                    { $inc: 
                        {
                            wrong: 1,
                        }
                    }
                ).then(question => {
                    console.log("Successfully updated question stats")
                }).catch(err => console.log(err));
                // update user
                User.findOneAndUpdate(
                    { email: req.user.email },
                    { $inc: 
                        {
                            lose: 1,
                        }
                    }
                ).then(u => {
                    console.log("Successfully updated question stats")
                }).catch(err => console.log(err));
            }
            res.render('result', {
                name: req.user.name,
                question: decoded_question,
                correct_answer: q.correct_answer,
                answer_status: answer_status,
                answer: choice,
                category: q.category,
                difficulty: q.difficulty
            });
        } else {
        }
    });
});

// Make HTML entity readable for API 
function decodeHtml(str) {
    var entityPairs = [
        {character: '&', html: '&amp;'},
        {character: '<', html: '&lt;'},
        {character: '>', html: '&gt;'},
        {character: "'", html: '&apos;'},
        {character: "'", html: '&quot;'},
        {character: "'", html: '&#039;'},
    ];

    entityPairs.forEach(function(pair){
        var reg = new RegExp(pair.html, 'g');
        str = str.replace(reg, pair.character);
    });
    return str;
}

//call this for multiple choice
function shuffleAnswers(gameChoices){
    var current = gameChoices.length, temporary, random;
    while (0 !== current) {
      //pick unshuffled 
      random = Math.floor(Math.random() * current);
      current -= 1;
      //swap it around with current element
      temporary = gameChoices[current];
      gameChoices[current] = gameChoices[random];
      gameChoices[random] = temporary;
    }
    return gameChoices;
}

// Post
module.exports = router;