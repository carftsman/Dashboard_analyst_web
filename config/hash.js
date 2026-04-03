const bcrypt = require('bcrypt');

bcrypt.hash('AAdmin@1234', 10).then(hash => {
  console.log(hash);
});