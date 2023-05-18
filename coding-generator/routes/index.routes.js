const express = require("express");
const router = express.Router();
const axios = require("axios");

const User = require("../models/User.model");
const Question = require("../models/Question.model");

const bcryptjs = require("bcryptjs");
const saltRounds = 12;
const { isLoggedIn, isLoggedOut } = require("../middlewares/route-guard.js");

/* GET home page */
router.get("/", (req, res, next) => {
  res.render("index");
});

//  (req, res, next) => {
//     console.log(req.session);
//     next();
//   },
//signup
router.get("/signup", isLoggedOut, (req, res, next) => {
  try {
    res.render("auth/signup");
  } catch (err) {
    console.log("you have the following error at signup:", err);
  }
});

//insert middleware here
router.post("/signup", isLoggedOut, async (req, res, next) => {
  // reprieve info from form
  const { email, password } = req.body;

  // check if user already exists
  try {
    const userFromDatabase = await User.findOne({ email });
    if (userFromDatabase) {
      return res.status(400).send("User already exists, go back to previous page");
    }

    const salt = await bcryptjs.genSalt(saltRounds);
    const hash = await bcryptjs.hash(password, salt);

    const user = new User({ email: req.body.email, password: hash });
    await user.save();

    res.redirect("/my-overview");
  } catch (error) {
    next(error);
  }
});

router.get("/my-overview", isLoggedIn, async (req, res, next) => {
  const userEmail = req.session.userFromDatabase.email;
  const tempUserId = await User.findOne({email:userEmail});
  //const userId= tempUserId;
  const questionsUserHasAnsweredId = tempUserId.answeredQuestions; 
 
  //console.log('user questions',questionsUserHasAnswered)
  try{
    const questionArr =[];
  for(let i=0; i<questionsUserHasAnsweredId.length; i++){
    let questionsUserHasAnswered = questionsUserHasAnsweredId[i]._id.toString();
    let questionModelFromUser = await Question.findById(questionsUserHasAnswered)
    questionArr.push(questionModelFromUser);
  }

  res.render("my-overview", {questions:questionArr});
  }catch(error){
    console.log('error getting the questions to overview',error )
  }

  
  

  
});

router.get("/login", isLoggedOut, (req, res, next) => {
  try {
    res.render("auth/login");
    console.log("successfully rendered login page");
  } catch (err) {
    next(err);
  }
});

router.post("/login", isLoggedOut, async (req, res) => {
  // get info from form
  const { email, password } = req.body;
  //console.log("req.body is:", req.body);

  if (email === "" || password === "") {
    res.render("auth/login", {
      errorMessage: "Please enter both, email and password to login.",
    });
    return;
  }

  const userFromDatabase = await User.findOne({ email });
  //console.log("user from database: ", userFromDatabase);
  try {
    if (!userFromDatabase) {
      console.log("email or password incorrect");
      res.render("auth/login", { errorMessage: "Email is not registrered, try another email-adress" });
    } else if (bcryptjs.compareSync(password, userFromDatabase.password)) {
      req.session.userFromDatabase = { email: userFromDatabase.email };
      console.log("password correct");

      const userEmail = req.session.userFromDatabase.email;
  const tempUserId = await User.findOne({email:userEmail});
  //const userId= tempUserId;
  const questionsUserHasAnsweredId = tempUserId.answeredQuestions; 
 
  //console.log('user questions',questionsUserHasAnswered)
  
    const questionArr =[];
  for(let i=0; i<questionsUserHasAnsweredId.length; i++){
    let questionsUserHasAnswered = questionsUserHasAnsweredId[i]._id.toString();
    let questionModelFromUser = await Question.findById(questionsUserHasAnswered)
    questionArr.push(questionModelFromUser);}
  

      res.render("my-overview", { userFromDatabase, questions:questionArr});
    } else {
      console.log("only password incorrect");
      res.render("auth/login", { errorMessage: "Incorrect password." });
    }

    //req.session.userFromDatabase = { email: userFromDatabase.email };
    
  } catch (err) {
    console.log("catch from login");
  }
  //console.log("SESSION =====> ", req.session);
});

//get question route
router.get("/createQuestion", isLoggedIn, (req, res, next) => {
  try {
    console.log("successfully rendered question page");
    res.render("questions/createQuestion");
  } catch (err) {
    console.log("error while geting question page");
  }
});

