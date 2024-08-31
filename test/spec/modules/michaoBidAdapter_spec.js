import { spec } from "modules/michaoBidAdapter.js";
import { expect } from "chai";
import {
  BIDDER_CODE,
  ENDPOINT,
  REQUEST_METHOD,
} from "../../../modules/michaoBidAdapter";

const MOCK_AUCTION_ID = "auctionId-56a2-4f71-9098-720a68f2f708";
const REFERER_INFO = {
  canonicalUrl: null,
  location: "https://example.com",
  page: "https://example.com",
  domain: "example.com",
  referer: null,
  numIframes: 0,
  reachedTop: true,
  isAmp: false,
};

describe("Michao bid adapter", () => {
  describe("`isBidRequestValid`", () => {
    it("should return false if `siteId` or `placementId` is not included", () => {
      const baseBid = {
        bidder: "michao",
        params: {},
      };

      const bidWithoutPlacementId = {
        ...baseBid,
        params: { ...baseBid.params, siteId: 123 },
      };
      const bidWithoutSiteId = {
        ...baseBid,
        params: { ...baseBid.params, placementId: 456 },
      };

      expect(spec.isBidRequestValid(bidWithoutSiteId)).to.equal(false);
      expect(spec.isBidRequestValid(bidWithoutPlacementId)).to.equal(false);
    });

    it("should return false if `siteId` or `placementId` is not a numeric type", () => {
      const bidWithNonNumericPlacementId = {
        bidder: "michao",
        params: {
          siteId: 123,
          placementId: "456",
        },
      };

      const bidWithNonNumericSiteId = {
        bidder: "michao",
        params: {
          siteId: "123",
          placementId: 456,
        },
      };

      expect(spec.isBidRequestValid(bidWithNonNumericPlacementId)).to.equal(
        false
      );
      expect(spec.isBidRequestValid(bidWithNonNumericSiteId)).to.equal(false);
    });

    it("should return false if `siteId` or `placementId` is less than or equal to 0", () => {
      const bidWithNegativePlacementId = {
        bidder: "michao",
        params: {
          siteId: 123,
          placementId: -456,
        },
      };

      const bidWithNegativeSiteId = {
        bidder: "michao",
        params: {
          siteId: -123,
          placementId: 456,
        },
      };

      expect(spec.isBidRequestValid(bidWithNegativePlacementId)).to.equal(
        false
      );
      expect(spec.isBidRequestValid(bidWithNegativeSiteId)).to.equal(false);
    });

    it("should return true if `siteId` and `placementId` are included", () => {
      const bidWithPlacementIdAndSiteId = {
        bidder: "michao",
        params: {
          siteId: 123,
          placementId: 444,
        },
      };

      expect(spec.isBidRequestValid(bidWithPlacementIdAndSiteId)).to.equal(
        true
      );
    });
  });

  describe("banner request", () => {
    let mockBannerBid1;
    let mockBannerBid2;
    let mockBannerValidBidRequests;
    let mockBannerBidderRequest;
    let mockBannerResponse;
    let mockBannerBidResponseForBannerBid1;

    beforeEach(() => {
      mockBannerBid1 = {
        adUnitCode: "adUnitCode1",
        bidId: "bidId1",
        auctionId: MOCK_AUCTION_ID,
        ortb2Imp: {
          ext: {
            tid: "cccc1234",
          },
        },
        mediaTypes: {
          banner: {
            sizes: [[300, 250]],
          },
        },
        bidder: BIDDER_CODE,
        params: {
          placementid: 999,
          appid: 111,
        },
      };

      mockBannerBid2 = {
        adUnitCode: "adUnitCode2",
        bidId: "bidId2",
        auctionId: MOCK_AUCTION_ID,
        ortb2Imp: {
          ext: {
            tid: "cccc1234",
          },
        },
        mediaTypes: {
          banner: {
            sizes: [[300, 250]],
          },
        },
        bidder: BIDDER_CODE,
        params: {
          placementid: 999,
          appid: 111,
        },
      };

      mockBannerValidBidRequests = [mockBannerBid1, mockBannerBid2];

      mockBannerBidderRequest = {
        auctionId: MOCK_AUCTION_ID,
        auctionStart: 1579746300522,
        bidderCode: "michao",
        bidderRequestId: "15246a574e859f",
        bids: [mockBannerBid1, mockBannerBid2],
        ortb2: {},
        refererInfo: REFERER_INFO,
      };

      mockBannerBidResponseForBannerBid1 = {
        id: "requestId",
        seatbid: [
          {
            bid: [
              {
                id: mockBannerBid1.bidId,
                impid: mockBannerBid1.bidId,
                price: 0.18,
                adm: "<script>adm</script>",
                adid: "144762342",
                adomain: ["https://dummydomain.com"],
                iurl: "iurl",
                cid: "109",
                crid: "creativeId",
                cat: [],
                w: 300,
                h: 250,
                mtype: 1,
              },
            ],
            seat: BIDDER_CODE,
          },
        ],
      };

      mockBannerResponse = {
        headers: null,
        body: mockBannerBidResponseForBannerBid1,
      };
    });

    describe("`buildRequests`", () => {
      it("should return a server request object containing the banner's bidRequest", () => {
        const serverRequests = spec.buildRequests(
          mockBannerValidBidRequests,
          mockBannerBidderRequest
        );

        expect(serverRequests).to.have.lengthOf(2);
        expect(serverRequests[0].method).to.equal(REQUEST_METHOD);
        expect(serverRequests[0].url).to.equal(ENDPOINT);
        expect(serverRequests[0].data.imp[0]).to.have.property(
          "id",
          mockBannerBid1.bidId
        );
        expect(serverRequests[0].data.imp[0]).to.have.property("banner");

        expect(serverRequests[1].method).to.equal(REQUEST_METHOD);
        expect(serverRequests[1].url).to.equal(ENDPOINT);
        expect(serverRequests[1].data.imp[0]).to.have.property(
          "id",
          mockBannerBid2.bidId
        );
        expect(serverRequests[0].data.imp[0]).to.have.property("banner");
      });
    });

    describe("`interpretResponse`", () => {
      it("should be interpreted from OpenRTB bid response to Prebid.js bid response", () => {
        const serverRequests = spec.buildRequests(
          mockBannerValidBidRequests,
          mockBannerBidderRequest
        );
        const bidResponse = spec.interpretResponse(
          mockBannerResponse,
          serverRequests[0]
        );

        expect(bidResponse).to.be.an("array").that.is.not.empty;

        expect(bidResponse[0]).to.have.property("currency", "USD");
        expect(bidResponse[0]).to.have.property(
          "requestId",
          mockBannerBidResponseForBannerBid1.seatbid[0].bid[0].id
        );
        expect(bidResponse[0]).to.have.property(
          "cpm",
          mockBannerBidResponseForBannerBid1.seatbid[0].bid[0].price
        );
        expect(bidResponse[0]).to.have.property(
          "width",
          mockBannerBidResponseForBannerBid1.seatbid[0].bid[0].w
        );
        expect(bidResponse[0]).to.have.property(
          "height",
          mockBannerBidResponseForBannerBid1.seatbid[0].bid[0].h
        );
        expect(bidResponse[0]).to.have.property(
          "ad",
          mockBannerBidResponseForBannerBid1.seatbid[0].bid[0].adm
        );
        expect(bidResponse[0]).to.have.property(
          "creativeId",
          mockBannerBidResponseForBannerBid1.seatbid[0].bid[0].crid
        );
        expect(bidResponse[0]).to.have.property("ttl", 30);
        expect(bidResponse[0]).to.have.property("netRevenue", true);
      });
    });
  });

  describe("video request", () => {
    let mockVideoBid1;
    let mockVideoBid2;
    let mockVideoValidBidRequests;
    let mockVideoBidderRequest;
    let mockVideoResponse;
    let mockVideoBidResponseForVideoBid1;

    beforeEach(() => {
      mockVideoBid1 = {
        adUnitCode: "adUnitCode1",
        bidId: "bidId1",
        auctionId: MOCK_AUCTION_ID,
        ortb2Imp: {
          ext: {
            tid: "cccc1234",
          },
        },
        mediaTypes: {
          video: { context: "outstream", playerSize: [[300, 250]] },
        },
        bidder: BIDDER_CODE,
        params: {
          siteId: 123,
          placementId: 456,
        },
      };

      mockVideoBid2 = {
        adUnitCode: "adUnitCode2",
        bidId: "bidId2",
        auctionId: MOCK_AUCTION_ID,
        ortb2Imp: {
          ext: {
            tid: "cccc1234",
          },
        },
        mediaTypes: {
          video: { context: "outstream", playerSize: [[300, 250]] },
        },
        bidder: BIDDER_CODE,
        params: {
          siteId: 123,
          placementId: 456,
        },
      };

      mockVideoValidBidRequests = [mockVideoBid1, mockVideoBid2];

      mockVideoBidderRequest = {
        auctionId: MOCK_AUCTION_ID,
        auctionStart: 1579746300522,
        bidderCode: BIDDER_CODE,
        bidderRequestId: "15246a574e859f",
        bids: [mockVideoBid1, mockVideoBid2],
        ortb2: {},
        refererInfo: REFERER_INFO,
      };

      mockVideoBidResponseForVideoBid1 = {
        id: "requestId",
        seatbid: [
          {
            bid: [
              {
                id: mockVideoBid1.bidId,
                impid: mockVideoBid1.bidId,
                price: 0.03294,
                nurl: "https://api.example.com/nurl",
                lurl: "https://api.example.com/lurl",
                adm: '<VAST version="2.0"></VAST>',
                adid: "1780626232977441",
                adomain: ["swi.esxcmnb.com"],
                iurl: "https://p16-ttam-va.ibyteimg.com/origin/ad-site-i18n-sg/202310245d0d598b3ff5993c4f129a8b",
                cid: "1780626232977441",
                crid: "1780626232977441",
                attr: [4],
                w: 640,
                h: 640,
                mtype: 1,
              },
            ],
            seat: BIDDER_CODE,
          },
        ],
      };

      mockVideoResponse = {
        headers: null,
        body: mockVideoBidResponseForVideoBid1,
      };
    });

    describe("`buildRequests`", () => {
      it("should return a server request object containing the video's bidRequest", () => {
        const serverRequests = spec.buildRequests(
          mockVideoValidBidRequests,
          mockVideoBidderRequest
        );

        expect(serverRequests).to.have.lengthOf(2);
        expect(serverRequests[0].method).to.equal(REQUEST_METHOD);
        expect(serverRequests[0].url).to.equal(ENDPOINT);
        expect(serverRequests[0].data.imp[0]).to.have.property(
          "id",
          mockVideoBid1.bidId
        );
        expect(serverRequests[0].data.imp[0]).to.have.property("video");

        expect(serverRequests[1].method).to.equal(REQUEST_METHOD);
        expect(serverRequests[1].url).to.equal(ENDPOINT);
        expect(serverRequests[1].data.imp[0]).to.have.property(
          "id",
          mockVideoBid2.bidId
        );
        expect(serverRequests[0].data.imp[0]).to.have.property("video");
      });
    });

    describe("`interpretResponse`", () => {
      it("should be interpreted from OpenRTB bid response to Prebid.js bid response", () => {
        const serverRequests = spec.buildRequests(
          mockVideoValidBidRequests,
          mockVideoBidderRequest
        );
        const bidResponse = spec.interpretResponse(
          mockVideoResponse,
          serverRequests[0]
        );
        expect(bidResponse).to.be.an("array").that.is.not.empty;

        expect(bidResponse[0]).to.have.property("currency", "USD");
        expect(bidResponse[0]).to.have.property(
          "requestId",
          mockVideoBidResponseForVideoBid1.seatbid[0].bid[0].id
        );
        expect(bidResponse[0]).to.have.property(
          "cpm",
          mockVideoBidResponseForVideoBid1.seatbid[0].bid[0].price
        );
        expect(bidResponse[0]).to.have.property(
          "width",
          mockVideoBidResponseForVideoBid1.seatbid[0].bid[0].w
        );
        expect(bidResponse[0]).to.have.property(
          "height",
          mockVideoBidResponseForVideoBid1.seatbid[0].bid[0].h
        );
        expect(bidResponse[0]).to.have.property(
          "vastXml",
          mockVideoBidResponseForVideoBid1.seatbid[0].bid[0].adm
        );
        expect(bidResponse[0]).to.have.property(
          "creativeId",
          mockVideoBidResponseForVideoBid1.seatbid[0].bid[0].crid
        );
        expect(bidResponse[0]).to.have.property("ttl", 30);
        expect(bidResponse[0]).to.have.property("netRevenue", true);
      });
    });
  });

  describe("banner and video request", () => {
    let mockMixedBid;
    let mockMixedValidBidRequests;
    let mockMixedBidderRequest;

    beforeEach(() => {
      mockMixedBid = {
        adUnitCode: "adUnitCode1",
        bidId: "bidId1",
        auctionId: MOCK_AUCTION_ID,
        ortb2Imp: {
          ext: {
            tid: "cccc1234",
          },
        },
        mediaTypes: {
          banner: {
            sizes: [[300, 250]],
          },
          video: { context: "outstream", playerSize: [[300, 250]] },
        },
        bidder: BIDDER_CODE,
        params: {
          siteId: 123,
          placementId: 456,
        },
      };

      mockMixedValidBidRequests = [mockMixedBid];

      mockMixedBidderRequest = {
        auctionId: MOCK_AUCTION_ID,
        auctionStart: 1579746300522,
        bidderCode: BIDDER_CODE,
        bidderRequestId: "15246a574e859f",
        bids: [mockMixedBid],
        ortb2: {},
        refererInfo: REFERER_INFO,
      };
    });

    describe("`buildRequests`", () => {
      it("should return a server request object containing the banner and video bidRequests", () => {
        const serverRequests = spec.buildRequests(
          mockMixedValidBidRequests,
          mockMixedBidderRequest
        );

        expect(serverRequests).to.have.lengthOf(2);
        expect(serverRequests[0].method).to.equal(REQUEST_METHOD);
        expect(serverRequests[0].url).to.equal(ENDPOINT);
        expect(serverRequests[0].data.imp[0]).to.have.property(
          "id",
          mockMixedBid.bidId
        );
        expect(serverRequests[0].data.imp[0]).to.have.property("banner");

        expect(serverRequests[1].method).to.equal(REQUEST_METHOD);
        expect(serverRequests[1].url).to.equal(ENDPOINT);
        expect(serverRequests[1].data.imp[0]).to.have.property(
          "id",
          mockMixedBid.bidId
        );
        expect(serverRequests[1].data.imp[0]).to.have.property("video");
      });
    });
  });
});
