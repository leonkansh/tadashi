// GET: /{orgid} : return the organization description, teams, ...
    // add information as needed

// PUT: /{orgid} : edit the orgnization info
    // user authentication is required

// DELETE: /{orgid} : delete the entire orgnization
    // user authentication is required

// POST: /create : create an organization
    // user authentication is required

// POST: /{orgid}/join : add a user to this org
    // user authentication is required

// POST: /{orgid}/leave : remove a user from this org
    // user themself only

// GET: /{orgid}/members : return a list of members in this org

// POST: /{orgid}/kick?user=[id] : 
    // admin only

// POST: /{orgid}/teams/random : put the entire org into random teams
