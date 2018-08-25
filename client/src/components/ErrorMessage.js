import React, {Component} from 'react';
import '../css/ErrorMessage.css';

class ErrorMessage extends Component {
    render() {
        return (
            <div class="error-message">Error: {this.props.message}</div>
        )
    }
};

export default ErrorMessage;