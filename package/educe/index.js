const CONNECTED = Symbol('connected');
const KEY = 'key';
const PROPS = Symbol('props');
const QUEUERENDER = Symbol('queueRender');
const RENDER = Symbol('render');
const RENDERQUEUED = Symbol('renderQueued');

// Create an element and set its props and event handlers
function createElement(root, elem) {
  let element;

  // Create element
  if (elem.name === '#text') {
    element = document.createTextNode(elem.props.data);
  } else {
    element = document.createElement(elem.name);
  }

  // Set properties/bind handlers
  for (const prop of Object.keys(elem.props)) {
    // Note that binding events only happens on create
    if (prop.startsWith('on')) {
      const event = prop.substring(2);
      element.addEventListener(event, elem.props[prop].bind(root));
    } else {
      element[prop] = elem.props[prop];
    }
  }

  // Return element
  return element;
}

// Update an element (but do NOT bind event handlers)
function patchElement(element, elem) {
  // If type is text, compare data and return
  if (elem.name === '#text') {
    if (element.data !== elem.props.data) {
      element.data = elem.props.data;
    }
    return;
  }

  // Set props if different
  // Note that binding events only happens on create
  for (const key of Object.keys(elem.props)) {
    // Skip event handlers
    if (key.startsWith('on')) {
      continue;
    }
    if (element[key] !== elem.props[key]) {
      element[key] = elem.props[key];
    }
  }
}

// Recursively match the parent's children to the provided dom array
function patch(root, parent, dom) {
  const keyMap = {}; // keyMap[nodeName][key] => node
  for (let i = 0; i < parent.childNodes.length; i++) {
    if (keyMap[parent.childNodes[i].nodeName] === undefined) {
      keyMap[parent.childNodes[i].nodeName] = {};
    }
    keyMap[parent.childNodes[i].nodeName][parent.childNodes[i][KEY]] = parent.childNodes[i];
  }

  let nextElement = (parent.childNodes.length > 0) ? parent.childNodes[0] : null;

  // Sync up the dom
  for (let i = 0; i < dom.length; i++) {
    // If the node already exists
    if (keyMap[dom[i].name] !== undefined && keyMap[dom[i].name][dom[i].props[KEY]] !== undefined) {
      // If the node isn't in the right spot, move it
      // Note that we are guaranteed to have at least i nodes
      // since the old Node hasn't been processed yet
      if (parent.childNodes[i] !== keyMap[dom[i].name][dom[i].props[KEY]]) {
        parent.insertBefore(keyMap[dom[i].name][dom[i].props[KEY]], parent.childNodes[i]);
      }
      // Patch the element
      patchElement(parent.childNodes[i], dom[i]);
    // Else create and insert
    } else {
      const element = createElement(root, dom[i]);
      parent.insertBefore(element, nextElement);
    }
    // Recurse
    patch(root, parent.childNodes[i], dom[i].children);
    // Set Next Element
    nextElement = parent.childNodes[i].nextSibling;
  }

  // Cleanup any leftover nodes
  for (let i = parent.childNodes.length-1; i > dom.length-1; i--) {
    parent.removeChild(parent.childNodes[i]);
  }
}

// Normalize attributes for properties that are reflected/set through attributes
function normalizeAttribute(attr) {
  switch(attr) {
    case null:
    case undefined:
    case false:
      return null
    case true:
      return '';
  }
  return attr;
}

// Morph render() return to an array of dom nodes if needed
function toChildrenArray(dom) {
  if (typeof dom === 'string') {
    // Return a single text node
    return [{name: '#text', props: {data: dom}, children: []}];
  } else if (Array.isArray(dom)) {
    // Turn strings into text nodes
    for (let i = 0; i < dom.length; i++) {
      if (typeof dom[i] === 'string') {
        dom[i] = {name: '#text', props: {data: dom[i]}, children: []};
      }
    }
    return dom;
  } else if (typeof dom === 'object' && dom.name !== undefined) {
    return [dom];
  } else {
    // TODO should this just error? Or fail silently?
    // Stringify it and turn it into a text node
    return [{name: '#text', props: {data: JSON.stringify(dom)}, children: []}];
  }
}

