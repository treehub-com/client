import {n, Element} from '../educe/index.js';

window.customElements.define('app-root', class extends Element {
  render() {
    return 'Hello World!';
  }
});
