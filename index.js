const notifications = require('./notifications')
const updateHandlation = require('./updateHandler')

exports.sendCommentNotification = notifications.sendCommentNotification;

exports.sendAnswerNotification = notifications.sendAnswerNotification;

exports.updateMemberInnerModel = updateHandlation.updateMemberInnerModel