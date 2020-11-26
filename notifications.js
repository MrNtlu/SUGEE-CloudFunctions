const functions = require('firebase-functions');
const admin = require('firebase-admin');

try { admin.initializeApp() } catch (e) {console.log(e);}

const db = admin.firestore();

exports.sendCommentNotification = functions.firestore.document('feed_comments/{commentID}').onCreate((data, context) => {
    const commentData = data.data();
    const feedID = commentData["feedId"];

    db.collection('memberLookups').where("feeds","array-contains",feedID).get().then(function(querySnapshot) {
        querySnapshot.forEach(function(doc) {
            if (doc.data()['notificationEnabled']) {
                sendTokenPayload(
                    "feed",
                    feedID,
                    `${commentData["author"]["name"]} commented`,
                    `${commentData["message"]}`,
                    doc.data()["fcmToken"]
                )
            }
        });

        return console.log("Done querying.");
    }).catch(err => {
        console.log('Error getting document', err);
        return err;
    });
});
    
exports.sendAnswerNotification = functions.firestore.document('answers/{answerID}').onCreate((data, context) => {
    const answerData = data.data();
    const questionID = answerData["questionID"]

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