const functions = require('firebase-functions');
const admin = require('firebase-admin');

try { admin.initializeApp() } catch (e) {undefined}

const db = admin.firestore();

exports.sendCommentNotification = functions.firestore.document('feed_comments/{commentID}').onCreate((data, context) => {
    const commentData = data.data();
    const feedID = commentData["feedId"];

    db.collection('memberLookups').where("feeds","array-contains",feedID).get().then(function(querySnapshot) {
        querySnapshot.forEach(function(doc) {
            // For notification check
            // && commentData['author']['id'] == doc.id
            if (doc.data()['notificationEnabled']) {
                sendTokenPayload(
                    "feed",
                    feedID,
                    `${commentData["author"]["name"]} commented on your feed.`,
                    `${commentData["message"]}`,
                    doc.data()["fcmToken"]
                )
            }
        });

        return console.log("Done querying.");
    }).catch(err => {
        console.error('Error getting document', err);
        return err;
    });
});
    
exports.sendAnswerNotification = functions.firestore.document('answers/{answerID}').onCreate((data, context) => {
    const answerData = data.data();
    const questionID = answerData["questionID"]

    db.collection('memberLookups').where("questions","array-contains",questionID).get().then(function(querySnapshot) {
        querySnapshot.forEach(function(doc) {
            if (doc.data()['notificationEnabled']) {
                sendTokenPayload(
                    "question",
                    questionID,
                    `${answerData["author"]["name"]} answered your question.`,
                    `${answerData["body"]}`,
                    doc.data()["author"]["fcmToken"]
                )
            }
        });

        return console.log("Done querying.");
    }).catch(err => {
        console.error('Error getting document', err);
        return err;
    });
});

exports.sendEventUpdateNotification = functions.firestore.document('events/{eventID}').onUpdate((change, context) => {
    const newEvent = change.after.data();
    const oldEvent = change.before.data();

    var messageTitle = null, messageBody = null;
    if(newEvent["endTime"] != oldEvent["endTime"] || newEvent["startTime"] != oldEvent["startTime"]){ // Event Time Changed
        messageTitle = "Events time changed"
        messageBody = `${newEvent["title"]}'s time changed.`
    }else if(newEvent["fee"] != oldEvent["fee"]){ // Event Fee Changed
        messageTitle = "Events fee changed"
        messageBody = `${newEvent["title"]}'s fee changed.`
    }else if(newEvent["location"]["latitude"] != oldEvent["location"]["latitude"] || newEvent["location"]["longitude"] != oldEvent["location"]["longitude"]){ // Event Location Changed
        messageTitle = "Events location changed"
        messageBody = `${newEvent["title"]}'s location changed. Please check the app to see new location.`
    }

    if (messageTitle != null && messageBody != null) {
        const attendeeList = JSON.parse(newEvent["attendeeIDList"])
        for (const attendeeID in attendeeList) {
            return console.log(attendeeID)
        }
    }
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
        return console.error("Error sending message:",error)
    });
}