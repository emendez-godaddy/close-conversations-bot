const Agent = require("../lib/AgentSDK");
const fs = require("fs");
//let convosIdsToClose = ["e9d7260e-2bd3-44fa-abf7-773610c1a2ed"];

class CloseConversationBot extends Agent {
  constructor(config) {
    super(config);
    this.convosToClose = [];
    this.totalConvosPerBatch = 50;
    this._totalJoinedConvos = 0;
    this._totalClosedConvos = 0;
    this._closedConvos = [];
    //this.init();
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

  get totalJoinedConvos() {
    return this._totalJoinedConvos;
  }
  get totalClosedConvos() {
    return this._totalClosedConvos;
  }
  get closedConvos() {
    return this._closedConvos;
  }
  set conversationsToBeClosed(convos) {
    this.convosToClose.push(...convos);
  }

  async closeConversations() {
    return new Promise(async (r, reject) => {
      // Iterate through conversationId's and close conversations
      try {
        await this.processAllConvos(this.convosToClose);
        r(this._closedConvos);
      } catch (err) {
        console.log(err);
      }
    }).catch((e) => {
      throw e;
    });
  }

  async joinAndCloseConversation(conversation) {
    return new Promise((resolve) => {
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
        async (e, resp) => {
          if (e) {
            //console.error(`joinConversation: ${e.code} ${e.message}`);
            if (e.code === 429) {
              setTimeout(async () => {
                this.joinAndCloseConversation(conversation);
              }, 2000);
            } else if (
              e.code === 400 &&
              e.body ===
                "Bad Request, Agent already exist" /* Bot already joined this convo */
            ) {
              await this.closeConversation(conversation);
              resolve();
            } else {
              const failedToJoin = {
                conversation,
                e,
              };
              //writeErrorsToFile(failedToJoin, "JoinConvoErrors.json");
              console.log(failedToJoin.e);
            }
          } else {
            this._totalJoinedConvos += 1;
            await this.closeConversation(conversation);
            resolve();
          }
        }
      );
    });
  }

  async closeConversation(conversation) {
    return new Promise((resolve) => {
      //this._closedConvos.push(conversation);
      //resolve();
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
            const failedToClose = {
              conversation,
              e,
            };
            writeErrorsToFile(failedToClose, "CloseConvoErrors.json");
          } else {
            this._totalClosedConvos += 1;
            this._closedConvos.push(conversation);
            resolve();
          }
        }
      );
    });
  }

  async processAllConvos(allConversations) {
    const convosToDividePerBatch = [...allConversations];
    // let batchPromises = [];
    while (convosToDividePerBatch.length > 0) {
      const convosBatch = convosToDividePerBatch.splice(
        0,
        this.totalConvosPerBatch
      );
      // batchPromises = [];
      // batchPromises.push(
      // setTimeout(() => {
      for (const conv of convosBatch) {
        // convosBatch.map(async (conv) => {
        console.log("Enter conversacion");
        await this.joinAndCloseConversation(conv);
        console.log("Cerre conversacion");
      }
      // }, 5000);
    }
    return Promise.resolve();
  }
}

const writeErrorsToFile = async (info, filename) => {
  const data = JSON.stringify(info, null, 2);
  try {
    fs.promises.appendFile(filename, data);
  } catch (error) {
    console.error("Error occured while writting the file", error);
  }
};

const getClock = (context) => {
  context.getClock({});
};

module.exports = CloseConversationBot;
