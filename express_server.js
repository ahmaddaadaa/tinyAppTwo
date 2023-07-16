const express = require("express");
const morgan = require('morgan');
const bcrypt = require("bcryptjs");
const cookieSession = require('cookie-session');
const helpers = require('./helpers');
const { urlDatabase, users } = require('./database');

const app = express();
const PORT = 8080; // default port 8080

let alarmFlag = 0; // used to display alarm messeges 

app.set("view engine", "ejs"); // set us a view engine for our EJS files 

//middleware
app.use(morgan('dev'));
app.use(express.urlencoded({ extended: true })); // populates: req.body
app.use(cookieSession({
  name: 'user_id',
  keys: ['myKey']

}));




/////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////
////////////////     GET  requests        ///////////////
/////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////         

// GET /
app.get("/", (req, res) => {
  alarmFlag = 0;
  if (req.session.user_id) {
    res.redirect("/urls");
  } else {
    res.redirect("/login");
  }
});

// GET /urls
app.get("/urls", (req, res) => {
  alarmFlag = 0;
  let id = req.session.user_id;
  let userUrlsDatabase = helpers.urlsForUser(id, urlDatabase);
  const user = users[id];

  // if not logged in:
  if (id === undefined) {
    return res.status(404).render("error", { user, message: "Can't show the URLs page. Login or Register first!" });
  }

  // logged in 
  if (Object.values(userUrlsDatabase).length === 0) {
    return res.status(404).render("error", { user, message: "No URLs found!! Start creating new ones!" });
  }





  const templateVars = {
    urls: userUrlsDatabase,
    user: user,
    id: id
  };
  console.log("users :" + JSON.stringify(users));
  res.render("urls_index", templateVars);

});

// GET /urls/new
app.get("/urls/new", (req, res) => {
  let id = req.session.user_id;
  if (id === undefined) {
    res.redirect("/login");
  }
  let user = users[id];
  const templateVars = { user: user };
  res.render("urls_new", templateVars);
});

// GET /login
app.get("/login", (req, res) => {
  if (req.session.user_id !== undefined) {
    res.redirect("/urls");
  }
  res.render("login", { alarmFlag });

});



// GET /register
app.get("/register", (req, res) => {
  if (req.session.user_id !== undefined) {
    res.redirect("/urls");
    return;
  }
  res.render("register", { alarmFlag });
});


//////////////////////////////////////////////////////
////////////////     GET  per "ID"  requests        //////////////////////////
//////////////////////////////////////////////////////



// GET /u/:id
app.get("/u/:id", (req, res) => {
  let idFound = null;
  let idUser = req.session.user_id;
  const user = users[idUser];


  for (let key in urlDatabase) {
    console.log("key", key);
    if (key === req.params.id) idFound = key;
  }

  if (idFound === null) {
    res.status(400).send("Not found!! Double check the Short Link Id.");
    return;
  }
  const longURL = urlDatabase[req.params.id].longURL;

  res.redirect(longURL);
});

// GET /urls/:id
app.get("/urls/:id", (req, res) => {

  let idUser = req.session.user_id;
  let id = req.params.id;
  let user = users[idUser];


  if (idUser === undefined) {
    return res.status(403).render("error", { user, message: "Can't show the URLs page. Login or Register first!" });
  }

  if (!helpers.verifyIfIdExists(id, urlDatabase)) {
    return res.status(403).render("error", { user, message: "the URL id does not exist" });
  }

  if (idUser !== urlDatabase[id].userID) {
    return res.status(403).render("error", { user, message: "You don't own the URL" });
  }

  const templateVars = {
    id: id,
    longURL: urlDatabase[id].longURL,
    user: user,
    idUser: idUser
  };


  res.render("urls_show", templateVars);
});




/////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////
////////////////     POST  requests        ///////////////
/////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////     





