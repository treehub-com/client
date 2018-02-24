# Educe
A minimal reactive style custom-element library that doesn't require transpilation or bundling

```javascript
import {n, Element} from `./educe.js`

window.customElements.define('my-elem', class extends Element {
  static get props() {
    return {
      clicked: {},
      myAttribute: {attribute: true, default: true},
    }
  }

  onClick() {
    this.clicked++;
  }

  render() {
    return [
      n('h1', 'Hello World!'),
      n('div', {id: 'foo', className: 'ab', onclick: this.onClick}, [
        `Clicked ${this.clicked} times`,
      ]),
    ]
  }
});

```

## Render Method

## Properties

## Attributes

## Events

## Keyed Children

# FAQ

### Render method
You can return a string, node (via `n`), or array of strings/nodes from render. The resulting nodes will be the children of the root element.

### Keying your data
All data is keyed, wether implicitly or explicitly. Note that key values are set via the `key` property, and are scoped to the node type in the children array (`div#0` and `span#0` will not conflict). If no key is provided, a naive key assignment is performed

### Reactive Style Rendering
When any tracked attribute or property is changed, a render is queued as a new microtask (and debounced if necessary). This means that you can change several attributes/properties synchronously and only re-render once.

### Property Based
Educe sets properties instead of attributes when synchronizing the dom. This means that you can pass down objects and other complex data types to other custom elements. This also means that if you set up a property that is not reflected to an attribute, it does not have to be normalized. Properties may optionally be reflected to attributes (which means all values are normalized when assigned), and can be defaulted (happens first thing in the constructor so property setting after creation overrides properly).

### Event Binding
All `on[event]` properties are interpreted as event bindings, and event handlers are bound to the child element with the root element being lexically bound (Meaning you can do `this.myProp` in the handler without binding it yourself)
