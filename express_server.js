const express = require("express");
const morgan = require('morgan');
const cookieParser = require('cookie-parser');

const app = express();
const PORT = 8080; // default port 8080

app.set("view engine", "ejs"); // set us a view engine for our EJS files 

//middleware
app.use(morgan('dev'));
app.use(express.urlencoded({ extended: true })); // populates: req.body
app.use(cookieParser());


// Database:

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

const users = {
  userRandomID: {
    id: "userRandomID",
    email: "user@example.com",
    password: "purple-monkey-dinosaur",
  },
  user2RandomID: {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "dishwasher-funk",
  },
};

// function to generate String ID
const generateRandomString = function() {
  return Math.random().toString(36).substring(2, 8);
};

// function returns email of a user
const getUserByEmail = function(email) {
  for (const userId in users) {
    if (users[userId].email === email) {
      return true;
    }
  }
};


/////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////
////////////////     GET  requests        ///////////////
/////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////         




// GET /urls
app.get("/urls", (req, res) => {
  let id = req.cookies.user_id;
  let user = users[id];


  const templateVars = {
    urls: urlDatabase,
    user: user
  };


  res.render("urls_index", templateVars);
});

// GET /urls/new
app.get("/urls/new", (req, res) => {
  let id = req.cookies.user_id;
  let user = users[id];
  const templateVars = {
    user: user
  };
  res.render("urls_new", templateVars);
});

// GET /login
app.get("/login", (req, res) => {
  res.render("login");
});



// GET /register
app.get("/register", (req, res) => {
  res.render("register");
});


//////////////////////////////////////////////////////
////////////////     GET  per "ID"  requests        //////////////////////////
//////////////////////////////////////////////////////



// GET /u/:id
app.get("/u/:id", (req, res) => {
  const longURL = urlDatabase[req.params.id];
  res.redirect(longURL);
});

// GET /urls/:id
app.get("/urls/:id", (req, res) => {
  let id = req.cookies.user_id;
  let user = users[id];
  const templateVars = { id: req.params.id, longURL: urlDatabase[req.params.id], user: user };
  res.render("urls_show", templateVars);
});




/////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////
////////////////     POST  requests        ///////////////
/////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////     





// POST /urls
app.post("/urls", (req, res) => {
  let id = req.cookies.user_id;
  let user = users[id];
  const generatedKey = generateRandomString();
  urlDatabase[generatedKey] = req.body.longURL;
  const templateVars = { id: generatedKey, longURL: req.body.longURL, user: user };
  res.render("urls_show", templateVars);
});

// POST /login
app.post("/login", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;

  // did we not get a username and a passward??
  if (!email || !password) {
    res.status(400).send('Please provide a username and a password');
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
    res.status(403).send('no user with that username found');
  }

  // do the password not match ?

  if (founduser.password !== password) {
    res.status(403).send('passward do not match');

  }

  //happy path!! the user and password found

  // set a cookie
  res.cookie('user_id', founduser.id);

  // redirect to /urls
  res.redirect('/urls');




});


// POST / logout
app.post("/logout", (req, res) => {
  res.clearCookie("user_id");
  res.redirect("/urls");
});


//POST /register
app.post("/register", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;

  // check if entries are empty strings
  if (email === '' || password === '') {
    res.status(400).send("Email or password cannot be empty");
    return;
  }

  // Check if email already exists
  if (getUserByEmail(email)) {
    res.status(400).send("Email already exists");
    return;
  }


  const generatedUserID = generateRandomString();
  users[generatedUserID] = { id: generatedUserID, email: req.body.email, password: req.body.password };


  console.log(users);
  res.cookie('user_id', generatedUserID);

  res.redirect("/urls");
});

//////////////////////////////////////////////////////
////////////////     POST  per "ID"  requests        //////////////////////////
//////////////////////////////////////////////////////



// POST /urls/edit/:id
app.post("/urls/edit/:id", (req, res) => {
  const id = req.params.id; // Retrieve the ID from the request parameters
  const newURL = req.body.longURL;
  let id_user = req.cookies.user_id;
  let user = users[id_user];

  urlDatabase[id] = newURL;

  const templateVars = { id: id, longURL: newURL, user: user };
  res.render("urls_show", templateVars);
});

// POST /urls/:id/delete
app.post("/urls/:id/delete", (req, res) => {
  delete urlDatabase[req.params.id];
  let id = req.cookies.user_id;
  let user = users[id];
  const templateVars = { urls: urlDatabase, user: user };
  res.render("urls_index", templateVars);
});





//////// calling the app
app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});