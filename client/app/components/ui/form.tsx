/**
 * Enhanced form components with built-in validation and error handling
 */
"use client";

import React from 'react';
import { AlertCircle } from 'lucide-react';

interface FormFieldProps {
  label?: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
  className?: string;
}

export const FormField: React.FC<FormFieldProps> = ({
  label,
  error,
  required,
  children,
  className = ''
}) => {
  return (
    <div className={`space-y-1 ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-gray-700">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      {children}
      {error && (
        <div className="flex items-center gap-1 text-red-600 text-sm">
          <AlertCircle size={14} />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
};

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string;
  label?: string;
}

export const Input: React.FC<InputProps> = ({
  error,
  label,
  required,
  className = '',
  ...props
}) => {
  const inputClasses = `
    w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent
    ${error ? 'border-red-300 bg-red-50' : 'border-gray-300'}
    ${props.disabled ? 'bg-gray-100 cursor-not-allowed' : ''}
    ${className}
  `;

  if (label) {
    return (
      <FormField label={label} error={error} required={required}>
        <input {...props} className={inputClasses} />
      </FormField>
    );
  }

  return <input {...props} className={inputClasses} />;
};

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: string;
  label?: string;
}

export const Textarea: React.FC<TextareaProps> = ({
  error,
  label,
  required,
  className = '',
  ...props
}) => {
  const textareaClasses = `
    w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent
    ${error ? 'border-red-300 bg-red-50' : 'border-gray-300'}
    ${props.disabled ? 'bg-gray-100 cursor-not-allowed' : ''}
    ${className}
  `;

  if (label) {
    return (
      <FormField label={label} error={error} required={required}>
        <textarea {...props} className={textareaClasses} />
      </FormField>
    );
  }

  return <textarea {...props} className={textareaClasses} />;
};

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  error?: string;
  label?: string;
  options: { value: string | number; label: string }[];
  placeholder?: string;
}

export const Select: React.FC<SelectProps> = ({
  error,
  label,
  required,
  options,
  placeholder,
  className = '',
  ...props
}) => {
  const selectClasses = `
    w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent
    ${error ? 'border-red-300 bg-red-50' : 'border-gray-300'}
    ${props.disabled ? 'bg-gray-100 cursor-not-allowed' : ''}
    ${className}
  `;

  const selectElement = (
    <select {...props} className={selectClasses}>
      {placeholder && (
        <option value="" disabled>
          {placeholder}
        </option>
      )}
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );

  if (label) {
    return (
      <FormField label={label} error={error} required={required}>
        {selectElement}
      </FormField>
    );
  }

  return selectElement;
};

interface FormProps extends React.FormHTMLAttributes<HTMLFormElement> {
  children: React.ReactNode;
}

export const Form: React.FC<FormProps> = ({ children, className = '', ...props }) => {
  return (
    <form className={`space-y-4 ${className}`} {...props}>
      {children}
    </form>
  );
};

interface FormErrorProps {
  message?: string;
  className?: string;
}

export const FormError: React.FC<FormErrorProps> = ({ message, className = '' }) => {
  if (!message) return null;

  return (
    <div className={`flex items-center gap-2 text-red-600 text-sm bg-red-50 p-3 rounded-lg border border-red-200 ${className}`}>
      <AlertCircle size={16} />
      <span>{message}</span>
    </div>
  );
};

interface FormSuccessProps {
  message?: string;
  className?: string;
}

export const FormSuccess: React.FC<FormSuccessProps> = ({ message, className = '' }) => {
  if (!message) return null;

  return (
    <div className={`flex items-center gap-2 text-green-600 text-sm bg-green-50 p-3 rounded-lg border border-green-200 ${className}`}>
      <span>{message}</span>
    </div>
  );
};