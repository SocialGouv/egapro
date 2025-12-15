const React = require('react');

// Lightweight mocks using React.createElement (no JSX) to avoid parse issues in Jest environment
const mockComponent = (props) => React.createElement('div', Object.assign({ 'data-testid': 'mock-component' }, props));
const mockFunction = jest.fn(() => ({}));

function Alert(props) {
  return React.createElement(
    'div',
    { 'data-testid': 'mock-alert', className: props && props.className },
    props && props.title ? React.createElement('h2', null, props.title) : null,
    props && props.description ? props.description : null
  );
}

function Breadcrumb(props) {
  const children = [];

  if (props && props.homeLinkProps) {
    children.push(React.createElement('a', { href: props.homeLinkProps.href, key: 'home' }, 'Home'));
  }

  if (props && Array.isArray(props.segments)) {
    props.segments.forEach((segment, idx) => {
      children.push(
        React.createElement(
          'span',
          { key: `seg-${idx}` },
          React.createElement('a', { href: segment.linkProps && segment.linkProps.href }, segment.label),
          idx < props.segments.length - 1 ? ' > ' : null
        )
      );
    });
  }

  children.push(React.createElement('span', { key: 'current' }, props && props.currentPageLabel));

  return React.createElement('nav', null, ...children);
}

const fr = {
  cx: function(...args) {
    return args.filter(Boolean).join(' ');
  },
  spacing: function(value) {
    return `${value}rem`;
  },
};

// Export a top-level cx so imports like `@codegouvfr/react-dsfr/tools/cx` can read it via moduleNameMapper
function cx(...args) {
  return fr.cx(...args);
}

const exportsObj = {
  Button: mockComponent,
  Alert,
  Breadcrumb,
  ButtonsGroup: mockComponent,
  Card: mockComponent,
  Checkbox: mockComponent,
  Input: mockComponent,
  Modal: mockComponent,
  Select: mockComponent,
  Table: mockComponent,
  Tabs: mockComponent,
  ToggleSwitch: mockComponent,
  createModal: mockFunction,
  fr,
  cx,
  useColors: mockFunction,
  useIsDark: () => false,
  breakpoints: {
    xs: '0px',
    sm: '576px',
    md: '768px',
    lg: '992px',
    xl: '1248px',
  },
};

// Provide a default export object as well to cover `import default from '@codegouvfr/react-dsfr/*'` usage
exportsObj.default = {
  ...exportsObj,
};

module.exports = exportsObj;