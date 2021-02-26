import { API_URL } from './constans';

export const getDataFromApi = () => {
  return fetch(API_URL)
    .then((data) => data.json())
    .then((data) => data)
    .catch((err) => {
      console.log(err);
    });
};

//Delete if there is an id, otherwise add
export const addOrRemoveTaskToApi = (task) => {
  return fetch(`${API_URL}/${task.id || ''}`, {
    method: task.id ? 'DELETE' : 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(task),
  }).then((data) => (data ? data.json() : ''));
};
