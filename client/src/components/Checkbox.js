import React from 'react';
import '../css/Checkbox.css';

// functional component
const Checkbox = function (props) {
    /* params: props.label, props.name, props.checked, props.onChange
      props.label is the text label displayed.
      props.checked is the boolean indicating whether it's checked or not
      props.name can be specified if using a generic onChange function.
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