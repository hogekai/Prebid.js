import { expect } from "chai";
import { domainLogger, spec } from "../../../modules/michaoBidAdapter";

describe("the michao bidder adapter", () => {
  const bidRequestValidationTestCases = [
    {
      bid: { params: "non-object" },
      expected: false,
      shouldLogError: false,
    },
    {
      bid: { params: { site: 123, placement: "456" } },
      expected: true,
      shouldLogError: false,
    },
    {
      bid: { params: { site: "123", placement: "super-placement" } },
      expected: false,
      shouldLogError: true,
    },
  ];

  bidRequestValidationTestCases.forEach((testCase) => {
    it("validate bid requests", () => {
      const validationErrorLogSpy = sinon.spy(
        domainLogger,
        "bidRequestValidationError"
      );
      const result = spec.isBidRequestValid(testCase.bid);

      expect(result).to.equal(testCase.expected);
      expect(validationErrorLogSpy.calledOnce).to.equal(
        testCase.shouldLogError
      );

      validationErrorLogSpy.restore();
    });
  });
});
