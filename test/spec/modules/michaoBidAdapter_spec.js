import { expect } from "chai";
import {
  buildRequest,
  domainLogger,
  spec,
  validateMichaoParams,
} from "../../../modules/michaoBidAdapter";
import { config } from "../../../src/config";

describe("the michao bidder adapter", () => {
  beforeEach(() => {
    config.resetConfig();
  });

  describe("unit", () => {
    describe("validate bid request", () => {
      const invalidBidParams = [
        { site: "123", placement: "super-placement" },
        { site: "123", placement: 456 },
        { site: Infinity, placement: 456 },
      ];
      invalidBidParams.forEach((params) => {
        it("Detecting incorrect parameters", () => {
          const result = validateMichaoParams(params);

          expect(result).to.be.false;
        });
      });

      it("If the site ID and placement ID are correct, the verification succeeds.", () => {
        const params = {
          site: 123,
          placement: 234,
        };

        const result = validateMichaoParams(params);

        expect(result).to.be.true;
      });
    });

    describe("build bid request", () => {
      it("Banner bid requests are converted to banner server request objects", () => {
        const bannerBidRequest = {
          adUnitCode: "test-div",
          auctionId: "b06c5141-fe8f-4cdf-9d7d-54415490a917",
          bidId: "22c4871113f461",
          bidder: "michao",
          bidderRequestId: "15246a574e859f",
          bidRequestsCount: 1,
          bidderRequestsCount: 1,
          bidderWinsCount: 0,
          mediaTypes: { banner: [[300, 250]] },
          params: {
            site: 123,
            placement: 456,
          },
        };
        const bidderRequest = {
          auctionId: "b06c5141-fe8f-4cdf-9d7d-54415490a917",
          auctionStart: 1579746300522,
          bidderCode: "michao",
          bidderRequestId: "15246a574e859f",
          bids: [bannerBidRequest],
        };

        const result = buildRequest(bannerBidRequest, bidderRequest, "banner");

        expect(result).to.nested.include({
          url: "https://michao-ssp.com/openrtb/prebid",
          "options.contentType": "application/json",
          "options.withCredentials": true,
          method: "POST",
          "data.cur[0]": "USD",
          "data.imp[0].ext.placement": "456",
          "data.site.id": "123",
          "data.test": 0,
        });
      });

      it("Video bid requests are converted to video server request objects", () => {
        const videoBidRequest = {
          adUnitCode: "test-div",
          auctionId: "b06c5141-fe8f-4cdf-9d7d-54415490a917",
          bidId: "22c4871113f461",
          bidder: "michao",
          bidderRequestId: "15246a574e859f",
          bidRequestsCount: 1,
          bidderRequestsCount: 1,
          bidderWinsCount: 0,
          mediaTypes: {
            video: {
              context: "outstream",
              playerSize: [640, 480],
              mimes: ["video/mp4"],
            },
          },
          params: {
            site: 123,
            placement: 456,
          },
        };
        const bidderRequest = {
          auctionId: "b06c5141-fe8f-4cdf-9d7d-54415490a917",
          auctionStart: 1579746300522,
          bidderCode: "michao",
          bidderRequestId: "15246a574e859f",
          bids: [videoBidRequest],
        };

        const result = buildRequest(videoBidRequest, bidderRequest, "banner");

        expect(result).to.nested.include({
          url: "https://michao-ssp.com/openrtb/prebid",
          "options.contentType": "application/json",
          "options.withCredentials": true,
          method: "POST",
          "data.cur[0]": "USD",
          "data.imp[0].ext.placement": "456",
          "data.site.id": "123",
          "data.test": 0,
        });
      });

      it("Converted to server request object for testing in debug mode", () => {
        const bidRequest = {
          adUnitCode: "test-div",
          auctionId: "b06c5141-fe8f-4cdf-9d7d-54415490a917",
          bidId: "22c4871113f461",
          bidder: "michao",
          bidderRequestId: "15246a574e859f",
          bidRequestsCount: 1,
          bidderRequestsCount: 1,
          bidderWinsCount: 0,
          mediaTypes: { banner: [[300, 250]] },
          params: {
            site: 123,
            placement: 456,
          },
        };
        const bidderRequest = {
          auctionId: "b06c5141-fe8f-4cdf-9d7d-54415490a917",
          auctionStart: 1579746300522,
          bidderCode: "michao",
          bidderRequestId: "15246a574e859f",
          bids: [bidRequest],
        };
        config.setConfig({
          debug: true,
        });

        const result = buildRequest(bidRequest, bidderRequest, "banner");

        expect(result).to.nested.include({
          "data.test": 1,
        });
      });
    });
  });

  describe("integration", () => {
    it("`isBidRequestValid`", () => {
      const validBidRequest = {
        params: {
          placement: 124,
          site: 456,
        },
      };

      const result = spec.isBidRequestValid(validBidRequest);

      expect(result).to.true;
    });

    it("`buildRequests`", () => {
      const validBidRequests = [
        {
          adUnitCode: "test-div",
          auctionId: "auction-1",
          bidId: "bid-1",
          bidder: "michao",
          bidderRequestId: "bidder-request-1",
          mediaType: {
            banner: {
              sizes: [[300, 250]],
            },
          },
          params: {
            site: 12,
            placement: 12,
          },
        },
        {
          adUnitCode: "test-div",
          auctionId: "auction-1",
          bidId: "bid-2",
          bidder: "michao",
          bidderRequestId: "bidder-request-1",
          mediaType: {
            video: {
              context: "outstream",
              playerSize: [640, 480],
              mimes: ["video/mp4"],
              minduration: 0,
              maxduration: 30,
            },
          },
          params: {
            site: 12,
            placement: 12,
          },
        },
      ];
      const bidderRequest = {
        auctionId: "auction-1",
        auctionStart: 1579746300522,
        bidderCode: "michao",
        bidderRequestId: "bidder-request-1",
      };

      const result = spec.buildRequests(validBidRequests, bidderRequest);

      expect(result.length).to.equal(2);
    });
  });
});
