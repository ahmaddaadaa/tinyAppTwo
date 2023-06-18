const express = require("express");
const morgan = require('morgan');
const cookieParser = require('cookie-parser');

const app = express();
const PORT = 8080; // default port 8080

app.set("view engine", "ejs"); // set us a view engine for our EJS files 

app.use(morgan('dev'));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());


const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};


const generateRandomString = function() {
  return Math.random().toString(36).substring(2, 8);
};


app.get("/urls", (req, res) => {
  const templateVars = {
    username: req.cookies["username"],
    urls: urlDatabase
  };
  console.log(templateVars);

  res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
  const templateVars = {
    username: req.cookies["username"]
  };
  res.render("urls_new", templateVars);
});


app.post("/urls", (req, res) => {
  const generatedKey = generateRandomString();
  urlDatabase[generatedKey] = req.body.longURL;
  const templateVars = { id: generatedKey, longURL: req.body.longURL, username: req.cookies["username"] };
  res.render("urls_show", templateVars);
});

app.post("/login", (req, res) => {
  res.cookie("username", req.body);
  
  res.redirect("/urls");
});

app.post("/logout", (req, res) => {
  res.clearCookie("username");
  
  res.redirect("/urls");
});



app.post("/urls/edit/:id", (req, res) => {
  const id = req.params.id; // Retrieve the ID from the request parameters
  const newURL = req.body.longURL;

  urlDatabase[id] = newURL;

  const templateVars = { id: id, longURL: newURL, username: req.cookies["username"] };
  res.render("urls_show", templateVars);
});


app.post("/urls/:id/delete", (req, res) => {
  delete urlDatabase[req.params.id];
  const templateVars = { urls: urlDatabase, username: req.cookies["username"] };
  res.render("urls_index", templateVars);
});

app.get("/u/:id", (req, res) => {
  const longURL = urlDatabase[req.params.id];
  res.redirect(longURL);
});

app.get("/urls/:id", (req, res) => {
  const templateVars = { id: req.params.id, longURL: urlDatabase[req.params.id], username: req.cookies["username"] };
  res.render("urls_show", templateVars);
});


app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});