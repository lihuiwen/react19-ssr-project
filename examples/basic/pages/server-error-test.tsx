// This page will throw an error during SSR to test 500 error handling

export default function ServerErrorTest() {
  // This will throw during server-side rendering
  throw new Error('Test server error: This error is thrown during SSR for testing')

  return <div>You should not see this</div>
}
