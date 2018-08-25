import React, { Component } from 'react';
import './App.css';
import Slide from './components/Slide.js'
import ErrorMessage from './components/ErrorMessage.js'

class App extends Component {
  constructor() {
    super()
    this.state={
      slides:[]
    }
  }

  componentDidMount() {
    fetch('/api/screen/slides')
      .then(res =>  {
        if (res.ok || res.status === 304) {
          return res.json()
        }
        else return []
      })
      .then(slides => this.setState({ slides }));
  }

  render() {
    return (
      <div className="App">
        <div className="greeting">
          <h1>KONSol</h1>
          <p>Fjärrkontrollera skärmen i Konsulatet!</p>
          <a href="/dashboard" className="btn">Logga in med KTH</a>
        </div>
        <div className="slides">
          {/*key is a unique key for React to optimise rerendering*/}
          {this.state.slides.length
              ? this.state.slides.map(slide => <Slide initialState={slide} key={slide._id}/>)
              : <ErrorMessage message="Could not load slides"/>
          }
        </div>
      </div>
    );
  }
}

export default App;
