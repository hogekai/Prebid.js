import { registerBidder } from "../src/adapters/bidderFactory.js";
import { BANNER, VIDEO } from "../src/mediaTypes.js";

const BIDDER_CODE = 'michao';

export const spec = {
    code: BIDDER_CODE,
    supportedMediaTypes: [BANNER, VIDEO],
    isBidRequestValid: function(bid) {},
    buildRequests: function(validBidRequests, bidderRequest) {},
    interpretResponse: function(serverResponse, request) {},
    getUserSyncs: function(syncOptions, serverResponses, gdprConsent, uspConsent) {},
};

registerBidder(spec);