import {n} from '../index.js';

describe('n', () => {
  it('Should accept all params', () => {
    const node = n('div', {prop: true}, [['a',{},[]]]);
    expect(node).to.be.instanceof(Object);
    expect(node.name).to.deep.equal('DIV');
    expect(node.props).to.deep.equal({prop: true});
    expect(node.children).to.deep.equal([['a',{},[]]]);
  });

  it('Should default props and children', () => {
    const node = n('div');
    expect(node).to.be.instanceof(Object);
    expect(node.name).to.deep.equal('DIV');
    expect(node.props).to.deep.equal({});
    expect(node.children).to.deep.equal([]);
  });

  it('Should default children', () => {
    const node = n('div', {prop: true});
    expect(node).to.be.instanceof(Object);
    expect(node.name).to.deep.equal('DIV');
    expect(node.props).to.deep.equal({prop: true});
    expect(node.children).to.deep.equal([]);
  });

  it('Should default props', () => {
    const node = n('div', [['a',{},[]]]);
    expect(node).to.be.instanceof(Object);
    expect(node.name).to.deep.equal('DIV');
    expect(node.props).to.deep.equal({});
    expect(node.children).to.deep.equal([['a',{},[]]]);
  });

  it('Should transform string children to #text', () => {
    const node = n('div', ['some text']);
    expect(node).to.be.instanceof(Object);
    expect(node.name).to.deep.equal('DIV');
    expect(node.props).to.deep.equal({});
    expect(node.children).to.deep.equal([{name: '#text',props: {data: 'some text'}, children: []}]);
  });

  it('Should transform non-array string child to #text', () => {
    const node = n('div', {}, 'some text');
    expect(node).to.be.instanceof(Object);
    expect(node.name).to.deep.equal('DIV');
    expect(node.props).to.deep.equal({});
    expect(node.children).to.deep.equal([{name: '#text',props: {data: 'some text'}, children: []}]);
  });

  it('Should transform non-array string children to #text', () => {
    const node = n('div', 'some text');
    expect(node).to.be.instanceof(Object);
    expect(node.name).to.deep.equal('DIV');
    expect(node.props).to.deep.equal({});
    expect(node.children).to.deep.equal([{name: '#text',props: {data: 'some text'}, children: []}]);
  });
});
