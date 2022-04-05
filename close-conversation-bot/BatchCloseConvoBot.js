//const Agent = require("node-agent-sdk").Agent;
const Agent = require("../lib/AgentSDK");
const fs = require("fs");
const { resolve } = require("path");
const { rejects } = require("assert");
//let convosIdsToClose = ["e9d7260e-2bd3-44fa-abf7-773610c1a2ed"];

class CloseConversationBot extends Agent {
  constructor(config, convosToClose) {
    super(config);
    this.convosToClose = convosToClose;
    this.failedToClose = [];
    this.failedToJoin = [];
    this.totalConvosPerBatch = 50;
    this.closedConvos = [];
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
      this.processAllConvos(this.convosToClose);
      // const convosToDividePerBatch = [...this.convosToClose];
      // while (this.convosToDividePerBatch > 0) {
      //   const convosBatch = this.convosToDividePerBatch.splice(0, 50);
      //   new Promise((resolve, reject) => {
      //     setTimeout(() => {
      //       this.convosBatch.forEach((conv) => {
      //         this.joinAndCloseConversation(conv);
      //       });s
      //       resolve();
      //     }, 2000);
      //   });
      // }

      generateFileWithFailedConvos(this.failedToJoin, "failedToJoin.json");
      generateFileWithFailedConvos(this.failedToClose, "failedToClose.json");
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

  joinAndCloseConversation(conversation) {
    this.updateConversationField(
      {
        conversationId: conversation.conversationId,
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
          // if (e.code === 429) {
          //   setTimeout(() => {
          //     this.joinAndCloseConversation(conversation);
          //   }, 2000);
          // } else if (
          //   e.code === 400 &&
          //   e.body ===
          //     "Bad Request, Agent already exist" /* Bot already joined this convo */
          // ) {
          //   this.closeConversation(conversation.conversationId);
          // } else {
          //   // Add convo to failedToJoinArray
          //   const failedToJoinConversation = {
          //     conversation,
          //     e,
          //     resp,
          //   };
          //   this.failedToJoin.push(failedToJoinConversation);
          //   console.log(
          //     `Failed to join: ${this.failedToJoin.length}, error: ${e.code}`
          //   );
          // }
        } else {
          console.log(
            `joinConversation: Joined conversation ${JSON.stringify(
              conversation.conversationId
            )}, ${JSON.stringify(resp)}`
          );
          this.closeConversation(conversation);
        }
      }
    );
  }

  closeConversation(conversation) {
    this.updateConversationField(
      {
        conversationId: conversation.conversationId,
        conversationField: [
          {
            field: "ConversationStateField",
            conversationState: "CLOSE",
          },
        ],
      },
      (e, c) => {
        if (e) {
          console.error(`closeConversation: ${JSON.stringify(e)}`);
          // setTimeout(() => {
          //   this.closeConversation(conversationId);
          // }, 5000);
          // const failedToCloseConversation = {
          //   conversation,
          //   e,
          // };
          // this.failedToClose.push(failedToCloseConversation);
          // console.log(`Failed to close: ${this.failedToClose}`);
        } else {
          console.log(`closeConversation successful ${c}`);
          this.closedConvos.push(conversation);
        }
      }
    );
  }
  async processAllConvos(allConversations) {
    const convosToDividePerBatch = [...allConversations];
    while (convosToDividePerBatch.length > 0) {
      const convosBatch = convosToDividePerBatch.splice(0, 50);
      await new Promise((resolve, reject) => {
        setTimeout(() => {
          convosBatch.forEach((conv) => {
            this.joinAndCloseConversation(conv);
          });
          resolve();
        }, 2000);
      });
      console.log("Saludos");
    }
  }
}

// const bot = new CloseConversationBot({
//     accountId: "77955991",
//     username: "closerTest",
//     password: "Password",
// });

const getClock = (context) => {
  context.getClock({});
};

const generateFileWithFailedConvos = (conversations, fileName) => {
  if (conversations.length > 0) {
    let jsonData = JSON.stringify(conversations, null, 2);
    fs.writeFileSync(fileName, jsonData);
  }
};

module.exports = CloseConversationBot;
