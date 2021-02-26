// button disabled function
export const disableButton = (activeType) => {
  const $taskSubmit = document.querySelector('#taskSubmit');
  $taskSubmit.disabled = activeType;
  if (activeType) {
    $taskSubmit.setAttribute('class', 'btn btn-secondary mb-3');
    $taskSubmit.innerHTML = 'Ekleniyor';
  } else {
    $taskSubmit.setAttribute('class', 'btn btn-primary mb-3');
    $taskSubmit.innerHTML = 'Add Task';
  }
};
