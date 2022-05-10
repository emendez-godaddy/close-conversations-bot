const express = require("express");
const { api } = require("../services/provider");
const router = express.Router();
const CloseConversationBot = require("../../close-conversation-bot/close-conversation-bot-noevent");
const ElasticSearch = require("../integrations/Elastic");
const CONST = require("../../lib/Const");
const fs = require("fs");

const elastic = new ElasticSearch();
const conf = {
  accountId: process.env.ACCOUNT_ID,
  username: process.env.USERNAME,
  appKey: process.env.BOT_APP_KEY,
  secret: process.env.BOT_APP_SECRET,
  accessToken: process.env.BOT_ACCESS_TOKEN,
  accessTokenSecret: process.env.BOT_ACCESS_TOKEN_SECRET,
};

router.get("/close-conversations", (req, res) => {
  const PAGE_SIZE = 50;
  const arr_data = [];
  let offset = 0;
  let requestPromises = [];

  callApiService(
    offset,
    conf.accountId,
    arr_data,
    PAGE_SIZE,
    requestPromises,
    res
  );
});

async function callApiService(
  offset,
  accountId,
  convArray,
  pageSize,
  requestPromises,
  response
) {
  const url = `https://va.msghist.liveperson.net/messaging_history/api/account/${accountId}/conversations/search?offset=${offset}&limit=50&source=GD_AgentUI_History`;
  const options = {
    url,
    method: "POST",
  };

  const body = {
    start: {
      from: 1646870400000 /*1644029518000*/,
      to: Date.now(),
    },
    skillIds: [3072159530],
    status: ["OPEN"],
  };

  const data = await api(options, {}, body);

  convArray.push(...data.conversationHistoryRecords);
  offset += pageSize;
  console.log(offset);

  if (data.conversationHistoryRecords.length < pageSize) {
    const convosToClose = getApplicableForClosingConvos(convArray);
    console.log(`Total conversations: ${convosToClose.conversations.length}`);

    // const closeBot = new CloseConversationBot(
    //   conf,
    //   convosToClose.conversations
    // );

    // const closedConversations = await closeBot.closeConversations();

    // const totalJoined = closeBot.totalJoinedConvos;
    // const totalClosed = closeBot.totalClosedConvos;

    // console.log(`Total Joined: ${totalJoined}, Total Closed: ${totalClosed}`);
    //console.log(`Closed Convos: ${JSON.stringify(closedConversations)}`);

    // indexDataIntoElastic(
    //   closedConversations,
    //   CONST.CLOSEDCONVOSELASTICBODYINDEX,
    //   CONST.CLOSEDCONVOSELASTICINDEXNAME
    // );

    //Saludos
    //kellksoek
    return response.json(convosToClose.idsToClose);
  } else {
    callApiService(
      offset,
      accountId,
      convArray,
      pageSize,
      requestPromises,
      response
    );
  }
}

const getApplicableForClosingConvos = (convoArray) => {
  const applicableConvos = {
    idsToClose: [],
    conversations: [],
  };
  for (let index = 0; index < convoArray.length; index++) {
    if (isConvoApplicable(convoArray[index].messageRecords)) {
      const convoId = convoArray[index].info.conversationId;
      const conversation = {
        ...convoArray[index].info,
        startTime: new Date(convoArray[index].info.startTime),
        endTime: new Date(),
        endTimeL: Date.now(),
        campaign: {
          ...convoArray[index].campaign,
        },
        responseTime: {
          ...convoArray[index].responseTime,
        },
        monitoring: {
          ...convoArray[index].monitoring,
        },
        agentParticipants: {
          ...convoArray[index].agentParticipants,
        },
      };
      applicableConvos.idsToClose.push(convoId);
      applicableConvos.conversations.push(conversation);
    } else {
      continue;
    }
  }
  return applicableConvos;
};

const isConvoApplicable = (messageRecords) => {
  const hoursNeededToCloseConvo = 48;
  const { timeL } = messageRecords[messageRecords.length - 1] || 0;
  const timeNowMillis = Date.now();

  const timeNowInHours = timeNowMillis / 1000 / 60 / 60;
  const lastconvoMessageTimeInHours = timeL / 1000 / 60 / 60;
  return (
    Math.ceil(timeNowInHours - lastconvoMessageTimeInHours) >=
    hoursNeededToCloseConvo
  );
};

const indexDataIntoElastic = async (
  convosToPersist,
  indexStructure,
  indexName
) => {
  const failedConvos = [];

  if (!(await elastic.isIndexCreated(indexName))) {
    await elastic.createIndex(indexName, indexStructure);
  }

  const result = await elastic.client.helpers.bulk({
    datasource: convosToPersist,
    onDocument(doc) {
      return {
        index: { _index: indexName },
      };
    },
    onDrop(doc) {
      failedConvos.push(doc);
    },
  });

  if (failedConvos.length > 0) {
    writeErrorsToFile(failedConvos, "failedConversations.json");
  }
  console.log(result);
};

const writeErrorsToFile = async (info, filename) => {
  const data = JSON.stringify(info, null, 2);
  try {
    fs.promises.appendFile(filename, data);
  } catch (error) {
    console.error("Error occured while writting the file", error);
  }
};

// Route to test elastic functions
router.get("/existing-index", async (req, res) => {
  // indexDataIntoElastic(
  //   "Hello",
  //   CONST.CLOSEDCONVOSELASTICBODYINDEX,
  //   "le-bot-closed-conversations"
  // );
  const error = {
    code: 400,
    desc: "Hi, im an error",
  };
  writeErrorsToFile(error, "Error.json");
});

module.exports = router;
