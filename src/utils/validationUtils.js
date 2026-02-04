// validationUtils.js

// Validation rules
export const validationRules = {
  email: {
    required: true,
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    message: {
      required: 'Email is required',
      invalid: 'Please enter a valid email address'
    }
  },
  password: {
    required: true,
    minLength: 6,
    message: {
      required: 'Password is required',
      minLength: 'Password must be at least 6 characters'
    }
  },
  name: {
    required: true,
    minLength: 2,
    message: {
      required: 'Full name is required',
      minLength: 'Name must be at least 2 characters'
    }
  },
  phone: {
    required: true,
    pattern: /^\d{10}$/,
    message: {
      required: 'Phone number is required',
      invalid: 'Phone must be 10 digits'
    }
  },
  postalCode: {
    required: true,
    pattern: /^[A-Za-z]\d[A-Za-z][ -]?\d[A-Za-z]\d$/,
    message: {
      required: 'Postal code is required',
      invalid: 'Please enter a valid postal code (e.g., A1A 1A1)'
    }
  },
  text: {
    required: true,
    message: {
      required: 'This field is required'
    }
  }
};

// Individual validation functions
export const validateEmail = (email) => {
  if (!email) return validationRules.email.message.required;
  if (!validationRules.email.pattern.test(email)) return validationRules.email.message.invalid;
  return '';
};

export const validatePassword = (password) => {
  if (!password) return validationRules.password.message.required;
  if (password.length < validationRules.password.minLength) return validationRules.password.message.minLength;
  return '';
};

export const validateName = (name) => {
  if (!name || !name.trim()) return validationRules.name.message.required;
  if (name.length < validationRules.name.minLength) return validationRules.name.message.minLength;
  return '';
};

export const validatePhone = (phone) => {
  if (!phone) return validationRules.phone.message.required;
  if (!validationRules.phone.pattern.test(phone)) return validationRules.phone.message.invalid;
  return '';
};

export const validatePostalCode = (postalCode) => {
  if (!postalCode) return validationRules.postalCode.message.required;
  if (!validationRules.postalCode.pattern.test(postalCode)) return validationRules.postalCode.message.invalid;
  return '';
};

export const validateRequired = (value, fieldName) => {
  if (!value || !value.trim()) return `${fieldName} is required`;
  return '';
};

// Field-specific validation function
export const validateField = (fieldName, value) => {
  switch (fieldName) {
    case 'email':
      return validateEmail(value);
    case 'password':
      return validatePassword(value);
    case 'name':
      return validateName(value);
    case 'phone':
      return validatePhone(value);
    case 'postalCode':
      return validatePostalCode(value);
    case 'address':
    case 'city':
    case 'province':
    case 'accountType':
      return validateRequired(value, fieldName.charAt(0).toUpperCase() + fieldName.slice(1));
    default:
      return '';
  }
};

// Validate all registration fields
export const validateRegistrationForm = (formData) => {
  const errors = {};
  
  errors.email = validateEmail(formData.email);
  errors.password = validatePassword(formData.password);
  errors.name = validateName(formData.name);
  errors.phone = validatePhone(formData.phone);
  errors.postalCode = validatePostalCode(formData.postalCode);
  errors.address = validateRequired(formData.address, 'Address');
  errors.city = validateRequired(formData.city, 'City');
  errors.province = validateRequired(formData.province, 'Province');
  errors.accountType = validateRequired(formData.accountType, 'Account type');
  
  return errors;
};

// Check if form has errors
export const hasValidationErrors = (errors) => {
  return Object.values(errors).some(error => error !== '');
};

// Get input style based on validation error
export const getInputStyle = (hasError) => {
  const baseStyle = {
    width: '80%',
    padding: '0.875rem 1rem',
    border: '1px solid #d1d5db',
    borderradius: '0.5rem',
    transition: 'all 0.2s ease',
    background: 'white',
    margin: '10px'
  };
  
  if (hasError) {
    return {
      ...baseStyle,
      border: '2px solid #ef4444',
      
    };
  }
  
  return baseStyle;
};

// Government email validation
export const isGovernmentEmail = (email) => {
  const governmentDomains = [
    'calgarypolice.ca',
    'calgary.ca', 
    'camrosepolice.ca',
    'edmontonpolice.ca',
    'ottawapolice.ca',
    'torontopolice.on.ca',
    'rcmp-grc.gc.ca',
    'vpd.ca',
    'cpkcpolice.com',
    'peelpolice.ca',
    'gmail.com'
  ];
  
  return governmentDomains.some(domain => 
    email.toLowerCase().includes(domain.toLowerCase())
  );
};