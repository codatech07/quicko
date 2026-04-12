// Username
const usernameRegex =
  /^(?=\S+$)(?=.{5,20}$)(?!.*[._]{2})[a-zA-Z0-9]+([._]?[a-zA-Z0-9]+)*$/;

// Email
const emailRegex = /^[\w.-]+@[\w.-]+\.\w{2,}$/;

// Phone
const phoneRegex = /^(09\d{8}|\+9639\d{8}|009639\d{8})$/;

// check the phone format
const normalizePhone = (phone) => {
  phone = phone.trim();

  if (phone.startsWith("09")) {
    return phone.slice(2); // last 8 number
  }

  if (phone.startsWith("+9639")) {
    return phone.slice(5); // +9639 + 8 digits
  }

  if (phone.startsWith("009639")) {
    return phone.slice(6); // 009639 + 8 digits
  }

  return null;
};

// Password
const passwordRegex = /^(?=.*[A-Z])(?=\S+$).{6,}$/;

module.exports = {
  usernameRegex,
  emailRegex,
  phoneRegex,
  passwordRegex,
  normalizePhone,
};
