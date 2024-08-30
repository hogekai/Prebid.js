import { registerBidder } from "../src/adapters/bidderFactory";
import { deepAccess, isNumber } from "../src/utils";

const BIDDER_CODE = "michao";

export const spec = {
  code: BIDDER_CODE,

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
};

function validateBidParams(bid) {
  const { siteId, placementId } = bid.params || {};

  if (!siteId || !placementId) {
    return false;
  }

  if (isNumber(siteId) || isNumber(placementId)) {
    return false;
  }

  if (siteId <= 0 || placementId <= 0) {
    return false;
  }

  return true;
}


registerBidder(spec);
