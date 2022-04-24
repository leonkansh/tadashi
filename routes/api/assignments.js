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
            description: 'assignment description,
            due: Date assignment due
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
                description: assign.description,
                due: assign.due
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
        description: 'assignment description',
        due: Date assignment due
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
                            due: req.body.due,
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
        description: 'assignment description',
        due: Date assignment due
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
                description: assignment.description,
                due: assignment.due
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
    Payload Body, exclude fields with no changes:
    {
        name: 'assignment name',
        description: 'assignment description',
        due: Date assignment due
    }
    Admin authentication required.
*/
router.put('/:orgid/:assignmentid', async (req, res) => {
    try {
        const org = await req.db.Org.findById(req.params.orgid);
        if(org.admin._id == req.session.userid) {
            let changes = {};
            if(req.body.name) {
                changes['assignments.$[el].name'] = req.body.name;
            }
            if(req.body.description) {
                changes['assignments.$[el].description'] = req.body.description;
            }
            if(req.body.due) {
                changes['assignments.$[el].due'] = req.body.due;
            }
            await req.db.Assignment.findOneAndUpdate(
                {
                    orgid: req.params.orgid
                },
                {
                    $set: changes
                },
                {
                    arrayFilters:
                    [
                        {
                            'el._id': req.params.assignmentid
                        }
                    ]
                }
            );
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

/* GET: /{orgid}/team/{teamid}
    Retrieve all assignments for a team in an organization
    Instances assignments on first assignment
    Used to retrieve alignments for horizontal scrolling
    Return:
    [
        {
            _id: 'assignment id',
            name: 'assignment name',
            description: 'assignment description',
            due: Date assignment due,
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
                            _id: assignment._id,
                            name: assignment.name,
                            description: assignment.description,
                            due: assignment.due,
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
                        _id: assignment._id,
                        name: assignment.name,
                        description: assignment.description,
                        due: assignment.due,
                        leader: {
                            _id: memberList[counter % memberList.length]._id,
                            name: memberList[counter % memberList.length].name
                        },
                        todos: []
                    });
                    counter++;
                }
            };
            assignments.sort((a, b) => a.due - b.due);
            assignments.forEach(asg => {
                asg.todos.sort((a, b) => a.date - b.date);
            });
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

/* GET: /{orgid}/{assignmentid}/team/{teamid}
    Retrieve todo list and extra data for specific assignment and organizations team
    Return:
    {
        _id: 'assignment id',
        name: 'assignment name,
        description: 'assignment description',
        due: Date assignment due
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
*/
router.get('/:orgid/:assignmentid/team/:teamid', async (req, res) => {
    let auth = verifyTeamMember(
        req.session.userid,
        req.params.orgid,
        req.params.teamid,
        req.db
    );
    if(auth) {
        try {
            const assignmentDoc = await req.db.Assignment.findOne({ orgid: req.params.orgid });
            let assignment = null;
            for(const assign of assignmentDoc.assignments) {
                if(assign._id == req.params.assignmentid) {
                    assignment = assign;
                }
            }
            if(assignment) {
                let datum = null;
                for(const data of assignment.data) {
                    if(data.teamid == req.params.teamid) {
                        datum = data
                    }
                }
                if(datum) {
                    datum.todos.sort((a, b) => a.date - b.date);
                    res.json({
                        _id: assignment._id,
                        name: assignment.name,
                        description: assignment.description,
                        due: assignment.due,
                        leader:
                        {
                            _id: datum.leader._id,
                            name: datum.leader.name
                        },
                        todos: datum.todos
                    });
                } else {
                    res.json({
                        status: 'error',
                        error: '404'
                    });
                }
            } else {
                res.json({
                    status: 'error',
                    error: '404'
                });
            }
        } catch (error) {
            console.log(error);
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

/* GET: /{orgid}/team/{teamid}/head
    Retrieve first three todo list items for current user for next assignment
    Return:
    {
        hwaName: name of assignment,
        hwaDescription: description of assignment,
        hwaDue: date assignment due,
        data: [
            {
                userid: {
                    _id: assigned user id,
                    name: assigned user name
                },
                content: todo description,
                date: date todo due,
                completed: Boolean if tod complete,
                _id: todo id
            }
        ]
    }
*/
router.get('/:orgid/team/:teamid/head', async (req, res) => {
    let auth = verifyTeamMember(
        req.session.userid,
        req.params.orgid,
        req.params.teamid,
        req.db
    );
    if(auth) {
        try {
            let assignmentsDoc = await req.db.Assignment.findOne({orgid: req.params.orgid});
            assignmentsDoc.assignments.sort((a, b) => a.due - b.due);
            let index = -1;
            for(let i = 0; i < assignmentsDoc.assignments.length; i++) {
                if(assignmentsDoc.assignments[i].due - Date.now() > 0 && index == -1) {
                    index = i;
                }
            }
            let assignment = assignmentsDoc.assignments[index];
            let teamdoc = null;
            assignment.data.forEach(team => {
                if(team.teamid == req.params.teamid) {
                    teamdoc = team;
                }
            });
            teamdoc.todos.sort((a, b) => a.date - b.date);
            let todoPayload = []
            teamdoc.todos.forEach(todo => {
                if(todo.userid._id == req.session.userid && todoPayload.length < 3) {
                    todoPayload.push(todo);
                }
            });
            res.json({
                hwaName: assignment.name,
                hwaDescription: assignment.description,
                hwaDue: assignment.due,
                data: todoPayload
            });
        } catch (error) {
            res.json({
                status: 'error',
                error: 'oof'
            });
        }
    } else {
        res.json({
            status: 'error',
            error: 'not authenticated'
        });
    }
});

/* POST: /{orgid}/{assignmentid}/team/{teamid}
    Add item to todo list for assignment on a organizations team
    Payload Body:
    {
        content: 'content of todo',
        date: Date, date todo is due,
        assignedId: 'user id of assigned user',
        assignedName: 'user name of assigned user'
    }
*/
router.post('/:orgid/:assignmentid/team/:teamid', async (req, res) => {
    let auth = verifyTeamMember(
        req.session.userid,
        req.params.orgid,
        req.params.teamid,
        req.db
    );
    if (auth) {
        try {
            let assignedId = null;
            let assignedName = null;
            if (req.body.assignedId) { assignedId = req.body.assignedId }
            if (req.body.assignedName) { assignedName = req.body.assignedName }
            await req.db.Assignment.findOneAndUpdate(
                {
                    orgid: req.params.orgid
                },
                {
                    $push: {
                        'assignments.$[ela].data.$[eld].todos': {
                            content: req.body.content,
                            userid: {
                                _id: assignedId,
                                name: assignedName
                            },
                            date: req.body.date,
                            completed: false
                        }
                    }
                },
                {
                    arrayFilters:
                    [
                        {
                            'ela._id': req.params.assignmentid
                        },
                        {
                            'eld.teamid': req.params.teamid
                        }
                    ]
                }
            );
            res.json({ status: 'success' });
        } catch(error) {
            console.log(error);
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

/* PUT: /{orgid}/{assignmentid}/team/{teamid}
    Edit task underneath assignment. If assignedTo is non-null, assigns task to userid
    Payload Body, exclude unchanged fields:
    {
        todoId: 'todo id'; required,
        content: 'changed todo content',
        date: 'changed todo date',
        completed: Boolean,
        assignedId: 'changed assigned userid'; if supplied must supply assignedName,
        assignedName: 'changed assigned username'; if supplied must supply assignedId,
    }
*/
router.put('/:orgid/:assignmentid/team/:teamid', async (req, res) => {
    let auth = verifyTeamMember(
        req.session.userid,
        req.params.orgid,
        req.params.teamid,
        req.db
    );
    if(auth) {
        try {
            let changes = {}
            if(req.body.content) {
                changes['assignments.$[ela].data.$[eld].todos.$[elt].content'] = req.body.content;
            }
            if(req.body.date) {
                changes['assignments.$[ela].data.$[eld].todos.$[elt].date'] = req.body.date;
            }
            if(req.body.completed) {
                changes['assignments.$[ela].data.$[eld].todos.$[elt].completed'] = req.body.completed;
            }
            if(req.body.assignedId) {
                changes['assignments.$[ela].data.$[eld].todos.$[elt].userid'] = {
                    _id: req.body.assignedId,
                    name: req.body.assignedName
                }
            }
            await req.db.Assignment.findOneAndUpdate(
                {
                    orgid: req.params.orgid
                },
                {
                    $set: changes
                },
                {
                    arrayFilters:
                    [
                        {
                            'ela._id': req.params.assignmentid
                        },
                        {
                            'eld.teamid': req.params.teamid
                        },
                        {
                            'elt._id': req.body.todoId
                        }
                    ]
                }
            );
            res.json({ status: 'success' });
        } catch (error) {
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

/* DELETE: /{orgid}/{assignmentid}/team/{teamid}
    Delete specified task/todo by name underneath assignment
    Payload Body:
    {
        todoId: 'todo id'
    }
*/
router.delete('/:orgid/:assignmentid/team/:teamid', async (req, res) => {
    let auth = verifyTeamMember(
        req.session.userid,
        req.params.orgid,
        req.params.teamid,
        req.db
    );
    if (auth) {
        try {
            await req.db.Assignment.findOneAndUpdate(
                {
                    orgid: req.params.orgid
                },
                {
                    $pull:
                    {
                        'assignments.$[ela].data.$[eld].todos': { _id: req.body.todoId }
                    }
                },
                {
                    arrayFilters:
                    [
                        {
                            'ela._id': req.params.assignmentid
                        },
                        {
                            'eld.teamid': req.params.teamid
                        }
                    ]
                }
            );
            res.send({ status: 'success' });
        } catch(error) {
            console.log(error);
        }
    } else {
        res.json({
            status: 'error',
            error: 'not authenticated'
        });
    }
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