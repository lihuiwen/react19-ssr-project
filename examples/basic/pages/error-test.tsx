import React, { useState } from 'react'

export default function ErrorTest() {
  const [shouldThrow, setShouldThrow] = useState(false)

  if (shouldThrow) {
    throw new Error('Test error: This is a deliberate error for testing error handling')
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
      <h1>Error Handling Test Page</h1>

      <div style={{ marginTop: '2rem' }}>
        <h2>Test 404 Error</h2>
        <p>Navigate to a non-existent route:</p>
        <a href="/non-existent-page" style={{ color: '#3b82f6', textDecoration: 'underline' }}>
          /non-existent-page
        </a>
      </div>

      <div style={{ marginTop: '2rem' }}>
        <h2>Test 500 Error</h2>
        <p>Click the button below to trigger a component error:</p>
        <button
          onClick={() => setShouldThrow(true)}
          style={{
            padding: '0.75rem 1.5rem',
            background: '#ef4444',
            color: 'white',
            border: 'none',
            borderRadius: '0.5rem',
            cursor: 'pointer',
            fontSize: '1rem',
            fontWeight: '600',
          }}
        >
          Throw Error
        </button>
      </div>

      <div style={{ marginTop: '2rem', padding: '1rem', background: '#f3f4f6', borderRadius: '0.5rem' }}>
        <h3>Expected Behavior:</h3>
        <ul style={{ marginTop: '0.5rem' }}>
          <li><strong>404 Test:</strong> Should show a purple gradient page with "404 Not Found"</li>
          <li><strong>500 Test:</strong> Should show a purple gradient page with "500 Server Error"</li>
          <li>In development mode, error details should be visible</li>
          <li>In production mode, error details should be hidden</li>
        </ul>
      </div>
    </div>
  )
}