//Post Question route
router.post("/createQuestion", isLoggedIn, async (req, res, next) => {
  // retreive info from question form
  const { description, correct, false1, false2, false3 } = req.body;
  console.log(req.body);
  try {
    const question = new Question({
      description: req.body.description,
      correct: req.body.correct,
      false1: req.body.false1,
      false2: req.body.false2,
      false3: req.body.false3,
    });
    await question.save();

    res.redirect("/my-overview");
  } catch (error) {
    console.log("could not post question", error);
  }
});

// View questions get route
router.get("/view-questions", isLoggedIn, (req, res, next) => {
  Question.find()
    .then((questionsFromDb) => {
     // console.log("retrieved questions", questionsFromDb);
      res.render("questions/view-questions", { questions: questionsFromDb });
    })
    .catch((error) => {
      console.log("error getting questions", error);
    });
});

router.get("/update/:questionId", isLoggedIn, (req, res, next) => {
  const { questionId } = req.params;
  Question.findById(questionId)
    .then((questionToEdit) => {
      console.log(questionToEdit);
      res.render("questions/update", { question: questionToEdit });
    })
    .catch((error) => {
      console.log("rendering get /update/:questionId did not work", error);
    });
});

router.post("/update/:questionId", isLoggedIn, (req, res, next) => {
  const { questionId } = req.params;
  const { description, correct, false1, false2, false3 } = req.body;

  Question.findByIdAndUpdate(questionId, { description, correct, false1, false2, false3 }, { new: true })
    .then(() => res.redirect("/view-questions"))
    .catch((error) => console.log("updating went wrong", error));
});

router.post("/update/:questionId/delete", isLoggedIn, (req, res, next) => {
  const { questionId } = req.params;
  console.log("should delete");

  Question.findByIdAndDelete(questionId)
    .then(() => res.redirect("/view-questions"))
    .catch((error) => console.log("could not delete question", error));
});

router.get("/play", isLoggedIn, async (req, res, next) => {
  try {
    // use a mongodb not in query written as $nin

    


    const userEmail = req.session.userFromDatabase.email;
    const userId = await User.findOne({email:userEmail});
    const questionsUserHasAnswered = userId.answeredQuestions;

    const questionFromDb = []; 
console.log('questions user has a',questionsUserHasAnswered)

for (let i=0;questionsUserHasAnswered.length;i++){
   let questionFromDbTemp = await Question.find({_id:{$nin:[questionsUserHasAnswered[i]]}});
   questionFromDb.push(questionFromDbTemp);

};
console.log('questions user has a, after loop',questionsUserHasAnswered)
    const randomIndex = Math.floor(Math.random() * questionFromDb.length);

    const randomQuestion = questionFromDb[randomIndex];

    const answerArr = [
      randomQuestion.correct, 
      randomQuestion.false1, 
      randomQuestion.false2, 
      randomQuestion.false3
    ];
    
    // console.log('answers',answerArr);

    const answersRandomized = answerArr.sort(() => Math.random() - 0.5);
     console.log(randomQuestion);
    // console.log(answersRandomized);
    res.render("questions/play", { randomQuestion, answersRandomized })
    

    

// const randomIndex = Math.floor(Math.random() * questionFromDb.length);

//     const randomQuestion = questionFromDb[randomIndex];

//     const answerArr = [randomQuestion.correct, randomQuestion.false1, randomQuestion.false2, randomQuestion.false3];
//     // console.log('answers',answerArr);

//     const answersRandomized = answerArr.sort(() => Math.random() - 0.5);
//      console.log(randomQuestion);
//     // console.log(answersRandomized);
//     res.render("questions/play", { randomQuestion, answersRandomized });


    
  
   
  } catch (error) {
    console.log("could not get question from db to /play", error);
  }
});

router.get("/test/:questionId/:answer", isLoggedIn, async (req, res) => {
  const { questionId, answer } = req.params;

  const userEmail = req.session.userFromDatabase.email;
  const tempUserId = await User.findOne({email:userEmail});
  const userId= tempUserId._id.toString();

  //console.log('user email ',userEmail, 'userId', userId._id.toString(), req.session.userFromDatabase);

  try {
    const findQuestion = await Question.findById(questionId);
    console.log('find question',findQuestion);

    if (findQuestion.correct === answer) {
    //find user model and push the questionID to the array answeredQuestion
     let result = await User.findByIdAndUpdate(userId, { $push :{answeredQuestions:questionId}},{new:true});


      console.log('question id',questionId, 'result', result);
      
      res.redirect("/correct");
    } else {
      res.redirect("/wrong");
    }
  } catch (error) {
    console.log(error, "finding question went wrong");
  }
});

