var React = require('react');
var Hello = require('./app/hello.jsx');

$( document ).ready(function() {
  React.render(<Hello />, document.getElementById('app'));
});
