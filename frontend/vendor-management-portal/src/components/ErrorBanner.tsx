import { ApiError } from '../api/client';

export function ErrorBanner({ error }: { error: unknown }) {
  if (!error) return null;

  if (error instanceof ApiError) {
    const messages = error.allMessages();

    if (messages.length > 0) {
      return (
        <div className="error-box">
          <div style={{ fontWeight: 600, marginBottom: 8 }}>
            {error.status === 422 ? 'Please fix the following:' : 'Request failed:'}
          </div>
          <ul style={{ margin: 0, paddingLeft: 20 }}>
            {messages.map((m, i) => (
              <li key={i} style={{ marginBottom: 4 }}>{m}</li>
            ))}
          </ul>
        </div>
      );
    }

    return <div className="error-box">{error.message}</div>;
  }

  if (error instanceof Error) return <div className="error-box">{error.message}</div>;
  return <div className="error-box">Something went wrong</div>;
}
