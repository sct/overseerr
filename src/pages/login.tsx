import React from 'react';
import { NextPage } from 'next';
import Login from '../components/Login';

const LoginPage: NextPage = () => {
  return (
    <div className="w-full">
      <Login />
    </div>
  );
};

export default LoginPage;
