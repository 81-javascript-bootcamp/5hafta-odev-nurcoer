import alertify from 'alertifyjs';
import { createTimer, timerContext } from './helpers/timer';
import { disableButton } from './helpers/button';
import { POMODORO_WORK_TIME, POMODORO_BREAK_TIME } from './constans';
import { getNow, addMinutesToDate, getRemainingDate } from './helpers/date';
import {
  getDataFromApi,
  addOrRemoveTaskToApi,
  completeTaskOnApi,
  setActiveTaskOnApi,
} from './data';

class PomodoroApp {
  constructor(options) {
    let {
      tableTbodySelector,
      taskFormSelector,
      startBtnSelector,
      timerElSelector,
      pauseBtnSelector,
      resetBtnSelector,
    } = options;
    this.data = [];
    this.currentInterval = null;
    this.breakInterval = null;
    this.currentRemaining = null;
    this.currentTask = null;
    this.$removeButtons;
    this.$tableTbody = document.querySelector(tableTbodySelector);
    this.$taskForm = document.querySelector(taskFormSelector);
    this.$taskFormInput = this.$taskForm.querySelector('input');
    this.$startBtn = document.querySelector(startBtnSelector);
    this.$pauseBtn = document.querySelector(pauseBtnSelector);
    this.$timerEl = document.querySelector(timerElSelector);
    this.$resetBtn = document.querySelector(resetBtnSelector);
  }

  removeTask(task) {
    addOrRemoveTaskToApi(task).then(() => {
      alertify.error(`${task.title} task deleted`).dismissOthers();
      this.removeTaskFromTable(task);
    });
  }

  addTask(task) {
    addOrRemoveTaskToApi(task)
      .then((newTask) => {
        this.data.push(newTask);
        this.addTaskToTable(newTask);
        alertify.success(`${newTask.title} task added.`).dismissOthers();
      })
      .then((newTask) => {
        disableButton(false);
        this.getRemoveButton();
      });
  }

  removeTaskFromTable(task) {
    let $removedTask = this.$tableTbody.querySelector(
      `tr[data-taskId = 'task${task.id}']`
    );
    this.$tableTbody.removeChild($removedTask);
  }

  addTaskToTable(task) {
    const $newTaskEl = document.createElement('tr');
    $newTaskEl.innerHTML = `<th scope="row"></th><td>${task.title}</td> 
    <td><a class="button cross" name= "removeButton" id= ${task.id} title="${task.title}" ></a></td>`;
    $newTaskEl.setAttribute('data-taskId', `task${task.id}`);
    if (task.completed) {
      $newTaskEl.classList.add('completed');
    }
    this.$tableTbody.appendChild($newTaskEl);
    this.$taskFormInput.value = '';
  }

  handleAddTask() {
    this.$taskForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const task = { title: this.$taskFormInput.value, completed: false };
      if (task.title) {
        this.addTask(task);
        disableButton(true);
      } else {
        alertify.error('task title cannot be blank.').dismissOthers();
      }
    });
  }

  getRemoveButton() {
    this.$removeButtons = document.querySelectorAll(`a[name="removeButton"]`);
    this.handleRemoveTask();
  }

  handleRemoveTask() {
    for (let i = 0; i < this.$removeButtons.length; i++) {
      this.$removeButtons[i].addEventListener('click', (e) => {
        e.preventDefault();
        const task = { id: e.target.id, title: e.target.title };
        this.removeTask(task);
      });
    }
  }

  fillTasksTable() {
    getDataFromApi()
      .then((currentTasks) => {
        this.data = currentTasks;
        currentTasks.forEach((task, index) => {
          this.addTaskToTable(task, index + 1);
        });
      })
      .then(() => {
        this.getRemoveButton();
      });
  }

  initializeBreakTimer(deadline) {
    createTimer({
      context: this,
      intervalVariable: 'breakInterval',
      deadline: deadline,
      timerElContent: 'Chill: ',
      onStop: () => {
        completeTaskOnApi(this.currentTask).then(() => {
          this.currentTask.completed = true;
          this.setActiveTask();
        });
      },
    });
  }

  initializeTimer(deadline) {
    createTimer({
      context: this,
      intervalVariable: 'currentInterval',
      deadline,
      timerElContent: "You're working: ",
      onStop: () => {
        const now = getNow();
        const breakDeadline = addMinutesToDate(now, POMODORO_BREAK_TIME);
        this.initializeBreakTimer(breakDeadline);
      },
      currentRemaining: 'currentRemaining',
    });
  }

  handlePreviousTask() {
    const $currentActiveEl = document.querySelector('tr.active');
    if ($currentActiveEl) {
      $currentActiveEl.classList.remove('active');
      $currentActiveEl.classList.add('completed');
    }
  }

  startTask() {
    const $currentTaskEl = document.querySelector(
      `tr[data-taskId = 'task${this.currentTask.id}']`
    );
    $currentTaskEl.classList.add('active');
    const newDeadline = addMinutesToDate(getNow(), POMODORO_WORK_TIME);
    this.initializeTimer(newDeadline);
  }

  handleEnd() {
    this.resetInterval();
    this.$timerEl.innerHTML = 'All tasks are done';
  }

  setActiveTask() {
    this.handlePreviousTask();
    this.currentTask = this.data.find((task) => !task.completed);
    if (this.currentTask) {
      this.startTask();
    } else {
      this.handleEnd();
    }
    //this.currentTask ? this.startTask() : this.handleEnd();
    // ternary ifler deger return eden ve assignment olan durumlarda kullaniliyor
    //const isActive = document.querySelector('#active') ? 'yes' : 'no';
  }

  continueTask() {
    const now = getNow();
    const nowTimestamp = now.getTime();
    const remainingDeadline = new Date(nowTimestamp + this.currentRemaining);
    this.initializeTimer(remainingDeadline);
  }

  handleStart() {
    this.$startBtn.addEventListener('click', () => {
      // check if continues to current task or start a new task.
      if (this.currentRemaining) {
        this.continueTask();
      } else {
        this.setActiveTask();
      }
    });
  }

  handleReset() {
    this.$resetBtn.addEventListener('click', (e) => {
      timerContext(this.$timerEl, 'Start');
      this.data.forEach((data) => {
        setActiveTaskOnApi(data);
        data.completed = false;
      });
      this.resetInterval();
      this.resetTasks();
      this.currentRemaining = null;
    });
  }

  resetInterval() {
    clearInterval(this.currentInterval);
    clearInterval(this.breakInterval);
  }

  resetTasks() {
    const $currentCompletedEl = document.querySelectorAll('tr');
    $currentCompletedEl.forEach(($el) => {
      if ($el) {
        $el.classList.remove('completed');
        $el.classList.remove('active');
      }
    });
  }

  handlePause() {
    this.$pauseBtn.addEventListener('click', () => {
      this.resetInterval();
    });
  }

  init() {
    this.fillTasksTable();
    this.handleAddTask();
    this.handleStart();
    this.handlePause();
    this.handleReset();
  }
}

export default PomodoroApp;
