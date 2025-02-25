"use client";

import React, { useState } from 'react';

const Collapsible: React.FC<{ title: string }> = ({ title, children }) => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleOpen = () => {
    setIsOpen(!isOpen);
  };

  return (
    <div className="collapsible">
      <button onClick={toggleOpen} className="collapsible-button">
        {isOpen ? 'Hide' : 'Show'} {title}
      </button>
      {isOpen && <div className="collapsible-content">{children}</div>}
    </div>
  );
};

export default Collapsible; 