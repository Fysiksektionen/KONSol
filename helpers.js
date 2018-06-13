const settings = require('./settings.json')

exports.checkAdminRights = function(req, res, next){
    /* 
    Returns:
            A function which checks if a user session has admin rights.
            Admin rights are decided by settings.json where the allowed 
            admin users are specified, or by dev_mode settings.
    */
    const dev_mode_and_admin = (settings.dev_mode && settings.dev_mode_is_admin)
    const user_is_admin = settings.admin_users.includes(req.session[settings.session_name])
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