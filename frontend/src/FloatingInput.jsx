import React, { useState } from 'react';

function FloatingInput({ id, type, icon, label, value, onChange, trailing }) {
  const [focused, setFocused] = useState(false);
  const floated = focused || value.length > 0;

  return (
    <div className="relative">
      <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 z-10">{icon}</span>
      <input
        id={id}
        type={type}
        value={value}
        onChange={onChange}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        className="w-full rounded-xl border border-gray-300 bg-white pl-11 pr-11 pt-5 pb-2 text-gray-800 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
        required
      />
      <label
        htmlFor={id}
        className={`pointer-events-none absolute left-11 transition-all duration-150 ${
          floated
            ? 'top-3 text-xs font-semibold text-purple-600'
            : 'top-1/2 -translate-y-1/2 text-base text-gray-400'
        }`}
      >
        {label}
      </label>
      {trailing}
    </div>
  );
}

export default FloatingInput;
