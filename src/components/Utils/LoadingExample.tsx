import React from 'react';
import Loading from './Loading';

const LoadingExample: React.FC = () => {
  return (
    <div style={{ padding: '20px', display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
      <div>
        <h3>Default</h3>
        <Loading />
      </div>
      
      <div>
        <h3>Small (20px)</h3>
        <Loading size={20} />
      </div>
      
      <div>
        <h3>Large (60px)</h3>
        <Loading size={60} />
      </div>
      
      <div>
        <h3>Red</h3>
        <Loading color="#ff4d4f" />
      </div>
      
      <div>
        <h3>Green</h3>
        <Loading color="#52c41a" />
      </div>
    </div>
  );
};

export default LoadingExample;