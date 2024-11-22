import { registerBidder } from "../src/adapters/bidderFactory.js";
import { BANNER, VIDEO } from "../src/mediaTypes.js";
import { logError } from "../src/utils";

const BIDDER_CODE = "michao";

export const spec = {
  code: BIDDER_CODE,
  supportedMediaTypes: [BANNER, VIDEO],

  isBidRequestValid: function (bid) {
    if (typeof bid.params !== "object") {
      return false;
    }

    const props = ["site", "placement"];
    if (
      props.some((prop) => {
        bid.params[prop] = parseInt(bid.params[prop]);
        return isNaN(bid.params[prop]);
      })
    ) {
      domainLogger.bidRequestValidationError();
      return false;
    }

    return true;
  },

  buildRequests: function (validBidRequests, bidderRequest) {},
  interpretResponse: function (serverResponse, request) {},
  getUserSyncs: function (
    syncOptions,
    serverResponses,
    gdprConsent,
    uspConsent
  ) {},
};

export const domainLogger = {
    bidRequestValidationError() {
        logError("Michao: wrong format of site or placement.");
    }
};

registerBidder(spec);
