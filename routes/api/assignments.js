/*
    Router handler for requests to:
        /api/assignments
*/
import express from "express";
import { verifyTeamMember } from '../authenticate.js';
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
        const org = await req.db.findById(req.params.orgid);
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
        const assignment = null;
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
        TODO: Complete Documentation
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
        if(org.admin._id == req.params.userid) {
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
    Used to retrieve alignments for horizontal scrolling
    Return:
    {
        TODO: Complete Documentation
    }
*/
router.get('/:orgid/:teamid', async (req, res) => {
    let auth = await verifyTeamMember(
        req.session.userid,
        req.params.orgid,
        req.params.teamid,
        req.db
    );

});

/* GET: /{orgid}/{assignmentid}/{teamid}
    Retrieve todo list for specific assignment and organizations team
    Return:
    {
        TODO: Complete Documentation
    }
*/
router.get('/:orgid/:assignmentid/:teamid', async (req, res) => {

});

/* POST: /{orgid}/{assignmentid}/{teamid}
    Add item to todo list for assignment on a organizations team
    Payload Body:
    {
        TODO: Complete Documentation 
    }
*/
router.post('/:orgid/:assignmentid/:teamid', async (req, res) => {

});

/* PUT: /{orgid}/{assignmentid}/{teamid}
    Edit task underneath assignment. If assignedTo is non-null, assigns task to userid
    Payload Body:
    {
        TODO: Complete Documentation,
        assignedTo: userid or null
    }
*/
router.put('/:orgid/:assignmentid/:teamid', async (req, res) => {

});

/* DELETE: /{orgid}/{assignmentid}/{teamid}
    Delete specified task/todo by name underneath assignment
    Payload Body:
    {
        name: 'task/todo name'
    }
*/
router.delete('/:orgid/:assignmentid/:teamid', async (req, res) => {

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