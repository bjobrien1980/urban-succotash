import React from 'react';
import ReactDOM from 'react-dom/client';
import SocialMediaMonitor from './components/SocialMediaMonitor';

// Simple test page to verify the Social Media Monitor works
const TestSocialPage = () => {
  return (
    <div>
      <SocialMediaMonitor />
    </div>
  );
};

// Render the test page
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<TestSocialPage />);
