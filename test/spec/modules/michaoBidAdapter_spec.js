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
        bidder: "pangle",
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
        bidder: "pangle",
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

        console.log(bidResponse[0].requestId);

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
});
