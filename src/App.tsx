import React from 'react';
import { testSteamApiKey } from './services/steam';

function App() {
  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-4xl mx-auto">
        <button 
          onClick={() => {
            console.log('Button clicked!');
            try {
              testSteamApiKey().catch(error => {
                console.error('Error testing API key:', error);
              });
            } catch (error) {
              console.error('Error in click handler:', error);
            }
          }}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Test Steam API Key
        </button>
      </div>
    </div>
  );
}

export default App; 