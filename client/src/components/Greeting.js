import React, { useEffect, useState, useContext } from "react";
import Tags from './Tags'
import Cookies from 'js-cookie'
import GoogleLogin from 'react-google-login';
import '../css/Greeting.css';
import { AlertRegisterContext } from "./Alerts";


function Greeting() {
    const alertRegisterContextValue = useContext(AlertRegisterContext);

    const [loggedIn, setLoggedIn] = useState(false);
    const [user, setUser] = useState(undefined);

    useEffect(() => {
        fetch(process.env.REACT_APP_ROOT_URL_PATH + '/me')
            .then(response => response.json())
            .then(data => {
                if (data?.user !== undefined) {
                    setUser(data.user);
                    setLoggedIn(true);
                }
            });
    }, []); 

    function responseGoogleSuccess(callbackData) {
        fetch(process.env.REACT_APP_ROOT_URL_PATH + '/login', {
            method: 'POST',
            body: JSON.stringify({token: callbackData.tokenId}),
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json',
                "XSRF-TOKEN": Cookies.get('XSRF-TOKEN')
            }
        })
            .then(res => res.json())
            .then(res => { setLoggedIn(res.loggedIn); setUser(res.user); })
            .catch(console.error);
    }
    function responseGoogleFailure(callbackData) {}

    return (
        <div className="greeting">
            <h1>KONSol</h1>
            <p>Fjärrkontrollera skärmen i Konsulatet!</p>
            <Tags addAlert={alertRegisterContextValue.addAlert} csrftoken={Cookies.get('XSRF-TOKEN')}/>
            <div className="greeting-buttons">
                { loggedIn
                    ? <p>Welcome {user?.name}!</p> 
                    : <GoogleLogin
                        clientId={process.env.REACT_APP_CLIENT_ID}
                        onSuccess={responseGoogleSuccess}
                        onFailure={responseGoogleFailure}
                        cookiePolicy={'single_host_origin'}
                    />
                }
                {/* <a href='http://localhost:8888/instagram' className="btn">Hämta nya Instagram-bilder</a> */}
            </div>
        </div>
    )
};
export default Greeting;