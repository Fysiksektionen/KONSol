import React, { Component, useEffect, useState } from 'react';
import './App.css';
import Greeting from './components/Greeting';
import Slides from './components/Slides'
import Alerts from './components/Alerts';

const App = ( ) => {
    return (
        <div className="App">
            <Alerts>
                <Greeting />
                <Slides />
            </Alerts>
        </div>
    );
}

export default App;
