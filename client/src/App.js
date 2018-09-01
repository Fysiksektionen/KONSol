import React, { Component } from 'react';
import './App.css';
import Slide from './components/Slide.js'
import ErrorMessage from './components/ErrorMessage.js'

class App extends Component {
  constructor() {
    super()
    this.state={
      user:{logged_in:false},
      slides:[{tags: [], url: '', start: '',end: '', visible: false, fullscreen: false, caption:''}]
    }
    this.removeSlide.bind(this)
    fetch('api/me')
      .then(res=>res.json())
      .then(user => {
          user.logged_in = true
          this.setState({user})
      })
      .catch(err => this.setState({user:{logged_in:false}}))
  }

  componentDidMount() {
    fetch('/api/screen/slides')
      .then(res =>  {
        if (res.ok || res.status === 304) {
          return res.json()
        }
        else return []
      })
      .then(slides => this.setState((prevstate) => {
        return { slides : prevstate.slides.concat(slides) }
      })); 
  }

  removeSlide = (id) => {
    this.setState(prevState => {
      return { slides: prevState.slides.filter(slide => slide._id !== id) }
    })
  }

  render() {
    return (
      <div className="App">
        <div className="greeting">
          <h1>KONSol</h1>
          <p>Fjärrkontrollera skärmen i Konsulatet!</p>
          { this.state.user.logged_in 
            ? <p>Welcome {this.state.user.name}!</p> 
            : <a href='http://localhost:8888/login?returnTo=http://localhost:8888' className="btn">Logga in med KTH</a>}
        </div>
        <div className="slides">
          {/*key is a unique key for React to optimise rerendering*/}
          {this.state.slides.length - 1
              ? this.state.slides.map(slide => 
                  <Slide initialState={slide} key={slide._id} removeSlide={this.removeSlide}/>
                )
              : <ErrorMessage message="Could not load slides"/>
          }
        </div>
      </div>
    );
  }
}

export default App;
