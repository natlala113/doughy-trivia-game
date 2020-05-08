const mongoose = require("mongoose");

// Make scheme for user
//question: question, category: game.category, type: game.type, difficulty: game.difficulty, correct_answer: decodeHtml(game.correct_answer), right: 0, wrong: 0}];
const QuestionSchema = new mongoose.Schema({
    question: {
        type: String,
        required: true
    },
    category: {
        type: String,
        required: true
    },
    type: {
        type: String,
        required: true
    },
    difficulty: {
        type: String,
        required: true
    },
    correct_answer: {
        type: String,
        required: true
    },
    right: {
        type: Number,
        default: 0
    },
    wrong: {
        type: Number,
        default: 0
    },
})

const Question = mongoose.model("Question", QuestionSchema);

module.exports = Question