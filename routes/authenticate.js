// True if {userid} is a part of {teamid} underneath {orgid}, false o/w
async function verifyTeamMember(userid, orgid, teamid, db) {
    try{
        let team = await db.Org.findById(orgid)
            .select({
                'teams': {
                    $elemMatch: {
                        teamid: teamid
                    }
                }
            })
            .populate('teams.members', '_id displayName email');
        const memberList = team.teams[0].members;
        for(let j = 0; j < memberList.length; j++) {
            if(memberList[j]._id == userid) {
                return true;
            }
        }
       return false;
    } catch(error) {
        console.log(error);
        return false;
    }
}

async function retrieveTeamMembers(orgid, teamid, db) {
    try {
        let team = await db.Org.findById(orgid)
            .select(
                {
                    teams: {
                        $elemMatch: {
                            teamid: teamid
                        }
                    }
                }
            )
            .populate('teams.members', '_id displayName email');
        return team.teams[0].members;
    } catch(error) {
        console.log(error);
        return null;
    }
}

export { verifyTeamMember, retrieveTeamMembers };