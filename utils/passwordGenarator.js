const generatePassword = (fullName, email) => {
  const namePart = fullName.replace(/\s+/g, '').substring(0, 2);
  const emailPart = email.split('@')[0].substring(0, 2);

  const upper = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lower = 'abcdefghijklmnopqrstuvwxyz';
  const numbers = '0123456789';
  const specials = '@$!%*?&';

  const allChars = upper + lower + numbers + specials;

  const getRandomChar = (str) => str[Math.floor(Math.random() * str.length)];

  let password =
    getRandomChar(upper) +
    getRandomChar(lower) +
    getRandomChar(numbers) +
    getRandomChar(specials);

  password += namePart + emailPart;

  while (password.length < 10) {
    password += getRandomChar(allChars);
  }

  password = password
    .split('')
    .sort(() => 0.5 - Math.random())
    .join('');

  return password.substring(0, 10);
};

module.exports = { generatePassword };