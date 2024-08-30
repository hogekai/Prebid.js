import { spec } from 'modules/michaoBidAdapter.js';
import { expect } from 'chai';

describe('Michao bid adapter', () => {
  describe('isBidRequestValid', () => {
    it('should return false if `siteId` or `placementId` is not included', () => {
      const baseBid = {
        bidder: 'michao',
        params: {}
      };

      const bidWithoutPlacementId = {...baseBid, params: {...baseBid.params, siteId: 123}};
      const bidWithoutSiteId = {...baseBid, params: {...baseBid.params, placementId: 456}};

      expect(spec.isBidRequestValid(bidWithoutSiteId)).to.equal(false);
      expect(spec.isBidRequestValid(bidWithoutPlacementId)).to.equal(false);
    });

    it('should return false if `siteId` or `placementId` is not a numeric type', () => {
      const bidWithNonNumericPlacementId = {
        bidder: 'michao',
        params: {
          siteId: 123,
          placementId: '456'
        }
      };

      const bidWithNonNumericSiteId = {
        bidder: 'michao',
        params: {
          siteId: '123',
          placementId: 456
        }
      };

      expect(spec.isBidRequestValid(bidWithNonNumericPlacementId)).to.equal(false);
      expect(spec.isBidRequestValid(bidWithNonNumericSiteId)).to.equal(false);
    });

    it('should return false if `siteId` or `placementId` is less than or equal to 0', () => {
      const bidWithNegativePlacementId = {
        bidder: 'michao',
        params: {
          siteId: 123,
          placementId: -456
        }
      };

      const bidWithNegativeSiteId = {
        bidder: 'michao',
        params: {
          siteId: -123,
          placementId: 456
        }
      };

      expect(spec.isBidRequestValid(bidWithNegativePlacementId)).to.equal(false);
      expect(spec.isBidRequestValid(bidWithNegativeSiteId)).to.equal(false);
    });

    it('should return true if `siteId` and `placementId` are included', () => {
      const bidWithPlacementIdAndSiteId = {
        bidder: 'michao',
        params: {
          siteId: 123,
          placementId: 444
        }
      };

      expect(spec.isBidRequestValid(bidWithPlacementIdAndSiteId)).to.equal(true);
    });
  });
});
