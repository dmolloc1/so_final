import React from 'react';

interface ReadOnlyInputProps {
  label: string;
  value: string;
}

const ReadOnlyInput: React.FC<ReadOnlyInputProps> = ({ label, value }) => {
  return (
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {label}
      </label>
      <input
        type="text"
        value={value}
        readOnly
        className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-700 cursor-not-allowed"
      />
    </div>
  );
};

export default ReadOnlyInput;