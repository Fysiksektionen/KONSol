import React, {Component} from 'react';
import '../css/ErrorMessage.css';

class ErrorMessage extends Component {
    render() {
        return (
            <div className="error-message">Error: {this.props.message}</div>
        )
    }
};

export default ErrorMessage;