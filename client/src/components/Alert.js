import React, {Component} from 'react';
import '../css/Alert.css';

class Alert extends Component {

    componentDidMount(){
        if (this.props.type === "success"){
            // Decided error messages should stay up to make sure
            // the user has seen them. This is up for debate!
            // Remove after 5 seconds if success-alert
            const timeout = 5*1000
            setTimeout(() => {
                this.remove()
            }, timeout);
        }
    }
    
    remove = () => this.props.handleRemove(this.props._id)
    
    render() {
        return (
            <div className={"alert " + this.props.type} onClick={this.remove}>{this.props.message}</div>
        )
    }
};

export default Alert;