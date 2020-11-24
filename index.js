const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();

const db = admin.firestore();

exports.sendCommentNotification = functions.firestore.document('feed_comments/{commentID}').onCreate((data, context) => {
    //const commentID = context.params.commentID;
    const commentData = data.data();
    const feedID = commentData["feedId"];
    //var topic = `feed_${feedID}`

    db.collection('feeds').doc(feedID).get().then(doc => {
        if (doc.exists) {
            sendTokenPayload(
                "feed",
                feedID,
                `${commentData["author"]["name"]} commented`,
                `${commentData["message"]}`,
                doc.data()["author"]["fcmToken"]
            )

            return console.log("Successfully queried.");
        }else{
            return console.log("Doc doesn't exist.")
        }
          
      }).catch(err => {
          console.log('Error getting document', err);
          return err;
      });
});

exports.sendAnswerNotification = functions.firestore.document('answers/{answerID}').onCreate((data, context) => {
    const answerData = data.data();
    const questionID = answerData["questionID"]
    //var topic = `question_${questionID}`

    db.collection('questions').doc(questionID).get().then(doc => {
        if (doc.exists) {
            sendTokenPayload(
                "question",
                questionID,
                `${answerData["author"]["name"]} answered`,
                `${answerData["body"]}`,
                doc.data()["author"]["fcmToken"]
            )

            return console.log("Successfully queried.");
        }else{
            return console.log("Doc doesn't exist.")
        }
          
      }).catch(err => {
          console.log('Error getting document', err);
          return err;
      });
});

exports.updateMemberInnerModel = functions.firestore.document('members/{memberID}').onUpdate((change, context) => {
    const newMemberModel = change.after.data();
    const previousMemberModel = change.before.data();

    updateMemberInnerModels(newMemberModel);
});

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
            const memberInnerModel = new MemberInnerModel(
                doc.data()[path]["id"],
                doc.data()[path]["name"],
                doc.data()[path]["image"],
                doc.data()[path]["roles"],
                doc.data()[path]["fcmToken"]
            )

            /*
            From this point update the memberinnermodel
            db.collection(collectionName).document(doc.data()["id"]).update(path, memberInnerModel)
            */
           return console.log(memberInnerModel.toString());
        });

        return console.log("Done querying.");
    }).catch(function(error) {
        console.log("Error getting documents: ", error);
        return error;
    });
}

function sendTokenPayload(data, dataID, title, body, token){
    const payload = {
        data: {
            "data": data,
            "dataID": dataID
        },
        notification: {
            title: title,
            body: body,
        },
        android: {
            notification: {
                sound: "default",
                notification_count: 1,
            }
        },
        token: token
    };

    admin.messaging().send(payload).then((response) => {
        return console.log("Successfully sent message:",response)
    })
    .catch((error) => {
        return console.log("Error sending message:",error)
    });
}

class MemberInnerModel {
    constructor (id, name, image, roles,fcmToken) {
        this.id = id;
        this.name = name;
        this.image = image;
        this.roles = roles;
        this.fcmToken = fcmToken;
    }
    toString() {
        return 'ID is: ' + this.id + ' name: ' + this.name + ' token: ' + this.fcmToken
    }
}

// Firestore data converter
var memberInnerModelConverter = {
    toFirestore: function(memberInnerModel) {
        return {
            id: memberInnerModel.id,
            name: memberInnerModel.name,
            image: memberInnerModel.image,
            roles: memberInnerModel.roles,
            fcmToken: memberInnerModel.fcmToken
            }
    },
    fromFirestore: function(snapshot, options){
        const data = snapshot.data(options);
        return new MemberInnerModel(data.id, data.name, data.image, data.roles, data.fcmToken)
    }
}