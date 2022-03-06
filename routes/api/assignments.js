/*
    Router handler for requests to:
        /api/assignments
*/
import express from "express";
import { verifyTeamMember, retrieveTeamMembers } from '../authenticate.js';
let router = express.Router()

/* ORGANIZATION LEVEL
    Utilized to create assignment repos for an organization
    A "copy" of each assignment is given to each team within the organization
*/

/* GET: /{orgid}
    Returns all assignments in an to organization
    Return:
    [
        {
            name: 'assignment name',
            description: 'assignment description
        }
    ]
*/
router.get('/:orgid', async (req, res) => {
    try {
        const assignmentsDoc = await req.db.Assignment.findOne({ orgid: req.params.orgid });
        let assignments = [];
        assignmentsDoc.assignments.forEach(assign => {
            assignments.push({
                _id: assign._id,
                name: assign.name,
                description: assign.description
            });
        });
        res.send(assignments);
    } catch(error) {
        console.log(error);
        res.json({
            status: 'error',
            error: 'oops'
        });
    }
});

/* POST: /{orgid}
    Create new assignment related to organization
    Payload Body:
    {
        name: 'assignment name',
        description: 'assignment description'
    }
    Admin authentication required.
*/
router.post('/:orgid', async (req, res) => {
    try {
        const org = await req.db.Org.findById(req.params.orgid);
        if(req.session.userid == org.admin._id) {
            await req.db.Assignment.findOneAndUpdate(
                {
                    orgid: req.params.orgid
                },
                {
                    $setOnInsert: {
                        orgid: req.params.orgid
                    },
                    $push: {
                        assignments: {
                            name: req.body.name,
                            description: req.body.description,
                            data: []
                        }
                    }
                },
                {
                    upsert: true
                }
            );
            res.json({ status: 'success' });
        } else {
            res.json({
                status: 'error',
                error: 'not authorized'
            });
        }
    } catch(error) {
        console.log(error);
        res.json({
            status: 'error',
            error: 'oops'
        });
    }
});

/* GET: /{orgid}/{assignmentid}
    Retrieve specific assignment for an organization
    Return, if found:
    {
        _id: 'assignment id',
        name: 'assignment name',
        description: 'assignment description'
    }
*/
router.get('/:orgid/:assignmentid', async (req, res) => {
    try {
        const assignmentDoc = await req.db.Assignment.findOne({ orgid: req.params.orgid });
        let assignment = null;
        assignmentDoc.assignments.forEach(assign => {
            if(assign._id == req.params.assignmentid) {
                assignment = assign
            }
        });
        if(assignment) {
            res.json({
                _id: assignment._id,
                name: assignment.name,
                description: assignment.description
            });
        } else {
            res.json({
                status: 'error',
                error: '404'
            });
        }
    } catch(error) {
        res.json({
            status: 'error',
            error: 'oops'
        });
    }
});

/* PUT: /{orgid}/{assignmentid}
    Edit specific assignment in organization
    Payload Body:
    {
        name: 'assignment name' (resend current name if no changes),
        description: 'assignment description' (resend current description if no changes)
    }
    Admin authentication required.
*/
router.put('/:orgid/:assignmentid', async (req, res) => {
    try {
        const org = await req.db.Org.findById(req.params.orgid);
        if(org.admin._id == req.session.userid) {
            // Refactor target, can do in one call
            const assignmentDoc = await req.db.Assignment.findOne({ orgid: req.params.orgid });
            for(let i = 0; i < assignmentDoc.assignments.length; i++) {
                if (assignmentDoc.assignments[i]._id == req.params.assignmentid) {
                    assignmentDoc.assignments[i].name = req.body.name;
                    assignmentDoc.assignments[i].description = req.body.description;
                }
            }
            assignmentDoc.save();
            res.json({ status: 'success' });
        } else {
            res.json({
                status: 'error',
                error: 'not authenticated'
            });
        }
    } catch(error) {
        console.log(error);
        res.json({
            status: 'error',
            error: 'oops'
        });
    }
});

/* DELETE: /{orgid}/{assignmentid}
    Remove specific assignment from organization
    Admin authentication required.
*/
router.delete('/:orgid/:assignmentid', async (req, res) => {
    try {
        const org = await req.db.Org.findById(req.params.orgid);
        if(org.admin._id == req.session.userid) {
            await req.db.Assignment.findOneAndUpdate(
                {
                    orgid: req.params.orgid
                },
                {
                    $pull:
                    {
                        assignments: { _id: req.params.assignmentid }
                    }
                }
            ).exec();
            res.json({
                status: 'success'
            });
        } else {
            res.json({
                status: 'error',
                error: 'not authenticated'
            });
        }
    } catch(error) {
        console.log(error);
        res.json({
            status: 'error',
            error: 'oops'
        });
    }
});

