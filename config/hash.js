const bcrypt = require('bcrypt');

bcrypt.hash('AAdmin@12345', 10).then(hash => {
  console.log(hash);
});