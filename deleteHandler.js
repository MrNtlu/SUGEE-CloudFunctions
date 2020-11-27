const functions = require('firebase-functions');
const admin = require('firebase-admin');
const { firebaseConfig } = require('firebase-functions');

try { admin.initializeApp() } catch (e) {undefined}

const db = admin.firestore();

exports.onQuestionDeleteAnswers = functions.firestore.document('questions/{questionID}').onDelete((snap, context) => {
    //const deletedValue = snap.data();

    handleQueryDelete('answers','questionID',context.params.questionID, 'answers')

    // db.collection('answers').where('questionID', '==',context.params.questionID)
    // .get()
    // .then(function(querySnapshot) {
    //     querySnapshot.forEach(function(doc) {
    //        db.collection('answers').doc(doc.data()["id"]).delete()
    //        .then(function() {
    //            console.log("Document successfully deleted!");
    //         }).catch(function(error) {
    //             console.error("Error removing document: ", error);
    //         });

    //        return null;
    //     });

    //     return console.log("Done querying.");
    // }).catch(function(error) {
    //     console.log("Error getting documents for ",error);
    //     return error;
    // });
});

exports.onFeedDeleteComments = functions.firestore.document('feeds/{feedID}').onDelete((snap, context) => {
    handleQueryDelete('feed_comments','feedId',context.params.feedID, 'comments')
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