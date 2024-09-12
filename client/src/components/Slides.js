import React, { useContext, useEffect, useState } from "react";
import Slide from './Slide'
import Cookies from 'js-cookie'
import { AlertRegisterContext } from "./Alerts";

const blankSlide = {tags: [], url: '', start: '',end: '', visible: false, fullscreen: false, caption:'', imageFile:null}


function Slides() {
    const alertRegisterContextValue = useContext(AlertRegisterContext);

    const [slides, setSlides] = useState([]);

    useEffect(() => {
        fetch(process.env.REACT_APP_ROOT_URL_PATH + '/api/screen/slides')
            .then(res =>  {
                if (res.ok || res.status === 304) {
                    return res.json()
                }
                else {
                    alertRegisterContextValue.addAlert({type:"error", message:"Error: Could not load slides"}) 
                    return []
                }
            })
            .then(newSlides => setSlides(slides.concat(newSlides)))
            .catch();
    }, []);

    const addSlide = (slide) => {
        setSlides([slide].concat(slides));
    };
    
    const removeSlide = (id) => {
        setSlides(slides.filter(slide => slide._id !== id));
    }

    return (
        <div className="slides">
            <Slide initialState={blankSlide} addSlide={addSlide} addAlert={alertRegisterContextValue.addAlert} csrftoken={Cookies.get('XSRF-TOKEN')}/>
            {slides.length !== 0 ? slides
                    .slice(0)
                    .sort((a, b) => (b.created - a.created))
                    .map(slide =>
                        <Slide 
                            key={slide._id}
                            initialState={slide}
                            csrftoken={Cookies.get('XSRF-TOKEN')}
                            removeSlide={removeSlide}
                            addAlert={alertRegisterContextValue.addAlert}
                        />
                    )
                    :<></>
            }
        </div>
    )
};
export default Slides;