/* TEAM LEVEL
    Used for interactions within a team.
    AUTHENTICATION LEVEL: Team member
*/

/* GET: /{orgid}/{teamid}
    Retrieve all assignments for a team in an organization
    Instances assignments on first assignment
    Used to retrieve alignments for horizontal scrolling
    Return:
    [
        {
            name: 'assignment name',
            description: 'assignment description',
            leader:
            {
                _id: 'leader id',
                name: 'leader name'
            }
            todos:
            [
                {
                    content: 'todo content',
                    userid: 
                    {
                        _id: 'assigned user id',
                        name: 'assigned user name'
                    }
                    date: 'target completion date',
                    completed: Boolean, T - has been finished; F - has not been finished
                }
            ]
        }
    ]
*/
router.get('/:orgid/team/:teamid', async (req, res) => {
    let auth = await verifyTeamMember(
        req.session.userid,
        req.params.orgid,
        req.params.teamid,
        req.db
    );
    if(auth) {
        try {
            const assignmentDoc = await req.db.Assignment.findOne({ orgid: req.params.orgid });
            const memberList = await retrieveTeamMembers(req.params.orgid, req.params.teamid, req.db);
            let assignments = [];
            let counter = memberList.length;
            for (const assignment of assignmentDoc.assignments) {
                let teamFound = false;
                for (const data of assignment.data) {
                    if(data.teamid == req.params.teamid) {
                        teamFound = true;
                        assignments.push({
                            name: assignment.name,
                            description: assignment.description,
                            leader: data.leader,
                            todos: data.todos
                        });
                    }
                };
                if(!teamFound) {
                    await req.db.Assignment.findOneAndUpdate(
                        {
                            orgid: req.params.orgid
                        },
                        {
                            $push: {
                                'assignments.$[el].data': {
                                    teamid: req.params.teamid,
                                    leader: {
                                        _id: memberList[counter % memberList.length]._id,
                                        name: memberList[counter % memberList.length].name
                                    },
                                    todos: []
                                }
                            }
                        },
                        {
                            arrayFilters: [{ 'el._id': assignment._id }]
                        }
                    ).exec();
                    assignments.push({
                        name: assignment.name,
                        description: assignment.description,
                        leader: {
                            _id: memberList[counter % memberList.length]._id,
                            name: memberList[counter % memberList.length].name
                        },
                        todos: []
                    });
                    counter++;
                }
            };
            res.send(assignments);
        } catch(error) {
            res.json({
                status: 'error',
                error: 'oops'
            });
        }
    } else {
        res.json({
            status: 'error',
            error: 'not authenticated'
        });
    }
});

/* GET: /{orgid}/{assignmentid}/{teamid}
    Retrieve todo list for specific assignment and organizations team
    Return:
    {
        TODO: Complete Documentation
    }
*/
router.get('/:orgid/:assignmentid/team/:teamid', async (req, res) => {

});

/* POST: /{orgid}/{assignmentid}/{teamid}
    Add item to todo list for assignment on a organizations team
    Payload Body:
    {
        TODO: Complete Documentation 
    }
*/
router.post('/:orgid/:assignmentid/team/:teamid', async (req, res) => {

});

/* PUT: /{orgid}/{assignmentid}/{teamid}
    Edit task underneath assignment. If assignedTo is non-null, assigns task to userid
    Payload Body:
    {
        TODO: Complete Documentation,
        assignedTo: userid or null
    }
*/
router.put('/:orgid/:assignmentid/team/:teamid', async (req, res) => {

});

/* DELETE: /{orgid}/{assignmentid}/{teamid}
    Delete specified task/todo by name underneath assignment
    Payload Body:
    {
        name: 'task/todo name'
    }
*/
router.delete('/:orgid/:assignmentid/team/:teamid', async (req, res) => {

});

/*------ EXTRA COMMANDS ------*/
/* REPO
    Repository for reusable assignments
    NOTE: To be implemented with professor view
*/
/* GET: /{userid}/repo
    Retrieve archive of assignments created by user
    Return:
    {
        todo: complete
    }
*/
router.get('/:orgid/repo', async (req, res) => {

});

/* POST: /{userid}/repo
    Add new assignment to user archive
    Payload Body:
    {
        todo: complete
    }
*/
router.post('/:orgid/repo', async (req, res) => {

});

export default router;