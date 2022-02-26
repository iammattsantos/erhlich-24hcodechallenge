export const validateEmail = (email: string, isExisting: boolean) => {
  let statusCode, validationMsg;

  if (isExisting) {
    statusCode = 409;
    validationMsg = 'Email address already exists.';
  } else {
    const validator = require('validator');
    const isValidEmail = validator.isEmail(email);
    if (!isValidEmail) {
      statusCode = 422;
      validationMsg = 'Invalid email address.';
    }
  }

  return { statusCode, validationMsg };
}

export const validatePassword = (password: string) => {
  let validationMsg;

  if (password.length < 8) {
    validationMsg = 'Password must be 8 characters long.';
  } else if (!password.match(/(?=.*[A-Z])/)) {
    validationMsg = 'Password must contain atleast 1 uppercase character.';
  } else if (!password.match(/^(?=.*[a-z])/)) {
    validationMsg = 'Password must contain atleast 1 lowercase character.';
  } else if (!password.match(/^(?=.*[0-9])/)) {
    validationMsg = 'Password must contain atlease 1 digit.';
  } else if (!password.match(/^(?=.*[~`!@#$%^&*()--+={}\[\]|\\:;"'<>,.?/_₹])/)) {
    validationMsg = 'Password must contain atleast 1 special character';
  }

  return validationMsg;
}
