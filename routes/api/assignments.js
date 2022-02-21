/* ORGANIZATION LEVEL */
// GET: /{orgid} : returns assignments pertaining to orgid

// POST: /{orgid} : create new assignment related to organization

// GET: /{orgid}/{assignmentid} : retrieve specific assignment

// PUT: /{orgid}/{assignmentid} : edit assignment in organization

// DELETE: /{orgid}/{assignmentid} : remove assignment from organization

/* TEAM LEVEL */
// GET: /{orgid}/{teamid} : retrive all assignments for a team in an organization
/* Used to retrieve assignemnts for horizontal scrolling */

// GET: /{orgid}/{assignmentid}/{teamid} : retrieve todo list for specific assignment and team

// POST: /{orgid}/{assignmentid}/{teamid} : add item to todo list for assignment on a team

// should also handle assignment of user -> task
// PUT: /{orgid}/{assignmentid}/{teamid} : make edit to task underneath assignment

// DELETE: /{orgid}/{assignmentid}/{teamid} : delete specifed task underneath assignment

/*------ EXTRA COMMANDS ------*/
// GET: /{userid}/repo : retrieve archive of assginments created by user

// POST: /{userid}/repo : add new assignment to user archive