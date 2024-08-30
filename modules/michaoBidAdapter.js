import { registerBidder } from "../src/adapters/bidderFactory";
import { deepAccess, isNumber } from "../src/utils";
import { BANNER, VIDEO } from "../src/mediaTypes";
import { ortbConverter } from "../libraries/ortbConverter/converter";

export const BIDDER_CODE = "michao";
export const ENDPOINT = "https://michao-ssp.com/bid/";
export const REQUEST_METHOD = "POST";
const DEFAULT_BID_TTL = 30;
const DEFAULT_CURRENCY = "USD";
const DEFAULT_NET_REVENUE = true;

const openRTBConverter = ortbConverter({
  context: {
    netRevenue: DEFAULT_NET_REVENUE,
    ttl: DEFAULT_BID_TTL,
    currency: DEFAULT_CURRENCY,
  },
});

export const spec = {
  code: BIDDER_CODE,
  supportedMediaTypes: [BANNER, VIDEO],

  /**
   * Validates the parameters of the bid request
   * Returns true if the following conditions are met:
   * - Contains both siteId and placementId
   * - siteId and placementId are numeric
   * - siteId and placementId are greater than 0
   * @param {object} bid The bid object provided by prebid.js
   * @returns {boolean} Whether the bid request parameters are valid
   */
  isBidRequestValid: function (bid) {
    return validateBidParams(bid);
  },

  buildRequests: function (validBidRequests, bidderRequest) {
    const serverRequests = [];

    const bannerBids = validBidRequests.filter(
      (bid) => hasBannerMediaType(bid) && !hasVideoMediaType(bid)
    );

    const videoBids = validBidRequests.filter(
      (bid) => hasVideoMediaType(bid) && !hasBannerMediaType(bid)
    );

    bannerBids.forEach((bannerBid) => {
      serverRequests.push(buildBannerRequest(bannerBid, bidderRequest));
    });

    videoBids.forEach((videoBid) => {
      serverRequests.push(buildVideoRequest(videoBid, bidderRequest));
    });

    return serverRequests;
  },

  interpretResponse: function (response, request) {
    const bids = openRTBConverter.fromORTB({
      response: response.body,
      request: request.data,
    }).bids;

    return bids;
  },
};

function validateBidParams(bid) {
  const { siteId, placementId } = bid.params || {};

  if (!siteId || !placementId) {
    return false;
  }

  if (!isNumber(siteId) || !isNumber(placementId)) {
    return false;
  }

  if (siteId <= 0 || placementId <= 0) {
    return false;
  }

  return true;
}

function hasBannerMediaType(bid) {
  return deepAccess(bid, "mediaTypes.banner");
}

function hasVideoMediaType(bid) {
  return deepAccess(bid, "mediaTypes.video");
}

function buildBannerRequest(bannerBid, bidderRequest) {
  return buildRequest(bannerBid, bidderRequest, BANNER);
}

function buildVideoRequest(videoBid, bidderRequest) {
  return buildRequest(videoBid, bidderRequest, VIDEO);
}

function buildRequest(bid, bidderRequest, mediaType) {
  const data = openRTBConverter.toORTB({
    bidRequests: [bid],
    bidderRequest,
    context: { mediaType },
  });

  return {
    method: REQUEST_METHOD,
    url: ENDPOINT,
    data,
    options: { contentType: "application/json", withCredentials: true },
  };
}

registerBidder(spec);
