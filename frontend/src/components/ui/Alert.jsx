// src/components/ui/Alert.jsx
import React from 'react';

export const Alert = ({ variant, children }) => {
  const baseStyle = 'p-4 rounded border';
  const styles = {
    default: `${baseStyle} bg-green-100 border-green-400 text-green-700`,
    destructive: `${baseStyle} bg-red-100 border-red-400 text-red-700`,
  };
  return <div className={styles[variant] || styles.default}>{children}</div>;
};

export const AlertTitle = ({ children }) => (
  <h2 className="font-bold mb-2">{children}</h2>
);

export const AlertDescription = ({ children }) => (
  <p>{children}</p>
);
