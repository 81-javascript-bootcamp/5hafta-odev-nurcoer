import alertify from 'alertifyjs';
import { createTimer, timerContext } from './helpers/timer';
import { disableButton } from './helpers/button';
import {
  POMODORO_WORK_TIME,
  POMODORO_BREAK_TIME,
  POMODORO_LONG_BREAK_TIME,
} from './constans';
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
    this.breakRemaining = null;
    this.currentTask = null;
    this.runningTaskCounter = null;
    this.$tableTbody = document.querySelector(tableTbodySelector);
    this.$taskForm = document.querySelector(taskFormSelector);
    this.$taskFormInput = document.querySelector('input');
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
    <td><a class="button cross" id= ${task.id} title="${task.title}" ></a></td>`;
    $newTaskEl.setAttribute('data-taskId', `task${task.id}`);
    $newTaskEl.setAttribute('taskRow', `taskRow`);
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

  handleRemoveTask() {
    this.$tableTbody.addEventListener('click', (e) => {
      if (e.target.classList.contains('cross')) {
        const task = { id: e.target.id, title: e.target.title };
        this.removeTask(task);
      }
    });
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
        this.handleRemoveTask();
      });
  }

  initializeBreakTimer(deadline, context) {
    createTimer({
      context: this,
      intervalVariable: 'breakInterval',
      deadline: deadline,
      timerElContent: `${context}:`,
      currentRemaining: `breakRemaining`,
      onStop: () => {
        this.setActiveTask();
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
        completeTaskOnApi(this.currentTask).then(() => {
          this.currentTask.completed = true;
          this.handleBreakTime();
          this.handlePreviousTask();
        });
      },
      currentRemaining: 'currentRemaining',
    });
  }

  handleBreakTime() {
    const now = getNow();
    this.runningTaskCounter += 1;
    console.log(this.runningTaskCounter);
    if (this.runningTaskCounter % 4 === 0) {
      const longBreakDeadLine = addMinutesToDate(now, POMODORO_LONG_BREAK_TIME);
      this.initializeBreakTimer(longBreakDeadLine, 'Long Chill');
    } else {
      const breakDeadline = addMinutesToDate(now, POMODORO_BREAK_TIME);
      this.initializeBreakTimer(breakDeadline, `Chill`);
    }
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
      if (this.currentRemaining) {
        this.continueTask();
      } else {
        this.setActiveTask();
      }
    });
  }

  handleReset() {
    //Reset butonuna popup ekle
    //update task function
    //sınav tarihi ve saati girişi yap geri sayım yap
    //chill zamanında spotify random müzik çalsın.

    //günlük çalışma planı oluşturmayı sağla günlük çalışmaları, listenebilsin eski çalışmalarını ve konularını görebilsin
    //hergün ders başlma saati ayarlasın ve o saatte bildirim alsın siteden.
    this.closeResetPopup();
    this.showResetPopup();
    this.$resetBtn.addEventListener('click', (e) => {
      timerContext(this.$timerEl, 'Start');
      this.data.forEach((data) => {
        setActiveTaskOnApi(data);
        data.completed = false;
      });
      this.resetInterval();
      this.resetTasks();
      this.currentRemaining = null;
      this.runningTaskCounter = null;
    });
  }

  showResetPopup() {
    this.$resetBtn.addEventListener('mouseover', () => {
      let resetPopup = document.getElementById('resetPopup');
      resetPopup.classList.toggle('show');
    });
  }

  closeResetPopup() {
    this.$resetBtn.addEventListener('mouseout', () => {
      let resetPopup = document.getElementById('resetPopup');
      resetPopup.classList.remove('show');
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
      clearInterval(this.currentInterval);
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
