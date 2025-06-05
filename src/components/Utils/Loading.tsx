import React from 'react';
import './Styles/Loading.scss';

interface LoadingProps {
  size?: number;
  color?: string;
}

const Loading: React.FC<LoadingProps> = ({ size = 40, color = '#4a6cf7' }) => {
  return (
    <div 
      className="loading-spinner"
      style={{ 
        width: `${size}px`, 
        height: `${size}px`,
        borderColor: `${color}20`,
        borderTopColor: color
      }}
    ></div>
  );
}

export default Loading;