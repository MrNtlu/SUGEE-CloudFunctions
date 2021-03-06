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
            if (doc.data()['notificationEnabled'] && commentData['author']['id'] !== doc.id) {
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
            if (doc.data()['notificationEnabled'] && answerData['author']['id'] !== doc.id) {
                sendTokenPayload(
                    "question",
                    questionID,
                    `${answerData["author"]["name"]} answered your question.`,
                    `${answerData["body"]}`,
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

exports.sendEventUpdateNotification = functions.firestore.document('events/{eventID}').onUpdate((change, context) => {
    const newEvent = change.after.data();
    const oldEvent = change.before.data();
    const newStartDate = newEvent["startTime"].toDate();
    const newEndDate = newEvent["endTime"].toDate();
    const oldStartDate = oldEvent["startTime"].toDate();
    const oldEndDate = oldEvent["endTime"].toDate();

    let isTimeChanged = newEndDate.getTime() !== oldEndDate.getTime() || newStartDate.getTime() !== oldStartDate.getTime();
    let isFeeChanged = newEvent["fee"] !== oldEvent["fee"];
    let isLocationChanged = newEvent["location"]["latitude"] !== oldEvent["location"]["latitude"] || newEvent["location"]["longitude"] !== oldEvent["location"]["longitude"];

    var i = 0;
    if(isTimeChanged){
        i++;
    }
    if(isFeeChanged){
        i++;
    }
    if(isLocationChanged){
        i++;
    }

    var messageTitle = null, messageBody = null;
    if(i > 0){
        if(i === 1){
            if(isTimeChanged){
                messageTitle = "Events time changed"
                messageBody = `${newEvent["title"]}'s time changed.`
            }else if(isFeeChanged){
                messageTitle = "Events fee changed"
                messageBody = `${newEvent["title"]}'s fee changed.`
            }else if(isLocationChanged){
                messageTitle = "Events location changed"
                messageBody = `${newEvent["title"]}'s location changed. Please check the app to see new location.`
            }
        }else if(i > 1){
            messageTitle = "Event information changed"
            messageBody = `${newEvent["title"]}'s information changed.`
        }

        const attendeeIDList = newEvent["attendeeIDList"]
        attendeeIDList.forEach(function(item){

            db.collection("memberLookups").doc(item).get().then(function(doc) {
                if (doc.data()['notificationEnabled']) {
                    sendTokenPayload(
                        "events",
                        newEvent['id'],
                        messageTitle,
                        messageBody,
                        doc.data()["fcmToken"]
                    )
                }
                return console.log("Done querying.");
            }).catch(err => {
                console.error('Error getting document', err);
                return err;
            });
        })
        return console.log("Notification queries started.")
    }

    return null;
});

//https://firebase.google.com/docs/reference/fcm/rest/v1/projects.messages#apnsconfig
function sendTokenPayload(data, dataID, title, body, token){
    const payload = {
        data: {
            "data": data,
            "dataID": dataID
        },
        notification: {
            title: title,
            body: body
        },
        android: {
            notification: {
                sound: "default",
                notification_count: 1,
            }
        },
        apns: {
            payload: {
                aps: {
                    badge: 1,
                    sound: 'default'
                },
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