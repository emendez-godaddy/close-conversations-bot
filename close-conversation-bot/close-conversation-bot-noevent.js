const Agent = require("../lib/AgentSDK");
const fs = require("fs");
const { resolve } = require("path");
const { reject } = require("async");
//let convosIdsToClose = ["e9d7260e-2bd3-44fa-abf7-773610c1a2ed"];

class CloseConversationBot extends Agent {
  constructor(config, convosToClose) {
    super(config);
    this.convosToClose = convosToClose;
    this.totalConvosPerBatch = 50;
    this._totalJoinedConvos = 0;
    this._totalClosedConvos = 0;
    this._closedConvos = [];
    //this.init();
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

  async init() {
    return new Promise((r, reject) => {
      this.on("connected", async (message) => {
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
        try {
          await this.processAllConvos(this.convosToClose);
          r(this._closedConvos);
        } catch (err) {
          console.log(err);
        }

        // .then((e) => {
        // });
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
              writeErrorsToFile(failedToJoin, "JoinConvoErrors.json");
            }
          } else {
            // console.log(
            //   `joinConversation: Joined conversation ${JSON.stringify(
            //     conversation.conversationId
            //   )}, ${JSON.stringify(resp)}`
            // );
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
            //console.error(`closeConversation: ${JSON.stringify(e)}`);
            // setTimeout(() => {
            //   this.closeConversation(conversationId);
            // }, 5000);
          } else {
            //console.log(`closeConversation successful ${c}`);
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

      // console.log(
      //   `Total Joined: ${this._totalJoinedConvos}, Total Closed: ${this._totalClosedConvos}`
      // );
    }

    // console.log("Ejecutando promise", batchPromises.length);
    return Promise.resolve();
  }

  // async waitForProcessing(allConvos) {
  //   this.processAllConvos(allConvos);
  // }
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
