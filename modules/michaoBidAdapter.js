import { ortbConverter } from "../libraries/ortbConverter/converter.js";
import { registerBidder } from "../src/adapters/bidderFactory.js";
import { config } from "../src/config.js";
import { BANNER, VIDEO } from "../src/mediaTypes.js";
import { deepSetValue, formatQS, logError } from "../src/utils";
import { getUserSyncParams } from "../libraries/userSyncUtils/userSyncUtils.js";

const ENV = {
  BIDDER_CODE: "michao",
  SUPPORTED_MEDIA_TYPES: [BANNER, VIDEO],
  ENDPOINT: "https://michao-ssp.com/openrtb/prebid",
  NET_REVENUE: true,
  CURRENCY: ["USD"],
};

const converter = ortbConverter({
  request(buildRequest, imps, bidderRequest, context) {
    const bidRequest = context.bidRequests[0];
    const openRTBBidRequest = buildRequest(imps, bidderRequest, context);
    openRTBBidRequest.cur = ENV.CURRENCY;
    openRTBBidRequest.test = config.getConfig("debug") ? 1 : 0;
    deepSetValue(
      openRTBBidRequest,
      "site.id",
      bidRequest.params.site.toString()
    );

    return openRTBBidRequest;
  },

  imp(buildImp, bidRequest, context) {
    const imp = buildImp(bidRequest, context);
    // imp.id = bidRequest.adUnitCode;
    deepSetValue(imp, "ext.placement", bidRequest.params.placement.toString());

    return imp;
  },

  context: {
    netRevenue: ENV.NET_REVENUE,
    ttl: 360,
  },
});

export const spec = {
  code: ENV.BIDDER_CODE,
  supportedMediaTypes: ENV.SUPPORTED_MEDIA_TYPES,

  isBidRequestValid: function (bid) {
    if (!hasParamsObject(bid)) {
      return false;
    }

    if (!validateMichaoParams(bid.params)) {
      domainLogger.bidRequestValidationError();
      return false;
    }

    return true;
  },

  buildRequests: function (validBidRequests, bidderRequest) {
    const bidRequests = [];

    validBidRequests.forEach((validBidRequest) => {
      if (
        hasVideoMediaType(validBidRequest) &&
        hasBannerMediaType(validBidRequest)
      ) {
        bidRequests.push(
          buildRequest(validBidRequest, bidderRequest, "banner")
        );
        bidRequests.push(buildRequest(validBidRequest, bidderRequest, "video"));
      } else if (hasVideoMediaType(validBidRequest)) {
        bidRequests.push(buildRequest(validBidRequest, bidderRequest, "video"));
      } else if (hasBannerMediaType(validBidRequest)) {
        bidRequests.push(
          buildRequest(validBidRequest, bidderRequest, "banner")
        );
      }
    });

    return bidRequests;
  },

  interpretResponse: function (serverResponse, request) {
    return interpretResponse(serverResponse, request);
  },

  getUserSyncs: function (
    syncOptions,
    serverResponses,
    gdprConsent,
    uspConsent
  ) {
    if (syncOptions.iframeEnabled) {
      return [syncUser(gdprConsent)];
    }
  },
};

export const domainLogger = {
  bidRequestValidationError() {
    logError("Michao: wrong format of site or placement.");
  },
};

export function buildRequest(bidRequest, bidderRequest, mediaType) {
  const openRTBBidRequest = converter.toORTB({
    bidRequests: [bidRequest],
    bidderRequest,
    context: {
      mediaType: mediaType,
    },
  });

  return {
    method: "POST",
    url: ENV.ENDPOINT,
    data: openRTBBidRequest,
    options: { contentType: "application/json", withCredentials: true },
  };
}

export function interpretResponse(response, request) {
  const bids = converter.fromORTB({
    response: response.body,
    request: request.data,
  }).bids;

  return bids;
}

export function syncUser(gdprConsent) {
    let gdprParams;
    if (typeof gdprConsent.gdprApplies === 'boolean') {
        gdprParams = `gdpr=${Number(gdprConsent.gdprApplies)}&gdpr_consent=${gdprConsent.consentString}`;
    } else {
        gdprParams = `gdpr_consent=${gdprConsent.consentString}`;
    }
  return {
    type: "iframe",
    url: "https://sync.michao-ssp.com/cookie-syncs?" + gdprParams
  };
}

export function hasParamsObject(bid) {
  return typeof bid.params === "object";
}

export function validateMichaoParams(params) {
  const michaoParams = ["site", "placement"];
  return michaoParams.every((michaoParam) =>
    Number.isFinite(params[michaoParam])
  );
}

function hasBannerMediaType(bid) {
  return hasMediaType(bid, "banner");
}

function hasVideoMediaType(bid) {
  return hasMediaType(bid, "video");
}

function hasMediaType(bid, mediaType) {
  return !!bid.mediaType[mediaType];
}

registerBidder(spec);
