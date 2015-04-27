var React = require('react');
var Hello = require('./app/hello.jsx');

jQuery( document ).ready(function() {
  if (document.getElementById('app'))
    React.render(<Hello />, document.getElementById('app'));
});
