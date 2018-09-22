import React, {Component} from 'react';
import '../css/Alert.css';

class Alert extends Component {
    render() {
        return (
            <div className={"alert " + this.props.type}>{this.props.message}</div>
        )
    }
};

export default Alert;