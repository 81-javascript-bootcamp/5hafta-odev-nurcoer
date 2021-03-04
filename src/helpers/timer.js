import { getRemainingDate } from './date';

export const createTimer = ({
  context,
  intervalVariable,
  intervalEnd = 1000,
  deadline,
  $timerEl = '$timerEl',
  timerElContent,
  currentRemaining,
  onStop,
}) => {
  context[intervalVariable] = setInterval(() => {
    const remainingTime = getRemainingDate(deadline);
    const { total, minutes, seconds } = remainingTime;
    if (currentRemaining) {
      context[currentRemaining] = total;
    }
    timerContext(context[$timerEl], `${timerElContent}${minutes}:${seconds}`);

    if (total <= 0) {
      clearInterval(context[intervalVariable]);
      onStop();
    }
  }, intervalEnd);
};

export const timerContext = ($timerEl, context) => {
  $timerEl.innerHTML = context;
};
