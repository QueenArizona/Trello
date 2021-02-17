/**
 * Class for saving and loading cards with local storage
 *
 * @example
 * CartStorage.save({
 *   todo: ["Do things"],
 *   progress: ["Learn Javascript", "Learn Git"],
 *   done: ["Init project"]
 * });
 * CartStorage.load();
 */
class CardStorage {
  /**
   * Saves cards to storage
   * @param {Object} data list of cards categories with tasks
   */
  static save(data) {
    localStorage.setItem('cards', JSON.stringify(data));
  }

  /**
   * Loads cards from storage
   */
  static load() {
    return localStorage.getItem('cards');
  }
}

export default CardStorage;
