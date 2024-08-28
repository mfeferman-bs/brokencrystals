import React from 'react';
import ReactDOM from 'react-dom';
import { Router } from 'react-router-dom';
import { Routes } from './router/Routes';
import { history } from './router/history';

ReactDOM.render(
  <Router history={history}>
    <Routes />
  </Router>,
  document.getElementById('root')
);
