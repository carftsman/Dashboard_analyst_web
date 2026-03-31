const bcrypt = require('bcrypt');

bcrypt.hash('NewAdmin@123', 10).then(hash => {
  console.log(hash);
});