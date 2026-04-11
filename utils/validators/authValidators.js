// Username
const usernameRegex =
  /^(?=\S+$)(?=.{5,20}$)(?!.*[._]{2})[a-zA-Z0-9]+([._]?[a-zA-Z0-9]+)*$/;

// Email
const emailRegex = /^[\w.-]+@[\w.-]+\.\w{2,}$/;

// Phone 
const phoneRegex = /^(09\d{8}|\+9639\d{8}|009639\d{8})$/;

// Password
const passwordRegex = /^(?=.*[A-Z])(?=\S+$).{4,}$/;

module.exports = {
  usernameRegex,
  emailRegex,
  phoneRegex,
  passwordRegex,
};