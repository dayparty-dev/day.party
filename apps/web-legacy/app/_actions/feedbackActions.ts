export const submitFeedback = async (feedback: 'good' | 'bad', taskId: string): Promise<void> => {
    const response = await fetch('/api/feedback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ feedback, taskId }),
    });
  
    if (!response.ok) {
      console.error('Failed to submit feedback');
    }
  };
  