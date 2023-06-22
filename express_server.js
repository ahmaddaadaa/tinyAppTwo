const express = require("express");
const morgan = require('morgan');
const bcrypt = require("bcryptjs");
//const cookieParser = require('cookie-parser');
const cookieSession = require('cookie-session');

const relpers = require("./helpers.js");

const app = express();
const PORT = 8080; // default port 8080

app.set("view engine", "ejs"); // set us a view engine for our EJS files 

//middleware
app.use(morgan('dev'));
app.use(express.urlencoded({ extended: true })); // populates: req.body
app.use(cookieSession({
  name: 'user_id',
  keys: ['myKey']
  // cookie options:
 // maxAge: 24 * 60 * 1000 // 24 hours
}));


const urlDatabase = {
  b6UTxQ: {
    longURL: "https://www.tsn.ca",
    userID: "aJ48lW",
  },
  i3BoGr: {
    longURL: "https://www.google.ca",
    userID: "aJ48lW",

  },

  shortId: {
    longURL: "ahmaddaadaa.ca",
    userID: "userRandomID",
  }

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



// function checks if an Id exists in the URLs Database
const verifyIfIdExists = function(id, database) {
  for (const key in database) {
    if (key === id) {
      return true;
    }
  }
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

const urlsForUser = function(id, database) {
  let result = {};
  for (let key in database) {
    if (database[key].userID === id)
      result[key] = database[key].longURL;

  };
  return result;
};

/////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////
////////////////     GET  requests        ///////////////
/////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////         




// GET /urls
app.get("/urls", (req, res) => {
  let id = req.session.user_id;
  let message = " ";
  let flag = 0;
  let userUrlsDatabase = urlsForUser(id, urlDatabase);
  const user = users[id];
  // if not logged in:
  if (id === undefined) {
    res.status(403);
    message = "Can't show the URLs page. Login or Register first!";
    flag = 1;
  }

  else {
    if (Object.values(userUrlsDatabase).length === 0) {
      flag = 1;
      message = "No URLs found!! Start creating new ones!";
    }


  };


  const templateVars = {
    urls: userUrlsDatabase,
    user: user,
    id: id,
    message: message,
    flag: flag
  };
  console.log("users :"+JSON.stringify(users));
  res.render("urls_index", templateVars);

});

// GET /urls/new
app.get("/urls/new", (req, res) => {
  let id = req.session.user_id;
  if (id === undefined) {
    res.redirect("/login");
  }
  let user = users[id];
  const templateVars = {
    user: user
  };
  res.render("urls_new", templateVars);
});

// GET /login
app.get("/login", (req, res) => {
  if (req.session.user_id !== undefined) {
    res.redirect("/urls");
  }
  res.render("login");
});



// GET /register
app.get("/register", (req, res) => {
  if (req.session.user_id !== undefined) {
    res.redirect("/urls");
    return;
  }
  res.render("register");
});


//////////////////////////////////////////////////////
////////////////     GET  per "ID"  requests        //////////////////////////
//////////////////////////////////////////////////////



// GET /u/:id
app.get("/u/:id", (req, res) => {
  let idFound = null;
  for (let key in urlDatabase) {
    if (key === req.params.id) idFound = key;
  }
  if (!idFound) {
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
  let message = "";
  let user = users[idUser];
  let flag = 0;

  if (idUser === undefined) {
    res.status(403);
    message = "Can't show the URLs page. Login or Register first!";
    flag = 1;
  }

  if (!verifyIfIdExists(id, urlDatabase)) {
    res.status(403);
    message = "the URL id does not exist";
    flag = 1;
  }

  if (idUser !== urlDatabase[id].userID) {
    res.status(403);
    message = "You don't own the URL";
    flag = 1;
  }

  const templateVars = { id: id, longURL: urlDatabase[id].longURL, user: user, message: message, flag: flag, idUser: idUser };


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
  //let id = req.params.id;
  let user = users[idUser];
  let generatedKey = '';
  let flag = 0;
  let message = '';
 
  if (idUser === undefined) {
    res.status(401).send("Unauthorized. please log in.");
    return;
    
    
  } else {

    generatedKey = generateRandomString();

    urlDatabase[generatedKey] = {
      longURL: req.body.longURL,
      userID: idUser
    };

  }

  const templateVars = { id: generatedKey, longURL: urlDatabase[generatedKey].longURL, user: user, flag: flag, message: message, idUser:idUser};

  res.render("urls_show", templateVars);

});

// POST /login
app.post("/login", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;

  // we did not get a username and a passward??
  if (!email || !password) {
    res.status(400).send('Please provide a username and a password');
    return;
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
    return;
  }

  // do the password not match ?

  // if (founduser.password !== password) {
  //   res.status(403).send('passward do not match');

  // }

    if (bcrypt.compareSync(password, founduser.password) === false) {
    console.log("Password: "+password+". encrypted: "+founduser.password);
    console.log("Password matched?? :"+bcrypt.compareSync(password, founduser.password));
    res.status(403).send('passward do not match');
    return;

  }

  //happy path!! the user and password found

  // set a cookie
  //res.cookie('user_id', founduser.id);
  req.session.user_id = founduser.id;

  // redirect to /urls
  res.redirect('/urls');




});


// POST / logout
app.post("/logout", (req, res) => {
  //res.clearCookie("user_id");
  req.session = null;
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
  users[generatedUserID] = { id: generatedUserID, email: req.body.email, password: bcrypt.hashSync(req.body.password, 10) };


  
  //res.cookie('user_id', generatedUserID);
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
  let flag = 0;
  let message = '';

  urlDatabase[id].longURL = newURL;

 

  const templateVars = { id: id, longURL: urlDatabase[id].longURL, user: user, flag: flag, message: message, idUser:idUser};
  res.render("urls_show", templateVars);
});

// POST /urls/:id/delete
app.post("/urls/:id/delete", (req, res) => {
  let id = req.session.user_id;
  let user = users[id];
  let flag = 0;
  let message = " ";

  // if not logged in
  if (id === undefined) {
    res.status(403);
    message = "Can't Delete!. Not Logged in!!";
    flag = 1;
  }

  else {
    if (!verifyIfIdExists(req.params.id, urlDatabase)) {
      flag = 1;
      message = "Id does not exist!";
    }

    else { delete urlDatabase[req.params.id]; }
  };


  let userUrlsDatabase = urlsForUser(id, urlDatabase);
  const templateVars = {
    urls: userUrlsDatabase,
    user: user,
    id: id,
    message: message,
    flag: flag
  };

  res.render("urls_index", templateVars);

});





//////// calling the app
app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});