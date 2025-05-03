interface FeedbackFormProps {
  onSubmitFeedback: (feedback: 'good' | 'bad') => void;
}

const FeedbackForm: React.FC<FeedbackFormProps> = ({ onSubmitFeedback }) => {
  return (
    <div className="feedback-form">
      <p>How's the task going?</p>
      <button onClick={() => onSubmitFeedback('good')}>👍</button>
      <button onClick={() => onSubmitFeedback('bad')}>👎</button>
    </div>
  );
};

export default FeedbackForm;
