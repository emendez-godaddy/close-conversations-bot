"use strict";

const SERVICES = {
  MESSAGING: "messaging",
  AUTHENTICATION: "authentication",
  DOMAIN_NAMES: "domainNames",
};

const ENDPOINTS = {
  LOGIN: "login",
  REFRESH_SESSION: "refreshSession",
};

const CLOSINGCONVOTIMEBYSKILL = {
  //1616035530: 48, //GD-EN_US
  //3721371038: 15, // TestSkill
  3072159530: 48, //GD-idleParking-BOT
};

const CLOSEDCONVOSELASTICINDEXNAME = "le-bot-closed-conversations";

const CLOSEDCONVOSELASTICBODYINDEX = {
  mappings: {
    properties: {
      startTime: { type: "date" },
      startTimeL: { type: "date" },
      endTime: { type: "date" },
      endTimeL: { type: "date" },
      duration: { type: "text" },
      conversationId: { type: "text" },
      brandId: { type: "text" },
      latestAgentId: { type: "text" },
      latestAgentNickname: { type: "text" },
      latestAgentFullName: { type: "text" },
      latestAgentLoginName: { type: "text" },
      agentDeleted: { type: "boolean" },
      latestSkillId: { type: "text" },
      latestSkillName: { type: "text" },
      source: { type: "text" },
      closeReason: { type: "text" },
      closeReasonDescription: { type: "text" },
      mcs: { type: "text" },
      alertedMCS: { type: "integer" },
      status: { type: "text" },
      fullDialogStatus: { type: "text" },
      firstConversation: { type: "boolean" },
      device: { type: "text" },
      browser: { type: "text" },
      browserVersion: { type: "text" },
      operatingSystem: { type: "text" },
      operatingSystemVersion: { type: "text" },
      latestAgentGroupId: { type: "text" },
      latestAgentGroupName: { type: "text" },
      latestQueueState: { type: "text" },
      isPartial: { type: "boolean" },
      visitorId: { type: "text" },
      sessionId: { type: "text" },
      interactionContextId: { type: "text" },
      language: { type: "text" },
      integration: { type: "text" },
      integrationVersion: { type: "text" },
      appId: { type: "text" },
      ipAddress: { type: "text" },
      latestHandlerAccountId: { type: "text" },
      latestHandlerSkillId: { type: "text" },
      firstIntentName: { type: "text" },
      firstIntentLabel: { type: "text" },
      campaign: {
        properties: {
          campaignEngagementId: { type: "text" },
          campaignEngagementName: { type: "text" },
          campaignId: { type: "text" },
          campaignName: { type: "text" },
          goalId: { type: "text" },
          goalName: { type: "text" },
          engagementSource: { type: "text" },
          visitorBehaviorId: { type: "text" },
          visitorBehaviorName: { type: "text" },
          visitorProfileId: { type: "text" },
          visitorProfileName: { type: "text" },
          lobId: { type: "text" },
          lobName: { type: "text" },
          locationId: { type: "text" },
          locationName: { type: "text" },
          profileSystemDefault: { type: "boolean" },
          behaviorSystemDefault: { type: "boolean" },
        },
      },
      responseTime: {
        properties: {
          latestEffectiveResponseDueTime: { type: "integer" },
          configuredResponseTime: { type: "integer" },
        },
      },
      monitoring: {
        properties: {
          country: { type: "text" },
          countryCode: { type: "text" },
          state: { type: "text" },
          city: { type: "text" },
          isp: { type: "text" },
          org: { type: "text" },
          device: { type: "text" },
          ipAddress: { type: "text" },
          browser: { type: "text" },
          operatingSystem: { type: "text" },
          conversationStartPage: { type: "text" },
          conversationStartPageTitle: { type: "text" },
        },
      },
    },
  },
};

module.exports = {
  CLOSEDCONVOSELASTICINDEXNAME,
  CLOSEDCONVOSELASTICBODYINDEX,
  SERVICES,
  ENDPOINTS,
  CLOSINGCONVOTIMEBYSKILL,
  AUTH_SERVICE_CONTEXT: {
    LOGIN: `${SERVICES.AUTHENTICATION}.${ENDPOINTS.LOGIN}`,
    REFRESH_SESSION: `${SERVICES.AUTHENTICATION}.${ENDPOINTS.REFRESH_SESSION}`,
  },
  EVENTS: {
    CONNECTED: "connected",
    CLOSED: "closed",
    NOTIFICATION: "notification",
  },
  KINDS: {
    REQUEST: "req",
    RESPONSE: "resp",
    NOTIFICATION: "notification",
  },
  REQUESTS: [
    ".GetClock",
    ".ams.cm.AgentRequestConversation",
    ".ams.aam.SubscribeExConversations",
    ".ams.aam.UnsubscribeExConversations",
    ".ams.cm.UpdateConversationField",
    ".ams.ms.PublishEvent",
    ".ams.routing.UpdateRingState",
    ".ams.routing.SubscribeRoutingTasks",
    ".ams.routing.UpdateRoutingTaskSubscription",
    ".ams.userprofile.GetUserProfile",
    ".ams.routing.SetAgentState",
    ".ams.routing.SubscribeAgentsState",
    "ms.SubscribeMessagingEvents",
    ".ams.ms.GenerateURLForDownloadFile",
    ".ams.ms.GenerateURLForUploadFile",
    ".ams.ms.token.GenerateDownloadToken",
  ],
};
