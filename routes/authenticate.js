// True if {userid} is a part of {teamid} underneath {orgid}, false o/w
async function verifyTeamMember(userid, orgid, teamid, db) {
    try{
       const orgDoc = await db.Org.findById(orgid);
       const teamList = orgDoc.teams;
       for(let j = 0; j < teamList.length; j++) {
           if(teamList[j].teamid == teamid) {
               const memList = teamList[j].members;
               for(let i = 0; i < memList.length; i++) {
                   if(memList[i]._id == userid) {
                       return true;
                   }
               }
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
        const orgDoc = await db.Org.findById(orgid);
        const teamList = orgDoc.teams;
        for(let i = 0; i < teamList.length; i++) {
            if(teamList[i].teamid == teamid) {
                return teamList[i].members;
            }
        }
    } catch(error) {
        console.log(error);
        return null;
    }
}

export { verifyTeamMember, retrieveTeamMembers };