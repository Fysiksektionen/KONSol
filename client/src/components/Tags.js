import React, {Component} from 'react';
import '../css/Tags.css';

class Tags extends Component {
    constructor(props){
        super(props)
        this.state = {tags: this.props.tags}
        this.handleChange= this.handleChange.bind(this)
        this.saveTags = this.saveTags.bind(this)
    }
    componentDidMount(){
        fetch(process.env.REACT_APP_ROOT_URL_PATH + '/api/screen')
        .then(res => {
          if (res.ok || res.status === 304) {
            return res.json()
          }
          else {
            this.props.addAlert({type:"error", message:"Error: Could not load current tags"}) 
            return {tags: []}
          }
        })
        .then(response => this.setState({tags: response.tags.join(" ")}))
    }
    
    handleChange (event) {
        // The `name=` attribute specified in the input tags should
        // match the corresponding attribute names in `this.state`.
        this.setState({[event.target.name]: event.target.value});
    }

    saveTags () {
        const options = {
            method: "POST",
            body: JSON.stringify({ tags: this.state.tags }),
            headers: {
                'XSRF-TOKEN': this.props.csrftoken,           
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            }
        }
        fetch(process.env.REACT_APP_ROOT_URL_PATH + '/api/screen', options)
            .then(res => res.json())
            .then(res => {
                if (res.ok) this.props.addAlert({type:"success", message:"Saved tags!"})
                else this.props.addAlert({type:"error", message:res.message})
            })
            .catch(err => this.props.addAlert({type:"error", message:"Something went terribly wrong"}))
        }

    render() {
        return (
            <div className="current-tags">
              <input className="tag-input" type="text" value={this.state.tags || ''} placeholder="Taggar (flera separeras med mellanslag)" name="tags" onChange={this.handleChange}/>
              <input type="submit" value="Save" className="btn" onClick={this.saveTags}/>
            </div>
        )}
};

export default Tags;