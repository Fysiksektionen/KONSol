import React, { Component, useEffect, useState } from 'react';
import './App.css';
import Greeting from './components/Greeting';
import Slides from './components/Slides'
import Alerts from './components/Alerts';
import { GoogleOAuthProvider } from '@react-oauth/google';

const App = ( ) => {
    return (
        <div className="App">
            <GoogleOAuthProvider clientId={process.env.REACT_APP_CLIENT_ID}>
                <Alerts>
                    <Greeting />
                    <Slides />
                </Alerts>
            </GoogleOAuthProvider>
        </div>
    );
}

export default App;
