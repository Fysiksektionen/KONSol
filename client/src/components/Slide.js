import React, { Component } from 'react';
import '../css/Slide.css';
import Checkbox from './Checkbox.js';

// functional component
function DateInput (props) {
  /*params: props.id, props.value, props.name and props.onChange
   props.id is just a unique DOM id.
   props.value is the datestring in format YYYY-MM-DD or an empty string
   props.name can be specified if using a generic onChange function.
  */
  return (
    <div className="date">
      <label htmlFor={props.id}>{props.label}</label>
      <input type="date" id={props.id} name={props.name}
        value={props.value}
        onChange={props.onChange}
      />
    </div>
  )
}

class Slide extends Component {
  constructor(props) {
    super(props)
    this.state = {...this.props.initialState}

    this.handleChange = this.handleChange.bind(this)
    this.handleCheckboxChange = this.handleCheckboxChange.bind(this)
    this.handleImageChange = this.handleImageChange.bind(this)
    this.handleSubmit = this.handleSubmit.bind(this)
  }

  handleChange (event) {
    // The `name=` attribute specified in the input tags should
    // match the corresponding attribute names in `this.state`.
    this.setState({[event.target.name]: event.target.value});
  }

  handleCheckboxChange (event) {
    // assumes name attribute corresponds to the desired this.state attribute
    this.setState({[event.target.name]: event.target.checked })
  }

  handleImageChange (event) {
    if (event.target.files && event.target.files[0]) {
      let reader = new FileReader();
      reader.onload = (e) => {
        this.setState({imageFile: e.target.result});
      };
      reader.readAsDataURL(event.target.files[0]);
    }
  }

  handleSubmit (event) {
    // to be implemented
  }

  render() {
    return (
      <form onSubmit={this.handleSubmit}>
        <div className="slide">
          <div className="image-container" 
              style={{backgroundImage:"url(https://static.tutsplus.com/assets/elements/landingpage_tuts_icon_plus-8ca21c2c723d17a1958914d2200c8ade.svg)"}}
              onClick={() => this.refs.imageUploader.click() /*click the hidden file input tag*/}>
            <input type="file" ref="imageUploader" onChange={this.handleImageChange} style={{display:"none"}} name="image" accept="image/*"/>
            {<img src={this.state.imageFile || this.state.url}/>}
          </div>
          <div className="slide-settings">
              <textarea value={this.state.caption || ''} onChange={this.handleChange}
                  placeholder="Caption here..." name="caption" form="slide-form">
              </textarea>
              <DateInput label="Start" value={this.state.start} onChange={this.handleChange} id={"start"+this.state._id} name="start" />
              <DateInput label="End"   value={this.state.end}   onChange={this.handleChange} id={"end"  +this.state._id} name="end"   />
              <Checkbox label="Visible"    checked={this.state.visible}    onChange={this.handleCheckboxChange} name="visible"/>
              <Checkbox label="Fullscreen" checked={this.state.fullscreen} onChange={this.handleCheckboxChange} name="fullscreen"/>
              <div>
                {/*Disabled if an image file has been selected, should allow to clear the selected file to reenable.
                  Can do this by rotating the background image of the image-container 45 degrees to form an X and
                  clear file input upon click.
                */}
                <input type="text" placeholder="URL" value={this.state.imageFile ? '' : this.state.url} name="url" 
                  disabled={!!this.state.imageFile} onChange={this.handleChange}
                />
              </div>
          </div>
          <div className="slide-footer">
            <input type="submit" value="Save" className="btn"/>
            <a href="#" className="btn red">Remove</a>
          </div>
        </div>
      </form>
    );
  }
}

export default Slide;