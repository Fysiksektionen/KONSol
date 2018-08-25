import React from 'react';
import '../css/Checkbox.css';

// functional component
const Checkbox = function (props) {
    /*
    */
    return (
      <div>
        <label className="checkbox-container">{props.label}
        <input type="checkbox" name={props.name} checked={props.checked ? "checked" : ""} onChange={props.onChange}/>
        <span className="checkmark"></span>
        </label>
      </div>
    )
};

export default Checkbox;