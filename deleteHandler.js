const functions = require('firebase-functions');
const admin = require('firebase-admin');
const { firebaseConfig } = require('firebase-functions');
const notifications = require('./notifications')

try { admin.initializeApp() } catch (e) {undefined}

const db = admin.firestore();

exports.onQuestionDeleteAnswers = functions.firestore.document('questions/{questionID}').onDelete((snap, context) => {
    handleQueryDelete('answers','questionID',context.params.questionID, 'answers')
});

exports.onFeedDeleteComments = functions.firestore.document('feeds/{feedID}').onDelete((snap, context) => {
    handleQueryDelete('feed_comments','feedId',context.params.feedID, 'comments')
});

exports.onEventDeleteAttendees = functions.firestore.document('events/{eventID}').onDelete((snap, context) => {
    const deletedEvent = snap.data();
    const attendeeIDList = deletedEvent["attendeeIDList"]

    attendeeIDList.forEach(function(item){
       db.collection("memberLookups").doc(item)
       .update("events", admin.firestore.FieldValue.arrayRemove(context.params.eventID))
       .catch(function(error) {
           return console.error("Error removing array item: ", error);
        });

        db.collection("memberLookups").doc(item).get().then(function(doc) {
            if (doc.data()['notificationEnabled']) {
                sendTokenPayload(
                    '',
                    '',
                    `${deletedEvent["title"]} deleted`,
                    "Event that you joined deleted by host.",
                    doc.data()["fcmToken"]
                )
            }
            return console.log(`Done querying. for ${item}`);
        }).catch(err => {
            console.error(`Error getting document for ${item}`, err);
            return err;
        });

        return console.log(`Request started for ${item}`)
    });
    
    return console.log("Function called.")
});

function handleQueryDelete(collectionName, field, fieldID, lookupField){
    db.collection(collectionName).where(field, '==',fieldID)
    .get()
    .then(function(querySnapshot) {
        querySnapshot.forEach(function(doc) {

            db.collection("memberLookups").doc(doc.data()["author"]["id"])
            .update(`${lookupField}`, admin.firestore.FieldValue.arrayRemove(doc.data()['id']))
            .catch(function(error) {
                return console.error("Error removing array item: ", error);
            });

            db.collection(collectionName).doc(doc.data()["id"]).delete()
            .catch(function(error) {
                return console.error("Error removing document: ", error);
            });

            return console.log('Received data.');
        });

        return console.log("Done querying.");
    }).catch(function(error) {
        console.log("Error getting documents for ",error);
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
        return console.error("Error sending message:",error)
    });
}