const Agent = require("../lib/AgentSDK");

class CloseConversationBot extends Agent {
  constructor(config, convosToClose) {
    super(config);
    this.convosToClose = convosToClose;
    this.init();
  }

  init() {
    this.on("connected", (message) => {
      clearTimeout(this._retryConnection);
      console.log(JSON.stringify(message));

      // Get server clock at a regular interval in order to keep the connection alive
      this._pingClock = setInterval(() => {
        getClock(this);
      }, 60000);

      // Set bot to away
      this.setAgentState({ availability: "AWAY" }, (e, resp) => {
        if (e) {
          console.error(`setAgentState: ${JSON.stringify(e)}`);
        } else {
          console.log(`setAgentState: ${JSON.stringify(resp)}`);
        }
      });

      // Iterate through conversationId's and close conversations
      this.convosToClose.forEach((convId) => {
        this.joinAndCloseConversation(convId);
      });
    });

    // Handle socket closed
    this.on("closed", (data) => {
      clearInterval(this._pingClock);
      console.error(`socket closed: ${JSON.stringify(data)}`);
      this.reconnect();
    });

    // Handle errors
    this.on("error", (err) => {
      console.error(`generic: ${err} ${JSON.stringify(err.message)}`);
    });
  }

  joinAndCloseConversation(conversationId) {
    this.updateConversationField(
      {
        conversationId: conversationId,
        conversationField: [
          {
            field: "ParticipantsChange",
            type: "ADD",
            role: "MANAGER",
          },
        ],
      },
      (e, resp) => {
        if (e) {
          console.error(`joinConversation: ${e.code} ${e.message}`);
          // setTimeout(() => {
          //   this.joinAndCloseConversation(conversationId);
          // }, 5000);
        } else {
          console.log(
            `joinConversation: Joined conversation ${JSON.stringify(
              conversationId
            )}, ${JSON.stringify(resp)}`
          );
          this.closeConversation(conversationId);
        }
      }
    );
  }

  closeConversation(conversationId) {
    this.updateConversationField(
      {
        conversationId: conversationId,
        conversationField: [
          {
            field: "ConversationStateField",
            conversationState: "CLOSE",
          },
        ],
      },
      (e, c) => {
        if (e) {
          console.error(
            `closeConversation: ${e.message} trying again in 5 seconds`
          );
          // setTimeout(() => {
          //   this.closeConversation(conversationId);
          // }, 5000);
        } else {
          console.log(`closeConversation successful ${c}`);
        }
      }
    );
  }
}

const getClock = (context) => {
  context.getClock({});
};

module.exports = CloseConversationBot;
