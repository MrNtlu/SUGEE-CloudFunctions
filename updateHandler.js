const functions = require('firebase-functions');
const admin = require('firebase-admin');

try { admin.initializeApp() } catch (e) {console.log(e);}

const db = admin.firestore();

exports.updateMemberInnerModel = functions.firestore.document('members/{memberID}').onUpdate((change, context) => {
    const newMemberModel = change.after.data();
    const oldMemberModel = change.before.data();
    
    if(shouldMemberInnerUpdate(newMemberModel, oldMemberModel)){
        updateMemberInnerModels(newMemberModel);
    }
});

function shouldMemberInnerUpdate(newData, oldData){
    if(newData['image'] !== oldData['image'] || 
    newData['name'] !== oldData['name'] || 
    newData['roles'][0] !== oldData['roles'][0] ||
    newData['fcmToken'] !== oldData['fcmToken']){
        return true
    }else{
        return false
    }
}

function updateMemberInnerModels(data){
    updateReference('questions','author',data)
    updateReference('answers','author',data)
    updateReference('events','host',data)
    updateReference('feeds','author',data)
    updateReference('feed_comments','author',data)
}

function updateReference(collectionName, path, data){
    db.collection(collectionName).where(path+".id","==",data["id"])
    .get()
    .then(function(querySnapshot) {
        querySnapshot.forEach(function(doc) {
           db.collection(collectionName).doc(doc.data()["id"]).update({
               [`${path}.id`]: data["id"],
               [`${path}.name`]: data["name"],
               [`${path}.image`]: data["image"],
               [`${path}.roles`]: data["roles"]
            })
            .catch(function(error) {
                console.error("Error updating document: ", error);
            });

           return console.log('Collection Name: '+collectionName+' Data '+JSON.stringify(data)+' Path '+path+' MemberInnerModel '+JSON.stringify({
            [`${path}.id`]: data["id"],
            [`${path}.name`]: data["name"],
            [`${path}.image`]: data["image"],
            [`${path}.roles`]: data["roles"]
         }));
        });

        return console.log("Done querying.");
    }).catch(function(error) {
        console.log("Error getting documents for "+collectionName+' '+path+' '+data['id']+' and error is ==> ', error);
        return error;
    });
}