// GET: /{usrid} : returns a user info with email and display name

// GET: /{usrid}/profile : returns a user profile

// PUT: /{usrid}/profile : edit a user profile
    // user authentication is required

// GET: /{usrid}/connections : return a list of users whom this user works with

// POST: /{usrid}/connections/add?user=[id] : add a user to this user by id
    // user authentication is required

// DELETE: /{usrid}/connections/remove?user=[id] : delete a connected user to this user by id
    // user authentication is required

// GET: /signin : verify SSO, prompt display name input if new user

// GET: /signout : call auth provider to sign out this user
