

const getUserByEmail = function(email, database) {
  // lookup magic...
  for(let key in database){
    if(database[key].email === email)
    return key;
  }
  return undefined;
};










module.exports = {getUserByEmail};
