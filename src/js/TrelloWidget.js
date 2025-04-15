import CardStorage from './CardStorage';

/**
 * Widget for adding and sorting tasks
 *
 * @example
 * const trelloWidget = new TrelloWidget();
 * @todo init widget
 */
class TrelloWidget {
  constructor() {
    this.container = document.querySelector('.tasks');
    this.todoList = document.getElementById('todo').querySelector('.tasks__list');
    this.progressList = document.getElementById('progress').querySelector('.tasks__list');
    this.doneList = document.getElementById('done').querySelector('.tasks__list');
    this.forms = document.forms;
    this.parent = null;
    this.draggedElement = null;
    this.ghostElement = null;
    this.topDifference = null;
    this.leftDifference = null;
  }

  /**
   * Init widget and loads data from storage
   */
  init() {
    document.addEventListener('DOMContentLoaded', () => {
      this.load();
    });
    this.action();
  }

  /**
   * Add eventListeners for events with mouse, keyboard and forms
   */
  action() {
    this.container.addEventListener('click', (event) => {
      const { target } = event;

      const action = target.closest('.tasks__action');
      if (action) {
        event.preventDefault();

        const parent = target.parentElement;
        if (!parent) return;

        const form = parent.querySelector('.tasks__form');
        if (!form.classList.contains('active')) form.classList.add('active');
      }

      const formDecline = target.closest('.tasks__form-decline');
      if (formDecline) {
        event.preventDefault();

        const form = target.closest('.tasks__form');
        form.reset();
        form.classList.remove('active');
      }

      const removeButton = target.closest('.card__remove');
      if (removeButton) {
        event.preventDefault();

        const card = removeButton.closest('.card');
        if (!card) return;

        card.remove();
        this.save();
      }
    });

    this.container.addEventListener('mousedown', (event) => {
      const { target } = event;

      if (target.classList.contains('card')) {
        event.preventDefault();

        const removeButton = target.querySelector('.card__remove');
        if (removeButton) removeButton.classList.remove('active');

        target.classList.remove('active');

        this.draggedElement = target;
        this.ghostElement = target.cloneNode(true);
        this.ghostElement.classList.add('dragged');
        document.body.appendChild(this.ghostElement);
        document.body.style.cursor = 'grabbing';
        this.ghostElement.style.width = `${this.draggedElement.offsetWidth}px`;
        const { top, left } = this.draggedElement.getBoundingClientRect();
        this.topDifference = event.pageY - top;
        this.leftDifference = event.pageX - left;
        this.ghostElement.style.left = `${left}px`;
        this.ghostElement.style.top = `${top}px`;
      }
    });

    this.container.addEventListener('mouseover', (event) => {
      event.preventDefault();
      if (this.draggedElement) return;

      const { target } = event;

      if (target.classList.contains('card')) {
        target.classList.add('active');

        const removeButton = target.querySelector('.card__remove');
        if (!removeButton) return;

        removeButton.classList.add('active');
      }
    });

    this.container.addEventListener('mouseout', (event) => {
      event.preventDefault();

      const { target, relatedTarget } = event;

      if (target.classList.contains('card') && !relatedTarget.classList.contains('card__remove')) {
        target.classList.remove('active');

        const removeButton = target.querySelector('.card__remove');
        if (!removeButton) return;

        removeButton.classList.remove('active');
      }
    });

    this.container.addEventListener('mousemove', (event) => {
      event.preventDefault();

      if (this.draggedElement) {
        this.ghostElement.style.left = `${event.pageX - this.leftDifference}px`;
        this.ghostElement.style.top = `${event.pageY - this.topDifference}px`;
      }
    });

    this.container.addEventListener('mouseup', (event) => {
      if (this.draggedElement) {
        const target = document.elementFromPoint(event.clientX, event.clientY);
        const { top } = target.getBoundingClientRect();
        const parent = target.closest('.tasks__list');
        if (parent && parent !== target) {
          if (event.pageY > window.scrollY + top + target.offsetHeight / 2) {
            parent.insertBefore(this.draggedElement, target.nextElementSibling);
          } else {
            parent.insertBefore(this.draggedElement, target);
          }
          this.stopMove();
          this.save();
        } else if (parent) {
          parent.appendChild(this.draggedElement);
          this.stopMove();
          this.save();
        } else {
          this.stopMove();
          this.save();
        }
      }
    });

    document.addEventListener('mouseup', (event) => {
      if (this.draggedElement) {
        const target = document.elementFromPoint(event.clientX, event.clientY);
        if (target.querySelector('.tasks')) {
          this.stopMove();
          this.save();
        }
      }
    });

    this.forms.forEach((form) => {
      form.addEventListener('submit', (event) => {
        event.preventDefault();

        const textarea = form.querySelector('textarea');
        if (!textarea) return;

        const value = textarea.value ? textarea.value.trim() : null;
        if (!value) return;

        const column = form.closest('.column');
        if (!column) return;

        const tasksList = column.querySelector('.tasks__list');
        if (!tasksList) return;

        this.addCard(tasksList, value);
        form.classList.remove('active');
        form.reset();
        this.save();
      });
    });
  }

  /**
   * Add card with task to widqet
   * @param {Object} parent parent element for adding card
   * @param {String} value input task value
   */
  addCard(parent, value) {
    this.parent = parent;
    const card = document.createElement('div');
    card.className = 'card';
    card.innerHTML = `${value} <div class='card__remove'>✕</div>`;
    this.parent.appendChild(card);
  }

  /**
   * Collect cards to data and saves it to storage
   */
  save() {
    const todoCards = this.todoList.querySelectorAll('.card');
    const progressCards = this.progressList.querySelectorAll('.card');
    const doneCards = this.doneList.querySelectorAll('.card');

    const data = {
      todo: [],
      progress: [],
      done: [],
    };

    todoCards.forEach((card) => data.todo.push(card.textContent.replace(' ✕', '')));

    progressCards.forEach((card) => data.progress.push(card.textContent.replace(' ✕', '')));

    doneCards.forEach((card) => data.done.push(card.textContent.replace(' ✕', '')));

    CardStorage.save(data);
  }

  /**
   * Loads data from storage and sorts it to cards
   */
  load() {
    const data = JSON.parse(CardStorage.load());
    if (data) {
      data.todo.forEach((card) => this.addCard(this.todoList, card));
      data.progress.forEach((card) => this.addCard(this.progressList, card));
      data.done.forEach((card) => this.addCard(this.doneList, card));
    }
  }

  /**
   * Cancels moving and removes 'ghost' item
   */
  stopMove() {
    document.body.removeChild(this.ghostElement);
    document.body.style.cursor = 'auto';
    this.ghostElement = null;
    this.draggedElement = null;
  }
}

export default TrelloWidget;
