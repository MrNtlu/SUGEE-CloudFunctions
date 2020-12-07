const notifications = require('./notifications')
const updateHandlation = require('./updateHandler')
const deleteHandlation = require('./deleteHandler')

exports.sendCommentNotification = notifications.sendCommentNotification;

exports.sendAnswerNotification = notifications.sendAnswerNotification;

exports.sendEventUpdateNotification = notifications.sendEventUpdateNotification;

exports.updateMemberInnerModel = updateHandlation.updateMemberInnerModel

exports.deleteAnswers = deleteHandlation.onQuestionDeleteAnswers

exports.deleteComments = deleteHandlation.onFeedDeleteComments

exports.deleteEvents = deleteHandlation.onEventDeleteAttendees
