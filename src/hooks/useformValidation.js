// useFormValidation.js
import { useState, useCallback } from 'react';
import {
  validateField,
  validateRegistrationForm,
  hasValidationErrors,
  getInputStyle
} from '/src/utils/validationUtils';

export const useFormValidation = (initialValues = {}) => {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [isSubmitted, setIsSubmitted] = useState(false);

  // Handle input change
  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    
    setValues(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  }, [errors]);

  // Handle input blur with validation
  const handleBlur = useCallback((e) => {
    const { name, value } = e.target;
    
    setTouched(prev => ({
      ...prev,
      [name]: true
    }));
    
    const error = validateField(name, value);
    setErrors(prev => ({
      ...prev,
      [name]: error
    }));
  }, []);

  // Validate specific field
  const validateFieldByName = useCallback((fieldName, value) => {
    const error = validateField(fieldName, value);
    setErrors(prev => ({
      ...prev,
      [fieldName]: error
    }));
    return error;
  }, []);

  // Validate all fields
  const validateAll = useCallback(() => {
    const validationErrors = validateRegistrationForm(values);
    setErrors(validationErrors);
    setIsSubmitted(true);
    return !hasValidationErrors(validationErrors);
  }, [values]);

  // Get field props for easier integration
  const getFieldProps = useCallback((fieldName) => ({
    name: fieldName,
    value: values[fieldName] || '',
    onChange: handleChange,
    onBlur: handleBlur,
    style: getInputStyle(errors[fieldName] && (touched[fieldName] || isSubmitted))
  }), [values, errors, touched, isSubmitted, handleChange, handleBlur]);

  // Reset form
  const resetForm = useCallback(() => {
    setValues(initialValues);
    setErrors({});
    setTouched({});
    setIsSubmitted(false);
  }, [initialValues]);

  return {
    values,
    errors,
    touched,
    isSubmitted,
    handleChange,
    handleBlur,
    validateField: validateFieldByName,
    validateAll,
    getFieldProps,
    resetForm,
    setValues,
    setErrors
  };
};