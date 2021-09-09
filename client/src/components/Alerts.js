import React, { useEffect, useState, createContext, useCallback } from "react";
import Alert from './Alert'
import { TransitionGroup, CSSTransition } from 'react-transition-group'


const randomId = () => Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
export const AlertRegisterContext = createContext({
    addAlert: undefined,
    removeAlert: undefined
});

const Alerts = ({children}) => {
    const [alerts, setAlerts] = useState([])

    const addAlert = useCallback((alert) => {
        setAlerts(alerts.concat({...alert, _id: randomId()}))
    }, [alerts]);

    const removeAlert = useCallback((id) => {
        setAlerts(alerts.filter(alert => alert._id !== id))
    }, [alerts]);

    return (
        <AlertRegisterContext.Provider value={{addAlert: addAlert, removeAlert: removeAlert}}>
            {children}
            <div className="alerts">
                <TransitionGroup>
                    {alerts.map(alert => 
                        <CSSTransition classNames="alertTransition" key={alert._id} timeout={{ enter: 500, exit: 300 }}>
                            <Alert {...alert} handleRemove={removeAlert}/>
                        </CSSTransition>
                    )}
                </TransitionGroup>
            </div>
        </AlertRegisterContext.Provider>
    )
};
export default Alerts;