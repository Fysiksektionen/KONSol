const settings = require('./settings.json')

exports.checkAdminRights = cas => function(req, res, next){
    /* 
    Param cas:
            An instance of CAS authentication, used to access the 
            session variable name in which the session username is stored.
    
    Returns:
            A function which checks if a user session has admin rights.
            Admin rights are decided by settings.json where the allowed 
            admin users are specified, or by dev_mode settings.
    */
    const dev_mode_and_admin = (settings.dev_mode && settings.dev_mode_is_admin)
    const user_is_admin = settings.admin_users.includes(req.session[cas.session_name])
    if (dev_mode_and_admin || user_is_admin){
        // User is permitted.
        next()
    }
    else {
        res.status(403)
        res.json({
            status: 403,
            ok: false,
            'message':'Not permitted, only admins can access this resource. Contact webmaster@kth.se if you believe this was a mistake.'
        })
    }
}