// Ensure each node has a key
function key(children) {
  const keyMap = {}; // keyMap[type] => 0, 1, 2...
  for (let i = 0; i < children.length; i++) {
    if (children[i].props[KEY] === undefined) {
      if (keyMap[children[i].name] === undefined) {
        keyMap[children[i].name] = 0;
      }
      children[i].props[KEY] = keyMap[children[i].name]++;
    }
    key(children[i].children);
  }
}

class Element extends HTMLElement {
  constructor() {
    super();
    // Initialize connected, renderQueued, props
    this[CONNECTED] = false;
    this[RENDERQUEUED] = false;
    this[PROPS] = {};

    // Create props getters/setters
    const props = this.constructor.props
    for (const prop of Object.keys(props)) {
      if (props[prop].attribute) {
        Object.defineProperty(this, prop, {
          get: () => this.getAttribute(prop),
          set: (val) => {
            const attr = normalizeAttribute(val);
            if (attr === null) {
              this.removeAttribute(prop);
            } else {
              this.setAttribute(prop, attr);
            }
            // Attribute getters/setters set the attribute, which
            // triggers attributeChangedCallback which calls queueRender
          },
        });
        const normalizedDefault = normalizeAttribute(props[prop].default);
        const existingDefault = this.getAttribute(prop);
        if (normalizedDefault !== null && existingDefault === null) {
          this.setAttribute(prop, normalizedDefault);
        }
      } else {
        Object.defineProperty(this, prop, {
          get: () => this[PROPS][prop],
          set: (val) => {
            if (val !== this[PROPS][prop]) {
              const oldVal = this[PROPS][prop];
              this[PROPS][prop] = val;
              // TODO allow callback to cancel render queue
              this[QUEUERENDER]();
            }
          },
        });
        if (props[prop].default !== undefined) {
          this[PROPS][prop] = props[prop].default;
        }
      }
    }
  }

  // Pulls props marked as attributes from static props method
  static get observedAttributes() {
    const attributes = [];

    // Get all props that map to an attribute
    for (const [prop, value] of Object.entries(this.props)) {
      if (value.attribute) {
        attributes.push(prop);
      }
    }

    return attributes;
  }

  // Overloaded by extending class to set props
  // {attribute, default}
  static get props() {
    return [];
  }

  // Sets connected and queues render
  connectedCallback() {
    if (!this[CONNECTED]) {
      this[CONNECTED] = true;
      this[QUEUERENDER]();
    }
  }

  // Calls queueRender if connected and changed
  attributeChangedCallback(attribute, oldVal, newVal) {
    if (this[CONNECTED]) {
      if (newVal !== oldVal) {
        // TODO allow callback in this.props[attr]... to cancel render queue
        this[QUEUERENDER]();
      }
    }
  }

  // If connected and not queued sets this[RENDERQUEUED] to true
  // and queues render via Promise.resolve().then(() => this.render())
  get [QUEUERENDER]() {
    return () => {
      // This runs at most 1 render as a new microtask,
      // so setting multiple properties does not trigger multiple renders
      if (this[CONNECTED] && !this[RENDERQUEUED]) {
        this[RENDERQUEUED] = true;
        Promise.resolve().then(() => {
          this[RENDER]();
          this[RENDERQUEUED] = false;
        });
      }
    }
  }

  // Calls this.render() and updates the dom
  get [RENDER]() {
    return () => {
      // TODO if render() returns dom nodes, use them and skip patch
      const dom = toChildrenArray(this.render());
      key(dom);
      patch(this, this, dom);
    }
  }

  // Overloaded by extending class and used to return virtual dom
  render() {
    return [];
  }
}

function n(name, props = {}, children = []) {
  let node;

  // Deal with optional and shortcut params
  if (Array.isArray(props)) {
    node = {name: name.toUpperCase(), props: {}, children: props};
  } else if (typeof props == 'string') {
    node = {name: name.toUpperCase(), props: {}, children: [props]};
  } else if (typeof children == 'string') {
    node = {name: name.toUpperCase(), props, children: [children]};
  } else {
    node = {name: name.toUpperCase(), props, children};
  }

  // Transform string children into text nodes
  for (let i = 0; i < node.children.length; i++) {
    if (typeof node.children[i] === 'string') {
      node.children[i] = {name: '#text', props: {data: node.children[i]}, children: []};
    }
  }

  return node;
}

export {n, Element};
