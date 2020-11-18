const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();

exports.sendCommentNotification = functions.firestore.document('feed_comments/{commentID}').onCreate((data, context) => {
    //const commentID = context.params.commentID;
    const commentData = data.data();
    const feedID = commentData["feedId"]

    var topic = `feed_${feedID}`
    const payload = {
        data: {
            "data": "feed",
            "dataID": feedID
        },
        notification: {
            title: `${commentData["author"]["name"]} commented`,
            body: `${commentData["message"]}`,
        },
        android: {
            notification: {
                sound: "default",
                notification_count: 1,
            }
        },
        topic: topic
    };

    admin.messaging().send(payload).then((response) => {
        return console.log("Successfully sent message:",response)
    })
    .catch((error) => {
        console.log("Error sending message:",error)
    });
});