// router.post("/test/:questionId/:answer", isLoggedIn, async (req, res) => {
//   const userId = req.session.userFromDatabase._id;
//   console.log('user id ',userId);
// });


router.get(`/correct`, isLoggedIn, (req, res) => {
  res.render(`questions/correct`);
});

router.get("/wrong", isLoggedIn, (req, res) => {
  res.render("questions/wrong");
});

router.post("/logout", isLoggedIn, (req, res, next) => {
  req.session.destroy((err) => {
    if (err) next(err);
    res.redirect("/");
  });
});

router.post("/api/generate-text", isLoggedIn, async (req, res, next) => {
  const promptQuestion = `You are an interviewer for a web development job. Create an easy level, multiple-choice web development question for an interview. The question should have 4 possible answers, of which only one is correct. Each answer should be no more than one word. Please note, only the question is required here, the answers will be generated separately. For instance:

  Question: Which of the following languages is not typically used for web development?
  
  Following this example, please generate a new question.`;

  console.log("made it to api");
  try {
    const responseQuestion = await axios.post(
      "https://api.openai.com/v1/engines/text-davinci-003/completions",
      {
        prompt: promptQuestion,
        max_tokens: 40,
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    const generatedQuestion = responseQuestion.data.choices[0].text;

    res.json({ description: generatedQuestion });
  } catch (err) {
    console.error("Error:", err);
    res.status(500).json({ err: "test Error generating text" });
  }
});

router.post("/api/generate-correct-answer", isLoggedIn, async (req, res, next) => {
  const question = req.body.description;

  const promptCorrectAnswer = `You are an interviewer for a web development job. Given the question "${question}", provide a single-word, objectively correct answer. Please note, the answer should be applicable to the context of the question and make sense in relation to the elements required for a fully functioning website.`;
  try {
    const responseCorrectAnswer = await axios.post(
      "https://api.openai.com/v1/engines/text-davinci-003/completions",
      {
        prompt: promptCorrectAnswer,
        max_tokens: 40,
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    const generatedCorrectAnswer = responseCorrectAnswer.data.choices[0].text;
    res.json({ correct: generatedCorrectAnswer });
  } catch (error) {
    console.error("Error:", error);
  }
});

router.post("/api/generate-false-answer", isLoggedIn, async (req, res, next) => {
  const question = req.body.description;
  const previousCorrectAnswer = req.body.correct;

  const promptIncorrectAnswer = `You are an interviewer for a web development job. Given the question "${question}", provide a single-word incorrect answer. Please note, the answer should be unrelated or incorrect in the context of the question and not make sense in relation to the elements required for a fully functioning website.`;

  try {
    const responseIncorrectAnswer = await axios.post(
      "https://api.openai.com/v1/engines/text-davinci-003/completions",
      {
        prompt: promptIncorrectAnswer,
        max_tokens: 40,
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    const generatedIncorrectAnswer = responseIncorrectAnswer.data.choices[0].text;
    res.json({ incorrect1: generatedIncorrectAnswer });
  } catch (error) {}
});

// should remember the previous reponse and use it as a prompt for the next response
router.post("/api/generate-false-answer2", isLoggedIn, async (req, res, next) => {
  const question = req.body.description;
  const previousCorrectAnswer = req.body.correct;
  const previousIncorrectAnswer = req.body.incorrect;

  const prompt = `You are an interviewer for a web development job. Given the question "${question}", provide a single-word incorrect answer. Please note, the answer should be unrelated or incorrect in the context of the question and not make sense in relation to the elements required for a fully functioning website. Make sure you dont give the same answer as the correct answer of previous incorrect answer.
  
  correct answer: ${previousCorrectAnswer},
  incorrect answer: ${previousIncorrectAnswer}
  `;

  try {
    const responseIncorrectAnswer2 = await axios.post(
      "https://api.openai.com/v1/engines/text-davinci-003/completions",
      {
        prompt: prompt,
        max_tokens: 40,
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );
    const generatedIncorrectAnswer2 = responseIncorrectAnswer2.data.choices[0].text;
    res.json({ incorrect2: generatedIncorrectAnswer2 });
  } catch (error) {}
});

router.post("/api/generate-false-answer3", isLoggedIn, async (req, res, next) => {
  const question = req.body.description;
  const incorrectAnswers1 = req.body.incorrect;
});

module.exports = router;
