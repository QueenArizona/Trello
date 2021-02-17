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
    this.container = document.querySelector('.container');
    this.todoList = document.getElementById('todo').querySelector('.cards');
    this.progressList = document.getElementById('progress').querySelector('.cards');
    this.doneList = document.getElementById('done').querySelector('.cards');
    this.forms = document.forms;
    this.parent = null;
    this.draggedEl = null;
    this.ghostEl = null;
    this.topDiff = null;
    this.leftDiff = null;
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
    this.container.addEventListener('mousedown', (event) => {
      if (event.target.classList.contains('add-card')) {
        const targetForm = event.target.parentElement.querySelector('.card-form');
        if (!targetForm.classList.contains('card-form-active')) targetForm.classList.add('card-form-active');
      } else if (event.target.classList.contains('cancel-button')) {
        event.preventDefault();
        const targetForm = event.target.closest('.card-form');
        targetForm.reset();
        targetForm.classList.remove('card-form-active');
      } else if (event.target.classList.contains('delete-button-active')) {
        event.preventDefault();
        const deletedCard = event.target.parentElement;
        event.target.closest('.cards').removeChild(deletedCard);
        this.save();
      } else if (event.target.classList.contains('card-item')) {
        event.preventDefault();
        event.target.querySelector('.delete-button').classList.remove('delete-button-active');
        event.target.classList.remove('card-item-active');
        this.draggedEl = event.target;
        this.ghostEl = event.target.cloneNode(true);
        this.ghostEl.classList.add('dragged');
        document.body.appendChild(this.ghostEl);
        document.body.style.cursor = 'grabbing';
        this.ghostEl.style.width = `${this.draggedEl.offsetWidth}px`;
        const { top, left } = this.draggedEl.getBoundingClientRect();
        this.topDiff = event.pageY - top;
        this.leftDiff = event.pageX - left;
        this.ghostEl.style.left = `${left}px`;
        this.ghostEl.style.top = `${top}px`;
      }
    });
    this.container.addEventListener('mouseover', (event) => {
      event.preventDefault();
      if (this.draggedEl) return;
      if (event.target.classList.contains('card-item')) {
        const targetCard = event.target;
        targetCard.classList.add('card-item-active');
        targetCard.querySelector('.delete-button').classList.add('delete-button-active');
      }
    });
    this.container.addEventListener('mouseout', (event) => {
      event.preventDefault();
      if (event.target.classList.contains('card-item') && !event.relatedTarget.classList.contains('delete-button')) {
        const targetCard = event.target;
        targetCard.classList.remove('card-item-active');
        targetCard.querySelector('.delete-button').classList.remove('delete-button-active');
      }
    });
    this.container.addEventListener('mousemove', (event) => {
      event.preventDefault();
      if (this.draggedEl) {
        this.ghostEl.style.left = `${event.pageX - this.leftDiff}px`;
        this.ghostEl.style.top = `${event.pageY - this.topDiff}px`;
      }
    });
    this.container.addEventListener('mouseup', (event) => {
      if (this.draggedEl) {
        const target = document.elementFromPoint(event.clientX, event.clientY);
        const { top } = target.getBoundingClientRect();
        const parent = target.closest('.cards');
        if (parent && parent !== target) {
          if (event.pageY > window.scrollY + top + target.offsetHeight / 2) {
            parent.insertBefore(this.draggedEl, target.nextElementSibling);
          } else {
            parent.insertBefore(this.draggedEl, target);
          }
          this.stopMove();
          this.save();
        } else if (parent) {
          parent.appendChild(this.draggedEl);
          this.stopMove();
          this.save();
        } else {
          this.stopMove();
          this.save();
        }
      }
    });
    document.addEventListener('mouseup', (event) => {
      if (this.draggedEl) {
        const target = document.elementFromPoint(event.clientX, event.clientY);
        if (target.querySelector('.container')) {
          this.stopMove();
          this.save();
        }
      }
    });
    this.forms.forEach((el) => {
      el.addEventListener('submit', (event) => {
        event.preventDefault();
        const isValid = event.currentTarget.checkValidity();
        const input = [...el.elements][0];
        if (isValid) {
          const targetList = el.closest('.cards-column').querySelector('.cards');
          this.addCard(targetList, input.value);
          el.reset();
          el.classList.remove('card-form-active');
          this.save();
        }
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
    card.className = 'card-item';
    card.innerHTML = `${value} <span class='delete-button'>✕</span>`;
    this.parent.appendChild(card);
  }

  /**
   * Collect cards to data and saves it to storage
   */
  save() {
    const todoCards = this.todoList.querySelectorAll('.card-item');
    const progressCards = this.progressList.querySelectorAll('.card-item');
    const doneCards = this.doneList.querySelectorAll('.card-item');

    const data = {
      todo: [],
      progress: [],
      done: [],
    };

    todoCards.forEach((el) => {
      data.todo.push(el.textContent.replace(' ✕', ''));
    });

    progressCards.forEach((el) => {
      data.progress.push(el.textContent.replace(' ✕', ''));
    });

    doneCards.forEach((el) => {
      data.done.push(el.textContent.replace(' ✕', ''));
    });

    CardStorage.save(data);
  }

  /**
   * Loads data from storage and sorts it to cards
   */
  load() {
    const data = JSON.parse(CardStorage.load());
    if (data) {
      data.todo.forEach((el) => {
        this.addCard(this.todoList, el);
      });
      data.progress.forEach((el) => {
        this.addCard(this.progressList, el);
      });
      data.done.forEach((el) => {
        this.addCard(this.doneList, el);
      });
    }
  }

  /**
   * Cancels moving and removes 'ghost' item
   */
  stopMove() {
    document.body.removeChild(this.ghostEl);
    document.body.style.cursor = 'auto';
    this.ghostEl = null;
    this.draggedEl = null;
  }
}

export default TrelloWidget;
