import React, { Component } from 'react';
import './App.css';
import Slide from './components/Slide.js'
import Alert from './components/Alert.js'
import Cookies from 'js-cookie'

const blankSlide = {tags: [], url: '', start: '',end: '', visible: false, fullscreen: false, caption:'', imageFile:null}

class App extends Component {
  constructor() {
    super()
    this.state={
      user:{logged_in:false},
      slides:[],
      alerts:[]
    }
    this.addSlide.bind(this)
    this.removeSlide.bind(this)
    this.addAlert.bind(this)

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
        else {
          this.addAlert({type:"error", message:"Error: Could not load slides"}) 
          return []
        }
      })
      .then(slides => this.setState((prevstate) => {
        return { slides : prevstate.slides.concat(slides) }
      })); 
  }

  addSlide = (slide) => {
    this.setState(prevState => {
      return { slides: [slide].concat(prevState.slides) }
    })
  }

  removeSlide = (id) => {
    this.setState(prevState => {
      return { slides: prevState.slides.filter(slide => slide._id !== id) }
    })
  }

  addAlert = (alert) => {
    this.setState(prevState => {
      return {alerts: prevState.alerts.concat(alert)}
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
          <a href='http://localhost:8888/instagram' className="btn">Hämta nya Instagram-bilder</a>
        </div>
        <div className="slides">
          <Slide initialState={blankSlide} addSlide={this.addSlide} addAlert={this.addAlert} csrftoken={Cookies.get('XSRF-TOKEN')}/>
          {/*key is a unique key for React to optimise rerendering*/}
          {this.state.slides.length
              ? this.state.slides.slice(0).sort((a,b) => (b.created-a.created))
                .map(slide =>
                  <Slide initialState={slide} csrftoken={Cookies.get('XSRF-TOKEN')} 
                      key={slide._id} removeSlide={this.removeSlide} addAlert={this.addAlert}/>
                )
              : null
          }
        </div>
        <div className="alerts">
          {this.state.alerts.map(alert => <Alert type={alert.type} message={alert.message}/>)}
        </div>
      </div>
    );
  }
}

export default App;
