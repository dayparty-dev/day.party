interface UpcomingTaskProps {
  task: any;
}

const UpcomingTask: React.FC<UpcomingTaskProps> = ({ task }) => {
  return (
    <div className="upcoming-task">
      <h3>Upcoming</h3>
      <p>{task.title}</p>
      <small>Scheduled: {new Date(task.scheduledAt).toLocaleString()}</small>
    </div>
  );
};

export default UpcomingTask;
