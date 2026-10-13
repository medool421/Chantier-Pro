class Expo {
  static isExpoPushToken() {
    return false;
  }

  chunkPushNotifications(messages) {
    return [messages];
  }

  async sendPushNotificationsAsync() {}
}

module.exports = { Expo };