// POST /urls
app.post("/urls", (req, res) => {
  let idUser = req.session.user_id;
  let user = users[idUser];
  let generatedKey = '';

  if (idUser === undefined) {
    return res.status(401).render("error", { user, message: "Can't show the URLs page. Login or Register first!" });
  }

  generatedKey = helpers.generateRandomString();

  urlDatabase[generatedKey] = {
    longURL: req.body.longURL,
    userID: idUser
  };

  const templateVars = {
    id: generatedKey,
    longURL: urlDatabase[generatedKey].longURL,
    user: user,
    idUser: idUser
  };

  res.render("urls_show", templateVars);

});

// POST /login
app.post("/login", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;

  if (!email || !password) {
    alarmFlag = 1;
    return res.status(404).render("login", { alarmFlag, message: "Please provide a username and a password!" });
  }

  // lookup username and password:
  let founduser = null;
  for (var userId in users) {
    let user = users[userId];
    if (user.email === email) {
      // we found the user
      founduser = user;
    }

  }
  // did we not found the user?
  if (!founduser) {
    alarmFlag = 1;
    return res.status(404).render("login", { alarmFlag, message: "No user with that username is found!" });
  }



  if (bcrypt.compareSync(password, founduser.password) === false) {
    console.log("Password: " + password + ". encrypted: " + founduser.password);
    console.log("Password matched?? :" + bcrypt.compareSync(password, founduser.password));
    alarmFlag = 1;
    return res.status(401).render("login", { alarmFlag, message: "passward do not match!" });

  }

  //happy path!! the user and password found


  req.session.user_id = founduser.id;

  // redirect to /urls
  res.redirect('/urls');




});


// POST / logout
app.post("/logout", (req, res) => {
  req.session = null;
  res.redirect("/login");
});


//POST /register
app.post("/register", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;

  // check if entries are empty strings
  if (email === '' || password === '') {
    alarmFlag = 1;
    return res.status(400).render("register", { alarmFlag, message: "Email or password cannot be empty" });
  }

  // Check if email already exists
  if (helpers.getUserByEmail(email, users)) {
    alarmFlag = 1;
    return res.status(400).render("register", { alarmFlag, message: "Email already exists" });
  }


  const generatedUserID = helpers.generateRandomString();
  users[generatedUserID] = { id: generatedUserID, email: req.body.email, password: bcrypt.hashSync(req.body.password, 10) };


  req.session.user_id = generatedUserID;

  res.redirect("/urls");
});

//////////////////////////////////////////////////////
////////////////     POST  per "ID"  requests        //////////////////////////
//////////////////////////////////////////////////////



// POST /urls/edit/:id
app.post("/urls/edit/:id", (req, res) => {


  const id = req.params.id; // Retrieve the ID from the request parameters
  const newURL = req.body.longURL;
  let idUser = req.session.user_id;
  let user = users[idUser];
  urlDatabase[id].longURL = newURL;

  if (idUser === undefined) {
    return res.status(403).render("error", { user, message: "Can't show the URLs page. Login or Register first!" });
  }

  if (!helpers.verifyIfIdExists(id, urlDatabase)) {
    return res.status(403).render("error", { user, message: "the URL id does not exist" });
  }

  if (idUser !== urlDatabase[id].userID) {
    return res.status(403).render("error", { user, message: "You don't own the URL" });
  }
  res.redirect("/urls");

});

// POST /urls/:id/delete
app.post("/urls/:id/delete", (req, res) => {
  let id = req.session.user_id;
  let user = users[id];

  // if not logged in
  if (id === undefined) {
    return res.status(403).render("error", { user, message: "Can't Delete!. Not Logged in!!" });
  }

  if (!helpers.verifyIfIdExists(req.params.id, urlDatabase)) {
    return res.status(403).render("error", { user, message: "Id does not exist!" });
  }



  delete urlDatabase[req.params.id];


  res.redirect("/urls");


});





//////// calling the app
app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});