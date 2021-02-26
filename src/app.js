import { getDataFromApi, addOrRemoveTaskToApi } from './data';
import alertify from 'alertifyjs';
import { disableButton } from './helper';

class PomodoroApp {
  constructor(options) {
    let { tableTbodySelector, taskFormSelector } = options;
    this.$tableTbody = document.querySelector(tableTbodySelector);
    this.$taskForm = document.querySelector(taskFormSelector);
    this.$taskFormInput = this.$taskForm.querySelector('input');
    this.$removeButtons;
  }
  //add remove task with data.js (added)
  removeTask(task) {
    addOrRemoveTaskToApi(task).then(() => {
      alertify.error(`${task.title} task deleted`).dismissOthers();
      this.removeTaskFromTable(task);
    });
  }
  // add then and alertify(changed)
  addTask(task) {
    addOrRemoveTaskToApi(task)
      .then((newTask) => {
        this.addTaskToTable(newTask);
        alertify.success(`${newTask.title} task added.`).dismissOthers();
      })
      .then((newTask) => {
        disableButton(false);
      });
  }
  // remove task from table(added)
  removeTaskFromTable(task) {
    let $removedTask = this.$tableTbody.querySelector(`#task${task.id}`);
    this.$tableTbody.removeChild($removedTask);
  }

  //add task to table
  addTaskToTable(task) {
    const $newTaskEl = document.createElement('tr');
    $newTaskEl.innerHTML = `<th scope="row"></th><td>${task.title}</td> 
    <td><a class="button cross" name="removeButton" id= ${task.id} title="${task.title}"></a></td>`;
    $newTaskEl.id = `task${task.id}`;
    this.$tableTbody.appendChild($newTaskEl);
    this.$taskFormInput.value = '';
  }

  //control task tittle and added alertify, disableButton(changed)
  handleAddTask() {
    this.$taskForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const task = { title: this.$taskFormInput.value };
      if (task.title) {
        this.addTask(task);
        disableButton(true);
      } else {
        alertify.error('task title cannot be blank.').dismissOthers();
      }
    });
  }
  //garbage button handler is captured(added)
  handleRemoveTask() {
    for (let i = 0; i < this.$removeButtons.length; i++) {
      this.$removeButtons[i].addEventListener('click', (e) => {
        e.preventDefault();
        const task = { id: e.target.id, title: e.target.title };
        this.removeTask(task);
      });
    }
  }

  //After the data is placed in the table, the delete buttons are defined and activated.(changed)
  fillTasksTable() {
    getDataFromApi()
      .then((currentTasks) => {
        currentTasks.forEach((task, index) => {
          this.addTaskToTable(task, index + 1);
        });
      })
      .then(() => {
        this.$removeButtons = document.querySelectorAll(
          `a[name="removeButton"]`
        );
        this.handleRemoveTask();
      });
  }

  init() {
    this.fillTasksTable();
    this.handleAddTask();
  }
}

export default PomodoroApp;
