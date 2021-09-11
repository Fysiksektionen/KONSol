import React, { Component } from 'react';
    import '../css/Slide.css';
    import Checkbox from './Checkbox.js';

    const randomId = () => Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

    // functional component
    function DateInput (props) {
    /*params: props.id, props.value, props.name and props.onChange
    props.id is just a unique DOM id.
    props.value is the datestring in format YYYY-MM-DD or an empty string
    props.name can be specified if using a generic onChange function.
    props.min minimum value
    props.max maximum value
    */
    return (
        <div className="date">
        <label htmlFor={props.id}>{props.label}</label>
        <input type="date" id={props.id} name={props.name}
            value={props.value.slice(0,10)}
            onChange={props.onChange}
            min={props.min}
            max={props.max}
        />
        </div>
    )
    }

    class Slide extends Component {
    constructor(props) {
        super(props)
        this.state = {...this.props.initialState}
        this.state.tags=this.state.tags.join(" ") // join because the text field is not a list

        this.handleChange = this.handleChange.bind(this)
        this.handleCheckboxChange = this.handleCheckboxChange.bind(this)
        this.handleImageChange = this.handleImageChange.bind(this)
        this.handleSubmit = this.handleSubmit.bind(this)
        this.handleRemove = this.handleRemove.bind(this)
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
        event.preventDefault() // Stop form submit
        // create FormData from form-tag
        const formData = new FormData(event.target);
        if (this.state.imageFile) formData.append('file', this.state.imageFile)
        if (this.state._id)       formData.append('_id', this.state._id)
        // set visible and fullscreen manually because
        // checkbox values are "on" and undefined, not "true" or "false"
        formData.set('visible', this.state.visible)
        formData.set('fullscreen', this.state.fullscreen)
        // set caption manually because it isn't registered as a field on the form-tag,
        // not even with form-id references
        formData.set('caption', this.state.caption)
        // Set tags after converting to array because it is not stored as a string
        formData.delete('tags'); // this is a string, but we want an array as below
        // avoids passing things like [''] if the tags field was empty
        const tags = this.state.tags.trim().split(" ").filter(tag => tag.length)
        if (tags.length) tags.forEach(tag => tag.length ? formData.append('tags[]',tag) : null)

        const options = {
            method: "POST",
            cache: "no-cache",
            body: formData,
            headers:{
                "XSRF-TOKEN": this.props.csrftoken
            }
        }
        fetch(process.env.REACT_APP_ROOT_URL_PATH + '/api/screen/slides/save', options)
            .then(res => res.json())
            .then(data => {
                if (data?.ok){
                    // if the slide is the blank empty slide (for adding new slides)
                    if (!this.state._id) {
                        // then add slide to view
                        this.props.addSlide(data.newSlide)
                        // then clear input so that if you select the same
                        // image again the onImageChange gets called.
                        document.getElementById('imageUploader').value = null
                        // finally remove the image but keep the
                        // rest in order to ease adding images to events.
                        this.setState(prevState => {
                            return {imageFile: null}
                        })
                    }
                    // Tell user everything went smoothly
                    this.props.addAlert({type:"success", message: "Saved slide!"})
                } else {
                    // show error message
                    this.props.addAlert({type:"error", message: data.message});
                }
            })
            .catch();
    }

    handleRemove () {
        const options = {
        method: "POST",
        body: {},
        headers: {
            "XSRF-TOKEN": this.props.csrftoken
        }
        }
        fetch(process.env.REACT_APP_ROOT_URL_PATH + '/api/screen/slides/'+this.state._id+'/remove', options)
        .then(res => res.json())
        .then(json => {
            if (json.ok && json.n === 1) { // A (this) slide was removed on the backend
            this.props.addAlert({type:"success", message: "Removed slide!"})
            this.props.removeSlide(this.state._id) // call parent remove.
            }
            else {
            // show error message
            this.props.addAlert({type:"error", message: json.message})
            }
        })
    }

    render() {
        return (
        <form encType="multipart/form-data" onSubmit={this.handleSubmit}>
            <div className="slide">
            <div className="image-container" 
                style={{backgroundImage:"url(https://static.tutsplus.com/assets/elements/landingpage_tuts_icon_plus-8ca21c2c723d17a1958914d2200c8ade.svg)"}}
                onClick={() => this.refs.imageUploader.click() /*click the hidden file input tag*/}>
                <input type="file" ref="imageUploader" id="imageUploader" onChange={this.handleImageChange} style={{display:"none"}} 
                    name="imageFile" accept="image/jpeg,image/gif,image/png"/>
                {/* if there is an image to display, then display, otherwise don't */
                this.state.imageFile || this.state.url ? <img src={this.state.imageFile || this.state.url}/> : null}
            </div>
            <div className="slide-settings">
                <textarea value={this.state.caption || ''} onChange={this.handleChange}
                    placeholder="Caption here..." name="caption">
                </textarea>
                <DateInput label="Start" value={this.state.start || ''} max={this.state.end}   onChange={this.handleChange} id={"start"+this.state._id} name="start" />
                <DateInput label="End"   value={this.state.end || ''}   min={this.state.start} onChange={this.handleChange} id={"end"  +this.state._id} name="end"   />
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
                    <input type="text" placeholder="Tags" value={this.state.tags} name="tags" onChange={this.handleChange}/>
                </div>
            </div>
            <div className="slide-footer">
                <input type="submit" value="Save" className="btn"/>
                {this.state._id
                ? <button className="btn red" type="button" onClick={this.handleRemove}>Remove</button>
                : null}
            </div>
            </div>
        </form>
        );
    }
    }

    export default Slide;