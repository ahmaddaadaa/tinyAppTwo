// gets the user given the email
const getUserByEmail = function(email, database) {
  for(let key in database){
    if(database[key].email === email)
    return key;
  }
  return undefined;
};


// function checks if an Id exists in the URLs Database
const verifyIfIdExists = function(id, database) {
  for (const key in database) {
    if (key === id) {
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

// function to generate String ID
const generateRandomString = function() {
  return Math.random().toString(36).substring(2, 8);
};







module.exports = {
  getUserByEmail,
  verifyIfIdExists,
  urlsForUser,
  generateRandomString
};
