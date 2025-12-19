import React from "react";

interface FormInputProps {
  label: string;
  type?: 'text'|'email'|'tel'|'number';
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  error?:string;
  required?:boolean; //es obligatorio
  placeholder?: string;
  disabled?: boolean; //true:no se puede editar
  maxLength?: number;
}

const FormInput: React.FC<FormInputProps> = ({
    label,
    type = 'text',
    name,
    value,
    onChange,
    error,
    required = false,
    placeholder = '',
    disabled = false,
    maxLength
}) => { 
    return (
       <div className="mb-4">
        <label 
          htmlFor={name} 
          className="block text-sm font-medium text-gray-700 mb-2"
        >
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
        </label>
        <input
            id={name}
            name={name}
            type={type}
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            disabled={disabled}
            maxLength={maxLength}
            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:outline-none transition-colors ${
            error 
                ? 'border-red-500 focus:ring-red-500 focus:border-red-500' 
                : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
            } ${disabled ? 'bg-gray-100 cursor-not-allowed' : ''}`}
        />
        {error && <p className="mt-1 text-sm text-red-500">{error}</p>}

       </div> 
    );
};

export default FormInput;